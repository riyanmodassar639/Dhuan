from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import sys

# Ensure src is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from predict import LahoreSmogPredictor, calculate_us_aqi, get_aqi_category
from assistant import SmogAssistantEngine
from routing_ai import SmogRoutingAIEngine

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
routing_engine = None
try:
    predictor = LahoreSmogPredictor()
    routing_engine = SmogRoutingAIEngine(predictor)
    print("[AI Core] Lahore Smog AI Model & Smart Routing Engine loaded successfully!")
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
        "algorithm": "RandomForestRegressor + Meteorological Lags + Spatial IDW Routing",
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

class SpatialAreasRequest(BaseModel):
    current_pm25: Optional[float] = 25.2
    current_aqi: Optional[int] = 81

@app.post("/api/v1/areas/spatial")
def predict_spatial_areas(req: SpatialAreasRequest):
    global predictor
    if not predictor:
        predictor = LahoreSmogPredictor()
    try:
        areas = predictor.predict_spatial_areas(
            current_pm25=req.current_pm25,
            current_aqi=req.current_aqi
        )
        return {
            "success": True,
            "engine": "DHUAN Spatial Land-Use Regression & Boundary Layer AI",
            "count": len(areas),
            "areas": areas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RouteEvaluationRequest(BaseModel):
    origin: list
    destination: list
    vehicle_mode: Optional[str] = "car"
    preference: Optional[str] = "safest"
    candidate_routes: list
    stops: Optional[list] = []
    current_aqi: Optional[int] = 81
    current_pm25: Optional[float] = 25.2

@app.post("/api/v1/routing/evaluate")
def evaluate_routes(req: RouteEvaluationRequest):
    global predictor, routing_engine
    if not predictor:
        predictor = LahoreSmogPredictor()
    if not routing_engine:
        routing_engine = SmogRoutingAIEngine(predictor)
    try:
        res = routing_engine.evaluate_routes(
            origin=req.origin,
            destination=req.destination,
            vehicle_mode=req.vehicle_mode,
            preference=req.preference,
            candidate_routes=req.candidate_routes,
            current_aqi=req.current_aqi,
            current_pm25=req.current_pm25,
            stops=req.stops or []
        )
        return {
            "success": True,
            "engine": "DHUAN AI Multi-Modal Smog Routing Engine",
            **res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RideMonitorRequest(BaseModel):
    current_pos: list
    ahead_pos: list
    destination: list
    vehicle_mode: Optional[str] = "car"
    remaining_coords: Optional[list] = []
    current_aqi: Optional[int] = 81
    current_pm25: Optional[float] = 25.2
    simulate_spike: Optional[bool] = False

@app.post("/api/v1/routing/monitor-step")
def monitor_ride_step(req: RideMonitorRequest):
    global predictor, routing_engine
    if not predictor:
        predictor = LahoreSmogPredictor()
    if not routing_engine:
        routing_engine = SmogRoutingAIEngine(predictor)
    try:
        res = routing_engine.monitor_navigation_step(
            current_pos=req.current_pos,
            ahead_pos=req.ahead_pos,
            destination=req.destination,
            vehicle_mode=req.vehicle_mode,
            remaining_coords=req.remaining_coords or [],
            current_aqi=req.current_aqi,
            current_pm25=req.current_pm25,
            simulate_spike=bool(req.simulate_spike)
        )
        return {
            "success": True,
            "engine": "DHUAN AI 1-Second Ride Environment Guard",
            **res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AssistantAskRequest(BaseModel):
    query: str
    history: Optional[list] = []
    current_aqi: Optional[int] = 81
    current_pm25: Optional[float] = 25.2
    city: Optional[str] = "Lahore"
    context: Optional[dict] = None

# Initialize assistant engine
assistant_engine = SmogAssistantEngine()

@app.post("/api/v1/assistant/ask")
def assistant_ask(req: AssistantAskRequest):
    global assistant_engine, predictor
    if not assistant_engine:
        assistant_engine = SmogAssistantEngine()
    try:
        ctx = req.context or {}
        if not ctx.get('highAlertAreas') and predictor:
            ctx['highAlertAreas'] = predictor.predict_spatial_areas(
                current_pm25=req.current_pm25,
                current_aqi=req.current_aqi
            )
        if not ctx.get('hourlyForecast') and predictor:
            forecast_res = predictor.forecast_72h(
                current_pm25=req.current_pm25,
                current_aqi=req.current_aqi
            )
            ctx['hourlyForecast'] = forecast_res.get('hourly', [])

        result = assistant_engine.evaluate_query(
            query=req.query,
            current_aqi=req.current_aqi,
            current_pm25=req.current_pm25,
            city=req.city,
            context=ctx
        )
        return {
            "success": True,
            "engine": "DHUAN Domain-Trained Atmospheric AI & Inversion Engine",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

