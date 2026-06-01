import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertTriangle, Users, Map as MapIcon, Flame } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';
import { Button } from '@/components/ui/button';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;
    
    // @ts-ignore - leaflet.heat augmentation
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

function MapCenterController() {
  const map = useMap();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    const zoom = params.get('zoom');
    
    if (lat && lng) {
      map.setView([parseFloat(lat), parseFloat(lng)], zoom ? parseInt(zoom) : 15);
    }
  }, [location, map]);

  return null;
}

export const getDeterministicPosition = (id: string, center: [number, number]): [number, number] => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lat = center[0] + ((hash % 100) / 100 - 0.5) * 0.05;
  const lng = center[1] + (((hash * 13) % 100) / 100 - 0.5) * 0.05;
  return [lat, lng];
};

export default function MapView() {
  const center: [number, number] = [-20.1900, 28.5300]; // Nkulumane, Bulawayo coordinates
  
  const [projects, setProjects] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    const unsubProjects = onSnapshot(query(collection(db, 'projects')), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        const position = getDeterministicPosition(doc.id, center);
        data.push({ id: doc.id, position, ...doc.data() });
      });
      setProjects(data);
    });

    const unsubCases = onSnapshot(query(collection(db, 'cases')), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        const position = getDeterministicPosition(doc.id, center);
        data.push({ id: doc.id, position, ...doc.data() });
      });
      setCases(data);
    });

    return () => {
      unsubProjects();
      unsubCases();
    };
  }, []);

  const heatmapPoints = cases.map(c => [c.position[0], c.position[1], c.priority === 'High' ? 1.0 : (c.priority === 'Medium' ? 0.6 : 0.4)] as [number, number, number]);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GIS & Mapping</h1>
          <p className="text-muted-foreground">Geospatial view of projects, issues, and demographics.</p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Building2 className="mr-1 h-3 w-3" /> Projects</Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="mr-1 h-3 w-3" /> Issues</Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Users className="mr-1 h-3 w-3" /> Demographics</Badge>
          </div>
          <Button 
            variant={showHeatmap ? "default" : "outline"}
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="flex items-center gap-2"
          >
            {showHeatmap ? <MapIcon className="w-4 h-4" /> : <Flame className="w-4 h-4 text-orange-500" />}
            {showHeatmap ? "Show Issue Points" : "Show Cases Heatmap"}
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="p-0 flex-1 relative">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <MapCenterController />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {showHeatmap && <HeatmapLayer points={heatmapPoints} />}

            {/* Project Markers */}
            {projects.map((marker) => (
              <Marker key={`proj-${marker.id}`} position={marker.position as [number, number]}>
                <Popup>
                  <div className="font-medium">{marker.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">Status: {marker.status}</div>
                  <div className="text-xs text-muted-foreground">Category: {marker.category}</div>
                </Popup>
              </Marker>
            ))}

            {/* Issue Circles */}
            {!showHeatmap && cases.map((issue) => (
              <Circle 
                key={`iss-${issue.id}`}
                center={issue.position as [number, number]} 
                pathOptions={{ color: issue.priority === 'High' ? 'red' : 'orange', fillColor: issue.priority === 'High' ? '#f87171' : '#fb923c', fillOpacity: 0.5 }} 
                radius={200}
              >
                <Popup>
                  <div className="font-medium">{issue.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">Priority: {issue.priority}</div>
                  <div className="text-xs text-muted-foreground">Status: {issue.status}</div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
}
