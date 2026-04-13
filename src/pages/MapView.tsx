import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, AlertTriangle, Users } from 'lucide-react';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const projectMarkers = [
  { id: 1, position: [-1.2921, 36.8219], title: 'Ward 4 Secondary School Lab', type: 'project', status: 'In Progress' },
  { id: 2, position: [-1.3000, 36.8100], title: 'Central Market Borehole', type: 'project', status: 'Completed' },
  { id: 3, position: [-1.2850, 36.8300], title: 'Dispensary Maternity Wing', type: 'project', status: 'Planning' },
];

const issueMarkers = [
  { id: 1, position: [-1.2950, 36.8250], title: 'Broken Water Pipe', type: 'issue', priority: 'High' },
  { id: 2, position: [-1.2880, 36.8150], title: 'Pothole on Main Road', type: 'issue', priority: 'Medium' },
];

export default function MapView() {
  const center: [number, number] = [-1.2921, 36.8219]; // Nairobi coordinates as placeholder

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
            {projectMarkers.map((marker) => (
              <Marker key={`proj-${marker.id}`} position={marker.position as [number, number]}>
                <Popup>
                  <div className="font-medium">{marker.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">Status: {marker.status}</div>
                </Popup>
              </Marker>
            ))}

            {/* Issue Circles */}
            {issueMarkers.map((issue) => (
              <Circle 
                key={`iss-${issue.id}`}
                center={issue.position as [number, number]} 
                pathOptions={{ color: issue.priority === 'High' ? 'red' : 'orange', fillColor: issue.priority === 'High' ? '#f87171' : '#fb923c', fillOpacity: 0.5 }} 
                radius={200}
              >
                <Popup>
                  <div className="font-medium">{issue.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">Priority: {issue.priority}</div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
}
