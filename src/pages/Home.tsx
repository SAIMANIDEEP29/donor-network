import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle, MapPin, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { BloodGroup } from '@/lib/bloodGroupCompatibility';

interface BloodRequest {
  id: string;
  hospital_name: string;
  city: string;
  district: string;
  state: string;
  patient_name: string;
  blood_group: BloodGroup;
  urgency_level: 'high' | 'medium' | 'low';
  created_at: string;
}

export default function Home() {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUrgentRequests();
  }, []);

  const fetchUrgentRequests = async () => {
    const { data, error } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('status', 'open')
      .order('urgency_level', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const filteredRequests = requests.filter(request =>
    request.blood_group.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Blood Donor Network</h1>
          <p className="text-muted-foreground">Save lives with your donation</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by blood group or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => navigate('/request-blood')}
            className="h-24 flex flex-col gap-2"
          >
            <Plus className="w-6 h-6" />
            <span>Request Blood</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/find-donors')}
            className="h-24 flex flex-col gap-2"
          >
            <Search className="w-6 h-6" />
            <span>Find Donors</span>
          </Button>
        </div>

        {/* Urgent Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Urgent Requests</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/requests')}>
              View All
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No urgent requests at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card
                  key={request.id}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}