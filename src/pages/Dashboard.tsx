import { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Clock
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
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';

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

    return () => {
      unsubCitizens();
      unsubCases();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground">Overview of constituency metrics, cases, and projects.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Download Report</Button>
          <Button>New Case</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
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
        <Card>
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
        <Card>
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
        <Card>
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
        <Card className="lg:col-span-4">
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

        <Card className="lg:col-span-3">
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
                          ) : c.status === 'In Progress' ? (
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
