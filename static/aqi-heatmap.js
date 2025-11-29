const API_KEY = "hujA2mFtx5KlExC7igZK8hAgRobPyBxp";

const map = tt.map({
    key: API_KEY,
    container: "map",
    center: [-0.1276, 51.5072],
    zoom: 11
});

async function loadHeatmap() {
    const res = await fetch("/aqi-heatmap-data");
    const points = await res.json();

    const geoData = {
        type: "FeatureCollection",
        features: points.map(p => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [p.lon, p.lat]
            },
            properties: {
                value: p.value
            }
        }))
    };

    if (map.getSource("aqiHeat")) {
        if (map.getLayer("aqiHeatLayer")) map.removeLayer("aqiHeatLayer");
        map.removeSource("aqiHeat");
    }

    map.addSource("aqiHeat", {
        type: "geojson",
        data: geoData
    });

    map.addLayer({
        id: "aqiHeatLayer",
        type: "circle",
        source: "aqiHeat",
        paint: {
            "circle-radius": [
                "interpolate",
                ["linear"],
                ["get", "value"],
                0, 5,
                25, 25
            ],
            "circle-color": [
                "interpolate",
                ["linear"],
                ["get", "value"],
                0, "green",
                10, "yellow",
                20, "orange",
                30, "red",
                50, "purple"
            ],
            "circle-opacity": 0.7
        }
    });
}

loadHeatmap();
