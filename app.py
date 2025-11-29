from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)


@app.route('/')
def home():
    return render_template('index.html')

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/routing")
def routing():
    return render_template("routing.html")

@app.route('/traffic-visualization')
def traffic_visualization():
    return render_template('traffic-visualization.html')

@app.route('/environment-impact')
def environment_impact():
    return render_template('environmental-impact.html')

@app.route('/aqi-trend')
def aqi_trend_page():
    return render_template('aqi-trend.html')


@app.route('/aqi-trend-data')
def aqi_trend_data():
    lat = request.args.get("lat")
    lon = request.args.get("lon")

    API_KEY = "dcd20f3c620b1c389886c936efd1e58387f16bd98f40cacb8704514d2f3f27dc"
    headers = {"X-API-Key": API_KEY}

    loc_url = "https://api.openaq.org/v3/locations"
    loc_params = {
        "coordinates": f"{lat},{lon}",
        "radius": 8000,
        "limit": 1
    }

    loc_res = requests.get(loc_url, headers=headers, params=loc_params)

    if loc_res.status_code != 200:
        return jsonify({"timestamps": [], "values": []})

    try:
        loc_data = loc_res.json()
    except:
        return jsonify({"timestamps": [], "values": []})

    if not loc_data.get("results"):
        return jsonify({"timestamps": [], "values": []})

    sensors = loc_data["results"][0].get("sensors", [])
    pm25_sensor = next((s for s in sensors if s["parameter"]["name"] == "pm25"), None)

    if not pm25_sensor:
        return jsonify({"timestamps": [], "values": []})

    sid = pm25_sensor["id"]

    meas_url = f"https://api.openaq.org/v3/sensors/{sid}/measurements"
    meas_params = {"limit": 24, "sort": "desc"}

    meas_res = requests.get(meas_url, headers=headers, params=meas_params)

    try:
        meas_data = meas_res.json()
    except:
        return jsonify({"timestamps": [], "values": []})

    timestamps = []
    values = []

    if "results" in meas_data:
        for m in reversed(meas_data["results"]):
            time = m["period"]["datetimeTo"]["local"]
            timestamps.append(time[-8:-3])  # HH:MM
            values.append(m["value"])

    return jsonify({"timestamps": timestamps, "values": values})

@app.route('/aqi-heatmap')
def aqi_heatmap_page():
    return render_template('aqi-heatmap.html')



@app.route('/aqi-heatmap-data')
def aqi_heatmap_data():
    API_KEY = "dcd20f3c620b1c389886c936efd1e58387f16bd98f40cacb8704514d2f3f27dc"
    headers = {"X-API-Key": API_KEY}

    loc_url = "https://api.openaq.org/v3/locations"
    params = {
        "coordinates": "51.5072,-0.1276",
        "radius": 15000,
        "limit": 50
    }

    loc_res = requests.get(loc_url, headers=headers, params=params)
    try:
        loc_data = loc_res.json()
    except:
        return jsonify([])

    results = []

    for station in loc_data.get("results", []):
        sensors = station.get("sensors", [])
        pm25_sensor = next((s for s in sensors if s["parameter"]["name"] == "pm25"), None)

        if not pm25_sensor:
            continue

        sid = pm25_sensor["id"]

        meas_url = f"https://api.openaq.org/v3/sensors/{sid}/measurements"
        meas_res = requests.get(meas_url, headers=headers, params={"limit": 1, "sort": "desc"})

        try:
            meas_data = meas_res.json()
        except:
            continue

        if meas_data.get("results"):
            value = meas_data["results"][0]["value"]

            results.append({
                "lat": station["coordinates"]["latitude"],
                "lon": station["coordinates"]["longitude"],
                "value": value
            })

    return jsonify(results)


@app.route('/get-aqi')
def get_aqi():
    lat = request.args.get("lat")
    lon = request.args.get("lon")

    API_KEY = "dcd20f3c620b1c389886c936efd1e58387f16bd98f40cacb8704514d2f3f27dc"
    headers = {"X-API-Key": API_KEY}

    loc_url = "https://api.openaq.org/v3/locations"
    params = {"coordinates": f"{lat},{lon}", "radius": 5000, "limit": 1}

    loc_res = requests.get(loc_url, headers=headers, params=params)
    try:
        loc_data = loc_res.json()
    except:
        return jsonify({"pm25": None, "pm10": None, "no2": None})

    if not loc_data.get("results"):
        return jsonify({"pm25": None, "pm10": None, "no2": None})

    sensors = loc_data["results"][0]["sensors"]

    sensor_map = {"pm25": None, "pm10": None, "no2": None}

    for s in sensors:
        name = s["parameter"]["name"]
        if name in sensor_map:
            sensor_map[name] = s["id"]

    results = {}

    for pollutant, sid in sensor_map.items():
        if sid is None:
            results[pollutant] = None
            continue

        meas_url = f"https://api.openaq.org/v3/sensors/{sid}/measurements"
        meas_res = requests.get(meas_url, headers=headers, params={"limit": 1, "sort": "desc"})

        try:
            meas_data = meas_res.json()
        except:
            results[pollutant] = None
            continue

        if meas_data.get("results"):
            results[pollutant] = meas_data["results"][0]["value"]
        else:
            results[pollutant] = None

    return jsonify(results)



if __name__ == '__main__':
    app.run(debug=True)
