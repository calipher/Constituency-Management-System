import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface AuditLog {
  id: string;
  action: string;
  category: string;
  details: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { user, role } = useAuth();

  useEffect(() => {
    if (!user || role !== 'admin') return;
    
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: AuditLog[] = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() } as AuditLog);
      });
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching audit logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, role]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Monitor system activity and user actions.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>Recent actions performed across the system (Last 100)</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search logs..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date & Time</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center">Loading audit logs...</td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">No logs found matching your criteria.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col">
                            <span className="font-medium">{log.userName}</span>
                            <span className="text-xs text-muted-foreground">{log.userEmail}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline">{log.category}</Badge>
                        </td>
                        <td className="p-4 align-middle font-medium">{log.action}</td>
                        <td className="p-4 align-middle text-muted-foreground max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
