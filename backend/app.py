import io
import base64
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from transformers import SwinForImageClassification
from torchvision import transforms
from datetime import datetime, timezone
from pymongo import MongoClient
import torch
import os
import bcrypt
from dotenv import load_dotenv

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

# Load Swin Transformer model
checkpoint_path = "./checkpoint-198"
model = SwinForImageClassification.from_pretrained(checkpoint_path, local_files_only=True)
model.eval()

# Image transform pipeline
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

# Grad-CAM helper hooks
def save_hook(module, input, output):
    module.activations = output

def backward_hook(module, grad_input, grad_output):
    module.gradients = grad_output[0]

def generate_gradcam_heatmap(activations, gradients):
    B, T, C = activations.shape
    H = W = int(T ** 0.5)  # For 49 tokens, H=W=7

    # Reshape to [B, C, H, W]
    activations = activations.permute(0, 2, 1).reshape(B, C, H, W)
    gradients = gradients.permute(0, 2, 1).reshape(B, C, H, W)

    pooled_gradients = torch.mean(gradients, dim=[2, 3])
    weighted_activations = activations * pooled_gradients[:, :, None, None]

    heatmap = weighted_activations.sum(dim=1).squeeze(0).cpu().detach().numpy()
    heatmap = np.maximum(heatmap, 0)
    heatmap /= heatmap.max() if heatmap.max() != 0 else 1

    heatmap_img = Image.fromarray(np.uint8(heatmap * 255))
    heatmap_img = heatmap_img.resize((224, 224), resample=Image.BILINEAR)
    heatmap = np.array(heatmap_img) / 255
    return heatmap

def overlay_heatmap_on_image(image, heatmap, alpha=0.5, colormap='jet'):
    import matplotlib.cm as cm
    color_map = cm.get_cmap(colormap)
    heatmap_color = color_map(heatmap)[:, :, :3]  # Drop alpha channel
    heatmap_color = (heatmap_color * 255).astype(np.uint8)
    heatmap_img = Image.fromarray(heatmap_color).convert("RGBA")
    base_img = image.resize((224, 224)).convert("RGBA")
    blended = Image.blend(base_img, heatmap_img, alpha=alpha)
    return blended

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

        # Remove previous hooks if any
        for hook in list(getattr(model, "_forward_hooks", {}).values()):
            hook.remove()

        # Register hooks on the last encoder layer's last block layernorm_after
        target_layer = model.swin.encoder.layers[-1].blocks[-1].layernorm_after
        target_layer.register_forward_hook(save_hook)
        target_layer.register_backward_hook(backward_hook)

        input_tensor.requires_grad_()
        outputs = model(input_tensor)
        logits = outputs.logits

        probs = torch.nn.functional.softmax(logits, dim=1)
        predicted_class = torch.argmax(probs, dim=1).item()
        confidence = torch.max(probs).item()

        model.zero_grad()
        class_score = logits[0, predicted_class]
        class_score.backward()

        activations = target_layer.activations
        gradients = target_layer.gradients

        heatmap = generate_gradcam_heatmap(activations, gradients)
        overlayed_img = overlay_heatmap_on_image(image, heatmap)

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
