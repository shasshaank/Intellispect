import torch
import numpy as np
import matplotlib.pyplot as plt
import uuid
import os
from PIL import Image
import torchvision.transforms as transforms

def generate_gradcam(image_tensor, model, output_dir="static"):
    model.eval()
    heatmap_path = None

    attention_maps = []

    def hook_fn(module, input, output):
        attention_maps.append(output.detach().cpu())

    # Hook into the last attention dropout in Swin (depends on model)
    handle = model.swin.encoder.layers[-1].attention.attn_drop.register_forward_hook(hook_fn)

    with torch.no_grad():
        _ = model(image_tensor)

    handle.remove()

    if not attention_maps:
        return None

    attn_map = attention_maps[0][0].mean(dim=0)  # Average heads
    attn_map = attn_map.mean(dim=0).reshape(7, 7).numpy()  # Assume 224x224 input → 7x7 patches
    attn_map = np.maximum(attn_map, 0)

    attn_map = attn_map / attn_map.max()

    # Resize heatmap to image size
    heatmap = Image.fromarray(np.uint8(attn_map * 255)).resize((224, 224)).convert("L")

    # Convert grayscale heatmap to color
    heatmap_np = np.array(heatmap)
    heatmap_colored = plt.get_cmap("jet")(heatmap_np / 255.0)
    heatmap_colored = np.uint8(heatmap_colored[:, :, :3] * 255)
    heatmap_img = Image.fromarray(heatmap_colored)

    # Save to disk
    filename = f"{uuid.uuid4().hex}.jpg"
    heatmap_path = os.path.join(output_dir, filename)
    heatmap_img.save(heatmap_path)

    return f"/static/{filename}"
