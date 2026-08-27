from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ICON_PATHS = [
    ROOT / "assets/images/icon.png",
    ROOT / "assets/images/splash-icon.png",
    ROOT / "assets/images/favicon.png",
    ROOT / "assets/images/android-icon-foreground.png",
]

for icon_path in ICON_PATHS:
    with Image.open(icon_path) as source:
        image = source.convert("RGBA")
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        image.save(icon_path, "PNG", optimize=True, compress_level=9)
        print(f"Optimized {icon_path.name}: {image.size[0]}x{image.size[1]}")
