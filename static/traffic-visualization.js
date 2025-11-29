const API_KEY = "hujA2mFtx5KlExC7igZK8hAgRobPyBxp";

const map = tt.map({
    key: API_KEY,
    container: "map",
    center: [-0.1276, 51.5072], // LONDON
    zoom: 12
});

map.addControl(new tt.NavigationControl());



const INCIDENT_TYPES = {
    0: "Unknown",
    1: "Accident",
    2: "Fog",
    3: "Dangerous Conditions",
    4: "Rain",
    5: "Ice",
    6: "Traffic Jam",
    7: "Lane Closed",
    8: "Road Closed",
    9: "Road Works",
    10: "Strong Wind",
    11: "Flooding",
    14: "Broken Down Vehicle"
};

async function loadIncidents() {

    const url =
        "https://api.tomtom.com/traffic/services/5/incidentDetails" +
        "?key=" + API_KEY +
        "&bbox=-0.25,51.45,0.05,51.60" +
        "&fields=%7Bincidents%7Btype%2Cgeometry%7Btype%2Ccoordinates%7D%2Cproperties%7BiconCategory%7D%7D%7D" +
        "&language=en-GB&t=1111&timeValidityFilter=present";

    const res = await fetch(url);
    if (!res.ok) {
        console.error("Incident API Error:", res.status);
        return;
    }

    const data = await res.json();
    console.log("London Incident Data:", data);

    if (!data.incidents) return;

    data.incidents.forEach(incident => {
        const coords = incident.geometry.coordinates[0];

        new tt.Marker({ color: "red" })
            .setLngLat(coords)
            .setPopup(
                new tt.Popup().setHTML(`
                    <b>Incident</b><br>
                    Type: ${INCIDENT_TYPES[incident.properties.iconCategory] || "Unknown"}
                `)
            )
            .addTo(map);
    });
}


loadIncidents();



async function getFlow(lat, lon) {
    const url = `
        https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json
        ?point=${lat},${lon}
        &key=${API_KEY}
    `.replace(/\s+/g, '');

    const res = await fetch(url);
    return await res.json();
}


function drawTrafficLine(start, end, jamFactor) {
    if (!start.lat || !start.lon || !end.lat || !end.lon) return;

    let color = "green";
    if (jamFactor >= 4) color = "yellow";
    if (jamFactor >= 7) color = "red";
    if (jamFactor === 10) color = "black";

    const layerData = {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: [
                [start.lon, start.lat],
                [end.lon, end.lat]
            ]
        }
    };

    if (map.getLayer("trafficLine")) {
        map.removeLayer("trafficLine");
        map.removeSource("trafficLine");
    }

    map.addLayer({
        id: "trafficLine",
        type: "line",
        source: { type: "geojson", data: layerData },
        paint: {
            "line-color": color,
            "line-width": 8
        }
    });
}


map.on("click", async (e) => {
    const lat = e.lngLat.lat;
    const lon = e.lngLat.lng;

    const data = await getFlow(lat, lon);

    if (!data.flowSegmentData) {
        document.getElementById("trafficInfo").innerHTML = `
            <h3>Traffic Details</h3>
            <p>No traffic data available for this road.</p>
        `;
        return;
    }

    const segment = data.flowSegmentData;

    let jamFactor = segment.jamFactor;

    if (jamFactor === undefined || jamFactor === null) {
        if (segment.currentSpeed && segment.freeFlowSpeed && segment.freeFlowSpeed > 0) {
            const ratio = segment.currentSpeed / segment.freeFlowSpeed;
            jamFactor = Math.round((1 - ratio) * 10);
        } else {
            jamFactor = 0;
        }
    }

    drawTrafficLine(
        { lat: segment.startLat, lon: segment.startLon },
        { lat: segment.endLat, lon: segment.endLon },
        jamFactor
    );

   
    document.getElementById("trafficInfo").innerHTML = `
        <h3>Traffic Details</h3>
        <b>Current Speed:</b> ${segment.currentSpeed} km/h<br>
        <b>Free Flow Speed:</b> ${segment.freeFlowSpeed} km/h<br>
        <b>Travel Time:</b> ${segment.currentTravelTime} s<br>
        <b>Free-Flow Travel Time:</b> ${segment.freeFlowTravelTime} s<br>
        <b>Congestion Level:</b> ${jamFactor}/10<br>
        <b>Confidence:</b> ${segment.confidence}<br>
    `;
});
