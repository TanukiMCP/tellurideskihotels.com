const MAPBOX_TOKEN = "pk.eyJ1IjoidGhla2V5c2phY2tzb24iLCJhIjoiY21oaXVyeHR0MGtoMzJpb3FldjNlNTZ6NCJ9.2TqajQrMP6y0dinBk7lfxw";
const TELLURIDE_CENTER = [-107.8123, 37.9375];
const MAX_DISTANCE_FROM_CENTER_KM = 10;
function getHotelMarkerColor(state) {
  switch (state) {
    case "selected":
      return "#3d6548";
    case "hover":
      return "#4A7C59";
    default:
      return "#4A7C59";
  }
}
function getMarkerSize(state) {
  return state === "default" ? 24 : 28;
}
function getIconSize(markerSize) {
  return markerSize * 0.45;
}
function calculateBounds(coordinates) {
  if (coordinates.length === 0) return null;
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  coordinates.forEach((coord) => {
    const lng = Array.isArray(coord) ? coord[0] : coord.lng;
    const lat = Array.isArray(coord) ? coord[1] : coord.lat;
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ];
}
function formatMapPrice(price, currency = "USD") {
  if (price === 0) return "View Rates";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return formatter.format(price);
}
const MAP_PADDING = {
  top: 80,
  bottom: 80,
  left: 80,
  right: 80
};
const MAX_BOUNDS_ZOOM = 14;
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
function isHotelNearTelluride(lat, lon) {
  const distance = calculateDistance(
    TELLURIDE_CENTER[1],
    // Telluride latitude
    TELLURIDE_CENTER[0],
    // Telluride longitude
    lat,
    lon
  );
  return distance <= MAX_DISTANCE_FROM_CENTER_KM;
}

export { MAX_BOUNDS_ZOOM as M, TELLURIDE_CENTER as T, MAP_PADDING as a, getMarkerSize as b, calculateBounds as c, getIconSize as d, MAPBOX_TOKEN as e, formatMapPrice as f, getHotelMarkerColor as g, isHotelNearTelluride as i };
