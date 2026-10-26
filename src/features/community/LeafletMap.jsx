import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PIN_TYPES } from './pinTypes';

// A Leaflet map with OpenStreetMap tiles. Leaflet is not a React library, so
// React only gives it an empty <div> (the ref) and Leaflet draws inside it.
// Three effects: create the map once, move it when the centre changes, and
// redraw the pins when they change.
const LeafletMap = ({ center, pins, className = '' }) => {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const map = L.map(boxRef.current).setView([center.lat, center.lon], 13);
    // OSM's tile policy asks for this attribution and light use only.
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    // If OSM's own tile server refuses us (it blocks some networks), switch to
    // CARTO's free tiles, drawn from the same OpenStreetMap data.
    let failed = 0;
    osm.on('tileerror', () => {
      failed += 1;
      if (failed !== 3) return;
      map.removeLayer(osm);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);
    });
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => map.remove();
    // Created once; the effects below handle later changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current.setView([center.lat, center.lon]);
  }, [center.lat, center.lon]);

  useEffect(() => {
    const layer = layerRef.current;
    layer.clearLayers();
    for (const pin of pins) {
      // A coloured dot with the type's icon, matching the legend. No image files needed.
      L.marker([pin.lat, pin.lon], { icon: dotIcon(pin.type), title: pin.title, alt: pin.title })
        .bindPopup(popup(pin))
        .addTo(layer);
    }
  }, [pins]);

  return <div ref={boxRef} role="region" aria-label="Map" className={`z-0 ${className}`} />;
};

function dotIcon(type) {
  const t = PIN_TYPES[type] ?? { color: '#64748b', icon: '' };
  const dot = document.createElement('span');
  dot.textContent = t.icon;
  dot.style.cssText = `display:grid;place-items:center;width:28px;height:28px;border-radius:9999px;border:3px solid #fff;box-shadow:0 1px 4px rgb(0 0 0 / .35);font-size:13px;background:${t.color}`;
  return L.divIcon({ html: dot, className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14] });
}

// Built with textContent, never innerHTML: report text comes from users, so
// HTML in it must show as text, not run (that would be an XSS hole).
function popup(pin) {
  const box = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = pin.title;
  const detail = document.createElement('p');
  detail.textContent = pin.detail ?? '';
  box.append(title, detail);
  // Only links to openstreetmap.org, which is where facility pins come from.
  if (pin.url?.startsWith('https://www.openstreetmap.org/')) {
    const link = document.createElement('a');
    link.href = pin.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = 'View on OpenStreetMap';
    box.append(link);
  }
  return box;
}

export default LeafletMap;
