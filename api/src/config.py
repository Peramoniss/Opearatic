from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
JSON_DIR = BASE_DIR / "json"
ENV = os.getenv(key="ENV", default="DEV")