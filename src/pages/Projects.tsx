import { useState } from 'react';
import { Search, Filter, Plus, Building2, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const projectsData = [
  { id: 'PRJ-001', name: 'Ward 4 Secondary School Lab', category: 'Education', status: 'In Progress', progress: 65, budget: 1500000, spent: 950000, location: 'Ward 4', endDate: '2023-12-15' },
  { id: 'PRJ-002', name: 'Central Market Borehole', category: 'Water', status: 'Completed', progress: 100, budget: 800000, spent: 780000, location: 'Ward 1', endDate: '2023-09-30' },
  { id: 'PRJ-003', name: 'Dispensary Maternity Wing', category: 'Health', status: 'Planning', progress: 10, budget: 2500000, spent: 250000, location: 'Ward 3', endDate: '2024-03-20' },
  { id: 'PRJ-004', name: 'Feeder Road Grading', category: 'Infrastructure', status: 'In Progress', progress: 40, budget: 3000000, spent: 1200000, location: 'Ward 2 & 5', endDate: '2024-01-10' },
];

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects & CDF</h1>
          <p className="text-muted-foreground">Manage constituency development funds and track project execution.</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> New Project</Button>
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
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">Across 5 wards</p>
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

      <div className="grid gap-4 md:grid-cols-2">
        {projectsData.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs font-normal">{project.id}</Badge>
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
                  <CardTitle className="text-lg">{project.name}</CardTitle>
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
                  <span className="font-medium">{project.endDate}</span>
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
    </div>
  );
}
