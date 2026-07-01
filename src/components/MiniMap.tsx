import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import type { Coords } from "@/src/hooks/useLocation";

// Free OpenStreetMap view (Leaflet + CDN tiles) showing the user's position
// and a radius circle. No API key required. Uses light/dark tiles to match.
export default function MiniMap({
  coords, radius = 500, isDark, accent, height = 180,
}: {
  coords: Coords | null;
  radius?: number;
  isDark: boolean;
  accent: string;
  height?: number;
}) {
  if (!coords) {
    return (
      <View style={[styles.placeholder, { height, backgroundColor: isDark ? "#0d1a12" : "#e8efe9" }]}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  const tiles = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{margin:0;height:100%;width:100%;background:${isDark ? "#07120c" : "#f4f7f5"}}
.leaflet-control-attribution{display:none}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false}).setView([${coords.lat}, ${coords.lng}], 15);
  L.tileLayer('${tiles}',{maxZoom:19}).addTo(map);
  L.circle([${coords.lat}, ${coords.lng}], {radius:${radius}, color:'${accent}', weight:2, fillColor:'${accent}', fillOpacity:0.12}).addTo(map);
  L.circleMarker([${coords.lat}, ${coords.lng}], {radius:7, color:'#fff', weight:2, fillColor:'${accent}', fillOpacity:1}).addTo(map);
</script></body></html>`;

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={{ backgroundColor: "transparent" }}
        scrollEnabled={false}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, overflow: "hidden", width: "100%" },
  placeholder: { borderRadius: 18, alignItems: "center", justifyContent: "center", width: "100%" },
});
