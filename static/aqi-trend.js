const ctx = document.getElementById("aqiChart");

let currentLat = 51.5072;
let currentLon = -0.1276;

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("lat") && urlParams.get("lon")) {
    currentLat = urlParams.get("lat");
    currentLon = urlParams.get("lon");
}

async function loadTrend() {
    const res = await fetch(`/aqi-trend-data?lat=${currentLat}&lon=${currentLon}`);
    const data = await res.json();

    new Chart(ctx, {
        type: "line",
        data: {
            labels: data.timestamps,
            datasets: [{
                label: "PM2.5 Levels (µg/m³)",
                data: data.values,
                borderColor: "green",
                backgroundColor: "rgba(0,128,0,0.2)",
                borderWidth: 3,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

loadTrend();
