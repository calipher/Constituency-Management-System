import { useState } from 'react';
import { Search, Filter, Plus, MoreHorizontal, Mail, Phone } from 'lucide-react';
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

const citizensData = [
  { id: 'CIT-001', name: 'John Doe', idNumber: '12345678', ward: 'Ward 1', phone: '+254 712 345 678', status: 'Registered Voter', lastContact: '2023-10-15' },
  { id: 'CIT-002', name: 'Jane Smith', idNumber: '87654321', ward: 'Ward 3', phone: '+254 723 456 789', status: 'Registered Voter', lastContact: '2023-10-20' },
  { id: 'CIT-003', name: 'Peter Jones', idNumber: '11223344', ward: 'Ward 2', phone: '+254 734 567 890', status: 'Unregistered', lastContact: '2023-09-05' },
  { id: 'CIT-004', name: 'Mary Wanjiku', idNumber: '44332211', ward: 'Ward 1', phone: '+254 745 678 901', status: 'Registered Voter', lastContact: '2023-10-22' },
  { id: 'CIT-005', name: 'David Omondi', idNumber: '55667788', ward: 'Ward 4', phone: '+254 756 789 012', status: 'Registered Voter', lastContact: '2023-10-01' },
  { id: 'CIT-006', name: 'Sarah Hassan', idNumber: '99887766', ward: 'Ward 5', phone: '+254 767 890 123', status: 'Deceased', lastContact: '2022-11-10' },
];

export default function Citizens() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCitizens = citizensData.filter(citizen => 
    citizen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citizen.idNumber.includes(searchTerm) ||
    citizen.ward.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Citizens & Voters</h1>
          <p className="text-muted-foreground">Manage constituency database, voter registration, and demographics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Import CSV</Button>
          <Button><Plus className="mr-2 h-4 w-4" /> Add Citizen</Button>
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
                {filteredCitizens.map((citizen) => (
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" /> Send SMS
                          </DropdownMenuItem>
                          <DropdownMenuItem>Log Case</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredCitizens.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No citizens found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>1</strong> to <strong>{filteredCitizens.length}</strong> of <strong>{citizensData.length}</strong> entries
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
