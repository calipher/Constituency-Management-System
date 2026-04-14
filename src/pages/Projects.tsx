import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Building2, MapPin, Calendar, DollarSign, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { exportToCSV } from '@/lib/exportUtils';
import { useAuth } from '@/contexts/AuthContext';

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
}

export default function Projects() {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleAddMockProject = async () => {
    try {
      await addDoc(collection(db, 'projects'), {
        name: 'New Project ' + Math.floor(Math.random() * 100),
        category: ['Education', 'Water', 'Health', 'Infrastructure'][Math.floor(Math.random() * 4)],
        status: ['Planning', 'In Progress', 'Completed'][Math.floor(Math.random() * 3)],
        progress: Math.floor(Math.random() * 100),
        budget: Math.floor(Math.random() * 5000000),
        spent: Math.floor(Math.random() * 2000000),
        location: 'Ward ' + (Math.floor(Math.random() * 5) + 1),
        endDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error adding project:", error);
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
            <Button onClick={handleAddMockProject}><Plus className="mr-2 h-4 w-4" /> New Project</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total CDF Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$5,000,000</div>
            <p className="text-xs text-muted-foreground mt-1">FY 2023/2024</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Funds Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">$3,180,000</div>
            <Progress value={63.6} className="mt-2" />
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
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer relative group">
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
                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Est. Completion</span>
                    <span className="font-medium">{project.endDate || project.createdAt.split('T')[0]}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Budget</span>
                    <span className="font-medium">${project.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Spent</span>
                    <span className="font-medium">${project.spent.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className={project.progress === 100 ? '[&>div]:bg-emerald-500' : ''} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
