'use client'

import { useLoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useMemo, useState } from 'react';
import type { Landmark } from '@/types/landmarks';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const mapOptions = {
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
  disableDefaultUI: true,
  zoomControl: true,
};

interface LandmarksMapProps {
  landmarks: Landmark[];
}

export function LandmarksMap({ landmarks }: LandmarksMapProps) {
  const [hoveredMarker, setHoveredMarker] = useState<Landmark | null>(null);
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const center = useMemo(() => {
    if (landmarks.length === 0) return { lat: 24.7869, lng: 120.9968 };
    
    const total = landmarks.reduce(
      (acc, landmark) => ({
        lat: acc.lat + Number(landmark.緯度),
        lng: acc.lng + Number(landmark.經度),
      }),
      { lat: 0, lng: 0 }
    );

    return {
      lat: total.lat / landmarks.length,
      lng: total.lng / landmarks.length,
    };
  }, [landmarks]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <div className="rounded-md border">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={15}
        center={center}
        options={mapOptions}
      >
        {landmarks.map((landmark, index) => (
          <Marker
            key={index}
            position={{
              lat: Number(landmark.緯度),
              lng: Number(landmark.經度)
            }}
            onMouseOver={() => setHoveredMarker(landmark)}
            onMouseOut={() => setHoveredMarker(null)}
            title={landmark.名稱}
          />
        ))}
        
        {hoveredMarker && (
          <InfoWindow
            position={{
              lat: Number(hoveredMarker.緯度),
              lng: Number(hoveredMarker.經度)
            }}
            onCloseClick={() => setHoveredMarker(null)}
          >
            <div className="p-2">
              <h3 className="font-bold">{hoveredMarker.名稱}</h3>
              <p className="text-sm">{hoveredMarker.地址}</p>
              <p className="text-xs text-gray-600 mt-1">
                {hoveredMarker.類型.join(', ')}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
} 