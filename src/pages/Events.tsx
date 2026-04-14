import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Users, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection, onSnapshot, query, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: string;
  createdAt: string;
}

export default function Events() {
  const [eventsData, setEventsData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events: Event[] = [];
      snapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as Event);
      });
      setEventsData(events);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddMockEvent = async () => {
    try {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = months[Math.floor(Math.random() * 12)];
      const d = Math.floor(Math.random() * 28) + 1;
      const y = 2024;
      
      await addDoc(collection(db, 'events'), {
        title: 'New Event ' + Math.floor(Math.random() * 100),
        date: `${m} ${d < 10 ? '0'+d : d}, ${y}`,
        time: '10:00 AM - 12:00 PM',
        location: 'Ward ' + (Math.floor(Math.random() * 5) + 1) + ' Hall',
        attendees: Math.floor(Math.random() * 500),
        type: ['Public Meeting', 'Project Launch', 'Workshop', 'Private Meeting'][Math.floor(Math.random() * 4)],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events & Meetings</h1>
          <p className="text-muted-foreground">Manage the MP's schedule, public townhalls, and project launches.</p>
        </div>
        <Button onClick={handleAddMockEvent}><Plus className="mr-2 h-4 w-4" /> Create Event</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Upcoming Schedule</h2>
          
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading events...</div>
          ) : eventsData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No events found.</div>
          ) : (
            eventsData.map((event) => (
              <Card key={event.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-3 min-w-[80px]">
                        <span className="text-sm font-medium text-muted-foreground">{event.date.split(' ')[0]}</span>
                        <span className="text-2xl font-bold">{event.date.split(' ')[1]?.replace(',', '') || '01'}</span>
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          <Badge variant="secondary" className="text-[10px]">{event.type}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {event.time}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
                          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Est. {event.attendees}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button size="sm">Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder for a real calendar component */}
              <div className="border rounded-md p-4 text-center text-muted-foreground bg-muted/20 h-[300px] flex flex-col items-center justify-center">
                <CalendarIcon className="h-10 w-10 mb-2 opacity-20" />
                <p>Interactive Calendar View</p>
                <p className="text-xs mt-1">Select dates to filter events</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Statistics</CardTitle>
              <CardDescription>This month's engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <span className="font-medium">{eventsData.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Citizens Reached</span>
                <span className="font-medium">~{eventsData.reduce((acc, curr) => acc + (curr.attendees || 0), 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
