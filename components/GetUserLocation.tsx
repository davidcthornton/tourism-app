// File: components/GetUserLocation.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

type PositionState = {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
};

type PermissionStateType = PermissionState | null;

const geoOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export default function GetUserLocation() {
  const [position, setPosition] = useState<PositionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);
  const [permissionState, setPermissionState] =
    useState<PermissionStateType>(null);

  const watchIdRef = useRef<number | null>(null);

  // Permissions API
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("permissions" in navigator) ||
      !navigator.permissions.query
    ) {
      return;
    }

    let mounted = true;
    let permStatus: PermissionStatus | null = null;

    const handleChange = () => {
      if (!mounted || !permStatus) return;
      setPermissionState(permStatus.state);
    };

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((perm) => {
        if (!mounted) return;
        permStatus = perm;
        setPermissionState(perm.state);
        perm.addEventListener?.("change", handleChange);
      })
      .catch(() => {
        // Ignore; Permissions API may not be available / may reject
      });

    return () => {
      mounted = false;
      if (permStatus) {
        permStatus.removeEventListener?.("change", handleChange);
      }
    };
  }, []);

  function handleSuccess(pos: GeolocationPosition) {
    const coords = pos.coords;
    setPosition({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
      timestamp: pos.timestamp,
    });
    setError(null);
    setLoading(false);
  }

  function handleError(err: GeolocationPositionError) {
    // Some environments might not expose name/message nicely, so be defensive
    console.error("Geolocation error:", err);
    setError(err.message || String(err));
    setLoading(false);
  }

  function getOneShot() {
    if (
      typeof window === "undefined" ||
      !("geolocation" in navigator) ||
      !navigator.geolocation
    ) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geoOptions
    );
  }

  function startWatching() {
    if (
      typeof window === "undefined" ||
      !("geolocation" in navigator) ||
      !navigator.geolocation
    ) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setError(null);
    setWatching(true);

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geoOptions
    );
    watchIdRef.current = id;
  }

  function stopWatching() {
    if (
      typeof window !== "undefined" &&
      "geolocation" in navigator &&
      navigator.geolocation &&
      watchIdRef.current != null
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatching(false);
  }

  function copyToClipboard() {
    if (!position) return;
    const text = `${position.latitude}, ${position.longitude}`;

    if (typeof window === "undefined") return;

    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        // Optional: toast/snackbar feedback
      })
      .catch(() => {
        // Fallback: temporary textarea
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      });
  }

  function openInMaps() {
    if (!position || typeof window === "undefined") return;
    const { latitude, longitude } = position;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold mb-3">Get user GPS coordinates</h2>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={getOneShot}
          className="px-3 py-2 rounded-md border hover:shadow-sm"
          disabled={loading}
        >
          {loading ? "Fetching…" : "Get current position"}
        </button>

        {!watching ? (
          <button
            onClick={startWatching}
            className="px-3 py-2 rounded-md border"
          >
            Start tracking
          </button>
        ) : (
          <button
            onClick={stopWatching}
            className="px-3 py-2 rounded-md border"
          >
            Stop tracking
          </button>
        )}

        <button
          onClick={copyToClipboard}
          className="px-3 py-2 rounded-md border"
          disabled={!position}
        >
          Copy coords
        </button>

        <button
          onClick={openInMaps}
          className="px-3 py-2 rounded-md border"
          disabled={!position}
        >
          Open in Maps
        </button>
      </div>

      <div className="mb-3">
        <strong>Permission:</strong>{" "}
        <span>{permissionState ?? "(unknown)"}</span>
      </div>

      <div className="bg-gray-50 p-3 rounded-md">
        {error && <div className="text-red-600 mb-2">Error: {error}</div>}

        {position ? (
          <div>
            <div>
              Latitude: <strong>{position.latitude}</strong>
            </div>
            <div>
              Longitude: <strong>{position.longitude}</strong>
            </div>
            <div>
              Accuracy: <strong>{position.accuracy} meters</strong>
            </div>
            {position.altitude !== null && (
              <div>
                Altitude: <strong>{String(position.altitude)}</strong>
              </div>
            )}
            {position.heading !== null && (
              <div>
                Heading: <strong>{String(position.heading)}</strong>
              </div>
            )}
            {position.speed !== null && (
              <div>
                Speed: <strong>{String(position.speed)}</strong>
              </div>
            )}
            <div className="text-sm text-gray-600 mt-2">
              Timestamp:{" "}
              {new Date(position.timestamp).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "medium",
              })}
            </div>
          </div>
        ) : (
          <div className="text-gray-600">
            No position yet. Click &quot;Get current position&quot; or &quot;Start
            tracking&quot;.
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-3">
        Note: Browsers require HTTPS to use Geolocation (except on localhost).
        The site must be served over HTTPS, and the user must grant permission.
        Use geolocation responsibly and only when necessary for your app&apos;s
        functionality.
      </div>
    </div>
  );
}
