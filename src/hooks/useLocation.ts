import { useEffect, useState } from "react";
import * as Location from "expo-location";

export type Coords = { lat: number; lng: number };

export type LocationState = {
  coords: Coords | null;
  address: string | null;   // human-readable current address
  status: "loading" | "ready" | "denied";
};

// Requests permission, resolves current GPS position and reverse-geocodes it
// into a short street address. Falls back gracefully when GPS is unavailable.
export function useLocation(): LocationState {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== "granted") { if (!cancelled) setStatus("denied"); return; }

        // Last-known first (instant, works on emulators after a geo fix),
        // then a fresh fix but capped with a timeout so we never hang.
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
            new Promise<null>(resolve => setTimeout(() => resolve(null), 8000)),
          ]);
        }
        if (cancelled) return;
        if (!loc) { setStatus("denied"); return; }
        const c = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setCoords(c);
        setStatus("ready");
        try {
          const results = await Location.reverseGeocodeAsync(loc.coords);
          const a = results[0];
          if (a && !cancelled) {
            const line = [
              a.name && !/^\d+$/.test(a.name) ? a.name : a.street,
              a.district ?? a.subregion ?? a.city,
              a.region,
            ].filter(Boolean).join(", ");
            setAddress(line || `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`);
          }
        } catch {
          if (!cancelled) setAddress(`${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`);
        }
      } catch {
        if (!cancelled) setStatus("denied");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { coords, address, status };
}
