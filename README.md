# 🔩 IntelliInspect — AI-Powered Screw Defect Detection

IntelliInspect is a full-stack industrial quality control application that uses deep learning to detect defects in screw images. Upload an image, get an instant classification, and visualize exactly where the model is looking via a Grad-CAM heatmap overlay.

![IntelliInspect Dashboard](https://img.shields.io/badge/Status-Live-brightgreen) ![Model](https://img.shields.io/badge/Model-ResNet50-blue) ![Framework](https://img.shields.io/badge/Backend-Flask-lightgrey) ![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB)

---

## ✨ Features

- **AI Defect Detection** — ResNet50 fine-tuned on real screw defect images
- **Grad-CAM Heatmaps** — SmoothGradCAM++ overlays highlight exactly which pixels triggered the prediction
- **Anomaly Reports** — Every prediction is logged to MongoDB with timestamp, confidence, and severity
- **Downloadable Reports** — Export any report as a `.txt` file directly from the dashboard
- **User Authentication** — Secure login/signup with bcrypt-hashed passwords

---

## 🏗️ Architecture

```
Intellispect/
├── backend/          # Flask API + ResNet50 model
│   ├── app.py        # Main Flask application
│   ├── Dockerfile    # For HuggingFace Spaces deployment
│   └── requirements.txt
└── src/              # React frontend
    ├── pages/
    │   ├── Dashboard.js   # Image upload + prediction UI
    │   ├── Reports.js     # Anomaly report table
    │   ├── Login.js
    │   └── Signup.js
    └── styles/
```

---

## 🤖 Model

| Property | Detail |
|----------|--------|
| Architecture | ResNet50 |
| Classes | `Good`, `Defective` |
| Input Size | 224 × 224 |
| Normalization | ImageNet mean/std |
| Explainability | SmoothGradCAM++ (torchcam) |
| Training | Real images + heavy augmentation (flips, rotations, colour jitter) |

---

## 🚀 Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
# Create a .env file with your MONGO_URI
python app.py
```

### Frontend
```bash
npm install
npm start
```

---

## 🌐 Deployment

| Component | Platform |
|-----------|----------|
| Backend (Flask API) | HuggingFace Spaces (Docker) |
| Frontend (React) | Vercel |
| Database | MongoDB Atlas |

---

## 🛠️ Tech Stack

**Frontend**: React, React Router, Vanilla CSS  
**Backend**: Python, Flask, Flask-CORS  
**ML**: PyTorch, torchvision (ResNet50), torchcam  
**Database**: MongoDB Atlas via pymongo  
**Auth**: bcrypt  
**Deployment**: HuggingFace Spaces, Vercel  
