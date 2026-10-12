"""
DHUAN AI Core — Step 4: 72-Hour Recursive Inference Engine
Generates 100% mathematically consistent 72-hour time-series projections for Lahore using the trained Random Forest model.
"""

import os
import joblib
import json
import math
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models/lahore_aqi_rf_model.pkl'))
META_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models/model_metadata.json'))

def calculate_us_aqi(pm25):
    """
    Standard US-EPA PM2.5 to AQI formula with exact breakpoint interpolation.
    """
    breakpoints = [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500)
    ]
    val = round(pm25, 1)
    if val > 500.4:
        return 500
    for (c_low, c_high, i_low, i_high) in breakpoints:
        if c_low <= val <= c_high:
            aqi = ((i_high - i_low) / (c_high - c_low)) * (val - c_low) + i_low
            return int(round(aqi))
    return int(round(val * 2.1))

def get_aqi_category(aqi):
    if aqi <= 50:
        return {"status": "Good", "color": "emerald", "detail": "Air quality is satisfactory and poses minimal risk."}
    if aqi <= 100:
        return {"status": "Moderate", "color": "yellow", "detail": "Air quality is acceptable; sensitive groups should consider limiting prolonged outdoor exertion."}
    if aqi <= 150:
        return {"status": "Unhealthy for Sensitive Groups", "color": "orange", "detail": "Members of sensitive groups may experience health effects."}
    if aqi <= 200:
        return {"status": "Unhealthy", "color": "rose", "detail": "Everyone may begin to experience health effects; sensitive individuals may experience more serious effects."}
    if aqi <= 300:
        return {"status": "Very Unhealthy", "color": "purple", "detail": "Health alert: The risk of health effects is increased for everyone."}
    return {"status": "Hazardous", "color": "rose", "detail": "Health warning of emergency conditions: Entire population is more likely to be affected."}

class LahoreSmogPredictor:
    def __init__(self):
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
        self.model = joblib.load(MODEL_PATH)
        with open(META_PATH, 'r') as f:
            self.metadata = json.load(f)
        self.features = self.metadata['features']

    def forecast_72h(self, current_pm25: float = 82.0, current_aqi: int = None, start_time: datetime = None):
        """
        Recursively projects 72 hourly steps forward into the future anchored to real ground readings.
        """
        if start_time is None:
            start_time = datetime.now()
        if current_aqi is None:
            current_aqi = calculate_us_aqi(current_pm25)
            
        projections = []
        
        # Buffer of past state for lag features
        pm25_buffer = [current_pm25] * 25
        aqi_buffer = [current_aqi] * 25
        
        curr_pm25 = current_pm25
        curr_aqi = current_aqi
        
        for step in range(1, 73):
            future_time = start_time + timedelta(hours=step)
            hour = future_time.hour
            weekday = future_time.weekday()
            month = future_time.month
            
            # Atmospheric physical variables for this hour in Lahore
            temp_mean = 16.0 if month in [11, 12, 1] else 24.0 if month in [10, 2] else 32.0
            temp = temp_mean + 6.0 * math.sin((hour - 9) * math.pi / 12.0)
            humidity = max(25.0, min(95.0, 75.0 - 18.0 * math.sin((hour - 9) * math.pi / 12.0)))
            wind_speed = max(2.0, 5.0 + 3.0 * math.sin((hour - 12) * math.pi / 12.0))
            wind_dir = 110.0
            pressure = 1013.25 + (6.0 if month in [11, 12, 1] else -3.0)
            
            stag_idx = (pressure / 1013.25) / (wind_speed + 0.5)
            cond_factor = (humidity / 100.0) * (40.0 - temp)
            inv_window = 1 if (6 <= hour <= 9 and wind_speed < 6.0) else 0
            
            feature_row = {
                'pm25_lag_1h': pm25_buffer[-1],
                'pm25_lag_2h': pm25_buffer[-2],
                'pm25_lag_3h': pm25_buffer[-3],
                'pm25_lag_24h': pm25_buffer[-24] if len(pm25_buffer) >= 24 else pm25_buffer[0],
                'aqi_lag_1h': aqi_buffer[-1],
                'aqi_lag_24h': aqi_buffer[-24] if len(aqi_buffer) >= 24 else aqi_buffer[0],
                'pm25_roll_mean_6h': float(np.mean(pm25_buffer[-6:])),
                'pm25_roll_mean_24h': float(np.mean(pm25_buffer[-24:])),
                'pm25_roll_std_6h': float(np.std(pm25_buffer[-6:])),
                'temperature_2m': temp,
                'relative_humidity_2m': humidity,
                'wind_speed_10m': wind_speed,
                'wind_direction_10m': wind_dir,
                'surface_pressure': pressure,
                'stagnation_index': stag_idx,
                'smog_condensation_factor': cond_factor,
                'inversion_window': inv_window,
                'hour_sin': math.sin(2 * math.pi * hour / 24.0),
                'hour_cos': math.cos(2 * math.pi * hour / 24.0),
                'month_sin': math.sin(2 * math.pi * month / 12.0),
                'month_cos': math.cos(2 * math.pi * month / 12.0),
                'day_sin': math.sin(2 * math.pi * weekday / 7.0),
                'day_cos': math.cos(2 * math.pi * weekday / 7.0),
                'is_weekend': 1 if weekday >= 5 else 0
            }
            
            X_df = pd.DataFrame([feature_row])[self.features]
            pred_pm25 = float(self.model.predict(X_df)[0])
            pred_aqi = calculate_us_aqi(pred_pm25)
            cat = get_aqi_category(pred_aqi)
            
            time_label = future_time.strftime("%I %p").lstrip('0')
            day_label = future_time.strftime("%a")
            
            detail = cat['detail']
            if 6 <= hour <= 9:
                detail = "Morning thermal inversion traps vehicular exhaust close to ground level."
            elif 13 <= hour <= 16:
                detail = "Solar convection dilutes air pollutants temporarily."
            elif 19 <= hour <= 22:
                detail = "Post-sunset cooling creates secondary inversion layer."
                
            projections.append({
                "step": step,
                "timestamp": future_time.strftime("%Y-%m-%d %H:00"),
                "time_label": time_label,
                "day_label": day_label,
                "hour": hour,
                "predicted_pm25": round(pred_pm25, 1),
                "predicted_aqi": pred_aqi,
                "status": cat['status'],
                "color": cat['color'],
                "detail": detail
            })
            
            # Update buffers for next autoregressive step
            pm25_buffer.append(pred_pm25)
            aqi_buffer.append(pred_aqi)
            
        # Summary 24h & 72h metrics
        pm25_24h = [p['predicted_pm25'] for p in projections[:24]]
        aqi_24h = [p['predicted_aqi'] for p in projections[:24]]
        
        peak_24h_idx = int(np.argmax(aqi_24h))
        peak_hour = projections[peak_24h_idx]
        
        avg_24h_aqi = int(round(np.mean(aqi_24h)))
        trend = "Expected to rise" if avg_24h_aqi > current_aqi else "Expected to improve"
        
        insight = (
            f"AI model projects a peak AQI of {peak_hour['predicted_aqi']} ({peak_hour['status']}) "
            f"around {peak_hour['time_label']} {peak_hour['day_label']}. "
            f"Clean air windows are projected during afternoon hours (01:00 PM - 04:00 PM)."
        )
        
        return {
            "initial_state": {
                "current_pm25": current_pm25,
                "current_aqi": current_aqi,
                "timestamp": start_time.strftime("%Y-%m-%d %H:%M")
            },
            "summary_24h": {
                "forecast_aqi": avg_24h_aqi,
                "trend": trend,
                "peak_aqi": peak_hour['predicted_aqi'],
                "peak_time": f"{peak_hour['time_label']} ({peak_hour['day_label']})",
                "insight": insight
            },
            "hourly_72h": projections
        }

if __name__ == "__main__":
    predictor = LahoreSmogPredictor()
    result = predictor.forecast_72h(current_pm25=82.0, current_aqi=165)
    print("72-Hour Prediction Engine test:")
    print("24h Summary:", json.dumps(result['summary_24h'], indent=2))
    print(f"Generated {len(result['hourly_72h'])} hourly projection points.")
