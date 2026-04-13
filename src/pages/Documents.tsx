import { useState } from 'react';
import { Search, Filter, Plus, FileText, Download, MoreHorizontal, Folder, File, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const documentsData = [
  { id: 'DOC-001', name: 'CDF Budget FY 2023-2024.pdf', type: 'PDF', size: '2.4 MB', category: 'Finance', date: '2023-10-20', uploader: 'Admin' },
  { id: 'DOC-002', name: 'Ward 3 Townhall Minutes.docx', type: 'Word', size: '1.1 MB', category: 'Meetings', date: '2023-10-18', uploader: 'Jane Staff' },
  { id: 'DOC-003', name: 'Borehole Project Proposal.pdf', type: 'PDF', size: '3.5 MB', category: 'Projects', date: '2023-10-15', uploader: 'Peter Admin' },
  { id: 'DOC-004', name: 'Constituency Map.png', type: 'Image', size: '5.2 MB', category: 'GIS', date: '2023-10-10', uploader: 'Admin' },
  { id: 'DOC-005', name: 'Bursary Applicants List.xlsx', type: 'Excel', size: '840 KB', category: 'Education', date: '2023-10-05', uploader: 'Jane Staff' },
];

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState('');

  const getIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText className="h-4 w-4 text-red-500" />;
      case 'Word': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'Excel': return <FileText className="h-4 w-4 text-emerald-500" />;
      case 'Image': return <ImageIcon className="h-4 w-4 text-purple-500" />;
      default: return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents & Files</h1>
          <p className="text-muted-foreground">Centralized repository for constituency documents, reports, and media.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Folder className="mr-2 h-4 w-4" /> New Folder</Button>
          <Button><Plus className="mr-2 h-4 w-4" /> Upload File</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-2">
        <Card className="bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-blue-500 mb-2" />
            <span className="font-medium">Finance & Budgets</span>
            <span className="text-xs text-muted-foreground">12 files</span>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-emerald-500 mb-2" />
            <span className="font-medium">Project Proposals</span>
            <span className="text-xs text-muted-foreground">24 files</span>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-amber-500 mb-2" />
            <span className="font-medium">Meeting Minutes</span>
            <span className="text-xs text-muted-foreground">45 files</span>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-purple-500 mb-2" />
            <span className="font-medium">Media & Photos</span>
            <span className="text-xs text-muted-foreground">128 files</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <CardTitle>Recent Files</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search files..."
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
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Uploaded By</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documentsData.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {getIcon(doc.type)}
                        {doc.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-normal">{doc.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{doc.size}</td>
                    <td className="px-4 py-3 text-muted-foreground">{doc.uploader}</td>
                    <td className="px-4 py-3 text-muted-foreground">{doc.date}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Rename</DropdownMenuItem>
                            <DropdownMenuItem>Move to Folder</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
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
