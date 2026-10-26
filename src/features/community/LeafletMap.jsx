import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PinDot from './PinDot';
import { FACILITY_TYPES, NEAR_KM, PIN_TYPES, distanceKm, isNearby } from './pinTypes';

// A Leaflet map with OpenStreetMap tiles. Leaflet is not a React library, so
// React only gives it an empty <div> (the ref) and Leaflet draws inside it.
// Three effects: create the map once, move it when the centre changes, and
// redraw the pins (plus a "near you" ring and a you-are-here dot) when either changes.
const LeafletMap = ({ center, pins, className = '' }) => {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const { lat, lon } = center;

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
    L.circle([lat, lon], {
      radius: NEAR_KM * 1000, color: '#65a30d', weight: 2, dashArray: '6 6', fillColor: '#bef264', fillOpacity: 0.12, interactive: false,
    }).addTo(layer);
    L.circleMarker([lat, lon], { radius: 7, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1, interactive: false }).addTo(layer);
    for (const pin of pins) {
      // Facilities near you are drawn bigger, with a lime ring, and on top.
      const near = FACILITY_TYPES.includes(pin.type) && isNearby(distanceKm({ lat, lon }, pin));
      L.marker([pin.lat, pin.lon], { icon: dotIcon(pin.type, near), title: pin.title, alt: pin.title, zIndexOffset: near ? 1000 : 0 })
        .bindPopup(popup(pin))
        .addTo(layer);
    }
  }, [pins, lat, lon]);

  return <div ref={boxRef} role="region" aria-label="Map" className={`z-0 ${className}`} />;
};

// The same PinDot as the legend, drawn once per type when this file loads
// (outside any React render, so flushSync is allowed) and kept as HTML for
// Leaflet. react-dom/server would do it too but doubles this chunk.
const dotHtml = new Map();
for (const type of [...Object.keys(PIN_TYPES), 'unknown']) {
  for (const near of [false, true]) {
    const box = document.createElement('div');
    const root = createRoot(box);
    flushSync(() => root.render(<PinDot type={type} size={near ? 28 : 22} ring={near} />));
    dotHtml.set(`${type}:${near}`, box.innerHTML);
    root.unmount();
  }
}

function dotIcon(type, near) {
  const size = near ? 34 : 28;
  const html = `<span style="display:block;border-radius:9999px;border:3px solid #fff;box-shadow:0 1px 4px rgb(0 0 0 / .35)">${dotHtml.get(`${PIN_TYPES[type] ? type : 'unknown'}:${near}`)}</span>`;
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
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
