import { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileText, Download, MoreHorizontal, Folder, File, Image as ImageIcon, Trash2 } from 'lucide-react';
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
import { collection, onSnapshot, query, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  category: string;
  date: string;
  uploader: string;
  createdAt: string;
}

export default function Documents() {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [documentsData, setDocumentsData] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'documents'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Document[] = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Document);
      });
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDocumentsData(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching documents:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddMockDocument = async () => {
    try {
      const types = ['PDF', 'Word', 'Excel', 'Image'];
      const type = types[Math.floor(Math.random() * types.length)];
      let ext = '.pdf';
      if (type === 'Word') ext = '.docx';
      if (type === 'Excel') ext = '.xlsx';
      if (type === 'Image') ext = '.png';

      await addDoc(collection(db, 'documents'), {
        name: `New Document ${Math.floor(Math.random() * 1000)}${ext}`,
        type: type,
        size: `${(Math.random() * 10).toFixed(1)} MB`,
        category: ['Finance', 'Meetings', 'Projects', 'GIS', 'Education'][Math.floor(Math.random() * 5)],
        date: new Date().toISOString().split('T')[0],
        uploader: ['Admin', 'Jane Staff', 'Peter Admin'][Math.floor(Math.random() * 3)],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document.");
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText className="h-4 w-4 text-red-500" />;
      case 'Word': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'Excel': return <FileText className="h-4 w-4 text-emerald-500" />;
      case 'Image': return <ImageIcon className="h-4 w-4 text-purple-500" />;
      default: return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredDocs = documentsData.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents & Files</h1>
          <p className="text-muted-foreground">Centralized repository for constituency documents, reports, and media.</p>
        </div>
        {role === 'admin' && (
          <div className="flex gap-2">
            <Button variant="outline"><Folder className="mr-2 h-4 w-4" /> New Folder</Button>
            <Button onClick={handleAddMockDocument}><Plus className="mr-2 h-4 w-4" /> Upload File</Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-2">
        <Card className="bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-blue-500 mb-2" />
            <span className="font-medium">Finance & Budgets</span>
            <span className="text-xs text-muted-foreground">{documentsData.filter(d => d.category === 'Finance').length} files</span>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-emerald-500 mb-2" />
            <span className="font-medium">Project Proposals</span>
            <span className="text-xs text-muted-foreground">{documentsData.filter(d => d.category === 'Projects').length} files</span>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-amber-500 mb-2" />
            <span className="font-medium">Meeting Minutes</span>
            <span className="text-xs text-muted-foreground">{documentsData.filter(d => d.category === 'Meetings').length} files</span>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-purple-500 mb-2" />
            <span className="font-medium">Media & Photos</span>
            <span className="text-xs text-muted-foreground">{documentsData.filter(d => d.type === 'Image').length} files</span>
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading documents...</td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No documents found.</td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
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
                      <td className="px-4 py-3 text-muted-foreground">{doc.date || doc.createdAt.split('T')[0]}</td>
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
                              {role === 'admin' && (
                                <>
                                  <DropdownMenuItem>Rename</DropdownMenuItem>
                                  <DropdownMenuItem>Move to Folder</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
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
