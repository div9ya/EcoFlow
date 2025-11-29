import requests
import csv
import time
from datetime import datetime
import numpy as np

API_KEY = "hujA2mFtx5KlExC7igZK8hAgRobPyBxp"

# -------- AUTO-GENERATE GRID OVER LONDON ----------
# Lat range (approx London)
lat_min, lat_max = 51.45, 51.60
lon_min, lon_max = -0.25, 0.05

# Generate 7×7 grid = 49 points
lat_points = np.linspace(lat_min, lat_max, 7)
lon_points = np.linspace(lon_min, lon_max, 7)

POINTS = [(lat, lon) for lat in lat_points for lon in lon_points]
print(f"POINTS GENERATED: {len(POINTS)}")  # Should be 49
# --------------------------------------------------

FILE = "traffic_history.csv"

# Write header if file doesn't exist
try:
    open(FILE, "x").write(
        "timestamp,lat,lon,currentSpeed,freeFlowSpeed,jamFactor,confidence\n"
    )
except:
    pass

while True:
    for lat, lon in POINTS:
        url = f"https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point={lat},{lon}&key={API_KEY}"

        try:
            res = requests.get(url).json()
        except:
            continue

        if "flowSegmentData" not in res:
            continue

        fsd = res["flowSegmentData"]

        with open(FILE, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                datetime.utcnow(),
                lat, lon,
                fsd.get("currentSpeed", None),
                fsd.get("freeFlowSpeed", None),
                fsd.get("jamFactor", None),
                fsd.get("confidence", None)
            ])

    print("Collected batch with", len(POINTS), "points.")
    time.sleep(300)  # 5 min
