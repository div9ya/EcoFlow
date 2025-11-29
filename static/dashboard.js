
const API_KEY = "hujA2mFtx5KlExC7igZK8hAgRobPyBxp";

const map = tt.map({
  key: API_KEY,
  container: "map",
  center: [-0.1276, 51.5072],
  zoom: 12
});
map.addControl(new tt.NavigationControl());

let incidentMarkers = [];
let incidents = [];
let currentRouteSourceId = null;

async function loadIncidentsAroundCenter() {
  const center = map.getCenter();
  const bboxDelta = 0.05;
  const bbox = [
    center.lng - bboxDelta,
    center.lat - bboxDelta,
    center.lng + bboxDelta,
    center.lat + bboxDelta
  ];

  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=${bbox.join(",")}&key=${API_KEY}&timeValidityFilter=present`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    incidents = data.incidents || [];
    clearIncidentMarkers();
    document.getElementById("metric-incidents").innerText = incidents.length;

    incidents.forEach((inc, idx) => {
      const coords = (inc.geometry && inc.geometry.coordinates && inc.geometry.coordinates[0]) || inc.geometry.coordinates || [center.lng, center.lat];
      let lng = coords[0], lat = coords[1];
      const m = new tt.Marker({ color: "crimson" })
        .setLngLat([lng, lat])
        .addTo(map)
        .setPopup(new tt.Popup().setHTML(`<b>Incident</b><br>Type: ${inc.properties?.iconCategory ?? inc.type ?? 'Unknown'}`));
      incidentMarkers.push(m);
    });

    const list = document.getElementById("incidentList");
    list.innerHTML = "";
    incidents.slice(0, 12).forEach((inc, i) => {
      const div = document.createElement("div");
      div.className = "incident-item";
      div.innerHTML = `<div>Type: ${inc.properties?.iconCategory ?? inc.type ?? 'Unknown'}</div><div>${(inc.geometry?.type||'').toLowerCase()}</div>`;
      div.onclick = () => {
        const coords = (inc.geometry && inc.geometry.coordinates && inc.geometry.coordinates[0]) || inc.geometry.coordinates;
        if (coords) map.flyTo({ center: [coords[0], coords[1]], zoom: 15 });
      };
      list.appendChild(div);
    });

  } catch (e) {
    console.error("Incident load failed", e);
  }
}

function clearIncidentMarkers() {
  incidentMarkers.forEach(m => m.remove());
  incidentMarkers = [];
}

map.on("idle", () => {
  loadIncidentsAroundCenter();
});

loadIncidentsAroundCenter();


map.on("click", async (e) => {
  const lat = Number(e.lngLat.lat.toFixed(6));
  const lon = Number(e.lngLat.lng.toFixed(6));

  // traffic flow
  const flowUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${API_KEY}`;
  try {
    const fRes = await fetch(flowUrl);
    const fData = await fRes.json();

    if (fData.flowSegmentData) {
      const seg = fData.flowSegmentData;
      drawTrafficSegment(seg);
      document.getElementById("metric-congestion").innerText = seg.jamFactor ?? calcJam(seg) ?? "--";
 
      document.getElementById("routeDetails").innerHTML =
        `Distance: ${(seg.currentTravelTime || 0)} s<br>Free-flow time: ${(seg.freeFlowTravelTime||0)} s`;
    } else {
    }
  } catch (e) {
    console.warn("Flow API fail", e);
  }

  try {
    const res = await fetch(`/get-aqi?lat=${lat}&lon=${lon}`);
    const a = await res.json();
    document.getElementById("envInfo").innerHTML = `
      <b>At clicked point</b><br>
      PM2.5: ${a.pm25 ?? "N/A"} µg/m³<br>
      PM10: ${a.pm10 ?? "N/A"} µg/m³<br>
      NO₂: ${a.no2 ?? "N/A"} µg/m³
    `;
    document.getElementById("quick-pm25").innerText = a.pm25 ?? "N/A";
    document.getElementById("quick-pm10").innerText = a.pm10 ?? "N/A";
    document.getElementById("quick-no2").innerText = a.no2 ?? "N/A";
  } catch (e) {
    console.warn("AQI fetch failed", e);
  }
});

function calcJam(seg) {
  if (!seg.currentSpeed || !seg.freeFlowSpeed) return null;
  const ratio = seg.currentSpeed / seg.freeFlowSpeed;
  return Math.round((1 - ratio) * 10);
}

function drawTrafficSegment(seg) {
  if (map.getLayer("trafficLine")) {
    map.removeLayer("trafficLine");
    map.removeSource("trafficLine");
  }
  const coords = [
    [seg.startLon, seg.startLat],
    [seg.endLon, seg.endLat]
  ];
  const jam = seg.jamFactor ?? calcJam(seg) ?? 0;
  let color = jam >= 7 ? "crimson" : jam >= 4 ? "orange" : "green";
  const geo = {
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords }
  };
  map.addSource("trafficLine", { type: "geojson", data: geo });
  map.addLayer({
    id: "trafficLine",
    type: "line",
    source: "trafficLine",
    paint: { "line-color": color, "line-width": 6 }
  });
}

const ctx = document.getElementById("aqiChart").getContext("2d");
const aqiChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["PM2.5", "PM10", "NO2"],
    datasets: [{
      label: "µg/m³",
      data: [3, 10, 27],
      backgroundColor: ['#ff6b6b','#ffa94d','#4dabf7']
    }]
  },
  options: {
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } }
  }
});


function fixCoordStr(s) {
  return s.trim().replace(/\s+/g, "");
}


async function ecoRoute() {
  const sVal = document.getElementById("start").value;
  const eVal = document.getElementById("end").value;
  if (!sVal || !eVal) { alert("Enter start and end coords"); return; }
  const start = fixCoordStr(sVal);
  const end = fixCoordStr(eVal);

const routeUrl =
  `https://api.tomtom.com/routing/1/calculateRoute/${start}:${end}/json?` +
  `routeType=eco&traffic=true&travelMode=car&key=${API_KEY}`;
  const r = await fetch(routeUrl);
  const d = await r.json();
  if (!d || !d.routes || !d.routes[0]) { alert("No route found"); return; }
  drawRouteOnMap(d.routes[0]);
  showSummary(d.routes[0]);
}

async function safeRoute() {
  const sVal = document.getElementById("start").value;
  const eVal = document.getElementById("end").value;
  if (!sVal || !eVal) { alert("Enter start and end coords"); return; }
  const start = fixCoordStr(sVal);
  const end = fixCoordStr(eVal);

  const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${start}:${end}/json?routeType=eco&traffic=true&travelMode=car&key=${API_KEY}`;
  let r = await fetch(routeUrl);
  let d = await r.json();
  if (!d || !d.routes || !d.routes[0]) { alert("No route"); return; }

  const mainRoutePoints = routePointsFromRoute(d.routes[0]);
  const nearbyIncidents = incidents.filter(inc => {
    const coords = (inc.geometry && inc.geometry.coordinates && inc.geometry.coordinates[0]) || inc.geometry.coordinates;
    if (!coords) return false;
    const lng = coords[0], lat = coords[1];
    return pointNearPolyline([lng, lat], mainRoutePoints, 0.0025); 
  });

  if (nearbyIncidents.length === 0) {
    drawRouteOnMap(d.routes[0]);
    showSummary(d.routes[0], nearbyIncidents.length);
    return;
  }

  const inc0 = nearbyIncidents[0];
  const coords0 = (inc0.geometry && inc0.geometry.coordinates && inc0.geometry.coordinates[0]) || inc0.geometry.coordinates;
  const detour = offsetCoordinate(coords0[1], coords0[0], 0.005, 90); 
  const waypoint = `${detour.lat},${detour.lon}`;
  const routeUrl2 = `https://api.tomtom.com/routing/1/calculateRoute/${start}:${waypoint}:${end}/json?routeType=eco&traffic=true&travelMode=car&key=${API_KEY}`;
  r = await fetch(routeUrl2);
  d = await r.json();
  if (!d || !d.routes || !d.routes[0]) {
    drawRouteOnMap(d.routes ? d.routes[0] : d);
    showSummary(d.routes ? d.routes[0] : d, nearbyIncidents.length);
    return;
  }
  drawRouteOnMap(d.routes[0]);
  showSummary(d.routes[0], nearbyIncidents.length);
}

function routePointsFromRoute(route) {
  const pts = [];
  if (!route.legs) return pts;
  route.legs.forEach(leg => leg.points.forEach(p => pts.push([p.longitude, p.latitude])));
  return pts;
}

function pointNearPolyline(point, poly, approxDistance=0.0025) {
  const [px, py] = point;
  for (let i=0;i<poly.length-1;i++){
    const [x1,y1] = poly[i];
    const [x2,y2] = poly[i+1];
    const minx = Math.min(x1,x2)-approxDistance; const maxx = Math.max(x1,x2)+approxDistance;
    const miny = Math.min(y1,y2)-approxDistance; const maxy = Math.max(y1,y2)+approxDistance;
    if (px>=minx && px<=maxx && py>=miny && py<=maxy) return true;
  }
  return false;
}

function offsetCoordinate(lat, lon, deltaDeg, bearing=0) {
  let lat2 = lat, lon2 = lon;
  if (bearing >= 45 && bearing < 135) { lon2 = lon + deltaDeg; }
  else if (bearing >= 135 && bearing < 225) { lat2 = lat - deltaDeg; }
  else if (bearing >= 225 && bearing < 315) { lon2 = lon - deltaDeg; }
  else { lat2 = lat + deltaDeg; }
  return { lat: Number(lat2.toFixed(6)), lon: Number(lon2.toFixed(6)) };
}

function drawRouteOnMap(route) {
  if (map.getLayer("routeLayer")) { map.removeLayer("routeLayer"); map.removeSource("routeSource"); }
  const pts = routePointsFromRoute(route);
  const coords = pts.map(p => [p[0], p[1]]);
  const geo = { type: "Feature", geometry: { type: "LineString", coordinates: coords } };
  map.addSource("routeSource", { type: "geojson", data: geo });
  map.addLayer({ id: "routeLayer", type: "line", source: "routeSource", paint: {"line-color": "#16a085", "line-width": 6 }});
  const bounds = new tt.LngLatBounds();
  coords.forEach(c => bounds.extend(c));
  map.fitBounds(bounds, { padding: 60 });
}

function showSummary(route, incidentCount=0) {
  const summ = route.summary;
  document.getElementById("routeDetails").innerHTML = `Distance: ${(summ.lengthInMeters/1000).toFixed(2)} km<br>ETA: ${(summ.travelTimeInSeconds/60).toFixed(1)} min<br>Nearby incidents avoided: ${incidentCount}`;
}

document.getElementById("ecoBtn").onclick = ecoRoute;
document.getElementById("safeBtn").onclick = safeRoute;

map.on('load', () => {
  
});
