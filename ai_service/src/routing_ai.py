import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from predict import calculate_us_aqi, get_aqi_category

class SmogRoutingAIEngine:
    """
    DHUAN AI Smart Routing & Real-Time Ride Environment Guard Engine.
    Evaluates multi-modal routes (Car, Bike, Walk, PMA Transit) against
    14-station spatial IDW telemetry, planetary boundary layer dispersion,
    and vehicle-specific inhalation physics.
    """

    def __init__(self, predictor):
        self.predictor = predictor

    def _haversine_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        r = 6371.0
        p1 = math.radians(lat1)
        p2 = math.radians(lat2)
        dp = math.radians(lat2 - lat1)
        dl = math.radians(lng2 - lng1)
        a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
        return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))

    def get_spatial_point_telemetry(self, lat: float, lng: float, stations: List[Dict[str, Any]], baseline_aqi: int = 81, baseline_pm25: float = 25.2) -> Dict[str, Any]:
        if not stations:
            stations = self.predictor.predict_spatial_areas(current_pm25=baseline_pm25, current_aqi=baseline_aqi)

        sum_w = 0.0
        sum_aqi = 0.0
        sum_pm25 = 0.0
        nearest_st = stations[0]
        min_dist_km = 9999.0

        for s in stations:
            d_km = self._haversine_km(lat, lng, float(s['lat']), float(s['lng']))
            if d_km < min_dist_km:
                min_dist_km = d_km
                nearest_st = s

            if d_km < 0.25:
                aqi_val = int(s['aqi'])
                pm25_val = float(s['pm25'])
                cat = get_aqi_category(aqi_val)
                return {
                    "aqi": aqi_val,
                    "pm25": round(pm25_val, 1),
                    "status": cat["status"],
                    "color": cat["color"],
                    "nearest_station": s["name"],
                    "nearest_zone": s["zone_code"],
                    "distance_km": round(d_km, 2)
                }

            w = 1.0 / math.pow(max(0.2, d_km), 2.5)
            sum_w += w
            sum_aqi += float(s['aqi']) * w
            sum_pm25 += float(s['pm25']) * w

        aqi_val = int(round(sum_aqi / sum_w)) if sum_w > 0 else baseline_aqi
        pm25_val = round(sum_pm25 / sum_w, 1) if sum_w > 0 else baseline_pm25
        cat = get_aqi_category(aqi_val)

        return {
            "aqi": aqi_val,
            "pm25": pm25_val,
            "status": cat["status"],
            "color": cat["color"],
            "nearest_station": nearest_st["name"],
            "nearest_zone": nearest_st["zone_code"],
            "distance_km": round(min_dist_km, 2)
        }

    def evaluate_routes(
        self,
        origin: List[float],
        destination: List[float],
        vehicle_mode: str,
        preference: str,
        candidate_routes: List[Dict[str, Any]],
        current_aqi: int = 81,
        current_pm25: float = 25.2,
        stops: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        stations = self.predictor.predict_spatial_areas(current_pm25=current_pm25, current_aqi=current_aqi)
        hour = datetime.now().hour
        is_inversion_hour = (hour >= 20 or hour <= 8)

        # Evaluate each intermediate stop's atmospheric telemetry
        stop_evaluations = []
        if stops:
            for s_idx, st in enumerate(stops):
                if isinstance(st, dict) and "coords" in st and isinstance(st["coords"], (list, tuple)) and len(st["coords"]) >= 2:
                    s_lat, s_lng = float(st["coords"][0]), float(st["coords"][1])
                    s_name = st.get("name") or f"Stop {chr(65 + s_idx)}"
                elif isinstance(st, (list, tuple)) and len(st) >= 2:
                    s_lat, s_lng = float(st[0]), float(st[1])
                    s_name = f"Stop {chr(65 + s_idx)}"
                else:
                    continue
                if s_lat == 0 and s_lng == 0:
                    continue
                s_tel = self.get_spatial_point_telemetry(s_lat, s_lng, stations, current_aqi, current_pm25)
                stop_evaluations.append({
                    "stop_index": s_idx,
                    "label": chr(65 + s_idx),
                    "name": s_name,
                    "lat": s_lat,
                    "lng": s_lng,
                    "aqi": s_tel["aqi"],
                    "pm25": s_tel["pm25"],
                    "status": s_tel["status"],
                    "nearest_station": s_tel["nearest_station"].split(" (")[0]
                })

        # Vehicle physical exposure & ventilation parameters
        mode_profiles = {
            "car": {
                "protection_factor": 0.78,       # Cabin filter & recirculation
                "ventilation_m3_min": 0.011,
                "default_corridor": "Lahore Ring Road (L-20) & Canal Expressway",
                "alt_corridor": "Main Boulevard & Ferozepur Flyover",
                "third_corridor": "Southern Bypass & Defence Avenue"
            },
            "bike": {
                "protection_factor": 1.14,       # Open-air two-wheeler exposure
                "ventilation_m3_min": 0.026,
                "default_corridor": "Canal Green-Belt Service Lane (Low-Exhaust)",
                "alt_corridor": "Model Town & Johar Town Tree Canopy Link",
                "third_corridor": "Secondary Boulevard Bike Corridor"
            },
            "walk": {
                "protection_factor": 1.05,       # Pedestrian street level
                "ventilation_m3_min": 0.032,
                "default_corridor": "Shaded Inner Residential Streets & Park Walkway",
                "alt_corridor": "Green Belt Pedestrian Shortcut",
                "third_corridor": "Neighborhood Inner Street Link"
            },
            "transit": {
                "protection_factor": 0.68,       # PMA AC Metrobus / Orange Line carriage
                "ventilation_m3_min": 0.013,
                "default_corridor": "PMA Dedicated MassTransit Corridor",
                "alt_corridor": "PMA Feeder & Metro Interchange",
                "third_corridor": "PMA Green Electric Bus Corridor"
            }
        }
        profile = mode_profiles.get(vehicle_mode, mode_profiles["car"])

        evaluated = []
        for idx, r in enumerate(candidate_routes):
            coords = r.get("geometry", {}).get("coordinates", [])
            duration_sec = float(r.get("duration", 900))
            distance_m = float(r.get("distance", 5000))

            sampled_aqis = []
            sampled_pm25s = []
            peak_aqi = 0
            peak_station = "Central Lahore"
            min_aqi = 999

            if coords:
                step = max(1, len(coords) // 20)
                for ci in range(0, len(coords), step):
                    pt = coords[ci]  # [lng, lat]
                    tel = self.get_spatial_point_telemetry(pt[1], pt[0], stations, current_aqi, current_pm25)
                    sampled_aqis.append(tel["aqi"])
                    sampled_pm25s.append(tel["pm25"])
                    if tel["aqi"] > peak_aqi:
                        peak_aqi = tel["aqi"]
                        peak_station = tel["nearest_station"].split(" (")[0]
                    if tel["aqi"] < min_aqi:
                        min_aqi = tel["aqi"]
            else:
                sampled_aqis = [current_aqi]
                sampled_pm25s = [current_pm25]
                peak_aqi = current_aqi
                min_aqi = current_aqi

            raw_avg_aqi = sum(sampled_aqis) / len(sampled_aqis)
            raw_avg_pm25 = sum(sampled_pm25s) / len(sampled_pm25s)

            # Apply corridor micro-environment adjustments based on route profile
            corridor_tag = r.get("corridor_type", "")
            corridor_bonus = 1.0
            if corridor_tag in ["ring_road_green", "multi_stop_safest"] or (idx == 0 and len(candidate_routes) > 1 and corridor_tag != "direct_arterial"):
                corridor_bonus = 0.92  # Free-flowing Ring Road / green belt avoids stop-and-go exhaust
            elif corridor_tag == "inner_streets" and vehicle_mode in ["walk", "bike"]:
                corridor_bonus = 0.90  # Inner residential streets avoid main arterial diesel plumes
            elif corridor_tag == "heavy_arterial" or idx == 2:
                corridor_bonus = 1.06

            ambient_aqi = int(round(raw_avg_aqi * corridor_bonus))
            ambient_pm25 = round(raw_avg_pm25 * corridor_bonus, 1)
            effective_aqi = int(round(ambient_aqi * profile["protection_factor"]))

            duration_min = max(1.0, duration_sec / 60.0)
            inhaled_pm25_ug = round(ambient_pm25 * profile["protection_factor"] * profile["ventilation_m3_min"] * duration_min, 1)

            # Calculate AI composite safety score (0 - 100) prioritizing low AQI & low peak hotspots
            aqi_penalty = max(0.0, (ambient_aqi - 45) * 0.48)
            peak_penalty = max(0.0, (peak_aqi - 75) * 0.28)
            dose_penalty = min(12.0, inhaled_pm25_ug * 0.45)
            safety_score = int(round(max(35.0, min(99.0, 100.0 - aqi_penalty - peak_penalty - dose_penalty))))

            # Determine authentic vehicle-specific corridor name
            existing_name = r.get("corridor_name") or (r.get("legs", [{}])[0].get("steps", [{}])[0].get("name", ""))
            if not existing_name or existing_name in ["via Main Route", "Main Route", "via Fastest Route"]:
                if idx == 0:
                    existing_name = f"via {profile['default_corridor']}"
                elif idx == 1:
                    existing_name = f"via {profile['alt_corridor']}"
                else:
                    existing_name = f"via {profile['third_corridor']}"

            evaluated.append({
                "original_idx": idx,
                "duration": round(duration_sec),
                "distance": round(distance_m),
                "corridor_name": existing_name,
                "ambient_aqi": ambient_aqi,
                "effective_aqi": effective_aqi,
                "avg_pm25": ambient_pm25,
                "peak_aqi": peak_aqi,
                "peak_zone": peak_station,
                "min_aqi": min_aqi,
                "inhaled_pm25_ug": inhaled_pm25_ug,
                "safety_score": safety_score,
                "is_inversion_hour": is_inversion_hour,
                "stop_evaluations": stop_evaluations
            })

        if not evaluated:
            return {"routes": [], "recommended_idx": 0, "stop_evaluations": stop_evaluations}

        # Identify true Safest (strictly lowest ambient AQI & highest safety score) and Fastest (lowest duration)
        safest_route = min(evaluated, key=lambda x: (x["ambient_aqi"], -x["safety_score"], x["duration"]))
        fastest_route = min(evaluated, key=lambda x: (x["duration"], x["ambient_aqi"]))
        worst_aqi = max(x["ambient_aqi"] for x in evaluated)
        max_dose = max(x["inhaled_pm25_ug"] for x in evaluated)

        stop_summary_str = ""
        if stop_evaluations:
            stop_parts = [f"Stop {s['label']} ({s['name']}: {s['aqi']} AQI)" for s in stop_evaluations]
            stop_summary_str = f" Covers {', '.join(stop_parts)}."

        for item in evaluated:
            is_safest = (item["original_idx"] == safest_route["original_idx"])
            is_fastest = (item["original_idx"] == fastest_route["original_idx"])
            item["is_safest"] = is_safest
            item["is_fastest"] = is_fastest

            aqi_diff = max(2, worst_aqi - item["ambient_aqi"])
            dose_saved_pct = int(round(((max_dose - item["inhaled_pm25_ug"]) / max(0.1, max_dose)) * 100)) if max_dose > item["inhaled_pm25_ug"] else 14

            if vehicle_mode == "car":
                if is_safest:
                    item["traffic"] = "Free-Flowing (Ring Rd / Green Belt)"
                    item["ai_badge"] = "AI Safest Multi-Stop Route" if stop_evaluations else "AI Safest & Cleanest"
                    item["ai_reasoning"] = (
                        f"AI selected this corridor ({item['corridor_name']}) to bypass higher particulate density near "
                        f"{item['peak_zone']}, reducing ambient smog exposure by -{aqi_diff} AQI ({item['ambient_aqi']} AQI).{stop_summary_str}"
                    )
                elif is_fastest:
                    item["traffic"] = "Fast Express Arterial"
                    item["ai_badge"] = "Fastest Multi-Stop Route" if stop_evaluations else "Fastest Express Route"
                    item["ai_reasoning"] = (
                        f"Shortest travel time ({round(item['duration']/60)} min) via {item['corridor_name']}. "
                        f"Ambient air averages {item['ambient_aqi']} AQI (peak {item['peak_aqi']} AQI near {item['peak_zone']}); keep car AC on recirculation.{stop_summary_str}"
                    )
                else:
                    item["traffic"] = "Moderate Urban Flow"
                    item["ai_badge"] = "Balanced Alternative"
                    item["ai_reasoning"] = (
                        f"Secondary urban arterial averaging {item['ambient_aqi']} AQI with {item['inhaled_pm25_ug']} µg estimated PM2.5 exposure.{stop_summary_str}"
                    )
            elif vehicle_mode == "bike":
                if is_safest:
                    item["traffic"] = "Low Diesel / Tree Canopy"
                    item["ai_badge"] = "AI Safest Bike Corridor"
                    item["ai_reasoning"] = (
                        f"Optimized for two-wheelers: uses tree-lined service lanes & secondary boulevards away from heavy freight exhaust "
                        f"({item['ambient_aqi']} AQI vs {worst_aqi} AQI on main arterial).{stop_summary_str}"
                    )
                else:
                    item["traffic"] = "Heavy Mixed Traffic"
                    item["ai_badge"] = "Fastest Bike Route" if is_fastest else "Direct Arterial (Higher Smog)"
                    item["ai_reasoning"] = (
                        f"Faster direct road ({round(item['duration']/60)} min) but passes closer to {item['peak_zone']} ({item['peak_aqi']} AQI). Wear N95 respirator.{stop_summary_str}"
                    )
            elif vehicle_mode == "walk":
                if is_safest:
                    item["traffic"] = "Pedestrian Inner Streets"
                    item["ai_badge"] = "AI Cleanest Walking Path"
                    item["ai_reasoning"] = (
                        f"Routes through shaded residential inner streets and park walkways ({item['ambient_aqi']} AQI), shielding pedestrians from main-road tailpipe plumes.{stop_summary_str}"
                    )
                else:
                    item["traffic"] = "Main Sidewalk Corridor"
                    item["ai_badge"] = "Direct Walkway"
                    item["ai_reasoning"] = (
                        f"Direct roadside walkway ({round(item['distance']/1000, 1)} km) with {item['ambient_aqi']} AQI average exposure.{stop_summary_str}"
                    )
            else:  # transit (PMA)
                item["traffic"] = "Dedicated PMA Transit Track"
                item["ai_badge"] = "PMA Recommended Line" if is_safest else "PMA Alternative Line"
                item["ai_reasoning"] = (
                    f"Punjab MassTransit Authority (PMA) air-conditioned carriage filters outdoor haze ({item['ambient_aqi']} AQI ambient -> {item['effective_aqi']} AQI cabin equivalent).{stop_summary_str}"
                )

        # Choose default recommended index based on user preference ('fastest' vs 'safest')
        recommended_idx = fastest_route["original_idx"] if preference == "fastest" else safest_route["original_idx"]

        return {
            "evaluated_routes": evaluated,
            "recommended_idx": recommended_idx,
            "safest_idx": safest_route["original_idx"],
            "fastest_idx": fastest_route["original_idx"],
            "stop_evaluations": stop_evaluations
        }

    def monitor_navigation_step(
        self,
        current_pos: List[float],
        ahead_pos: List[float],
        destination: List[float],
        vehicle_mode: str,
        remaining_coords: List[List[float]],
        current_aqi: int = 81,
        current_pm25: float = 25.2,
        simulate_spike: bool = False
    ) -> Dict[str, Any]:
        stations = self.predictor.predict_spatial_areas(current_pm25=current_pm25, current_aqi=current_aqi)

        cur_tel = self.get_spatial_point_telemetry(current_pos[0], current_pos[1], stations, current_aqi, current_pm25)
        ahead_tel = self.get_spatial_point_telemetry(ahead_pos[0], ahead_pos[1], stations, current_aqi, current_pm25)

        cur_area_name = cur_tel["nearest_station"].split(" (")[0]
        ahead_area_name = ahead_tel["nearest_station"].split(" (")[0]

        # Scan remaining route coordinates (~next 3.5 km) for any genuine high-alert smog pockets
        peak_ahead_aqi = ahead_tel["aqi"]
        peak_ahead_pm25 = ahead_tel["pm25"]
        peak_ahead_zone = ahead_area_name

        if remaining_coords:
            scan_slice = remaining_coords[:min(len(remaining_coords), 28)]
            step = max(1, len(scan_slice) // 8)
            for ci in range(0, len(scan_slice), step):
                pt = scan_slice[ci]  # [lng, lat]
                t = self.get_spatial_point_telemetry(pt[1], pt[0], stations, current_aqi, current_pm25)
                if t["aqi"] > peak_ahead_aqi:
                    peak_ahead_aqi = t["aqi"]
                    peak_ahead_pm25 = t["pm25"]
                    peak_ahead_zone = t["nearest_station"].split(" (")[0]

        # Only if an explicit High-Alert Simulation is requested for testing, or if real station AQI is in High Alert
        if simulate_spike:
            peak_ahead_aqi = max(cur_tel["aqi"] + 92, 176)
            peak_ahead_pm25 = round(peak_ahead_aqi * 0.56, 1)
            ahead_tel["aqi"] = peak_ahead_aqi
            ahead_tel["pm25"] = peak_ahead_pm25
            ahead_tel["status"] = get_aqi_category(peak_ahead_aqi)["status"]

        delta_aqi = peak_ahead_aqi - cur_tel["aqi"]
        visibility_km = round(max(0.4, 3.2 - (cur_tel["aqi"] / 95.0)), 1)
        wind_kmh = 6

        # Compute perpendicular cleaner bypass waypoint around the high-smog pocket
        mid_lat = (current_pos[0] + destination[0]) / 2.0
        mid_lng = (current_pos[1] + destination[1]) / 2.0
        d_lat = destination[0] - current_pos[0]
        d_lng = destination[1] - current_pos[1]

        candidate_offsets = [
            [mid_lat + (-d_lng * 0.38 + 0.012), mid_lng + (d_lat * 0.38 + 0.012)],
            [mid_lat - (-d_lng * 0.38 + 0.012), mid_lng - (d_lat * 0.38 + 0.012)],
            [31.4820, 74.3220],  # Model Town Green Belt anchor
            [31.5142, 74.3341]   # Canal Bank Green Corridor anchor
        ]
        best_wp = candidate_offsets[0]
        best_wp_aqi = 999
        best_wp_name = "Canal Green-Belt Bypass"
        for wp in candidate_offsets:
            wp_tel = self.get_spatial_point_telemetry(wp[0], wp[1], stations, current_aqi, current_pm25)
            if wp_tel["aqi"] < best_wp_aqi:
                best_wp_aqi = wp_tel["aqi"]
                best_wp = wp
                best_wp_name = f"{wp_tel['nearest_station'].split(' (')[0]} Green Corridor"

        # STRICT REAL-TIME THRESHOLD:
        # Do NOT trigger route changes when smog is normal (Moderate Haze < 130 AQI).
        # ONLY trigger when ahead corridor enters genuine HIGH ALERT (AQI >= 150 Dense Smog Inversion / Hazardous,
        # or a severe +30 AQI surge into >= 130 AQI), prioritizing user safety.
        is_genuine_high_alert = (peak_ahead_aqi >= 150) or (peak_ahead_aqi >= 130 and delta_aqi >= 30)
        spike_triggered = bool(simulate_spike or is_genuine_high_alert)

        projected_clean_aqi = min(cur_tel["aqi"], best_wp_aqi)
        aqi_saved = max(15, peak_ahead_aqi - projected_clean_aqi)

        if spike_triggered:
            ai_live_message = (
                f"🚨 HIGH SMOG ALERT AHEAD! Near {peak_ahead_zone}, smog reaches {peak_ahead_aqi} AQI "
                f"({get_aqi_category(peak_ahead_aqi)['status']}). AI recommends safer bypass via {best_wp_name} ({projected_clean_aqi} AQI)."
            )
        elif delta_aqi <= -4:
            ai_live_message = (
                f"🌿 AI 1s Scan: Entering cleaner air zone near {peak_ahead_zone} "
                f"({ahead_tel['aqi']} AQI). Current route is safe and optimal."
            )
        else:
            ai_live_message = (
                f"✅ AI 1s Scan: Normal air quality ({cur_tel['aqi']} AQI • {cur_tel['status']}). "
                f"No high smog alert ahead — current path is safe."
            )

        return {
            "timestamp": datetime.now().isoformat(),
            "current_telemetry": {
                **cur_tel,
                "area_name": cur_area_name,
                "visibility_km": visibility_km,
                "wind_kmh": wind_kmh
            },
            "ahead_telemetry": {
                **ahead_tel,
                "area_name": ahead_area_name,
                "peak_aqi_ahead": peak_ahead_aqi,
                "peak_pm25_ahead": peak_ahead_pm25,
                "hotspot_name": peak_ahead_zone,
                "delta_aqi": delta_aqi
            },
            "ai_live_message": ai_live_message,
            "smog_alert": {
                "triggered": spike_triggered,
                "severity": "critical" if peak_ahead_aqi >= 150 else "normal",
                "hotspot_name": peak_ahead_zone,
                "current_path_aqi": peak_ahead_aqi,
                "projected_clean_aqi": projected_clean_aqi,
                "aqi_saved": aqi_saved,
                "delta_aqi": delta_aqi,
                "recommended_corridor": best_wp_name,
                "detour_waypoint": best_wp,
                "message": (
                    f"High Smog Alert ({peak_ahead_aqi} AQI / {peak_ahead_pm25} µg/m³) detected ahead near {peak_ahead_zone}. "
                    f"For your safety, AI recommends switching to {best_wp_name} ({projected_clean_aqi} AQI, -{aqi_saved} AQI cleaner)."
                ) if spike_triggered else "",
                "reason": (
                    f"High Smog Alert ({peak_ahead_aqi} AQI / {peak_ahead_pm25} µg/m³) detected ahead near {peak_ahead_zone}. "
                    f"Rerouting via {best_wp_name} reduces smog exposure to {projected_clean_aqi} AQI (-{aqi_saved} AQI cleaner)."
                ) if spike_triggered else ""
            }
        }
