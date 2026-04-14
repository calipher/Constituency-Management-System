import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Clock, CheckCircle2, AlertTriangle, User, Tag, Calendar, FileText, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { exportToCSV } from '@/lib/exportUtils';
import { useAuth } from '@/contexts/AuthContext';

interface Case {
  id: string;
  citizenName: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  date: string;
  assigneeName: string;
  createdAt: string;
  description?: string;
}

export default function Cases() {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [casesData, setCasesData] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'cases'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cases: Case[] = [];
      snapshot.forEach((doc) => {
        cases.push({ id: doc.id, ...doc.data() } as Case);
      });
      setCasesData(cases);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cases:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddMockCase = async () => {
    try {
      await addDoc(collection(db, 'cases'), {
        citizenName: 'Citizen ' + Math.floor(Math.random() * 1000),
        title: 'New Issue ' + Math.floor(Math.random() * 100),
        category: ['Infrastructure', 'Education', 'Health', 'Water'][Math.floor(Math.random() * 4)],
        status: 'Open',
        priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        date: new Date().toISOString().split('T')[0],
        assigneeName: 'Staff Member',
        description: 'This is a mock description for the newly created case. It contains details about the issue reported by the citizen.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error adding case:", error);
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this case?")) return;
    try {
      await deleteDoc(doc(db, 'cases', id));
      setSelectedCase(null);
    } catch (error) {
      console.error("Error deleting case:", error);
      alert("Failed to delete case.");
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedCase) return;
    
    if (newPriority === 'High') {
      const confirm = window.confirm("Are you sure you want to set this case to High priority? This indicates an urgent issue that requires immediate attention.");
      if (!confirm) return;
    }

    try {
      const caseRef = doc(db, 'cases', selectedCase.id);
      await updateDoc(caseRef, { priority: newPriority, updatedAt: new Date().toISOString() });
      setSelectedCase({ ...selectedCase, priority: newPriority });
    } catch (error) {
      console.error("Error updating priority:", error);
      alert("Failed to update priority.");
    }
  };

  const filteredCases = casesData.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.includes(searchTerm)
  );

  const handleExport = () => {
    exportToCSV('cases.csv', filteredCases, [
      { header: 'Case ID', key: 'id' },
      { header: 'Citizen Name', key: 'citizenName' },
      { header: 'Title', key: 'title' },
      { header: 'Category', key: 'category' },
      { header: 'Priority', key: 'priority' },
      { header: 'Status', key: 'status' },
      { header: 'Assignee', key: 'assigneeName' },
      { header: 'Date Logged', key: 'date' },
    ]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases & Issues</h1>
          <p className="text-muted-foreground">Track and manage citizen requests, complaints, and casework.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button onClick={handleAddMockCase}><Plus className="mr-2 h-4 w-4" /> Log New Case</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Open Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{casesData.filter(c => c.status === 'Open').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{casesData.filter(c => c.status === 'In Progress').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{casesData.filter(c => c.status === 'Resolved').length}</div>
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
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Loading cases...
                    </td>
                  </tr>
                ) : filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No cases found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c) => (
                    <tr 
                      key={c.id} 
                      className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedCase(c)}
                    >
                      <td className="px-4 py-3 font-medium text-primary">{c.id.substring(0, 8)}</td>
                      <td className="px-4 py-3">{c.citizenName}</td>
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
                      <td className="px-4 py-3 text-muted-foreground">{c.assigneeName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.date || c.createdAt.split('T')[0]}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {selectedCase?.title}
              <Badge variant={selectedCase?.priority === 'High' ? 'destructive' : selectedCase?.priority === 'Medium' ? 'default' : 'secondary'} className="ml-2">
                {selectedCase?.priority} Priority
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Case ID: {selectedCase?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><User className="h-4 w-4" /> Citizen</p>
                <p className="font-medium">{selectedCase?.citizenName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Tag className="h-4 w-4" /> Category</p>
                <p className="font-medium">{selectedCase?.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> Status</p>
                <div className="flex items-center gap-2 font-medium">
                  {selectedCase?.status === 'Resolved' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : selectedCase?.status === 'In Progress' ? (
                    <Clock className="h-4 w-4 text-blue-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  {selectedCase?.status}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Priority</p>
                <Select value={selectedCase?.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-4 w-4" /> Date Logged</p>
                <p className="font-medium">{selectedCase?.date || selectedCase?.createdAt?.split('T')[0]}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><User className="h-4 w-4" /> Assignee</p>
                <p className="font-medium">{selectedCase?.assigneeName}</p>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><FileText className="h-4 w-4" /> Description</p>
              <div className="bg-muted/50 p-4 rounded-md text-sm">
                {selectedCase?.description || "No detailed description provided for this case."}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between gap-2 border-t pt-4">
            <div>
              {role === 'admin' && (
                <Button variant="destructive" onClick={() => selectedCase && handleDeleteCase(selectedCase.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedCase(null)}>Close</Button>
              <Button>Update Case</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
