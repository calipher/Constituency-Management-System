import { useState, useEffect } from 'react';
import { Send, MessageSquare, Mail, Phone, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, onSnapshot, query, addDoc, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

interface Broadcast {
  id: string;
  subject: string;
  content: string;
  type: string;
  targetAudience: string;
  sentCount: number;
  createdAt: string;
}

export default function Communications() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [smsContent, setSmsContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('All Registered Voters');

  useEffect(() => {
    const q = query(collection(db, 'broadcasts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Broadcast[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Broadcast);
      });
      // Sort by date descending
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBroadcasts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching broadcasts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSendSMS = async () => {
    if (!smsContent) return;
    try {
      await addDoc(collection(db, 'broadcasts'), {
        subject: 'SMS Broadcast',
        content: smsContent,
        type: 'SMS',
        targetAudience,
        sentCount: Math.floor(Math.random() * 5000) + 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setSmsContent('');
    } catch (error) {
      console.error("Error sending SMS:", error);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailContent) return;
    try {
      // 1. Fetch citizens based on targetAudience to get emails
      const citizensRef = collection(db, 'citizens');
      // For a real app, we would add where() clauses based on targetAudience
      // e.g., if (targetAudience === 'Ward 1 Residents') query(citizensRef, where('ward', '==', 'Ward 1'))
      const snapshot = await getDocs(query(citizensRef));
      
      const emails: string[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.email) emails.push(data.email);
      });

      // Fallback for testing if no citizens have emails
      if (emails.length === 0) {
        emails.push('test@example.com');
      }

      // 2. Call the backend API to send the email via Resend
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emails.slice(0, 50), // Resend free tier limits to 50 per request usually
          subject: emailSubject,
          html: `<p>${emailContent.replace(/\n/g, '<br/>')}</p>`
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email via API');
      }

      // 3. Save the broadcast record to Firestore
      await addDoc(collection(db, 'broadcasts'), {
        subject: emailSubject,
        content: emailContent,
        type: 'Email',
        targetAudience,
        sentCount: emails.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      setEmailSubject('');
      setEmailContent('');
      alert(result.mocked ? 'Email mocked successfully (No API Key)' : 'Email sent successfully!');
    } catch (error) {
      console.error("Error sending Email:", error);
      alert("Failed to send email. See console for details.");
    }
  };

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
            <div className="text-2xl font-bold">
              {broadcasts.filter(b => b.type === 'SMS').reduce((acc, curr) => acc + curr.sentCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Email Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{broadcasts.filter(b => b.type === 'Email').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total campaigns</p>
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
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  >
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
                    value={smsContent}
                    onChange={(e) => setSmsContent(e.target.value)}
                  ></textarea>
                  <p className="text-xs text-muted-foreground text-right">{smsContent.length} / 160 characters</p>
                </div>
                <Button className="w-full" onClick={handleSendSMS} disabled={!smsContent}><Send className="mr-2 h-4 w-4" /> Send Broadcast</Button>
              </TabsContent>
              <TabsContent value="email" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Audience</label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  >
                    <option>All Registered Voters</option>
                    <option>Ward 1 Residents</option>
                    <option>Ward 2 Residents</option>
                    <option>Youth (18-35)</option>
                    <option>Custom List...</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input 
                    placeholder="Newsletter Subject" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <textarea 
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Write your email content here..."
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                  ></textarea>
                </div>
                <Button className="w-full" onClick={handleSendEmail} disabled={!emailSubject || !emailContent}><Send className="mr-2 h-4 w-4" /> Send Email</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Broadcasts</CardTitle>
            <CardDescription>History of sent messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No broadcasts yet.</div>
            ) : (
              broadcasts.map((broadcast) => (
                <div key={broadcast.id} className="flex flex-col gap-2 border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">{broadcast.subject}</span>
                    <Badge variant={broadcast.type === 'Email' ? 'secondary' : 'outline'} className="text-[10px]">{broadcast.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{broadcast.content}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-muted-foreground">Sent to {broadcast.sentCount.toLocaleString()} ({broadcast.targetAudience})</span>
                    <span className="text-[10px] text-muted-foreground">{broadcast.createdAt.split('T')[0]}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full text-sm">View All History</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
