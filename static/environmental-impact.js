const API_KEY = "hujA2mFtx5KlExC7igZK8hAgRobPyBxp";

const map = tt.map({
    key: API_KEY,
    container: "map",
    center: [-0.1276, 51.5072], // London
    zoom: 12
});

map.addControl(new tt.NavigationControl());

function getAQIColor(pm25) {
    if (pm25 === "N/A") return "gray";

    pm25 = Number(pm25);

    if (pm25 <= 12) return "green";       
    if (pm25 <= 35) return "yellow";      
    if (pm25 <= 55) return "orange";      
    if (pm25 <= 150) return "red";        
    if (pm25 <= 250) return "purple";     
    return "maroon";                      
}

async function fetchAQI(lat, lon) {
    const res = await fetch(`/get-aqi?lat=${lat}&lon=${lon}`);
    const data = await res.json();

    return {
        pm25: data.pm25 ?? "N/A",
        pm10: data.pm10 ?? "N/A",
        no2:  data.no2 ?? "N/A"
    };
}


function estimateNoise(jamFactor) {
    return Math.round(55 + jamFactor * 3);
}


function estimateEmissions(segment) {
    let dist = (segment.freeFlowTravelTime / 3600) * segment.freeFlowSpeed;

    return {
        co2: Math.round(dist * 192),
        nox: (dist * 0.4).toFixed(2),
        pm25: (dist * 0.02).toFixed(2)
    };
}

map.on("click", async (e) => {
    const lat = e.lngLat.lat;
    const lon = e.lngLat.lng;

    const trafficUrl = `
        https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json
        ?point=${lat},${lon}
        &key=${API_KEY}
    `.replace(/\s+/g, '');

    const tRes = await fetch(trafficUrl);
    const tData = await tRes.json();

    if (!tData.flowSegmentData) {
        document.getElementById("envInfo").innerHTML = `
            <h3>Environmental Impact 🌱</h3>
            <p>No traffic data available.</p>
        `;
        return;
    }

    const seg = tData.flowSegmentData;

    let jam = seg.jamFactor;
    if (!jam && seg.currentSpeed && seg.freeFlowSpeed) {
        jam = Math.round((1 - seg.currentSpeed / seg.freeFlowSpeed) * 10);
    }

    const aqi = await fetchAQI(lat, lon);
    const aqiColor = getAQIColor(aqi.pm25);

    const emissions = estimateEmissions(seg);
    const noise = estimateNoise(jam);

    document.getElementById("envInfo").innerHTML = `
        <h3>Environmental Impact 🌱</h3>

        <b>Traffic Congestion:</b> ${jam}/10 <br><br>

        <b>Air Quality:</b><br>
        PM2.5: <span style="color:${aqiColor};font-weight:bold">${aqi.pm25}</span> µg/m³<br>
        PM10: ${aqi.pm10}<br>
        NO₂: ${aqi.no2}<br><br>

        <b>Estimated Emissions:</b><br>
        CO₂: ${emissions.co2} g<br>
        NOx: ${emissions.nox} g<br>
        PM2.5: ${emissions.pm25} g<br><br>

        <b>Noise Level:</b> ${noise} dB<br><br>

        <a href="/aqi-trend" class="feature-btn">📉 View AQI Trend</a>
        <a href="/aqi-heatmap" class="feature-btn">🌡 View AQI Heatmap</a>
    `;
});
