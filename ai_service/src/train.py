"""
DHUAN AI Core — Step 3: Model Training & Rigorous Evaluation
Trains a Random Forest Regressor on engineered Lahore smog data with high statistical accuracy.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from features import engineer_features, FEATURE_COLUMNS, TARGET_COLUMN

DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/lahore_smog_dataset.csv'))
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models'))
MODEL_PATH = os.path.join(MODELS_DIR, 'lahore_aqi_rf_model.pkl')
META_PATH = os.path.join(MODELS_DIR, 'model_metadata.json')

def train_lahore_smog_model():
    print("=" * 65)
    print("      TRAINING DHUAN AI SMOG FORECASTING MODEL (LAHORE)      ")
    print("=" * 65)
    
    # 1. Load Data
    print(f"[1/5] Loading historical dataset from: {DATA_FILE}")
    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f"Dataset not found at {DATA_FILE}. Run data_collector.py first.")
        
    df_raw = pd.read_csv(DATA_FILE)
    print(f"      Loaded {len(df_raw):,} raw hourly observations.")
    
    # 2. Engineer Features
    print("[2/5] Running Feature Engineering Pipeline (lags, rollings, physics)...")
    df_features = engineer_features(df_raw)
    print(f"      Engineered {len(FEATURE_COLUMNS)} predictive features across {len(df_features):,} samples.")
    
    X = df_features[FEATURE_COLUMNS]
    y = df_features[TARGET_COLUMN]
    
    # 3. Train-Test Split (Chronological 80% train, 20% test to prevent temporal data leakage)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    print(f"[3/5] Chronological Split: {len(X_train):,} training hours | {len(X_test):,} testing hours")
    
    # 4. Train High-Precision Ensemble Regressor
    print("[4/5] Training High-Precision Random Forest Regressor with 150 estimators...")
    rf_model = RandomForestRegressor(
        n_estimators=150,
        max_depth=22,
        min_samples_split=2,
        min_samples_leaf=1,
        max_features=0.85,
        random_state=42,
        n_jobs=-1
    )
    
    rf_model.fit(X_train, y_train)
    print("      Training completed successfully!")
    
    # 5. Evaluate Rigorously
    print("[5/5] Evaluating Model Accuracy on Unseen Test Split...")
    y_pred = rf_model.predict(X_test)
    
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    
    # Percentage of predictions within strict +/- 10 ug tolerance
    tolerance_10 = (np.abs(y_test - y_pred) <= 10.0).mean() * 100.0
    tolerance_20 = (np.abs(y_test - y_pred) <= 20.0).mean() * 100.0
    
    # Feature Importances
    importances = sorted(
        zip(FEATURE_COLUMNS, rf_model.feature_importances_),
        key=lambda x: x[1],
        reverse=True
    )
    
    print("\n" + "=" * 65)
    print("           MODEL ACCURACY & VERIFICATION REPORT            ")
    print("=" * 65)
    print(f"  • R² Score (Explained Variance) : {r2 * 100:.2f}%  (Target: >95%)")
    print(f"  • Mean Absolute Error (MAE)    : {mae:.2f} µg/m³")
    print(f"  • Root Mean Squared Error (RMSE): {rmse:.2f} µg/m³")
    print(f"  • Accuracy within ±10 µg/m³    : {tolerance_10:.1f}%")
    print(f"  • Accuracy within ±20 µg/m³    : {tolerance_20:.1f}%")
    print("\nTop 5 Most Influential Predictive Features:")
    for feat, imp in importances[:5]:
        print(f"    - {feat:<25} : {imp * 100:.2f}%")
    print("=" * 65)
    
    # 6. Save Model Artifacts
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(rf_model, MODEL_PATH)
    print(f"\n[Saved] AI Model saved to: {MODEL_PATH}")
    
    metadata = {
        "model_type": "RandomForestRegressor",
        "n_estimators": 120,
        "features": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "metrics": {
            "r2_score": round(r2, 4),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "accuracy_within_10ug": round(tolerance_10, 2),
            "accuracy_within_20ug": round(tolerance_20, 2)
        },
        "trained_samples": len(X_train),
        "test_samples": len(X_test),
        "saved_at": pd.Timestamp.now().isoformat()
    }
    
    with open(META_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"[Saved] Model metadata saved to: {META_PATH}\n")
    
    return rf_model, metadata

if __name__ == "__main__":
    train_lahore_smog_model()
