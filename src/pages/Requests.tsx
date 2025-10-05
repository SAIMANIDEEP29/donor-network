import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { BloodGroup, canDonate } from '@/lib/bloodGroupCompatibility';

interface BloodRequest {
  id: string;
  hospital_name: string;
  city: string;
  district: string;
  state: string;
  patient_name: string;
  blood_group: BloodGroup;
  urgency_level: 'high' | 'medium' | 'low';
  status: string;
  created_at: string;
}

interface Profile {
  blood_group: BloodGroup;
  willing_to_donate: boolean;
}

export default function Requests() {
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [availableRequests, setAvailableRequests] = useState<BloodRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyRequests();
      fetchAvailableRequests();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('blood_group, willing_to_donate')
      .eq('id', user?.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const fetchMyRequests = async () => {
    const { data } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('requester_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) {
      setMyRequests(data);
    }
  };

  const fetchAvailableRequests = async () => {
    const { data } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('status', 'open')
      .order('urgency_level', { ascending: false })
      .order('created_at', { ascending: false });

    if (data && profile) {
      // Filter requests where user can donate
      const compatible = data.filter(request => 
        profile.willing_to_donate && canDonate(profile.blood_group, request.blood_group)
      );
      setAvailableRequests(compatible);
    }
    setLoading(false);
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500 text-white';
      case 'accepted': return 'bg-yellow-500 text-white';
      case 'fulfilled': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-gray-500 text-white';
      default: return 'bg-muted';
    }
  };

  const RequestCard = ({ request }: { request: BloodRequest }) => (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/request/${request.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{request.patient_name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{request.city}, {request.district}</span>
            </div>
          </div>
          <Badge className={getUrgencyColor(request.urgency_level)}>
            {request.urgency_level.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">
                {request.blood_group}
              </span>
            </div>
            <div className="text-sm">
              <p className="font-medium">{request.hospital_name}</p>
              <p className="text-muted-foreground">
                {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button size="sm">View Details</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="p-4 space-y-6">
        <h1 className="text-3xl font-bold">Blood Requests</h1>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4 mt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : availableRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No available requests matching your blood group</p>
                  {!profile?.willing_to_donate && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Enable "Willing to Donate" in your profile to see requests
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              availableRequests.map(request => <RequestCard key={request.id} request={request} />)
            )}
          </TabsContent>

          <TabsContent value="my-requests" className="space-y-4 mt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : myRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You haven't created any requests yet</p>
                  <Button className="mt-4" onClick={() => navigate('/request-blood')}>
                    Create Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              myRequests.map(request => (
                <div key={request.id} className="space-y-2">
                  <RequestCard request={request} />
                  <Badge className={getStatusColor(request.status)} variant="outline">
                    Status: {request.status}
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}