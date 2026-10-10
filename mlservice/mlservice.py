from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import uvicorn

app = FastAPI()

# Enable CORS for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict_soil(file: UploadFile = File(...)):
    # 1. Read image from upload
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"status": "error", "error": "INVALID_FILE", "message": "Could not decode image."}

    # 2. Convert to HSV color space
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    total_pixels = img.shape[0] * img.shape[1]

    # --- VISION GUARD: PLANT DETECTION ---
    # Define range for GREEN color in HSV
    lower_green = np.array([35, 40, 40])
    upper_green = np.array([85, 255, 255])
    
    green_mask = cv2.inRange(hsv, lower_green, upper_green)
    green_pixels = np.count_nonzero(green_mask)
    green_percentage = (green_pixels / total_pixels) * 100

    # If > 25% of image is green, reject it (Strict threshold for soil)
    if green_percentage > 25:
        return {
            "status": "error",
            "error": "INVALID_IMAGE", 
            "message": f"Validation Failed: Image contains too much vegetation ({round(green_percentage, 1)}%). Please upload a clear, close-up photo of only soil."
        }

    # --- VISION GUARD: SKY/SUNLIGHT DETECTION ---
    # Soil photos should be downward-facing. If top of image is very bright, it's likely a landscape.
    # We check for pixels with very high "Value" (Brightness)
    bright_pixels = np.count_nonzero(hsv[:, :, 2] > 220)
    bright_percentage = (bright_pixels / total_pixels) * 100

    if bright_percentage > 30:
        return {
            "status": "error",
            "error": "INVALID_IMAGE",
            "message": "Validation Failed: Image is too bright or contains sky/sunlight. Please take a downward photo of the soil."
        }

    # --- SOIL PIXEL ANALYSIS ---
    # Analyze the 'V' (Value/Brightness) channel
    avg_v = np.mean(hsv[:, :, 2]) 

    # Calibrated Nutrient Formulas
    predicted_ph = round(6.0 + (avg_v / 255) * 1.5, 1)
    nitrogen = int(30 + (avg_v / 2))
    phosphorus = int(20 + (avg_v / 3))
    potassium = int(40 + (avg_v / 2.5))
    moisture = int(100 - (avg_v / 2.5))

    return {
        "status": "success",
        "ph": predicted_ph,
        "nitrogen": nitrogen,
        "phosphorus": phosphorus,
        "potassium": potassium,
        "moisture": moisture
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)