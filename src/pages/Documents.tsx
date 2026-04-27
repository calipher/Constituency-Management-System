import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileText, Download, MoreHorizontal, Folder, File, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase';
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
  url?: string;
}

export default function Documents() {
  const { role, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [documentsData, setDocumentsData] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) { // Limit to 20MB for safety
      alert('File is too large. Please select a file smaller than 20MB.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Determine file extension and type
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let docType = 'File';
      if (['pdf'].includes(fileExt || '')) docType = 'PDF';
      else if (['doc', 'docx'].includes(fileExt || '')) docType = 'Word';
      else if (['xls', 'xlsx'].includes(fileExt || '')) docType = 'Excel';
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '')) docType = 'Image';
      
      const categoryOptions = ['Finance', 'Meetings', 'Projects', 'GIS', 'Education', 'General'];
      const uploadCategory = selectedFolder && selectedFolder !== 'Media' 
        ? selectedFolder 
        : (docType === 'Image' ? 'Media' : categoryOptions[Math.floor(Math.random() * categoryOptions.length)]);

      const rawFileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `documents/${rawFileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        }, 
        (error) => {
          console.error("Storage Error:", error);
          alert("Error uploading file. Please ensure Firebase Storage rules are configured and enabled.");
          setUploading(false);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            await addDoc(collection(db, 'documents'), {
              name: file.name,
              type: docType,
              size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
              category: uploadCategory,
              uploaderId: user?.uid || 'Unknown',
              uploaderName: user?.displayName || user?.email?.split('@')[0] || 'Admin',
              url: downloadURL,
              date: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            setUploading(false);
            setUploadProgress(0);
            alert("File uploaded successfully!");
          } catch (dbError) {
            console.error("Database Error:", dbError);
            alert("File uploaded, but failed to save document listing to database.");
            setUploading(false);
          }
        }
      );
    } catch (error) {
      console.error("Setup Error:", error);
      alert("Failed to initialize file upload.");
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string, url?: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      if (url) {
        // Attempt to delete from storage if URL exists and belongs to us
        try {
          const fileRef = ref(storage, url);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn("Could not delete physical file from storage (it might already be deleted or not found). Proceeding to delete db record.");
        }
      }
      
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

  const filteredDocs = documentsData.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If a folder is selected, enforce filtering
    let matchesFolder = true;
    if (selectedFolder) {
      if (selectedFolder === 'Media') {
        matchesFolder = doc.type === 'Image' || doc.category === 'Media';
      } else {
        matchesFolder = doc.category === selectedFolder;
      }
    }
    
    return matchesSearch && matchesFolder;
  });

  const getFolderTitle = () => {
    if (selectedFolder === 'Finance') return 'Finance & Budgets';
    if (selectedFolder === 'Projects') return 'Project Proposals';
    if (selectedFolder === 'Meetings') return 'Meeting Minutes';
    if (selectedFolder === 'Media') return 'Media & Photos';
    return 'Recent Files';
  };

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
            <div className="relative">
              <input 
                type="file" 
                id="file-upload" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Button disabled={uploading}>
                <Plus className="mr-2 h-4 w-4" /> 
                {uploading ? `Uploading... ${uploadProgress}%` : 'Upload File'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-2">
        <Card 
          className={`bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors ${selectedFolder === 'Finance' ? 'border-blue-500 bg-blue-500/10' : ''}`}
          onClick={() => setSelectedFolder(selectedFolder === 'Finance' ? null : 'Finance')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-blue-500 mb-2" />
            <span className="font-medium">Finance & Budgets</span>
            <span className="text-xs text-muted-foreground">{documentsData.filter(d => d.category === 'Finance').length} files</span>
          </CardContent>
        </Card>
        <Card 
          className={`bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors ${selectedFolder === 'Projects' ? 'border-emerald-500 bg-emerald-500/10' : ''}`}
          onClick={() => setSelectedFolder(selectedFolder === 'Projects' ? null : 'Projects')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-emerald-500 mb-2" />
            <span className="font-medium">Project Proposals</span>
            <span className="text-xs text-muted-foreground">{documentsData.filter(d => d.category === 'Projects').length} files</span>
          </CardContent>
        </Card>
        <Card 
          className={`bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors ${selectedFolder === 'Meetings' ? 'border-amber-500 bg-amber-500/10' : ''}`}
          onClick={() => setSelectedFolder(selectedFolder === 'Meetings' ? null : 'Meetings')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-amber-500 mb-2" />
            <span className="font-medium">Meeting Minutes</span>
            <span className="text-xs text-muted-foreground">{documentsData.filter(d => d.category === 'Meetings').length} files</span>
          </CardContent>
        </Card>
        <Card 
          className={`bg-muted/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors ${selectedFolder === 'Media' ? 'border-purple-500 bg-purple-500/10' : ''}`}
          onClick={() => setSelectedFolder(selectedFolder === 'Media' ? null : 'Media')}
        >
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Folder className="h-8 w-8 text-purple-500 mb-2" />
            <span className="font-medium">Media & Photos</span>
            <span className="text-xs text-muted-foreground">{documentsData.filter(d => d.type === 'Image' || d.category === 'Media').length} files</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle>{getFolderTitle()}</CardTitle>
              {selectedFolder && (
                <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setSelectedFolder(null)}>
                  Clear selection ×
                </Badge>
              )}
            </div>
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
                          {doc.url ? (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(doc.url, '_blank')}>
                              <Download className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 cursor-not-allowed" title="No file attached">
                              <Download className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {doc.url ? (
                                  <DropdownMenuItem onClick={() => window.open(doc.url, '_blank')}>
                                    Download File
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                {role === 'admin' ? (
                                  <React.Fragment>
                                    <DropdownMenuItem>Rename</DropdownMenuItem>
                                    <DropdownMenuItem>Move to Folder</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => handleDeleteDocument(doc.id, doc.url)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </React.Fragment>
                                ) : null}
                              </DropdownMenuGroup>
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
