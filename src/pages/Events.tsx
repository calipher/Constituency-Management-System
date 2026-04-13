import { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Users, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const upcomingEvents = [
  { id: 1, title: 'Ward 3 Townhall Meeting', date: 'Oct 26, 2023', time: '10:00 AM - 1:00 PM', location: 'Ward 3 Social Hall', attendees: 500, type: 'Public Meeting' },
  { id: 2, title: 'Borehole Commissioning', date: 'Oct 28, 2023', time: '09:00 AM - 11:00 AM', location: 'Central Market, Ward 1', attendees: 200, type: 'Project Launch' },
  { id: 3, title: 'Youth Empowerment Workshop', date: 'Nov 02, 2023', time: '08:00 AM - 4:00 PM', location: 'Constituency Office', attendees: 150, type: 'Workshop' },
  { id: 4, title: 'Meeting with Elders', date: 'Nov 05, 2023', time: '2:00 PM - 4:00 PM', location: 'MP Residence', attendees: 20, type: 'Private Meeting' },
];

export default function Events() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events & Meetings</h1>
          <p className="text-muted-foreground">Manage the MP's schedule, public townhalls, and project launches.</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Create Event</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Upcoming Schedule</h2>
          
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-3 min-w-[80px]">
                      <span className="text-sm font-medium text-muted-foreground">{event.date.split(' ')[0]}</span>
                      <span className="text-2xl font-bold">{event.date.split(' ')[1].replace(',', '')}</span>
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
          ))}
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
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Citizens Reached</span>
                <span className="font-medium">~3,450</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Invitations</span>
                <span className="font-medium">4</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
