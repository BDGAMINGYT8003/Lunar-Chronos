import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  error: string | null;
  timestamp: number | null;
}

export const useGeolocation = (updateIntervalMs: number = 30000) => {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    altitude: null,
    error: null,
    timestamp: null
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: "Geolocation not supported" }));
      return;
    }

    const updatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || 0, // Default to sea level if null
            error: null,
            timestamp: position.timestamp
          });
        },
        (error) => {
          setLocation(prev => ({ ...prev, error: error.message }));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Initial call
    updatePosition();

    // Interval
    const intervalId = setInterval(updatePosition, updateIntervalMs);

    return () => clearInterval(intervalId);
  }, [updateIntervalMs]);

  return location;
};