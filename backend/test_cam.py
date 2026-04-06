import torch
from torchvision.models import swin_t, Swin_T_Weights
from torchvision.transforms import Compose, Resize, ToTensor, Normalize
from PIL import Image
from torchcam.methods import SmoothGradCAMpp
from torchcam.utils import overlay_mask
import matplotlib.pyplot as plt

# Load the model and weights
weights = Swin_T_Weights.DEFAULT
model = swin_t(weights=weights)
model.eval()

# Initialize the CAM extractor
cam_extractor = SmoothGradCAMpp(model)

# Load and preprocess an input image
image = Image.open("003.png").convert("RGB")  # Or whatever the actual image filename is
 # Replace with actual image path

preprocess = weights.transforms()
input_tensor = preprocess(image).unsqueeze(0)  # Add batch dimension

# Forward pass
with torch.no_grad():
    output = model(input_tensor)

# Get the predicted class
pred_class = output.argmax(dim=1).item()

# Extract CAM for the predicted class
activation_map = cam_extractor(pred_class, output)

# Overlay the CAM on the image
result = overlay_mask(image, activation_map[0], alpha=0.6)

# Show the result
plt.imshow(result)
plt.axis('off')
plt.title(f"SmoothGradCAM++ for class {pred_class}")
plt.show()
