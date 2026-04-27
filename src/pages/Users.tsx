import React, { useState, useEffect } from 'react';
import { Search, Shield, ShieldAlert, User as UserIcon, Trash2, Plus, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

// Initialize a secondary app for creating users without signing out the admin
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

interface UserData {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function Users() {
  const { role: currentUserRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Add Staff form state
  const [addStaffName, setAddStaffName] = useState('');
  const [addStaffEmail, setAddStaffEmail] = useState('');
  const [addStaffPassword, setAddStaffPassword] = useState('');
  const [addStaffRole, setAddStaffRole] = useState('staff');
  const [addStaffPhone, setAddStaffPhone] = useState('');
  const [addStaffDepartment, setAddStaffDepartment] = useState('');
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [addStaffError, setAddStaffError] = useState('');

  useEffect(() => {
    if (currentUserRole !== 'admin') return;

    const q = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      const usersData: UserData[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as UserData);
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    const qInvites = query(collection(db, 'invitations'));
    const unsubscribeInvites = onSnapshot(qInvites, (snapshot) => {
      const invitesData: Invitation[] = [];
      snapshot.forEach((doc) => {
        invitesData.push({ id: doc.id, email: doc.id, ...doc.data() } as Invitation);
      });
      setInvitations(invitesData);
    }, (error) => {
      console.error("Error fetching invitations:", error);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeInvites();
    };
  }, [currentUserRole]);

  if (currentUserRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this user's access? This will delete their role record.")) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteError('');
    
    try {
      if (invitePassword) {
        // If an explicit password is provided, try to create an Email/Password account
        try {
          await createUserWithEmailAndPassword(secondaryAuth, inviteEmail, invitePassword);
          // Optional: Send password reset/welcome email if desired
          // await sendPasswordResetEmail(secondaryAuth, inviteEmail);
        } catch (authError: any) {
          if (authError.code === 'auth/operation-not-allowed') {
            throw new Error("Email/Password authentication is disabled in Firebase. Leave password blank for Google Sign-In, or enable Email/Password in your Firebase Console.");
          }
          throw authError; // Rethrow other errors
        }
      }

      // Create an invitation document with the email as the ID
      // This allows the user to sign in with Google or the created email/password
      await setDoc(doc(db, 'invitations', inviteEmail.toLowerCase()), {
        role: inviteRole,
        createdAt: new Date().toISOString()
      });
      
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('staff');
      setIsInviteDialogOpen(false);
      
      if (invitePassword) {
        alert(`Invitation sent! Account created for ${inviteEmail}.`);
      } else {
        alert(`Invitation recorded! ${inviteEmail} can now access the system using Google Sign-In.`);
      }
    } catch (error: any) {
      console.error("Error inviting user:", error);
      setInviteError(error.message || "Failed to create user invitation.");
    }
  };

  const handleRevokeInvitation = async (email: string) => {
    if (!window.confirm("Are you sure you want to revoke this invitation?")) return;
    try {
      await deleteDoc(doc(db, 'invitations', email));
    } catch (error) {
      console.error("Error revoking invitation:", error);
      alert("Failed to revoke invitation.");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addStaffName || !addStaffEmail || !addStaffPassword) return;
    setAddStaffError('');
    
    try {
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, addStaffEmail, addStaffPassword);
      
      await setDoc(doc(db, 'users', userCred.user.uid), {
        name: addStaffName,
        email: addStaffEmail,
        role: addStaffRole,
        phone: addStaffPhone,
        department: addStaffDepartment,
        uid: userCred.user.uid,
        createdAt: new Date().toISOString()
      });
      
      setAddStaffName('');
      setAddStaffEmail('');
      setAddStaffPassword('');
      setAddStaffRole('staff');
      setAddStaffPhone('');
      setAddStaffDepartment('');
      setIsAddStaffDialogOpen(false);
      alert(`Staff member ${addStaffName} added successfully.`);
    } catch (error: any) {
      console.error("Error adding staff:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setAddStaffError("Email/Password authentication is disabled in Firebase. Please enable it in the Firebase Console to add staff manually.");
      } else {
        setAddStaffError(error.message || "Failed to create staff member.");
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage staff access and administrative roles.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              <Mail className="mr-2 h-4 w-4" /> Invite User
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Invite a user by their email address. They will receive an email with a link to set their password and sign in.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input 
                  type="email" 
                  placeholder="user@example.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password (Optional)</label>
                <Input 
                  type="password" 
                  placeholder="Leave blank to only allow Google Sign-In" 
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Send Invite</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> Capture Staff
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>
                Manually capture and create an account for a new staff member.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
                  <Input 
                    placeholder="e.g. Jane Doe" 
                    value={addStaffName}
                    onChange={(e) => setAddStaffName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address <span className="text-destructive">*</span></label>
                  <Input 
                    type="email" 
                    placeholder="jane@example.com" 
                    value={addStaffEmail}
                    onChange={(e) => setAddStaffEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password <span className="text-destructive">*</span></label>
                  <Input 
                    type="password" 
                    placeholder="Secure password" 
                    value={addStaffPassword}
                    onChange={(e) => setAddStaffPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role <span className="text-destructive">*</span></label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={addStaffRole}
                    onChange={(e) => setAddStaffRole(e.target.value)}
                    required
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input 
                    type="tel" 
                    placeholder="+263 7..." 
                    value={addStaffPhone}
                    onChange={(e) => setAddStaffPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Input 
                    placeholder="e.g. Health, Infrastructure" 
                    value={addStaffDepartment}
                    onChange={(e) => setAddStaffDepartment(e.target.value)}
                  />
                </div>
              </div>
              {addStaffError && <p className="text-sm text-destructive">{addStaffError}</p>}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddStaffDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Staff Account</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {invitations.length > 0 && (
        <Card className="border-dashed border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-amber-500" /> Pending Invitations
            </CardTitle>
            <CardDescription>Users who have been invited but haven't signed in yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-background">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Invited On</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{inv.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={inv.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                          {inv.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{inv.createdAt?.split('T')[0]}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRevokeInvitation(inv.email)}>
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <CardTitle>System Users</CardTitle>
              <CardDescription>All users who have signed into the system.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                          {u.role === 'admin' ? <ShieldAlert className="mr-1 h-3 w-3" /> : <Shield className="mr-1 h-3 w-3" />}
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.createdAt?.split('T')[0]}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role === 'staff' ? (
                            <Button variant="outline" size="sm" onClick={() => handleRoleChange(u.id, 'admin')}>
                              Make Admin
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleRoleChange(u.id, 'staff')}>
                              Make Staff
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(u.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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