import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, MoreHorizontal, Mail, Phone, Download, Trash2, Upload } from 'lucide-react';
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
import { db } from '@/firebase';
import { exportToCSV } from '@/lib/exportUtils';
import { useAuth } from '@/contexts/AuthContext';

interface Citizen {
  id: string;
  name: string;
  idNumber: string;
  email?: string;
  ward: string;
  phone: string;
  status: string;
  lastContact: string;
  createdAt: string;
}

export default function Citizens() {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [citizensData, setCitizensData] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'citizens'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const citizens: Citizen[] = [];
      snapshot.forEach((doc) => {
        citizens.push({ id: doc.id, ...doc.data() } as Citizen);
      });
      setCitizensData(citizens);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching citizens:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddMockCitizen = async () => {
    try {
      const randNum = Math.floor(Math.random() * 1000);
      await addDoc(collection(db, 'citizens'), {
        name: 'New Citizen ' + randNum,
        idNumber: Math.floor(Math.random() * 100000000).toString(),
        email: `citizen${randNum}@example.com`,
        ward: 'Ward ' + (Math.floor(Math.random() * 5) + 1),
        phone: '+263 7' + Math.floor(Math.random() * 100000000),
        status: 'Registered Voter',
        lastContact: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error adding citizen:", error);
    }
  };

  const handleDeleteCitizen = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this citizen?")) return;
    try {
      await deleteDoc(doc(db, 'citizens', id));
    } catch (error) {
      console.error("Error deleting citizen:", error);
      alert("Failed to delete citizen.");
    }
  };

  const filteredCitizens = citizensData.filter(citizen => 
    citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citizen.idNumber.includes(searchTerm) ||
    citizen.ward.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    exportToCSV('citizens.csv', filteredCitizens, [
      { header: 'Name', key: 'name' },
      { header: 'ID Number', key: 'idNumber' },
      { header: 'Email', key: 'email' },
      { header: 'Ward', key: 'ward' },
      { header: 'Phone', key: 'phone' },
      { header: 'Status', key: 'status' },
      { header: 'Last Contact', key: 'lastContact' },
    ]);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
      
      if (rows.length <= 1) {
        alert("CSV file is empty or only contains headers.");
        setIsImporting(false);
        return;
      }

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      
      // Find indexes
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const idIdx = headers.findIndex(h => h.includes('id'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const wardIdx = headers.findIndex(h => h.includes('ward'));
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('contact'));
      const statusIdx = headers.findIndex(h => h.includes('status'));

      let importedCount = 0;

      for (let i = 1; i < rows.length; i++) {
        // Split by comma, respecting quotes
        const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').trim());
        
        if (values.length < 2) continue; // Skip malformed rows

        const name = nameIdx >= 0 && values[nameIdx] ? values[nameIdx] : `Citizen ${Math.floor(Math.random() * 1000)}`;
        const idNumber = idIdx >= 0 && values[idIdx] ? values[idIdx] : Math.floor(Math.random() * 100000000).toString();
        const email = emailIdx >= 0 && values[emailIdx] ? values[emailIdx] : '';
        const ward = wardIdx >= 0 && values[wardIdx] ? values[wardIdx] : 'Ward 1';
        const phone = phoneIdx >= 0 && values[phoneIdx] ? values[phoneIdx] : '';
        const status = statusIdx >= 0 && values[statusIdx] ? values[statusIdx] : 'Registered Voter';

        await addDoc(collection(db, 'citizens'), {
          name,
          idNumber,
          email,
          ward,
          phone,
          status,
          lastContact: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        importedCount++;
      }

      alert(`Successfully imported ${importedCount} citizens.`);
    } catch (error) {
      console.error("Error importing CSV:", error);
      alert("Failed to import CSV. Please check the file format.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Citizens & Voters</h1>
          <p className="text-muted-foreground">Manage constituency database, voter registration, and demographics.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
            <Upload className="mr-2 h-4 w-4" /> 
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button onClick={handleAddMockCitizen}><Plus className="mr-2 h-4 w-4" /> Add Citizen</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <CardTitle>Citizen Database</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search name, ID, or ward..."
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
                  <th className="px-4 py-3 font-medium">ID Number</th>
                  <th className="px-4 py-3 font-medium">Ward</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Voter Status</th>
                  <th className="px-4 py-3 font-medium">Last Contact</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Loading citizens...
                    </td>
                  </tr>
                ) : filteredCitizens.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No citizens found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredCitizens.map((citizen) => (
                    <tr key={citizen.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{citizen.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{citizen.idNumber}</td>
                      <td className="px-4 py-3">{citizen.ward}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{citizen.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={
                            citizen.status === 'Registered Voter' ? 'default' : 
                            citizen.status === 'Unregistered' ? 'secondary' : 'destructive'
                          }
                        >
                          {citizen.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{citizen.lastContact}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                              <DropdownMenuItem>Edit Details</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" /> Send SMS
                              </DropdownMenuItem>
                              <DropdownMenuItem>Log Case</DropdownMenuItem>
                              {role === 'admin' ? (
                                <React.Fragment>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteCitizen(citizen.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Citizen
                                  </DropdownMenuItem>
                                </React.Fragment>
                              ) : null}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{filteredCitizens.length > 0 ? 1 : 0}</strong> to <strong>{filteredCitizens.length}</strong> of <strong>{citizensData.length}</strong> entries
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
