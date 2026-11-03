"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

/**
 * Small dark map pinned on one campus. Leaflet is imported on first use, so it
 * costs nothing until a visitor actually opens an education card.
 */
export default function CampusMap({
  coords,
  label,
}: {
  coords: [number, number];
  label: string;
}) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;
    let ro: ResizeObserver | null = null;

    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;

      const touch = window.matchMedia("(pointer: coarse)").matches;
      map = L.map(el.current, {
        center: coords,
        zoom: 15,
        // the wheel belongs to the modal's own scroll, and one-finger drags on
        // a phone should scroll the sheet rather than pan the map
        scrollWheelZoom: false,
        dragging: !touch,
        attributionControl: true,
        zoomControl: true,
      });
      map.attributionControl.setPrefix(false);

      // OpenStreetMap's own tiles: no API key (CARTO's dark basemap now
      // serves an "API KEY REQUIRED" placeholder instead of a map). They are
      // light, so globals.css darkens the tile pane — the pin is untouched.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      // a glowing star rather than Leaflet's stock pin (whose image paths also
      // break under a bundler)
      L.marker(coords, {
        title: label,
        keyboard: false,
        icon: L.divIcon({
          className: "cst-map-pin",
          html: '<span class="cst-map-pin-halo"></span><span class="cst-map-pin-core"></span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(map);

      // This effect runs before the parent dialog's showModal(), so the map is
      // born inside a display:none box and measures 0×0. Re-fit whenever the
      // box gets its real size.
      ro = new ResizeObserver(() => {
        map?.invalidateSize();
        map?.setView(coords, map.getZoom(), { animate: false });
      });
      ro.observe(el.current);
    });

    return () => {
      cancelled = true;
      ro?.disconnect();
      map?.remove();
    };
  }, [coords, label]);

  return (
    <div
      ref={el}
      role="img"
      aria-label={`Map showing ${label}`}
      // isolate: keep Leaflet's own z-indexes (400–1000) from climbing over the
      // modal's sticky header
      className="relative isolate z-0 h-64 w-full overflow-hidden rounded-lg border border-base-border bg-base sm:h-72"
    />
  );
}
