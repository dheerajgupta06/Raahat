import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext.jsx';
import { bedTone, oxygenMeta } from '../lib/status.js';
import { formatDistance, formatPhone, telHref } from '../lib/format.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const TILE_URLS = {
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  light:
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
};

const tileUrl = (theme) => (theme === 'light' ? TILE_URLS.light : TILE_URLS.dark);

export function HospitalMap({
  hospitals = [],
  center,
  selectedId,
  onSelect,
  className = 'h-[420px] w-full',
  zoom = 12,
  showUser = true,
}) {
  const { theme, t } = useApp();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const markersRef = useRef(new Map());
  const userRef = useRef(null);
  const themeRef = useRef(theme);
  const onSelectRef = useRef(onSelect);
  const lastFitRef = useRef('');
  const fitRef = useRef(null);
  const pendingFitRef = useRef(true);
  themeRef.current = theme;
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      worldCopyJump: true,
    });
    mapRef.current = map;
    tileRef.current = L.tileLayer(tileUrl(themeRef.current), {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.setView([center?.lat ?? 28.5708, center?.lng ?? 77.326], zoom);

    const observer = new ResizeObserver(() => {
      const before = map.getSize();
      map.invalidateSize();
      const after = map.getSize();
      const becameVisible = (before.x === 0 || before.y === 0) && after.x > 0 && after.y > 0;
      if (becameVisible && pendingFitRef.current) {
        pendingFitRef.current = false;
        fitRef.current?.();
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      userRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    tileRef.current?.setUrl(tileUrl(theme));
  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const lat = center?.lat ?? 28.5708;
    const lng = center?.lng ?? 77.326;

    hospitals.forEach((hospital) => {
      if (!Number.isFinite(hospital.location?.lat) || !Number.isFinite(hospital.location?.lng)) return;
      const tone = bedTone(hospital.bedStatus);
      const oxygen = oxygenMeta(hospital.oxygenStatus, t);
      const reception = hospital.contacts?.reception;
      const closed = reception && reception.isOpenNow === false;
      const phone = closed
        ? hospital.contacts?.emergencyWard?.phone || reception?.phone
        : reception?.phone;
      const level = hospital.level?.label || '';
      const icon = L.divIcon({
        className: 'map-pin',
        html: `<div class="map-pin__body" style="--pin-color:${tone.hex};--pin-glow:${tone.hex}66"><span class="map-pin__rank">${hospital.rank || ''}</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([hospital.location.lat, hospital.location.lng], {
        icon,
        title: hospital.name,
        riseOnHover: true,
      })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:190px">
            <div style="font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgb(var(--c-muted))">${escapeHtml(level)}</div>
            <div style="font-weight:700;font-size:13px;margin-top:2px">${escapeHtml(hospital.name)}</div>
            <div style="font-size:11px;color:rgb(var(--c-muted));margin-top:3px">${formatDistance(hospital.distanceKm)} km · ${hospital.etaMinutes || '—'} min · ${escapeHtml(hospital.type)}</div>
            <div style="display:flex;gap:8px;margin-top:6px;font-size:11px">
              <span style="color:${tone.hex};font-weight:700">${hospital.availableBeds ?? 0} ${escapeHtml(t('results.bedsAvailable'))}</span>
              <span style="color:${oxygen.classes.hex};font-weight:600">${escapeHtml(oxygen.label)}</span>
            </div>
            ${
              phone
                ? `<a href="${telHref(phone)}" style="display:inline-flex;margin-top:8px;font-size:11px;font-weight:700;color:rgb(var(--c-accent))">${escapeHtml(formatPhone(phone))} · ${escapeHtml(t('common.call'))}</a>`
                : ''
            }
          </div>`,
          { maxWidth: 260 }
        )
        .on('click', () => onSelectRef.current?.(hospital.id));

      markersRef.current.set(hospital.id, marker);
    });

    if (showUser) {
      if (!userRef.current) {
        const userIcon = L.divIcon({
          className: 'user-pin',
          html: '<div class="user-pin__dot"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        userRef.current = L.marker([lat, lng], { icon: userIcon, title: t('results.youAreHere'), zIndexOffset: 1200 }).addTo(map);
      } else {
        userRef.current.setLatLng([lat, lng]);
      }
    }

    const fitKey = `${hospitals
      .map((hospital) => hospital.id)
      .sort()
      .join('|')}@${lat.toFixed(3)},${lng.toFixed(3)}`;

    fitRef.current = () => {
      if (!hospitals.length) {
        map.setView([lat, lng], zoom);
        return;
      }
      const bounds = L.latLngBounds(hospitals.map((hospital) => [hospital.location.lat, hospital.location.lng]));
      bounds.extend([lat, lng]);
      map.fitBounds(bounds, { padding: [38, 38], maxZoom: 14, animate: true });
    };

    if (lastFitRef.current !== fitKey) {
      lastFitRef.current = fitKey;
      const size = map.getSize();
      if (size.x > 0 && size.y > 0) fitRef.current();
      else pendingFitRef.current = true;
    }
  }, [hospitals, center?.lat, center?.lng, showUser, t, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker, id) => {
      const element = marker.getElement();
      element?.querySelector('.map-pin')?.classList.toggle('map-pin--selected', id === selectedId);
      if (id === selectedId) marker.setZIndexOffset(1000);
      else marker.setZIndexOffset(0);
    });
    if (selectedId) {
      const marker = markersRef.current.get(selectedId);
      if (marker) {
        marker.openPopup();
        map.panTo(marker.getLatLng(), { animate: true, duration: 0.35 });
      }
    }
  }, [selectedId, hospitals]);

  return <div ref={containerRef} className={`relative z-0 ${className}`} aria-label={t('results.map')} role="application" />;
}
