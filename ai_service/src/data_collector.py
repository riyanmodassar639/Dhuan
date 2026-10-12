"""
DHUAN AI Core — Step 1: Physical Continuous Atmospheric Dataset Generator for Lahore
Simulates realistic continuous atmospheric particulate diffusion and meteorological forcing.
Adheres strictly to continuous physics and US-EPA AQI breakpoint standards.
"""

import os
import math
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data'))
DATA_FILE = os.path.join(DATA_DIR, 'lahore_smog_dataset.csv')

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

def generate_continuous_lahore_dataset():
    """
    Generates a continuous, physically consistent 8,760-hour (1 year) dataset.
    Pollution evolves via continuous physical equations rather than uncorrelated noise.
    """
    print("[1/3] Generating physically continuous atmospheric time-series for Lahore...")
    os.makedirs(DATA_DIR, exist_ok=True)
    
    end_date = datetime.now().replace(minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=365)
    
    random.seed(42)
    np.random.seed(42)
    
    # State tracking
    current_time = start_date
    current_pm25 = 120.0
    records = []
    
    total_hours = 365 * 24
    
    for h in range(total_hours):
        month = current_time.month
        hour = current_time.hour
        weekday = current_time.weekday()
        
        # 1. Seasonal target equilibrium for Lahore
        # Nov, Dec, Jan: Extreme winter inversion + stubble smoke (avg 240)
        # Oct, Feb: High pre/post winter smog (avg 160)
        # Jul, Aug: Monsoon rains washing air clean (avg 40)
        # Mar-Jun, Sep: Normal urban traffic & industrial baseline (avg 90-110)
        if month in [11, 12, 1]:
            seasonal_target = 240.0
            temp_mean = 14.0
            humidity_mean = 78.0
            wind_mean = 4.5
        elif month in [10, 2]:
            seasonal_target = 165.0
            temp_mean = 22.0
            humidity_mean = 62.0
            wind_mean = 7.0
        elif month in [7, 8]:
            seasonal_target = 42.0
            temp_mean = 33.0
            humidity_mean = 75.0
            wind_mean = 14.0
        else:
            seasonal_target = 95.0
            temp_mean = 31.0
            humidity_mean = 45.0
            wind_mean = 9.0
            
        # 2. Daily Diurnal cycle in Lahore
        # Morning peak (07:00-09:30 AM) due to morning rush + night thermal inversion trapping
        # Afternoon drop (13:00-16:00) due to solar convection lifting boundary layer
        # Evening peak (19:00-22:00) due to evening traffic + cooling surface inversion
        diurnal_factor = 1.0 + 0.38 * math.sin((hour - 4) * math.pi / 12.0)
        if 6 <= hour <= 9:
            diurnal_factor += 0.28  # Heavy morning rush + inversion
        elif 19 <= hour <= 22:
            diurnal_factor += 0.22  # Evening traffic
        elif 13 <= hour <= 16:
            diurnal_factor -= 0.32  # Solar convective clearing
            
        # Sunday traffic reduction (~18%)
        weekend_factor = 0.82 if weekday == 6 else 1.0
        
        target_pm25 = seasonal_target * diurnal_factor * weekend_factor
        
        # Weather parameters (smoothly varying)
        temp = temp_mean + 6.0 * math.sin((hour - 9) * math.pi / 12.0) + np.random.normal(0, 0.4)
        humidity = max(20.0, min(98.0, humidity_mean - 16.0 * math.sin((hour - 9) * math.pi / 12.0) + np.random.normal(0, 0.6)))
        wind_speed = max(1.5, wind_mean + 2.8 * math.sin((hour - 12) * math.pi / 12.0) + np.random.normal(0, 0.3))
        wind_direction = (110 + 35 * math.sin(h / 72.0) + np.random.normal(0, 5)) % 360
        surface_pressure = 1013.25 + (7.0 if month in [11, 12, 1] else -3.0) + 2.0 * math.sin(hour * math.pi / 12.0)
        
        # Weather influence on PM2.5:
        # High wind disperses PM2.5
        wind_dispersion = max(0.65, 1.0 - (wind_speed - 5.0) * 0.035)
        # High humidity swells particles
        humidity_effect = 1.0 + (humidity - 50.0) * 0.003
        
        effective_target = target_pm25 * wind_dispersion * humidity_effect
        
        # Continuous physical relaxation equation (Atmospheric Persistence):
        # PM2.5(t) = 0.88 * PM2.5(t-1) + 0.12 * effective_target + slight disturbance
        current_pm25 = max(12.0, (0.86 * current_pm25) + (0.14 * effective_target) + np.random.normal(0, 1.8))
        
        pm10 = current_pm25 * (1.65 + 0.15 * math.sin(hour * math.pi / 12.0))
        us_aqi = calculate_us_aqi(current_pm25)
        
        records.append({
            "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
            "hour": hour,
            "day_of_week": weekday,
            "month": month,
            "is_weekend": 1 if weekday >= 5 else 0,
            "pm2_5": round(current_pm25, 2),
            "pm10": round(pm10, 2),
            "us_aqi": us_aqi,
            "temperature_2m": round(temp, 2),
            "relative_humidity_2m": round(humidity, 2),
            "wind_speed_10m": round(wind_speed, 2),
            "wind_direction_10m": round(wind_direction, 1),
            "surface_pressure": round(surface_pressure, 2),
        })
        
        current_time += timedelta(hours=1)
        
    df = pd.DataFrame(records)
    df.to_csv(DATA_FILE, index=False)
    
    print(f"[2/3] Physically continuous dataset saved to: {DATA_FILE}")
    print(f"      Total Samples: {len(df):,}")
    print(f"      PM2.5 Min/Max/Mean: {df['pm2_5'].min():.1f} / {df['pm2_5'].max():.1f} / {df['pm2_5'].mean():.1f} µg/m³")
    print(f"      AQI Min/Max/Mean  : {df['us_aqi'].min()} / {df['us_aqi'].max()} / {df['us_aqi'].mean():.1f}")
    return df

if __name__ == "__main__":
    generate_continuous_lahore_dataset()
