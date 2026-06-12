import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Smartphone
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { collection, onSnapshot, query, limit, orderBy, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useNavigate } from 'react-router-dom';

const caseData = [
  { name: 'Jan', resolved: 40, new: 64 },
  { name: 'Feb', resolved: 30, new: 45 },
  { name: 'Mar', resolved: 55, new: 50 },
  { name: 'Apr', resolved: 45, new: 30 },
  { name: 'May', resolved: 60, new: 40 },
  { name: 'Jun', resolved: 75, new: 55 },
];

const projectData = [
  { name: 'Education', budget: 4000000 },
  { name: 'Health', budget: 3000000 },
  { name: 'Water', budget: 2000000 },
  { name: 'Roads', budget: 5000000 },
  { name: 'Security', budget: 1500000 },
];

export default function Dashboard() {
  const [citizensCount, setCitizensCount] = useState(0);
  const [activeCasesCount, setActiveCasesCount] = useState(0);
  const [criticalCasesCount, setCriticalCasesCount] = useState(0);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const navigate = useNavigate();

  // New Case Form State
  const [isNewCaseDialogOpen, setIsNewCaseDialogOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseCitizen, setNewCaseCitizen] = useState('');
  const [newCaseCategory, setNewCaseCategory] = useState('Infrastructure');
  const [newCasePriority, setNewCasePriority] = useState('Medium');
  const [newCaseAssignee, setNewCaseAssignee] = useState('Unassigned');
  const [newCaseDescription, setNewCaseDescription] = useState('');
  const [staffMembers, setStaffMembers] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    // Listen to citizens
    const unsubCitizens = onSnapshot(collection(db, 'citizens'), (snapshot) => {
      setCitizensCount(snapshot.size);
    });

    // Listen to cases
    const unsubCases = onSnapshot(collection(db, 'cases'), (snapshot) => {
      let active = 0;
      let critical = 0;
      const cases: any[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status !== 'Resolved') active++;
        if (data.priority === 'High' && data.status !== 'Resolved') critical++;
        cases.push({ id: doc.id, ...data });
      });
      
      setActiveCasesCount(active);
      setCriticalCasesCount(critical);
      
      // Sort by date descending and take top 5
      cases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentCases(cases.slice(0, 5));
    });

    // Listen to staff members
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const staff: {id: string, name: string}[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        staff.push({ id: doc.id, name: data.name || data.email || 'Unknown User' });
      });
      setStaffMembers(staff);
    });

    return () => {
      unsubCitizens();
      unsubCases();
      unsubUsers();
    };
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle || !newCaseCitizen) return;

    try {
      const caseRef = await addDoc(collection(db, 'cases'), {
        citizenName: newCaseCitizen,
        title: newCaseTitle,
        category: newCaseCategory,
        status: 'Open',
        priority: newCasePriority,
        date: new Date().toISOString().split('T')[0],
        assigneeName: newCaseAssignee,
        description: newCaseDescription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // If assigned to a staff member, create a notification
      if (newCaseAssignee !== 'Unassigned') {
        const assignedStaff = staffMembers.find(s => s.name === newCaseAssignee);
        if (assignedStaff) {
          await addDoc(collection(db, 'notifications'), {
            userId: assignedStaff.id,
            title: 'New Case Assigned',
            message: `You have been assigned to a new case: ${newCaseTitle}`,
            read: false,
            caseId: caseRef.id,
            createdAt: new Date().toISOString()
          });
        }
      }
      
      // Reset form and close dialog
      setNewCaseTitle('');
      setNewCaseCitizen('');
      setNewCaseCategory('Infrastructure');
      setNewCasePriority('Medium');
      setNewCaseAssignee('Unassigned');
      setNewCaseDescription('');
      setIsNewCaseDialogOpen(false);
    } catch (error) {
      console.error("Error adding case:", error);
      alert("Failed to create case.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">Overview of constituency metrics, cases, and projects.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.open('/capture', '_blank', 'noopener,noreferrer')}>
            <Smartphone className="mr-2 h-4 w-4" />
            Launch Mobile App
          </Button>
          <Button variant="outline">Download Report</Button>
          <Dialog open={isNewCaseDialogOpen} onOpenChange={setIsNewCaseDialogOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> New Case</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log New Case</DialogTitle>
                <DialogDescription>
                  Capture a new issue or request from a citizen.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCase} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Citizen Name</label>
                  <Input 
                    placeholder="e.g. John Doe" 
                    value={newCaseCitizen}
                    onChange={(e) => setNewCaseCitizen(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue Title</label>
                  <Input 
                    placeholder="Brief description of the issue" 
                    value={newCaseTitle}
                    onChange={(e) => setNewCaseTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newCaseCategory}
                      onChange={(e) => setNewCaseCategory(e.target.value)}
                    >
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Education">Education</option>
                      <option value="Health">Health</option>
                      <option value="Water">Water</option>
                      <option value="Security">Security</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newCasePriority}
                      onChange={(e) => setNewCasePriority(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign To</label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newCaseAssignee}
                    onChange={(e) => setNewCaseAssignee(e.target.value)}
                  >
                    <option value="Unassigned">Unassigned</option>
                    {staffMembers.map(staff => (
                      <option key={staff.id} value={staff.name}>{staff.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Detailed description of the case..."
                    value={newCaseDescription}
                    onChange={(e) => setNewCaseDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsNewCaseDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Case</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/citizens')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registered Voters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citizensCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 inline-flex items-center">
                <TrendingUp className="mr-1 h-3 w-3" /> +2.5%
              </span>{' '}
              from last month
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/cases')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCasesCount}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-rose-500 inline-flex items-center">
                <TrendingUp className="mr-1 h-3 w-3" /> +12
              </span>{' '}
              new this week
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/projects')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CDF Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68.5%</div>
            <p className="text-xs text-muted-foreground">
              $3.4M of $5.0M allocated
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/cases')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{criticalCasesCount}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Charts */}
        <Card className="lg:col-span-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/cases')}>
          <CardHeader>
            <CardTitle>Case Resolution Trends</CardTitle>
            <CardDescription>New vs Resolved cases over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={caseData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="new" stroke="#8884d8" strokeWidth={2} name="New Cases" />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved Cases" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/projects')}>
          <CardHeader>
            <CardTitle>CDF Allocation by Sector</CardTitle>
            <CardDescription>Budget distribution across key sectors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000000}M`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Bar dataKey="budget" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Casework</CardTitle>
          <CardDescription>Latest issues reported by citizens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">Case ID</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-md">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No recent cases found.
                    </td>
                  </tr>
                ) : (
                  recentCases.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{c.id.substring(0, 8)}</td>
                      <td className="px-4 py-3">{c.title}</td>
                      <td className="px-4 py-3">{c.category}</td>
                      <td className="px-4 py-3">
                        <Badge variant={c.priority === 'High' ? 'destructive' : c.priority === 'Medium' ? 'default' : 'secondary'}>
                          {c.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.status === 'Resolved' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (c.status === 'Work In Progress' || c.status === 'In Progress') ? (
                            <Clock className="h-4 w-4 text-blue-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          {c.status}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.date || c.createdAt.split('T')[0]}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
