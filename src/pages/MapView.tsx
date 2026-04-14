import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertTriangle, Users } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapView() {
  const center: [number, number] = [-1.2921, 36.8219]; // Nairobi coordinates as placeholder
  
  const [projects, setProjects] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    // We'll generate mock coordinates for projects and cases since they don't have them in the DB yet
    // In a real app, you'd add lat/lng to the Firestore documents
    
    const unsubProjects = onSnapshot(query(collection(db, 'projects')), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        // Generate random coordinates near the center
        const lat = center[0] + (Math.random() - 0.5) * 0.05;
        const lng = center[1] + (Math.random() - 0.5) * 0.05;
        data.push({ id: doc.id, position: [lat, lng], ...doc.data() });
      });
      setProjects(data);
    });

    const unsubCases = onSnapshot(query(collection(db, 'cases')), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        // Generate random coordinates near the center
        const lat = center[0] + (Math.random() - 0.5) * 0.05;
        const lng = center[1] + (Math.random() - 0.5) * 0.05;
        data.push({ id: doc.id, position: [lat, lng], ...doc.data() });
      });
      setCases(data);
    });

    return () => {
      unsubProjects();
      unsubCases();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GIS & Mapping</h1>
          <p className="text-muted-foreground">Geospatial view of projects, issues, and demographics.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Building2 className="mr-1 h-3 w-3" /> Projects</Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="mr-1 h-3 w-3" /> Issues</Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Users className="mr-1 h-3 w-3" /> Demographics</Badge>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="p-0 flex-1 relative">
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
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
            {cases.map((issue) => (
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
