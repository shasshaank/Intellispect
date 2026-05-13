import io
import base64
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from torchvision import models, transforms
import torch.nn as nn
from datetime import datetime, timezone
from pymongo import MongoClient
import torch
import os
import bcrypt
from dotenv import load_dotenv
from torchcam.methods import SmoothGradCAMpp
from torchcam.utils import overlay_mask
from torchvision.transforms.functional import to_pil_image

# Load environment variables
load_dotenv()

# Flask setup
app = Flask(__name__)
CORS(app)

# MongoDB setup
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["screw_inspections"]
predictions_collection = db["predictions"]
users_collection = db["users"]

# Load ResNet50 model
model = models.resnet50()
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, 2)
model.load_state_dict(torch.load("resnet50_screws.pth", map_location=torch.device('cpu')))
model.eval()

# Image transform pipeline
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Grad-CAM helper hooks removed in favor of torchcam

@app.route("/predict", methods=["POST"])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    user_email = request.form.get("user_email")
    if not user_email:
        return jsonify({"error": "Missing user email"}), 400

    filename = secure_filename(file.filename)

    try:
        image = Image.open(file.stream).convert("RGB")
        input_tensor = transform(image).unsqueeze(0)

        # Use torchcam for Grad-CAM overlay
        cam_extractor = SmoothGradCAMpp(model)

        input_tensor.requires_grad_()
        outputs = model(input_tensor)
        
        probs = torch.nn.functional.softmax(outputs, dim=1)
        predicted_class = torch.argmax(probs, dim=1).item()
        confidence = torch.max(probs).item()

        # Extract CAM
        activation_map = cam_extractor(predicted_class, outputs)
        
        # Format the mask and overlay
        mask = to_pil_image(activation_map[0].squeeze(0), mode='F')
        overlayed_img = overlay_mask(image.resize((224, 224)), mask, alpha=0.6)
        
        cam_extractor.remove_hooks()

        buffered = io.BytesIO()
        overlayed_img.save(buffered, format="PNG")
        heatmap_base64 = base64.b64encode(buffered.getvalue()).decode()

        is_anomaly = predicted_class == 0

        result = {
            "filename": filename,
            "anomaly_detected": is_anomaly,
            "type": "Defect" if is_anomaly else "Good",
            "confidence": round(confidence, 4),
            "severity": "High" if is_anomaly else "None",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "heatmap": f"data:image/png;base64,{heatmap_base64}"
        }

        predictions_collection.insert_one({
            "filename": filename,
            "user_email": user_email,
            "type": result["type"],
            "confidence": result["confidence"],
            "severity": result["severity"],
            "timestamp": datetime.now(timezone.utc)
        })

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "User already exists"}), 400

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    users_collection.insert_one({
        "username": username,
        "password": hashed_pw,
        "action": "register",
        "timestamp": datetime.now(timezone.utc)
    })

    return jsonify({"message": "User registered successfully"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    user = users_collection.find_one({"username": username})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({"error": "Invalid username or password"}), 401

    users_collection.insert_one({
        "username": username,
        "action": "login",
        "timestamp": datetime.now(timezone.utc)
    })

    return jsonify({"message": "Login successful", "user_email": username}), 200

@app.route("/get-reports", methods=["POST"])
def get_reports():
    data = request.json
    user_email = data.get("user_email")

    if not user_email:
        return jsonify({"error": "Missing email"}), 400

    try:
        reports = list(predictions_collection.find({"user_email": user_email}, {'_id': 0}))
        return jsonify(reports), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
