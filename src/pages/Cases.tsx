import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Clock, CheckCircle2, AlertTriangle, User, Tag, Calendar, FileText, Download, Trash2, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { exportToCSV } from '@/lib/exportUtils';
import { useAuth } from '@/contexts/AuthContext';
import { logAudit } from '@/lib/auditUtils';

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

const getSentimentTag = (description?: string) => {
  if (!description) return { label: 'Neutral', classes: 'bg-slate-100 text-slate-700 border-slate-200' };
  
  const lower = description.toLowerCase();
  
  const urgentWords = ['urgent', 'emergency', 'immediate', 'danger', 'hazard', 'critical', 'severe', 'help', 'now'];
  const frustratedWords = ['angry', 'terrible', 'worst', 'bad', 'broken', 'unacceptable', 'disgusting', 'awful', 'ignored', 'fail', 'waiting', 'pothole', 'ridiculous'];
  const positiveWords = ['good', 'thanks', 'appreciate', 'great', 'excellent', 'helpful', 'improved', 'happy', 'resolved', 'kudos'];
  
  const hasUrgent = urgentWords.some(w => lower.includes(w));
  const hasFrustrated = frustratedWords.some(w => lower.includes(w));
  const hasPositive = positiveWords.some(w => lower.includes(w));
  
  if (hasUrgent) return { label: 'Urgent Tone', classes: 'bg-red-100 text-red-800 border-red-200' };
  if (hasFrustrated) return { label: 'Frustrated', classes: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (hasPositive) return { label: 'Positive', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  
  return { label: 'Neutral', classes: 'bg-slate-100 text-slate-700 border-slate-200' };
};

export default function Cases() {
  const { role, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [casesData, setCasesData] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const [isNewCaseDialogOpen, setIsNewCaseDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newCaseData, setNewCaseData] = useState({
    title: '',
    citizenName: '',
    category: '',
    priority: '',
    description: '',
  });

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

  const handleSyncExternalCases = async () => {
    setIsSyncing(true);
    try {
      const url = 'https://script.google.com/macros/s/AKfycbxJcmT6h94oai4egEAEDFDJkhlGJty-ri5rV_HzYsvW-bUrLkJpAUx1BvOT-oiqtdqA/exec';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("External Data Response:", data);
      
      // Attempt to map and save data based on standard generic structure or alert user if they need to format it.
      if (Array.isArray(data) && data.length > 0) {
        let addedCount = 0;
        for (const item of data) {
          // If we can map it to our format we add it to firestore. 
          // For now we will just log it and inform the user it connected, 
          // but we can make a best-effort mapping if they use common keys like "Name" or "Issue"
          const mappedCase = {
            title: item.Title || item.title || item.Issue || item.issue || item.Subject || 'External Case',
            citizenName: item.Name || item.name || item.Citizen || item.citizen || 'Unknown Citizen',
            category: item.Category || item.category || item.Type || 'Other',
            priority: item.Priority || item.priority || 'Medium',
            description: item.Description || item.description || item.Message || item.message || JSON.stringify(item),
            status: 'Open',
            date: new Date().toISOString().split('T')[0],
            assigneeName: 'Unassigned',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await addDoc(collection(db, 'cases'), mappedCase);
          addedCount++;
        }
        alert(`Successfully connected and imported ${addedCount} records!`);
      } else {
        alert("Successfully connected, but no records were found or format was not a valid array. Check console for details.");
      }
    } catch (error) {
      console.error("Sync Error:", error);
      alert("Failed to fetch external cases. Ensure the Google App Script is deployed with 'Execute as: Me' and 'Who has access: Anyone'. Check console for details.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogNewCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseData.title || !newCaseData.citizenName || !newCaseData.category || !newCaseData.priority) {
      alert("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'cases'), {
        ...newCaseData,
        status: 'Open',
        date: new Date().toISOString().split('T')[0],
        assigneeName: 'Unassigned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await logAudit({
        action: 'Log Case',
        category: 'Cases',
        details: `Logged new case: ${newCaseData.title} by ${newCaseData.citizenName}`,
        userId: user?.uid || 'unknown',
        userName: user?.displayName || 'Unknown User',
        userEmail: user?.email || 'unknown@example.com'
      });
      setIsNewCaseDialogOpen(false);
      setNewCaseData({ title: '', citizenName: '', category: '', priority: '', description: '' });
    } catch (error) {
      console.error("Error adding case:", error);
      alert("Failed to log new case.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCase = async (caseObj: Case) => {
    if (!window.confirm("Are you sure you want to delete this case?")) return;
    try {
      await deleteDoc(doc(db, 'cases', caseObj.id));
      await logAudit({
        action: 'Delete Case',
        category: 'Cases',
        details: `Deleted case: ${caseObj.title}`,
        userId: user?.uid || 'unknown',
        userName: user?.displayName || 'Unknown User',
        userEmail: user?.email || 'unknown@example.com'
      });
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
      await logAudit({
        action: 'Update Case Priority',
        category: 'Cases',
        details: `Changed priority of case "${selectedCase.title}" to ${newPriority}`,
        userId: user?.uid || 'unknown',
        userName: user?.displayName || 'Unknown User',
        userEmail: user?.email || 'unknown@example.com'
      });
      setSelectedCase({ ...selectedCase, priority: newPriority });
    } catch (error) {
      console.error("Error updating priority:", error);
      alert("Failed to update priority.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedCase) return;
    
    try {
      const caseRef = doc(db, 'cases', selectedCase.id);
      await updateDoc(caseRef, { status: newStatus, updatedAt: new Date().toISOString() });
      await logAudit({
        action: 'Update Case Status',
        category: 'Cases',
        details: `Changed status of case "${selectedCase.title}" to ${newStatus}`,
        userId: user?.uid || 'unknown',
        userName: user?.displayName || 'Unknown User',
        userEmail: user?.email || 'unknown@example.com'
      });
      setSelectedCase({ ...selectedCase, status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const filteredCases = casesData.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.includes(searchTerm);
    if (!matchesSearch) return false;
    
    if (filterStatus === 'all') return true;
    if (filterStatus === 'open') return c.status === 'Open';
    if (filterStatus === 'progress') return c.status === 'Work In Progress' || c.status === 'In Progress';
    if (filterStatus === 'resolved') return c.status === 'Resolved';
    
    return true;
  });

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
          <Button variant="outline" onClick={handleSyncExternalCases} disabled={isSyncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
            {isSyncing ? 'Syncing...' : 'Sync External Cases'}
          </Button>
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Dialog open={isNewCaseDialogOpen} onOpenChange={setIsNewCaseDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" /> Log New Case
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Log New Case</DialogTitle>
                <DialogDescription>
                  Enter the details of the reported issue to create a new case record.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLogNewCase}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Issue Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g., Pothole on Main St" 
                      value={newCaseData.title}
                      onChange={(e) => setNewCaseData({...newCaseData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="citizenName">Citizen Name</Label>
                    <Input 
                      id="citizenName" 
                      placeholder="Name of reporting citizen" 
                      value={newCaseData.citizenName}
                      onChange={(e) => setNewCaseData({...newCaseData, citizenName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={newCaseData.category} 
                        onValueChange={(val) => setNewCaseData({...newCaseData, category: val})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Health">Health</SelectItem>
                          <SelectItem value="Water">Water</SelectItem>
                          <SelectItem value="Security">Security</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={newCaseData.priority} 
                        onValueChange={(val) => setNewCaseData({...newCaseData, priority: val})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      rows={4}
                      placeholder="Details about the issue..."
                      value={newCaseData.description}
                      onChange={(e) => setNewCaseData({...newCaseData, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsNewCaseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging...' : 'Log Case'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Work In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{casesData.filter(c => c.status === 'Work In Progress' || c.status === 'In Progress').length}</div>
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
            <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-[400px]">
              <TabsList>
                <TabsTrigger value="all">All Cases</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="progress">Work In Progress</TabsTrigger>
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
                  <th className="px-4 py-3 font-medium">Sentiment</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Date Logged</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      Loading cases...
                    </td>
                  </tr>
                ) : filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
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
                        <Badge variant="outline" className={`font-normal text-xs ${getSentimentTag(c.description).classes}`}>
                          {getSentimentTag(c.description).label}
                        </Badge>
                      </td>
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
                <Select value={selectedCase?.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Work In Progress">Work In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Activity className="h-4 w-4" /> Detected Tone</p>
                <p className="font-medium">
                  {selectedCase && (
                    <Badge variant="outline" className={`font-normal ${getSentimentTag(selectedCase.description).classes}`}>
                      {getSentimentTag(selectedCase.description).label}
                    </Badge>
                  )}
                </p>
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
                <Button variant="destructive" onClick={() => selectedCase && handleDeleteCase(selectedCase)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedCase(null)}>Close</Button>
              {selectedCase?.status === 'Open' && (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleStatusChange('Work In Progress')}
                >
                  <Clock className="mr-2 h-4 w-4" /> Start Work
                </Button>
              )}
              {(selectedCase?.status === 'Work In Progress' || selectedCase?.status === 'In Progress') && (
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleStatusChange('Resolved')}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Resolved
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
