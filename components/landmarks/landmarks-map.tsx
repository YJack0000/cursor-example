'use client'

import { useLoadScript, GoogleMap, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import type { Landmark } from '@/types/landmarks';
import { Button } from "@/components/ui/button";
import { PolygonPoint } from '@/actions/landmarks';

const GOOGLE_MAPS_LIBRARIES: ["geometry"] = ["geometry"];

const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '500px'
};

const BASE_MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      featureType: 'poi',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const DRAWING_MAP_OPTIONS = {
  ...BASE_MAP_OPTIONS,
  draggableCursor: 'crosshair',
  draggable: false,
  scrollwheel: false,
  disableDoubleClickZoom: true,
};

interface LandmarksMapProps {
  landmarks: Landmark[];
  onPolygonChange: (points: PolygonPoint[] | null) => void | Promise<void>;
}

export function LandmarksMap({ landmarks, onPolygonChange }: LandmarksMapProps) {
  const [hoveredMarker, setHoveredMarker] = useState<Landmark | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<PolygonPoint[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const isMouseDown = useRef(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const center = useMemo(() => ({
    lat: 24.7865972,
    lng: 120.9982083
  }), []);

  const calculateDistance = useCallback((p1: PolygonPoint, p2: PolygonPoint) => {
    return Math.sqrt(Math.pow(p2.lat - p1.lat, 2) + Math.pow(p2.lng - p1.lng, 2));
  }, []);

  const handleMouseDown = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing || !e.latLng) return;
    const mouseEvent = e.domEvent as MouseEvent;
    if (mouseEvent.button === 0) { // Left click only
      isMouseDown.current = true;
      setCurrentPath([{
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      }]);
    }
  }, [isDrawing]);

  const handleMouseMove = useCallback((e: google.maps.MapMouseEvent) => {
    if (!isDrawing || !isMouseDown.current || !e.latLng) return;

    const newPoint = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };

    setCurrentPath(prev => {
      const lastPoint = prev[prev.length - 1];
      if (lastPoint && calculateDistance(lastPoint, newPoint) < 0.0001) {
        return prev;
      }
      return [...prev, newPoint];
    });
  }, [isDrawing, calculateDistance]);

  const handleDrawClick = useCallback(() => {
    if (!isDrawing) {
      setIsDrawing(true);
      setHoveredMarker(null);
      setCurrentPath([]);
      onPolygonChange(null);
    } else {
      setIsDrawing(false);
      setCurrentPath([]);
      onPolygonChange(null);
    }
  }, [isDrawing, onPolygonChange]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!isDrawing || !isMouseDown.current) return;

      isMouseDown.current = false;

      if (currentPath.length > 2) {
        const closedPath = [...currentPath, currentPath[0]];

        setCurrentPath(closedPath);
        setIsDrawing(false);
        onPolygonChange(closedPath);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDrawing, currentPath, onPolygonChange]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleDrawClick}
        variant={isDrawing ? "destructive" : "default"}
      >
        {isDrawing ? '取消畫圖' : '開始畫圖'}
      </Button>
      <div className="rounded-md border">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          zoom={15}
          center={center}
          options={isDrawing ? DRAWING_MAP_OPTIONS : BASE_MAP_OPTIONS}
          onLoad={handleMapLoad}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          {!isDrawing && landmarks.map((landmark, index) => (
            <Marker
              key={index}
              position={{
                lat: Number(landmark.緯度),
                lng: Number(landmark.經度),
              }}
              onMouseOver={() => setHoveredMarker(landmark)}
              onMouseOut={() => setHoveredMarker(null)}
            />
          ))}
          
          {!isDrawing && hoveredMarker && (
            <InfoWindow
              position={{
                lat: Number(hoveredMarker.緯度),
                lng: Number(hoveredMarker.經度),
              }}
              onCloseClick={() => setHoveredMarker(null)}
            >
              <div>
                <h3 className="font-bold">{hoveredMarker.名稱}</h3>
                <p>{hoveredMarker.地址}</p>
              </div>
            </InfoWindow>
          )}

          {currentPath.length > 1 && (
            <Polyline
              path={currentPath}
              options={{
                strokeColor: '#FF0000',
                strokeWeight: 2,
                strokeOpacity: 1
              }}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
} 