Traffic Impact Dashboard

A real-time traffic visualization dashboard built using Flask, Socket.IO, JavaScript, and TomTom Traffic APIs. It displays congestion levels, live incidents, and safe/eco route suggestions using interactive maps and dynamic data processing.

🔥 Features

Real-time Traffic Flow Data using TomTom flowSegmentData API

Live Incident Mapping (accidents, blocks, construction)

Safe Route vs Eco Route Analysis

Dynamic Map Visualization (color-coded safe/moderate/danger roads)

Flask Backend + Socket.IO for instant updates

Future ML Support:

Congestion Prediction

Route Optimization

Travel Time Forecasting

📁 Project Structure
.
├── static/
│   ├── css/
│   └── js/
│       └── dashboard.js
├── templates/
│   └── index.html
├── app.py
├── config.py
└── README.md

🛠 Technologies Used
Frontend

HTML, CSS

JavaScript

Leaflet.js / TomTom Maps SDK

Backend

Python Flask

Flask-SocketIO

Requests Library

Traffic APIs

TomTom Traffic Flow API

TomTom Incident Viewport API

TomTom Routing API

⚙️ Installation
1. Clone the repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

2. Create a virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate   # Linux/Mac

3. Install dependencies
pip install -r requirements.txt

4. Add TomTom API Key

Create a file named config.py:

TOMTOM_API_KEY = "your_api_key_here"

5. Run the Flask server
python app.py

6. Open in browser
http://127.0.0.1:5000

📡 API Endpoints
✔ Traffic Flow Data
GET /api/flowSegmentData?lat=<lat>&lon=<lon>

✔ Incident Data
GET /api/incidents

✔ Route Analysis
GET /api/routeAnalysis?start=<lat,lon>&end=<lat,lon>
