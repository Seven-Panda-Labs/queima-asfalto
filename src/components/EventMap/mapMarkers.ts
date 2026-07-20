import L from 'leaflet'
import 'leaflet.markercluster'

const PRIMARY = '#2563eb'

export function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<span style="background-color:${color};width:16px;height:16px;border-radius:50%;border:2px solid #fff;display:block;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount()
  const size = count < 10 ? 38 : count < 100 ? 46 : 54
  const fontSize = count < 100 ? 14 : 12

  return L.divIcon({
    html: `<span style="
      background-color:${PRIMARY};
      color:#fff;
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      border:3px solid #fff;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700;
      font-size:${fontSize}px;
      line-height:1;
      box-shadow:0 2px 10px rgba(0,0,0,.35);
    ">${count}</span>`,
    className: 'event-map-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}
