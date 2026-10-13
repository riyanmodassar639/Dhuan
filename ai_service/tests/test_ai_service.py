import unittest
import os
import sys
import numpy as np
import pandas as pd

# Add src to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from predict import LahoreSmogPredictor, calculate_us_aqi, get_aqi_category
from features import engineer_features, FEATURE_COLUMNS, TARGET_COLUMN
from routing_ai import SmogRoutingAIEngine
from assistant import SmogAssistantEngine

class TestDhuanAiCore(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.predictor = LahoreSmogPredictor()
        cls.routing_engine = SmogRoutingAIEngine(cls.predictor)
        cls.assistant_engine = SmogAssistantEngine()

    def test_01_us_aqi_calculation(self):
        self.assertEqual(calculate_us_aqi(0.0), 0)
        self.assertEqual(calculate_us_aqi(12.0), 50)
        self.assertEqual(calculate_us_aqi(35.4), 100)
        self.assertEqual(calculate_us_aqi(55.4), 150)
        self.assertEqual(calculate_us_aqi(150.4), 200)
        self.assertEqual(calculate_us_aqi(250.4), 300)
        self.assertEqual(calculate_us_aqi(500.4), 500)

    def test_02_aqi_categories(self):
        cat_clean = get_aqi_category(35)
        self.assertEqual(cat_clean["status"], "Clean Air")
        self.assertEqual(cat_clean["color"], "emerald")

        cat_moderate = get_aqi_category(81)
        self.assertEqual(cat_moderate["status"], "Moderate Haze")
        self.assertEqual(cat_moderate["color"], "amber")

        cat_severe = get_aqi_category(245)
        self.assertEqual(cat_severe["status"], "Severe Smog Event")
        self.assertEqual(cat_severe["color"], "purple")

    def test_03_feature_engineering_pipeline(self):
        # Create a small continuous synthetic 48-hour dataframe
        dates = pd.date_range(start="2026-01-01 00:00:00", periods=48, freq="h")
        raw_df = pd.DataFrame({
            "timestamp": dates,
            "pm2_5": [50.0 + i * 0.5 for i in range(48)],
            "us_aqi": [100 + i for i in range(48)],
            "temperature_2m": [15.0 + 5.0 * np.sin(i / 12.0) for i in range(48)],
            "relative_humidity_2m": [60.0 + 10.0 * np.cos(i / 12.0) for i in range(48)],
            "wind_speed_10m": [5.0 + 2.0 * np.sin(i / 6.0) for i in range(48)],
            "wind_direction_10m": [180.0 for _ in range(48)],
            "surface_pressure": [1013.25 for _ in range(48)],
            "hour": [d.hour for d in dates],
            "month": [d.month for d in dates],
            "day_of_week": [d.weekday() for d in dates],
            "is_weekend": [1 if d.weekday() >= 5 else 0 for d in dates]
        })

        feat_df = engineer_features(raw_df)
        for col in FEATURE_COLUMNS:
            self.assertIn(col, feat_df.columns, f"Missing engineered feature {col}")
        self.assertFalse(feat_df[FEATURE_COLUMNS].isnull().any().any(), "Engineered features should contain no NaNs")
        self.assertEqual(len(feat_df), 24, "Should have 24 samples remaining after 24h shifting")

    def test_04_predictor_forecast_72h(self):
        forecast = self.predictor.forecast_72h(current_pm25=25.2, current_aqi=81)
        self.assertIn("hourly_72h", forecast)
        self.assertIn("summary_24h", forecast)
        self.assertEqual(len(forecast["hourly_72h"]), 73)
        self.assertGreaterEqual(forecast["summary_24h"]["forecast_aqi"], 50)
        self.assertLessEqual(forecast["summary_24h"]["forecast_aqi"], 500)

    def test_05_predictor_spatial_areas(self):
        stations = self.predictor.predict_spatial_areas(current_pm25=25.2, current_aqi=81)
        self.assertEqual(len(stations), 14, "Should predict exactly 14 official monitoring stations in Lahore")
        for st in stations:
            self.assertIn("name", st)
            self.assertIn("lat", st)
            self.assertIn("lng", st)
            self.assertIn("aqi", st)
            self.assertGreater(st["lat"], 31.0)
            self.assertGreater(st["lng"], 74.0)

    def test_06_spatial_idw_routing_telemetry(self):
        # Kalma Chowk coordinates
        pt = self.routing_engine.get_spatial_point_telemetry(lat=31.5034, lng=74.3318, stations=[])
        self.assertIn("aqi", pt)
        self.assertIn("nearest_station", pt)
        self.assertIn("distance_km", pt)
        self.assertLess(pt["distance_km"], 5.0, "Kalma Chowk should be within 5km of a monitoring station")

    def test_07_assistant_grounded_response(self):
        res = self.assistant_engine.evaluate_query("What is the current AQI in Lahore?", current_aqi=81, current_pm25=25.2)
        answer = res.get("answer") or res.get("reply")
        self.assertIsNotNone(answer)
        self.assertTrue(len(answer) > 10)
        self.assertIn("smog_category", res)

if __name__ == '__main__':
    unittest.main()
