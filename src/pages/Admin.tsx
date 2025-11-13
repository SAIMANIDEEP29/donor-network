import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/hooks/useRole';
import Layout from '@/components/Layout';
import { Shield, Users, Droplet, FileText, CheckCircle, XCircle, Trash2, BarChart3, TrendingUp } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const { isAdmin, loading: roleLoading } = useRole();
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [bloodBanks, setBloodBanks] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeDonors: 0, activeRequests: 0, totalBloodBanks: 0, totalDonations: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges',
        variant: 'destructive',
      });
      navigate('/home');
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    // Fetch users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch roles separately
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const usersWithRoles = (usersData || []).map((u: any) => ({
      ...u,
      roles: (rolesData || [])
        .filter((r: any) => r.user_id === u.id)
        .map((r: any) => r.role),
    }));

    // Fetch requests
    const { data: requestsData } = await supabase
      .from('blood_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch blood banks
    const { data: bloodBanksData } = await supabase
      .from('blood_banks')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch audit logs
    const { data: logsData } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    // Enrich audit logs with usernames
    const logsWithUsernames = (logsData || []).map((log: any) => {
      const user = usersWithRoles.find((u: any) => u.id === log.user_id);
      return {
        ...log,
        username: user?.name || 'Unknown User',
      };
    });

    // Calculate stats
    const totalUsers = usersWithRoles.length;
    const activeDonors = usersWithRoles.filter((u: any) => u.willing_to_donate && u.is_available).length;
    const activeRequests = (requestsData || []).filter((r: any) => r.status === 'open').length;
    const totalBloodBanks = bloodBanksData?.length || 0;
    const totalDonations = (requestsData || []).filter((r: any) => r.status === 'fulfilled').length;

    setUsers(usersWithRoles);
    setRequests(requestsData || []);
    setBloodBanks(bloodBanksData || []);
    setAuditLogs(logsWithUsernames);
    setStats({ totalUsers, activeDonors, activeRequests, totalBloodBanks, totalDonations } as any);
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (newRole === 'admin') {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
    }

    toast({ title: 'Success', description: `User role updated to ${newRole}` });
    fetchData();
  };

  const toggleUserAvailability = async (userId: string, currentStatus: boolean) => {
    try {
      await supabase.rpc('update_user_availability', {
        _user_id: userId,
        _is_available: !currentStatus
      });
      toast({ title: 'Success', description: 'User availability updated' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const verifyRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('blood_requests')
      .update({ status: 'fulfilled' })
      .eq('id', requestId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Request fulfilled' });
    fetchData();
  };

  const verifyBloodBank = async (bankId: string) => {
    const { error } = await supabase
      .from('blood_banks')
      .update({ is_verified: true })
      .eq('id', bankId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Blood bank verified' });
    fetchData();
  };

  const toggleBloodBankStatus = async (bankId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('blood_banks')
      .update({ is_active: !currentStatus })
      .eq('id', bankId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Blood bank status updated' });
    fetchData();
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'User deleted successfully' });
    fetchData();
  };

  const deleteBloodBank = async (bankId: string) => {
    const { error } = await supabase
      .from('blood_banks')
      .delete()
      .eq('id', bankId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Blood bank deleted successfully' });
    fetchData();
  };

  const deleteRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('blood_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Request deleted successfully' });
    fetchData();
  };

  if (roleLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Donors</CardTitle>
              <Droplet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDonors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRequests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blood Banks</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBloodBanks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDonations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="blood-banks">Blood Banks</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Analytics
                </CardTitle>
                <CardDescription>Overview of platform activity and statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">User Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Total Users</span>
                        <span className="font-bold">{stats.totalUsers}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Active Donors</span>
                        <span className="font-bold">{stats.activeDonors}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Donor Availability Rate</span>
                        <span className="font-bold">
                          {stats.totalUsers > 0 ? ((stats.activeDonors / stats.totalUsers) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Request Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Active Requests</span>
                        <span className="font-bold">{stats.activeRequests}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Fulfilled Requests</span>
                        <span className="font-bold">{stats.totalDonations}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Success Rate</span>
                        <span className="font-bold">
                          {(stats.activeRequests + stats.totalDonations) > 0 
                            ? ((stats.totalDonations / (stats.activeRequests + stats.totalDonations)) * 100).toFixed(1) 
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Blood Bank Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Total Blood Banks</span>
                        <span className="font-bold">{stats.totalBloodBanks}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Verified Blood Banks</span>
                        <span className="font-bold">
                          {bloodBanks.filter(b => b.is_verified).length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Active Blood Banks</span>
                        <span className="font-bold">
                          {bloodBanks.filter(b => b.is_active).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">System Health</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Total Activities Logged</span>
                        <span className="font-bold">{auditLogs.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm">Platform Status</span>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and availability</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Willing to Donate</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{user.blood_group}</TableCell>
                        <TableCell>{user.city}, {user.district}</TableCell>
                        <TableCell>
                          <Badge variant={user.roles?.includes('admin') ? 'default' : 'secondary'}>
                            {user.roles?.includes('admin') ? 'Admin' : 'User'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_available ? 'default' : 'secondary'}>
                            {user.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.willing_to_donate ? 'default' : 'outline'}>
                            {user.willing_to_donate ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserRole(user.id, user.roles?.includes('admin') ? 'admin' : 'user')}
                          >
                            Toggle Role
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserAvailability(user.id, user.is_available)}
                          >
                            Toggle Status
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUser(user.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blood-banks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Blood Bank Management</CardTitle>
                <CardDescription>Verify and manage blood banks</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bloodBanks.map((bank) => (
                      <TableRow key={bank.id}>
                        <TableCell>{bank.name}</TableCell>
                        <TableCell>{bank.contact_number}</TableCell>
                        <TableCell>{bank.city}, {bank.district}</TableCell>
                        <TableCell>
                          <Badge variant={bank.is_active ? 'default' : 'secondary'}>
                            {bank.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {bank.is_verified ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {!bank.is_verified && (
                            <Button
                              size="sm"
                              onClick={() => verifyBloodBank(bank.id)}
                            >
                              Verify
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleBloodBankStatus(bank.id, bank.is_active)}
                          >
                            {bank.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Blood Bank</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {bank.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteBloodBank(bank.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Blood Requests</CardTitle>
                <CardDescription>Verify and manage blood requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.patient_name}</TableCell>
                        <TableCell>{request.hospital_name}</TableCell>
                        <TableCell>{request.blood_group}</TableCell>
                        <TableCell>{request.city}, {request.district}</TableCell>
                        <TableCell>
                          <Badge variant={request.urgency_level === 'urgent' ? 'destructive' : 'default'}>
                            {request.urgency_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge>{request.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {request.status === 'open' && (
                            <Button
                              size="sm"
                              onClick={() => verifyRequest(request.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Close
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this request for {request.patient_name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteRequest(request.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>System activity and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No audit logs available
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.username}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>{log.entity_type}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm text-muted-foreground truncate">
                              {log.details ? JSON.stringify(log.details) : 'No details'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{log.ip_address || 'N/A'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
