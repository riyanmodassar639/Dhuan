"""
DHUAN AI Core — Step 2: Feature Engineering & Preprocessing Pipeline
Constructs high-precision meteorological and autoregressive lag features for Lahore smog prediction.
"""

import numpy as np
import pandas as pd

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw hourly time-series records into high-dimensional predictive features.
    """
    df = df.copy()
    
    # Ensure sorted by timestamp
    if 'timestamp' in df.columns:
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp').reset_index(drop=True)
        
    # 1. Autoregressive Lags (Atmospheric Persistence)
    df['pm25_lag_1h'] = df['pm2_5'].shift(1)
    df['pm25_lag_2h'] = df['pm2_5'].shift(2)
    df['pm25_lag_3h'] = df['pm2_5'].shift(3)
    df['pm25_lag_24h'] = df['pm2_5'].shift(24)
    
    df['aqi_lag_1h'] = df['us_aqi'].shift(1)
    df['aqi_lag_24h'] = df['us_aqi'].shift(24)
    
    # 2. Moving Window Rolling Aggregations
    df['pm25_roll_mean_6h'] = df['pm2_5'].shift(1).rolling(window=6, min_periods=1).mean()
    df['pm25_roll_mean_24h'] = df['pm2_5'].shift(1).rolling(window=24, min_periods=1).mean()
    df['pm25_roll_std_6h'] = df['pm2_5'].shift(1).rolling(window=6, min_periods=1).std().fillna(0)
    
    # 3. Meteorological Interaction Physics
    # Stagnation Index: High pressure + low wind traps particulate matter against the ground
    df['stagnation_index'] = (df['surface_pressure'] / 1013.25) / (df['wind_speed_10m'] + 0.5)
    
    # Moisture Particle Swelling: High humidity + cold temperature condenses aerosols into dense smog
    df['smog_condensation_factor'] = (df['relative_humidity_2m'] / 100.0) * (40.0 - df['temperature_2m'])
    
    # Thermal Inversion Risk Window (Lahore 06:00 - 09:30 AM with low wind)
    df['inversion_window'] = ((df['hour'] >= 6) & (df['hour'] <= 9) & (df['wind_speed_10m'] < 6.0)).astype(int)
    
    # 4. Circular Temporal Encodings (Continuity across 23:00 -> 00:00 and Dec -> Jan)
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24.0)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24.0)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12.0)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12.0)
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7.0)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7.0)
    
    # Drop initial rows with NaN from 24h shifting
    df = df.dropna().reset_index(drop=True)
    return df

FEATURE_COLUMNS = [
    'pm25_lag_1h',
    'pm25_lag_2h',
    'pm25_lag_3h',
    'pm25_lag_24h',
    'aqi_lag_1h',
    'aqi_lag_24h',
    'pm25_roll_mean_6h',
    'pm25_roll_mean_24h',
    'pm25_roll_std_6h',
    'temperature_2m',
    'relative_humidity_2m',
    'wind_speed_10m',
    'wind_direction_10m',
    'surface_pressure',
    'stagnation_index',
    'smog_condensation_factor',
    'inversion_window',
    'hour_sin',
    'hour_cos',
    'month_sin',
    'month_cos',
    'day_sin',
    'day_cos',
    'is_weekend'
]

TARGET_COLUMN = 'pm2_5'
