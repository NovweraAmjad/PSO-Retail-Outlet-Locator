import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
// Markercluster JS is dynamically loaded below to ensure Leaflet (`L`) is
// available on `window` before the plugin attaches. CSS can remain imported
// statically so styles are available.
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const PAKISTAN_CENTER = [30.3753, 69.3451];

const markerIcons = {
  enabled: new L.DivIcon({
    className: "custom-marker marker-enabled",
    html: `<span class='marker-pin'></span>`,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -36],
  }),
  disabled: new L.DivIcon({
    className: "custom-marker marker-disabled",
    html: `<span class='marker-pin'></span>`,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -36],
  }),
  normal: new L.DivIcon({
    className: "custom-marker marker-normal",
    html: `<span class='marker-pin'></span>`,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -36],
  }),
};

const getMarkerIcon = (status) => {
  if (status?.toString().toUpperCase() === "Y") return markerIcons.enabled;
  if (status?.toString().toUpperCase() === "N") return markerIcons.disabled;
  return markerIcons.normal;
};

const getTileProvider = (language) => {
  if (language === "ur") {
    return {
      url: "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };
  }
  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  };
};

function MarkerCluster({ stations, text, searchText }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const points = (stations || []).filter((s) => s.latitude != null && s.longitude != null);

    let isMounted = true;

    (async () => {
      // Ensure the global `L` exists for the plugin to attach to
      if (typeof window !== 'undefined') window.L = L;

      // Load markercluster plugin only when needed and if it hasn't attached
      if (typeof L.markerClusterGroup !== 'function') {
        try {
          await import('leaflet.markercluster');
        } catch (err) {
          // If plugin fails to load, gracefully skip clustering.
          // Log to console for debugging, but avoid throwing to keep app alive.
          // eslint-disable-next-line no-console
          console.warn('Failed to load leaflet.markercluster plugin', err);
        }
      }

      if (!isMounted) return;

      const mcg = (typeof L.markerClusterGroup === 'function')
        ? L.markerClusterGroup({
            chunkedLoading: true,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: false,
            iconCreateFunction: (cluster) => {
              const count = cluster.getChildCount();
              const size = count < 10 ? 42 : count < 25 ? 48 : 56;
              return L.divIcon({
                html: `<div class="cluster-marker" style="width:${size}px;height:${size}px"><span class="cluster-count">${count}</span></div>`,
                className: "",
                iconSize: L.point(size, size),
                iconAnchor: L.point(size / 2, size / 2),
              });
            },
          })
        : null;

      if (mcg) {
        points.forEach((station) => {
          const marker = L.marker([station.latitude, station.longitude], { icon: getMarkerIcon(station.pso_cards_enabled) });
          const address = station.location || [station.city, station.district].filter(Boolean).join(', ');
          const popupHtml = `
            <div class='popup-card'>
              <strong>${station.name_of_outlets || 'Unnamed Outlet'}</strong>
              <div class='popup-address'>${address || ''}</div>
              <div>${station.city || ''}</div>
              <div>${text.status}: ${station.pso_cards_enabled?.toString().toUpperCase() === 'Y' ? text.cardEnabled : text.cardDisabled}</div>
              ${station.latitude && station.longitude ? `<div class='popup-actions'><a class='popup-navigate-link' href='https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}' target='_blank' rel='noreferrer'>Navigate</a></div>` : ''}
            </div>`;
          marker.bindPopup(popupHtml);
          marker.on('click', () => marker.openPopup());
          mcg.addLayer(marker);
        });

        mcg.on('clusterclick', function (e) {
          const cluster = e.layer;
          const bounds = cluster.getBounds();
          try {
            map.flyToBounds(bounds, { padding: [40, 40] });
          } catch (err) {
            map.fitBounds(bounds, { padding: [40, 40] });
          }
        });

        map.addLayer(mcg);

        // Fit bounds for search/filtered results (avoid fitting for empty sets)
        if (points.length > 0 && searchText) {
          const bounds = mcg.getBounds();
          if (bounds && bounds.isValid && bounds.isValid()) {
            try { map.flyToBounds(bounds, { padding: [40, 40] }); } catch { map.fitBounds(bounds, { padding: [40, 40] }); }
          }
        }
      }

      return () => {};
    })();

    return () => { isMounted = false; };
  }, [map, stations, text, searchText]);

  return null;
}

function MapInvalidator({ language, compact }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.invalidateSize();
    const timer = window.setTimeout(() => map.invalidateSize(), 200);
    return () => window.clearTimeout(timer);
  }, [map, language, compact]);

  return null;
}

export default function Map({ stations = [], userLocation, text, language = "en", compact = false, searchText = "" }) {
  const tileProvider = getTileProvider(language);

  return (
    <div className={`map-view ${compact ? "map-view--compact" : ""}`}>
      <MapContainer
        center={PAKISTAN_CENTER}
        zoom={compact ? 5 : 6}
        scrollWheelZoom={!compact}
        style={{ height: "100%", width: "100%", minHeight: compact ? 420 : 680 }}
      >
        <TileLayer attribution={tileProvider.attribution} url={tileProvider.url} />
        <MapInvalidator language={language} compact={compact} />
        <MarkerCluster stations={stations} text={text} searchText={searchText} />
        {userLocation && !compact ? (
          <CircleMarker
            center={[userLocation.latitude, userLocation.longitude]}
            radius={10}
            pathOptions={{ color: "#0d9488", fillColor: "#0d9488", fillOpacity: 0.85 }}
          >
            <Popup>{text.markerYourLocation}</Popup>
          </CircleMarker>
        ) : null}
      </MapContainer>
    </div>
  );
}
