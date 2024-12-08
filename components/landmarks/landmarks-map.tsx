'use client'

import { useLoadScript, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useMemo, useState, useRef } from 'react';
import type { Landmark } from '@/types/landmarks';
import { Button } from "@/components/ui/button";
import { PolygonPoint } from '@/actions/landmarks';

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
  onPolygonChange: (points: PolygonPoint[] | null) => void | Promise<void>;
}

export function LandmarksMap({ landmarks, onPolygonChange }: LandmarksMapProps) {
  const [hoveredMarker, setHoveredMarker] = useState<Landmark | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['drawing']
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

  const onLoad = (map: google.maps.Map) => {
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#FF0000',
        fillOpacity: 0.2,
        strokeWeight: 2,
        strokeColor: '#FF0000',
        clickable: false,
        editable: false,
        zIndex: 1,
      },
    });
    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    google.maps.event.addListener(
      drawingManager, 
      'polygoncomplete', 
      (polygon: google.maps.Polygon) => {
        if (polygonRef.current) {
          polygonRef.current.setMap(null);
        }
        polygonRef.current = polygon;
        setIsDrawing(false);
        drawingManager.setDrawingMode(null);

        const path = polygon.getPath();
        const points: PolygonPoint[] = [];
        for (let i = 0; i < path.getLength(); i++) {
          const vertex = path.getAt(i);
          points.push({
            lat: vertex.lat(),
            lng: vertex.lng(),
          });
        }

        onPolygonChange(points);
      }
    );
  };

  const handleDrawClick = () => {
    if (!drawingManagerRef.current) return;
    
    if (!isDrawing) {
      drawingManagerRef.current.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    } else {
      drawingManagerRef.current.setDrawingMode(null);
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
        onPolygonChange(null);
      }
    }
    setIsDrawing(!isDrawing);
  };

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
          mapContainerStyle={mapContainerStyle}
          zoom={15}
          center={center}
          options={mapOptions}
          onLoad={onLoad}
        >
          {landmarks.map((landmark, index) => (
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
          {hoveredMarker && (
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
        </GoogleMap>
      </div>
    </div>
  );
} 