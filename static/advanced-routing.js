const API_KEY = "hujA2mFtx5KlExC7igZK8hAgRobPyBxp";

const map = tt.map({
    key: API_KEY,
    container: "map",
    center: [-0.1276, 51.5072],
    zoom: 12
});

async function ecoRoute() {
    const startVal = document.getElementById("start").value.trim();
    const endVal = document.getElementById("end").value.trim();

    if (!startVal || !endVal) {
        alert("Enter valid start and end coordinates");
        return;
    }

    const start = startVal.replace(" ", "");
    const end = endVal.replace(" ", "");

    const url = `
        https://api.tomtom.com/routing/1/calculateRoute/${start}:${end}/json?
        routeType=eco&traffic=true&avoid=unpavedRoads&
        travelMode=car&vehicleEngineType=combustion&key=${API_KEY}
    `.replace(/\s+/g, '');

    console.log("API URL:", url);

    const res = await fetch(url);
    const data = await res.json();

    console.log("ROUTING RESPONSE:", data);

    if (!data.routes || data.routes.length === 0) {
        alert("Route not found. Check coordinates!");
        return;
    }

    const points = data.routes[0].legs[0].points;
    drawRoute(points);

    document.getElementById("routeDetails").innerHTML =
        `<b>Distance:</b> ${(data.routes[0].summary.lengthInMeters / 1000).toFixed(2)} km<br>
         <b>ETA:</b> ${(data.routes[0].summary.travelTimeInSeconds / 60).toFixed(1)} min`;
}

function drawRoute(points) {
    const geojson = {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: points.map(p => [p.longitude, p.latitude])
        }
    };

    if (map.getLayer("routeLayer")) {
        map.removeLayer("routeLayer");
        map.removeSource("routeSource");
    }

    map.addSource("routeSource", { type: "geojson", data: geojson });

    map.addLayer({
        id: "routeLayer",
        type: "line",
        source: "routeSource",
        paint: {
            "line-color": "#00ff99",
            "line-width": 6
        }
    });
}

async function reachableRange() {
    let startVal = document.getElementById("start").value.trim();
    if (!startVal) {
        alert("Enter a start coordinate!");
        return;
    }

    const start = startVal.replace(" ", "");

    const url = `
        https://api.tomtom.com/routing/1/calculateReachableRange/${start}/json?
        fuelBudgetInLiters=25
        &travelMode=car
        &routeType=eco
        &vehicleEngineType=combustion
        &traffic=true
        &avoid=unpavedRoads
        &constantSpeedConsumptionInLitersPerHundredkm=50,6.3:130,9.8
        &key=${API_KEY}
    `.replace(/\s+/g, "");

    const res = await fetch(url);
    const data = await res.json();

    console.log("REACHABLE RESPONSE:", data);

    if (!data.reachableRange || !data.reachableRange.coordinates) {
        alert("⚠ No reachable area! Try:\n- Increasing fuel\n- Using a better coordinate\n- Checking if location is on a road");
        return;
    }

    const geojson = {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: data.reachableRange.coordinates
        }
    };

    // Clear old layers
    if (map.getLayer("rangeFill")) map.removeLayer("rangeFill");
    if (map.getLayer("rangeBorder")) map.removeLayer("rangeBorder");
    if (map.getSource("rangeSource")) map.removeSource("rangeSource");

    map.addSource("rangeSource", { type: "geojson", data: geojson });

    map.addLayer({
        id: "rangeFill",
        type: "fill",
        source: "rangeSource",
        paint: {
            "fill-color": "#3388ff",
            "fill-opacity": 0.25
        }
    });

    map.addLayer({
        id: "rangeBorder",
        type: "line",
        source: "rangeSource",
        paint: {
            "line-color": "#0044cc",
            "line-width": 3
        }
    });
}
