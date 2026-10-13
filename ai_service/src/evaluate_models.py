"""
DHUAN AI Core — Model Benchmark & Empirical Evaluation Suite
Compares Persistence Baselines, Linear Regression, Gradient Boosting,
and Random Forest Regressors on unseen chronological test data.
Generates empirical metrics (MAE, RMSE, R2, calibration within tolerances).
"""

import os
import json
import time
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from features import engineer_features, FEATURE_COLUMNS, TARGET_COLUMN

DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/lahore_smog_dataset.csv'))
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models'))
OUTPUT_JSON = os.path.join(MODELS_DIR, 'benchmark_evaluation.json')

def run_model_benchmark():
    print("=" * 70)
    print("       DHUAN AI CORE — EMPIRICAL MODEL BENCHMARK & EVALUATION      ")
    print("=" * 70)

    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f"Dataset not found at {DATA_FILE}")

    raw_df = pd.read_csv(DATA_FILE)
    print(f"Loaded raw dataset: {len(raw_df):,} hourly samples.")

    # 1. Feature Engineering
    df_features = engineer_features(raw_df)
    X = df_features[FEATURE_COLUMNS]
    y = df_features[TARGET_COLUMN]

    # Chronological Split (80% train, 20% test to prevent temporal leakage)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    print(f"Chronological Split: {len(X_train):,} train samples | {len(X_test):,} test samples.\n")

    results = {}

    # Model 1: Persistence Baseline (T-1h Lag)
    y_pred_pers = X_test['pm25_lag_1h']
    mae_pers = mean_absolute_error(y_test, y_pred_pers)
    rmse_pers = np.sqrt(mean_squared_error(y_test, y_pred_pers))
    r2_pers = r2_score(y_test, y_pred_pers)
    tol10_pers = (np.abs(y_test - y_pred_pers) <= 10.0).mean() * 100.0

    results['Persistence_Baseline_T1'] = {
        'model_name': 'Persistence Baseline (t-1h)',
        'type': 'Baseline',
        'mae': round(mae_pers, 2),
        'rmse': round(rmse_pers, 2),
        'r2_score': round(r2_pers, 4),
        'accuracy_pm25_within_10ug': round(tol10_pers, 1),
        'inference_latency_ms': 0.01
    }

    # Model 2: Diurnal Seasonal Baseline (T-24h Lag)
    y_pred_s24 = X_test['pm25_lag_24h']
    mae_s24 = mean_absolute_error(y_test, y_pred_s24)
    rmse_s24 = np.sqrt(mean_squared_error(y_test, y_pred_s24))
    r2_s24 = r2_score(y_test, y_pred_s24)
    tol10_s24 = (np.abs(y_test - y_pred_s24) <= 10.0).mean() * 100.0

    results['Seasonal_Baseline_T24'] = {
        'model_name': 'Seasonal Baseline (t-24h)',
        'type': 'Baseline',
        'mae': round(mae_s24, 2),
        'rmse': round(rmse_s24, 2),
        'r2_score': round(r2_s24, 4),
        'accuracy_pm25_within_10ug': round(tol10_s24, 1),
        'inference_latency_ms': 0.01
    }

    # Model 3: Multivariate Linear Regression
    print("[1/3] Evaluating Linear Regression...")
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    t0 = time.time()
    y_pred_lr = lr.predict(X_test)
    lat_lr = (time.time() - t0) / len(X_test) * 1000.0

    mae_lr = mean_absolute_error(y_test, y_pred_lr)
    rmse_lr = np.sqrt(mean_squared_error(y_test, y_pred_lr))
    r2_lr = r2_score(y_test, y_pred_lr)
    tol10_lr = (np.abs(y_test - y_pred_lr) <= 10.0).mean() * 100.0

    results['LinearRegression'] = {
        'model_name': 'Multivariate Linear Regression',
        'type': 'Linear',
        'mae': round(mae_lr, 2),
        'rmse': round(rmse_lr, 2),
        'r2_score': round(r2_lr, 4),
        'accuracy_pm25_within_10ug': round(tol10_lr, 1),
        'inference_latency_ms': round(lat_lr, 4)
    }

    # Model 4: Gradient Boosting Regressor
    print("[2/3] Evaluating Gradient Boosting Regressor (100 estimators)...")
    gbr = GradientBoostingRegressor(n_estimators=100, max_depth=5, learning_rate=0.08, random_state=42)
    gbr.fit(X_train, y_train)
    t0 = time.time()
    y_pred_gbr = gbr.predict(X_test)
    lat_gbr = (time.time() - t0) / len(X_test) * 1000.0

    mae_gbr = mean_absolute_error(y_test, y_pred_gbr)
    rmse_gbr = np.sqrt(mean_squared_error(y_test, y_pred_gbr))
    r2_gbr = r2_score(y_test, y_pred_gbr)
    tol10_gbr = (np.abs(y_test - y_pred_gbr) <= 10.0).mean() * 100.0

    results['GradientBoostingRegressor'] = {
        'model_name': 'Gradient Boosting Regressor',
        'type': 'Ensemble Boosting',
        'mae': round(mae_gbr, 2),
        'rmse': round(rmse_gbr, 2),
        'r2_score': round(r2_gbr, 4),
        'accuracy_pm25_within_10ug': round(tol10_gbr, 1),
        'inference_latency_ms': round(lat_gbr, 4)
    }

    # Model 5: Production Random Forest Regressor
    print("[3/3] Evaluating Production Random Forest Regressor (120 trees)...")
    rf = RandomForestRegressor(n_estimators=120, max_depth=20, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    t0 = time.time()
    y_pred_rf = rf.predict(X_test)
    lat_rf = (time.time() - t0) / len(X_test) * 1000.0

    mae_rf = mean_absolute_error(y_test, y_pred_rf)
    rmse_rf = np.sqrt(mean_squared_error(y_test, y_pred_rf))
    r2_rf = r2_score(y_test, y_pred_rf)
    tol10_rf = (np.abs(y_test - y_pred_rf) <= 10.0).mean() * 100.0

    results['RandomForestRegressor_Prod'] = {
        'model_name': 'Random Forest Regressor (Production)',
        'type': 'Ensemble Bagging',
        'mae': round(mae_rf, 2),
        'rmse': round(rmse_rf, 2),
        'r2_score': round(r2_rf, 4),
        'accuracy_pm25_within_10ug': round(tol10_rf, 1),
        'inference_latency_ms': round(lat_rf, 4)
    }

    # Print Summary Table
    print("\n" + "=" * 70)
    print(f"{'Model':<35} | {'MAE (µg)':<8} | {'RMSE (µg)':<9} | {'R²':<7} | {'±10µg Acc'}")
    print("-" * 70)
    for k, v in results.items():
        print(f"{v['model_name']:<35} | {v['mae']:<8} | {v['rmse']:<9} | {v['r2_score']:<7} | {v['accuracy_pm25_within_10ug']}%")
    print("=" * 70)

    # Save to JSON
    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(OUTPUT_JSON, 'w') as f:
        json.dump({
            'dataset': 'Lahore Atmospheric Particulate Time-Series (8,760 hours)',
            'evaluation_date': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'test_samples_count': len(X_test),
            'benchmark_results': results
        }, f, indent=2)

    print(f"\nBenchmark results saved to: {OUTPUT_JSON}")
    return results

if __name__ == '__main__':
    run_model_benchmark()
