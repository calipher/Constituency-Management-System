import { useState } from 'react';
import { Search, Filter, Plus, MessageSquare, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const casesData = [
  { id: 'CAS-1042', citizen: 'John Doe', title: 'Borehole repair needed', category: 'Infrastructure', status: 'Open', priority: 'High', date: '2023-10-24', assignee: 'Jane Staff' },
  { id: 'CAS-1041', citizen: 'Mary Wanjiku', title: 'School bursary application', category: 'Education', status: 'In Progress', priority: 'Medium', date: '2023-10-23', assignee: 'Peter Admin' },
  { id: 'CAS-1040', citizen: 'David Omondi', title: 'Road maintenance request', category: 'Infrastructure', status: 'Resolved', priority: 'Low', date: '2023-10-22', assignee: 'Jane Staff' },
  { id: 'CAS-1039', citizen: 'Sarah Hassan', title: 'Medical assistance', category: 'Health', status: 'Open', priority: 'High', date: '2023-10-21', assignee: 'Unassigned' },
  { id: 'CAS-1038', citizen: 'Peter Jones', title: 'Land dispute', category: 'Legal', status: 'In Progress', priority: 'Medium', date: '2023-10-20', assignee: 'Legal Team' },
];

export default function Cases() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases & Issues</h1>
          <p className="text-muted-foreground">Track and manage citizen requests, complaints, and casework.</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Log New Case</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Open Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">18</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">64</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Resolution Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 Days</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <Tabs defaultValue="all" className="w-[400px]">
              <TabsList>
                <TabsTrigger value="all">All Cases</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="progress">In Progress</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search cases..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Case ID</th>
                  <th className="px-4 py-3 font-medium">Citizen</th>
                  <th className="px-4 py-3 font-medium">Issue Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Date Logged</th>
                </tr>
              </thead>
              <tbody>
                {casesData.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium text-primary">{c.id}</td>
                    <td className="px-4 py-3">{c.citizen}</td>
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.category}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.priority === 'High' ? 'destructive' : c.priority === 'Medium' ? 'default' : 'secondary'}>
                        {c.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.status === 'Resolved' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : c.status === 'In Progress' ? (
                          <Clock className="h-4 w-4 text-blue-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        {c.status}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.assignee}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
