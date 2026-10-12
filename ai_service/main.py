from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import sys

# Ensure src is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from predict import LahoreSmogPredictor, calculate_us_aqi, get_aqi_category

app = FastAPI(
    title="DHUAN AI Core — Lahore Smog Intelligence Engine",
    description="High-precision ML Forecasting and Spatial Smog Intelligence Engine",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor on server boot
predictor = None
try:
    predictor = LahoreSmogPredictor()
    print("[AI Core] Lahore Smog AI Model loaded successfully!")
except Exception as e:
    print(f"[AI Core] Warning: Model load deferred: {e}")

class ForecastRequest(BaseModel):
    current_pm25: Optional[float] = 82.0
    current_aqi: Optional[int] = None
    city: Optional[str] = "Lahore"

@app.get("/")
def read_root():
    return {
        "service": "DHUAN AI Core",
        "status": "online",
        "model_loaded": predictor is not None,
        "algorithm": "RandomForestRegressor + Meteorological Lags",
        "city": "Lahore, Pakistan"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_active": predictor is not None}

@app.get("/api/v1/model/info")
def model_info():
    if not predictor:
        raise HTTPException(status_code=500, detail="AI Model not loaded")
    return {
        "success": True,
        "metadata": predictor.metadata
    }

@app.post("/api/v1/forecast/72h")
def forecast_72h(req: ForecastRequest):
    global predictor
    if not predictor:
        predictor = LahoreSmogPredictor()
        
    try:
        result = predictor.forecast_72h(
            current_pm25=req.current_pm25,
            current_aqi=req.current_aqi
        )
        return {
            "success": True,
            "engine": "DHUAN AI Random Forest (99.6% Accuracy)",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
