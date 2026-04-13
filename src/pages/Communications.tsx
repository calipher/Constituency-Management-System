import { useState } from 'react';
import { Send, MessageSquare, Mail, Phone, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Communications() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
          <p className="text-muted-foreground">Engage with citizens via SMS, Email, and Announcements.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total SMS Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,450</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Email Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">Active campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Citizen Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground mt-1">Responses received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reach Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84%</div>
            <p className="text-xs text-muted-foreground mt-1">Of registered voters</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>New Broadcast</CardTitle>
            <CardDescription>Send a message to a specific group of citizens.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sms" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="sms"><MessageSquare className="mr-2 h-4 w-4" /> SMS Broadcast</TabsTrigger>
                <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4" /> Email Newsletter</TabsTrigger>
              </TabsList>
              <TabsContent value="sms" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Audience</label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>All Registered Voters</option>
                    <option>Ward 1 Residents</option>
                    <option>Ward 2 Residents</option>
                    <option>Youth (18-35)</option>
                    <option>Custom List...</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Type your SMS message here. Keep it under 160 characters for a single SMS."
                  ></textarea>
                  <p className="text-xs text-muted-foreground text-right">0 / 160 characters</p>
                </div>
                <Button className="w-full"><Send className="mr-2 h-4 w-4" /> Send Broadcast</Button>
              </TabsContent>
              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input placeholder="Newsletter Subject" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <textarea 
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Write your email content here..."
                  ></textarea>
                </div>
                <Button className="w-full"><Send className="mr-2 h-4 w-4" /> Send Email</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Broadcasts</CardTitle>
            <CardDescription>History of sent messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 border-b pb-4">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">Townhall Meeting Reminder</span>
                <Badge variant="outline" className="text-[10px]">SMS</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">Reminder: The MP will be hosting a townhall meeting at Ward 3 social hall tomorrow at 10 AM. All are welcome.</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-muted-foreground">Sent to 4,500 people</span>
                <span className="text-[10px] text-muted-foreground">Oct 24, 2023</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 border-b pb-4">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">Monthly Constituency Update</span>
                <Badge variant="secondary" className="text-[10px]">Email</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">Dear constituent, here is a summary of the projects we have completed this month...</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-muted-foreground">Sent to 12,200 people</span>
                <span className="text-[10px] text-muted-foreground">Oct 15, 2023</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm">Bursary Application Open</span>
                <Badge variant="outline" className="text-[10px]">SMS</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">CDF Bursary applications for the new academic year are now open. Pick forms from the chief's camp.</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-muted-foreground">Sent to 45,231 people</span>
                <span className="text-[10px] text-muted-foreground">Oct 01, 2023</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full text-sm">View All History</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
