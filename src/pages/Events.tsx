import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Users, Clock, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';

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
  const { role } = useAuth();
  const [eventsData, setEventsData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    attendees: 0,
    type: 'Public Meeting'
  });

  useEffect(() => {
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events: Event[] = [];
      snapshot.forEach((docSnap) => {
        events.push({ id: docSnap.id, ...docSnap.data() } as Event);
      });
      // Sort by creation date simply
      events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEventsData(events);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateEvent = async () => {
    try {
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsAddOpen(false);
      setNewEvent({ title: '', date: '', time: '', location: '', attendees: 0, type: 'Public Meeting' });
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error: any) {
      console.error("Error deleting event:", error);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;
    try {
      const eventRef = doc(db, 'events', editingEvent.id);
      await updateDoc(eventRef, {
        title: editingEvent.title,
        date: editingEvent.date,
        time: editingEvent.time,
        location: editingEvent.location,
        attendees: editingEvent.attendees,
        type: editingEvent.type,
        updatedAt: new Date().toISOString()
      });
      setEditingEvent(null);
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events & Meetings</h1>
          <p className="text-muted-foreground">Manage the MP's schedule, public townhalls, and project launches.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>
                Add a new event or meeting to the schedule. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Event Title</Label>
                <Input 
                  id="title" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="e.g. Townhall Meeting" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time" 
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  placeholder="e.g. Ward 3 Community Center" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="attendees">Estimated Attendees</Label>
                  <Input 
                    id="attendees" 
                    type="number"
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({...newEvent, attendees: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select value={newEvent.type} onValueChange={(v) => setNewEvent({...newEvent, type: v})}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public Meeting">Public Meeting</SelectItem>
                      <SelectItem value="Project Launch">Project Launch</SelectItem>
                      <SelectItem value="Workshop">Workshop</SelectItem>
                      <SelectItem value="Private Meeting">Private Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateEvent}>Save Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                        <span className="text-sm font-medium text-muted-foreground">{event.date.split('-')[1] ? `${event.date.split('-')[1]}/${event.date.split('-')[2]}` : event.date.split(' ')[0]}</span>
                        <span className="text-2xl font-bold">{event.date.split('-')[2] ? event.date.split('-')[2] : event.date.split(' ')[1]?.replace(',', '') || '01'}</span>
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
                      <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>Details</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingEvent(event)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Information about the scheduled event.
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Title</h4>
                <p className="text-lg font-semibold">{selectedEvent.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                  <p className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> {selectedEvent.date}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Time</h4>
                  <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {selectedEvent.time}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {selectedEvent.location}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Event Type</h4>
                  <Badge variant="secondary">{selectedEvent.type}</Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Est. Attendees</h4>
                  <p className="flex items-center gap-2"><Users className="h-4 w-4" /> {selectedEvent.attendees}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedEvent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the details of the event.
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-title">Event Title</Label>
                <Input 
                  id="edit-title" 
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input 
                    id="edit-date" 
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({...editingEvent, date: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input 
                    id="edit-time" 
                    type="text"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({...editingEvent, time: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input 
                  id="edit-location" 
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-attendees">Estimated Attendees</Label>
                  <Input 
                    id="edit-attendees" 
                    type="number"
                    value={editingEvent.attendees}
                    onChange={(e) => setEditingEvent({...editingEvent, attendees: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-type">Event Type</Label>
                  <Select value={editingEvent.type} onValueChange={(v) => setEditingEvent({...editingEvent, type: v})}>
                    <SelectTrigger id="edit-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public Meeting">Public Meeting</SelectItem>
                      <SelectItem value="Project Launch">Project Launch</SelectItem>
                      <SelectItem value="Workshop">Workshop</SelectItem>
                      <SelectItem value="Private Meeting">Private Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
            <Button onClick={handleUpdateEvent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
