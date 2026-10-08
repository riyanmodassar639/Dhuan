from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

app = FastAPI(title="DHUAN AI Core", description="AI Services for DHUAN platform", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "DHUAN AI Core API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Placeholder for forecasting and routing endpoints
@app.post("/api/v1/predict")
def predict_aqi(location: str):
    # Dummy implementation
    return {"location": location, "predicted_aqi": 150}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
