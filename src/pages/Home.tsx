import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplet, Phone, Shield } from 'lucide-react';
import Layout from '@/components/Layout';
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
  const [loading, setLoading] = useState(true);
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
      <div className="p-4 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Save lives with every <span className="text-destructive">drop of blood</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            LifePulse connects recipients to compatible donors nearby, sends instant emergency alerts, and keeps donors healthy with a smart cooldown tracker.
          </p>
          
          <div className="flex gap-4 pt-4">
            <Button size="lg" onClick={() => navigate('/request-blood')} className="gap-2">
              <Droplet className="w-5 h-5" />
              Request Blood
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Phone className="w-5 h-5" />
              Contact
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold">Real-time alerts</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold">Verified donors</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold">Map-based search</h3>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How it Works */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-destructive" />
            <h2 className="text-2xl font-bold">How it works</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="font-semibold">1.</span>
              <p className="text-muted-foreground">Create an emergency request with the patient's location and needed blood group.</p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold">2.</span>
              <p className="text-muted-foreground">We alert all compatible, nearby, eligible donors instantly.</p>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold">3.</span>
              <p className="text-muted-foreground">First accepted donor connects with you and proceeds to donate.</p>
            </div>
          </div>
        </div>

        {/* Urgent Requests Preview */}
        {!loading && requests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Urgent Requests</h2>
              <Button variant="ghost" onClick={() => navigate('/requests')}>
                View All
              </Button>
            </div>
            <div className="grid gap-4">
              {requests.slice(0, 3).map((request) => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/request/${request.id}`)}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-destructive rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-destructive-foreground">{request.blood_group}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-muted-foreground">{request.hospital_name}</p>
                            <p className="text-sm text-muted-foreground">{request.city}, {request.district}</p>
                          </div>
                        </div>
                      </div>
                      <Badge className={getUrgencyColor(request.urgency_level)}>
                        {request.urgency_level.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
