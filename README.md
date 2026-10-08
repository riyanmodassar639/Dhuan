# DHUAN — AI-Powered Smog Intelligence, Health & Smart Navigation Platform

**Tagline:** Predict the Smog. Understand the Risk. Choose the Safer Route. Protect the People.
**Event:** Lahore Garrison University — 4th International AI Championship

## Overview
DHUAN is an AI-powered Smog Intelligence, Health Protection, and Smog-Aware Navigation platform for Lahore. A hybrid Random Forest + LSTM engine forecasts AQI three days ahead, area by area. The DHUAN AI Core fuses AQI, forecasts, traffic, wind, and the user's health profile to compute a personal Exposure Score, then recommends the safest route and best travel window.

## Architecture & Tech Stack

### Frontend (Next.js)
- **UI:** Responsive web app, mobile-first
- **Maps:** Leaflet.js for AQI, traffic, predicted movement, health-risk, route, and sensor layers
- **Charts:** Chart.js for forecasts, travel-time timeline, exposure trends

### Backend (Node.js)
- **Framework:** Express/Node.js (managed via package.json)
- **Role:** API gateway, caching, key protection, orchestration

### AI Services (Python FastAPI)
- **Framework:** FastAPI
- **Role:** Forecast and Route Intelligence services
- **Models:** RandomForestRegressor (scikit-learn), LSTM for sequential AQI forecasting
- **Data Processing:** pandas for cleaning and feature engineering

## Folder Structure
- `/frontend`: Next.js web application
- `/backend`: Node.js API Gateway and Orchestration
- `/ai_service`: Python FastAPI for ML Models and Data Processing
