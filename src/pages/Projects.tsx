import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Building2, MapPin, Calendar, DollarSign, Download, Trash2, AlertTriangle, Target, CheckCircle2, Circle, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { exportToCSV } from '@/lib/exportUtils';
import { useAuth } from '@/contexts/AuthContext';

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
}

interface Project {
  id: string;
  name: string;
  category: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  location: string;
  endDate: string;
  createdAt: string;
  milestones?: Milestone[];
}

export default function Projects() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [cdfAllocated, setCdfAllocated] = useState(5000000);
  const [isUpdateCdfDialogOpen, setIsUpdateCdfDialogOpen] = useState(false);
  const [newCdfAmount, setNewCdfAmount] = useState(5000000);

  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    category: 'Infrastructure',
    status: 'Planning',
    progress: 0,
    budget: 0,
    spent: 0,
    location: '',
    endDate: ''
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  // Keep selectedProject in sync with projectsData
  useEffect(() => {
    if (selectedProject) {
      const updated = projectsData.find(p => p.id === selectedProject.id);
      if (updated) {
        setSelectedProject(updated);
      }
    }
  }, [projectsData]);

  useEffect(() => {
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects: Project[] = [];
      snapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjectsData(projects);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'cdf'), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data && data.totalAllocated !== undefined) {
          setCdfAllocated(data.totalAllocated);
          setNewCdfAmount(data.totalAllocated);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectData.name || !newProjectData.category || !newProjectData.location) {
      alert("Please fill out all required fields (Name, Category, Location).");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'projects'), {
        name: newProjectData.name,
        category: newProjectData.category,
        status: newProjectData.status,
        progress: Number(newProjectData.progress),
        budget: Number(newProjectData.budget),
        spent: Number(newProjectData.spent),
        location: newProjectData.location,
        endDate: newProjectData.endDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setNewProjectData({
        name: '',
        category: 'Infrastructure',
        status: 'Planning',
        progress: 0,
        budget: 0,
        spent: 0,
        location: '',
        endDate: ''
      });
      setIsAddProjectDialogOpen(false);
    } catch (error) {
      console.error("Error adding project:", error);
      alert("Failed to add project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project.");
    }
  };

  const handleUpdateCdf = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'cdf'), { totalAllocated: newCdfAmount }, { merge: true });
      setIsUpdateCdfDialogOpen(false);
    } catch (error) {
      console.error("Error updating CDF:", error);
      alert("Failed to update total CDF amount.");
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newMilestoneTitle) return;

    const newMilestone = {
      id: Date.now().toString(),
      title: newMilestoneTitle,
      completed: false,
      dueDate: newMilestoneDate || new Date().toISOString().split('T')[0]
    };

    const updatedMilestones = [...(selectedProject.milestones || []), newMilestone];

    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        milestones: updatedMilestones
      });
      setNewMilestoneTitle('');
      setNewMilestoneDate('');
    } catch (error) {
      console.error("Error adding milestone:", error);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    if (!selectedProject) return;

    const updatedMilestones = (selectedProject.milestones || []).map(m => 
      m.id === milestoneId ? { ...m, completed } : m
    );

    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        milestones: updatedMilestones
      });
    } catch (error) {
      console.error("Error toggling milestone:", error);
    }
  };

  const handleShowOnMap = (projectId: string) => {
    const center = [-20.1900, 28.5300];
    const hash = projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const lat = center[0] + ((hash % 100) / 100 - 0.5) * 0.05;
    const lng = center[1] + (((hash * 13) % 100) / 100 - 0.5) * 0.05;
    navigate(`/map?lat=${lat}&lng=${lng}&zoom=16`);
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!selectedProject) return;
    
    const updatedMilestones = (selectedProject.milestones || []).filter(m => m.id !== milestoneId);

    try {
      await updateDoc(doc(db, 'projects', selectedProject.id), {
        milestones: updatedMilestones
      });
    } catch (error) {
      console.error("Error deleting milestone:", error);
    }
  };

  const filteredProjects = projectsData.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    exportToCSV('projects.csv', filteredProjects, [
      { header: 'Project ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Category', key: 'category' },
      { header: 'Status', key: 'status' },
      { header: 'Progress (%)', key: 'progress' },
      { header: 'Budget', key: 'budget' },
      { header: 'Spent', key: 'spent' },
      { header: 'Location', key: 'location' },
      { header: 'Est. Completion', key: 'endDate' },
    ]);
  };

  const totalFundsDisbursed = projectsData.reduce((sum, project) => sum + (project.budget || 0), 0);
  const fundsDisbursedPercentage = cdfAllocated > 0 ? (totalFundsDisbursed / cdfAllocated) * 100 : 0;

  const categoryStats = React.useMemo(() => {
    const stats: Record<string, { category: string, budget: number, spent: number }> = {};
    projectsData.forEach(p => {
      if (!stats[p.category]) {
        stats[p.category] = { category: p.category, budget: 0, spent: 0 };
      }
      stats[p.category].budget += p.budget || 0;
      stats[p.category].spent += p.spent || 0;
    });
    return Object.values(stats);
  }, [projectsData]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects & CDF</h1>
          <p className="text-muted-foreground">Manage constituency development funds and track project execution.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          {role === 'admin' && (
            <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
              <DialogTrigger render={<Button />}>
                <Plus className="mr-2 h-4 w-4" /> New Project
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Project</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new project.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddProject}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name *</Label>
                      <Input id="name" value={newProjectData.name} onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">Category *</Label>
                      <div className="col-span-3">
                        <Select value={newProjectData.category} onValueChange={(val) => setNewProjectData({...newProjectData, category: val})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
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
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="status" className="text-right">Status</Label>
                      <div className="col-span-3">
                        <Select value={newProjectData.status} onValueChange={(val) => setNewProjectData({...newProjectData, status: val})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Planning">Planning</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="location" className="text-right">Location *</Label>
                      <Input id="location" value={newProjectData.location} onChange={(e) => setNewProjectData({...newProjectData, location: e.target.value})} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="budget" className="text-right">Budget ($)</Label>
                      <Input id="budget" type="number" min="0" value={newProjectData.budget} onChange={(e) => setNewProjectData({...newProjectData, budget: Number(e.target.value)})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="spent" className="text-right">Spent ($)</Label>
                      <Input id="spent" type="number" min="0" value={newProjectData.spent} onChange={(e) => setNewProjectData({...newProjectData, spent: Number(e.target.value)})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="progress" className="text-right">Progress (%)</Label>
                      <Input id="progress" type="number" min="0" max="100" value={newProjectData.progress} onChange={(e) => setNewProjectData({...newProjectData, progress: Number(e.target.value)})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="endDate" className="text-right">End Date</Label>
                      <Input id="endDate" type="date" value={newProjectData.endDate} onChange={(e) => setNewProjectData({...newProjectData, endDate: e.target.value})} className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddProjectDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Project'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total CDF Allocated</CardTitle>
            {role === 'admin' && (
              <Dialog open={isUpdateCdfDialogOpen} onOpenChange={setIsUpdateCdfDialogOpen}>
                <DialogTrigger render={<Button variant="ghost" size="sm" className="h-8 w-8 p-0" />}>
                  <span className="sr-only">Edit total</span>
                  <DollarSign className="h-4 w-4" />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update CDF Allocation</DialogTitle>
                    <DialogDescription>
                      Enter the total approved CDF budget.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateCdf}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cdfAmount" className="text-right">Amount ($)</Label>
                        <Input 
                          id="cdfAmount" 
                          type="number" 
                          autoFocus
                          value={newCdfAmount} 
                          onChange={(e) => setNewCdfAmount(Number(e.target.value))} 
                          className="col-span-3" 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setIsUpdateCdfDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Save</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${cdfAllocated.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">FY 2023/2024</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Funds Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${totalFundsDisbursed.toLocaleString()}</div>
            <Progress value={Math.min(100, fundsDisbursedPercentage)} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsData.filter(p => p.status === 'In Progress').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget vs. Disbursed by Sector</CardTitle>
          <CardDescription>Ratio of allocated budget to spent funds across different project categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `$${value >= 1000 ? value / 1000 + 'k' : value}`} />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  cursor={{ fill: 'transparent' }}
                />
                <Legend />
                <Bar dataKey="budget" name="Budget Allocated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" name="Funds Disbursed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 mb-2">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects by name, category, or location..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No projects found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProjects.map((project) => {
            const isOverbudget = (project.spent || 0) > (project.budget || 0);
            return (
            <Card key={project.id} onClick={() => setSelectedProject(project)} className={`hover:shadow-md transition-shadow cursor-pointer relative group ${isOverbudget ? 'border-destructive' : ''}`}>
              {role === 'admin' && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => handleDeleteProject(e, project.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs font-normal">{project.id.substring(0, 8)}</Badge>
                      <Badge 
                        variant={
                          project.status === 'Completed' ? 'default' : 
                          project.status === 'In Progress' ? 'secondary' : 'outline'
                        }
                        className={project.status === 'Completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg pr-8">{project.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3" /> {project.category}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</span>
                    <span className="font-medium">{project.location}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" /> Milestones</span>
                    <span className="font-medium">
                      {project.milestones ? `${project.milestones.filter(m => m.completed).length}/${project.milestones.length}` : '0/0'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Budget</span>
                    <span className="font-medium">${project.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Spent
                      {isOverbudget && (
                        <span className="text-destructive flex items-center" title="Budget exceeded">
                          <AlertTriangle className="h-3 w-3 ml-1" />
                        </span>
                      )}
                    </span>
                    <span className={`font-medium ${isOverbudget ? 'text-destructive font-bold' : ''}`}>${project.spent.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className={project.progress === 100 ? '[&>div]:bg-emerald-500' : ''} />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2 border-dashed hover:bg-slate-50 transition-colors" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleShowOnMap(project.id); 
                  }}
                >
                  <MapIcon className="mr-2 h-4 w-4 text-blue-600" /> <span className="text-blue-700 font-medium">Show on Map</span>
                </Button>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Project Milestones Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedProject.name}</DialogTitle>
                <DialogDescription>
                  Milestones and task tracking for this project.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                  <div>
                    <span className="text-muted-foreground block text-xs">Status</span>
                    <span className="font-medium">{selectedProject.status}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Category</span>
                    <span className="font-medium">{selectedProject.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Est. Completion</span>
                    <span className="font-medium">{selectedProject.endDate || selectedProject.createdAt.split('T')[0]}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Completion</span>
                    <span className="font-medium">{selectedProject.progress}%</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" /> Milestones
                  </h3>
                  {(!selectedProject.milestones || selectedProject.milestones.length === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">No milestones added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProject.milestones.map(milestone => (
                        <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleToggleMilestone(milestone.id, !milestone.completed)}
                              className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                            >
                              {milestone.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                            <div className={`flex flex-col ${milestone.completed ? 'opacity-60' : ''}`}>
                              <span className={`text-sm font-medium ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {milestone.title}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {milestone.dueDate}
                              </span>
                            </div>
                          </div>
                          {role === 'admin' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteMilestone(milestone.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {role === 'admin' && (
                  <form onSubmit={handleAddMilestone} className="flex gap-2">
                    <div className="grid grid-cols-[1fr_auto] gap-2 flex-grow">
                      <Input 
                        placeholder="New milestone..." 
                        value={newMilestoneTitle}
                        onChange={e => setNewMilestoneTitle(e.target.value)}
                        required
                      />
                      <Input 
                        type="date"
                        value={newMilestoneDate}
                        onChange={e => setNewMilestoneDate(e.target.value)}
                      />
                    </div>
                    <Button type="submit" size="icon" className="shrink-0"><Plus className="w-4 h-4" /></Button>
                  </form>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProject(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
