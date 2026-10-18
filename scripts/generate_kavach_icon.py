"""
Convert KAVACH shield logo into professional multi-resolution Windows .ico and installer assets.
Generates:
- Exact square 32-bit RGBA icon layers: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256.
- High-resolution Inno Setup wizard banner and header bitmaps.
- Transparent PNG assets for desktop, companion, and mobile.
"""

from pathlib import Path
from PIL import Image, ImageOps

SRC_LOGO = Path("kavach-frontend/assets/kavach-shield-logo.png")
if not SRC_LOGO.exists():
    SRC_LOGO = Path("mobile/assets/images/kavach_logo.png")

print(f"[*] Loading master logo from: {SRC_LOGO}")
src_img = Image.open(SRC_LOGO).convert("RGBA")

# Crop transparent margins
bbox = src_img.getbbox()
if bbox:
    cropped = src_img.crop(bbox)
else:
    cropped = src_img

print(f"[*] Master logo cropped dimensions: {cropped.size}")

# Standard Windows Explorer icon sizes
ICON_SIZES = [16, 24, 32, 48, 64, 128, 256]

square_layers = []
for s in ICON_SIZES:
    # 1. Create transparent square canvas
    canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    
    # 2. Fit within s x s preserving aspect ratio with clean padding
    # Small sizes (16, 24) use 100% canvas to maintain pixel clarity
    # Larger sizes (>= 32) use 94% canvas for subtle edge margin
    fill_ratio = 1.0 if s <= 24 else 0.94
    max_dim = max(1, int(s * fill_ratio))
    
    aspect = cropped.width / cropped.height
    if aspect >= 1.0:
        target_w = max_dim
        target_h = max(1, int(max_dim / aspect))
    else:
        target_h = max_dim
        target_w = max(1, int(max_dim * aspect))
    
    resample_filter = Image.Resampling.NEAREST if s <= 16 else Image.Resampling.LANCZOS
    resized = cropped.resize((target_w, target_h), resample_filter)
    
    offset_x = (s - target_w) // 2
    offset_y = (s - target_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)
    square_layers.append(canvas)

# The base image is the 256x256 layer; append other layers
base_layer = square_layers[-1]  # 256x256
other_layers = square_layers[:-1]  # 16, 24, 32, 48, 64, 128

ICO_TARGETS = [
    Path("assets/kavach.ico"),
    Path("assets/shield.ico"),
    Path("mobile/windows/runner/resources/app_icon.ico"),
]

for target in ICO_TARGETS:
    target.parent.mkdir(parents=True, exist_ok=True)
    base_layer.save(target, format="ICO", append_images=other_layers)
    print(f"[OK] Generated Windows Icon: {target} ({target.stat().st_size} bytes)")

# Update mobile/assets/images/kavach_logo.png with crisp transparent master logo
mobile_logo_path = Path("mobile/assets/images/kavach_logo.png")
mobile_logo_path.parent.mkdir(parents=True, exist_ok=True)
cropped.save(mobile_logo_path, format="PNG")
print(f"[OK] Updated Flutter mobile/desktop logo: {mobile_logo_path}")

# Also save assets/kavach_logo.png
assets_logo_path = Path("assets/kavach_logo.png")
cropped.save(assets_logo_path, format="PNG")
print(f"[OK] Saved assets logo: {assets_logo_path}")

# Generate Inno Setup Wizard Bitmaps (BMP format required by Inno Setup)
# 1. WizardImageFile: 164 x 314 px (Left side of Welcome & Finished pages)
wizard_large = Image.new("RGB", (164, 314), "#06080e")
# Paste centered logo in top third
w_shield_w = 140
w_shield_h = int(w_shield_w / (cropped.width / cropped.height))
w_shield = cropped.resize((w_shield_w, w_shield_h), Image.Resampling.LANCZOS)
# Composite with background
w_shield_rgba = Image.new("RGBA", (164, 314), (6, 8, 14, 255))
w_shield_rgba.paste(w_shield, ((164 - w_shield_w) // 2, 60), w_shield)
wizard_large = w_shield_rgba.convert("RGB")
wizard_large_path = Path("assets/wizard_large.bmp")
wizard_large.save(wizard_large_path, format="BMP")
print(f"[OK] Generated Inno Setup WizardImage: {wizard_large_path}")

# 2. WizardSmallImageFile: 55 x 58 px (Top right of all inner wizard pages)
wizard_small = Image.new("RGB", (55, 58), "#0d1527")
s_shield_w = 48
s_shield_h = int(s_shield_w / (cropped.width / cropped.height))
s_shield = cropped.resize((s_shield_w, s_shield_h), Image.Resampling.LANCZOS)
s_shield_rgba = Image.new("RGBA", (55, 58), (13, 21, 39, 255))
s_shield_rgba.paste(s_shield, ((55 - s_shield_w) // 2, (58 - s_shield_h) // 2), s_shield)
wizard_small = s_shield_rgba.convert("RGB")
wizard_small_path = Path("assets/wizard_small.bmp")
wizard_small.save(wizard_small_path, format="BMP")
print(f"[OK] Generated Inno Setup WizardSmallImage: {wizard_small_path}")

print("[SUCCESS] All KAVACH brand assets and Windows ICO files generated successfully.")
