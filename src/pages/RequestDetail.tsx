import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Phone, User, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { canDonate, getDaysUntilEligible } from '@/lib/bloodGroupCompatibility';

interface Request {
  id: string;
  hospital_name: string;
  city: string;
  district: string;
  state: string;
  patient_name: string;
  illness_condition: string;
  urgency_level: 'high' | 'medium' | 'low';
  mobile_number: string;
  blood_group: string;
  status: string;
  requester_id: string;
  created_at: string;
}

interface Profile {
  name: string;
  phone: string;
  blood_group: string;
  last_donation_date: string | null;
  willing_to_donate: boolean;
  is_available: boolean;
}

interface Acceptance {
  id: string;
  donor_id: string;
  profiles: Profile;
}

export default function RequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState<Request | null>(null);
  const [acceptances, setAcceptances] = useState<Acceptance[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id && user) {
      fetchRequestDetails();
      fetchAcceptances();
      fetchUserProfile();
    }
  }, [id, user]);

  const fetchRequestDetails = async () => {
    const { data, error } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setRequest(data);
    }
    setLoading(false);
  };

  const fetchAcceptances = async () => {
    const { data } = await supabase
      .from('request_acceptances')
      .select(`
        id,
        donor_id,
        profiles (name, phone, blood_group)
      `)
      .eq('request_id', id);

    if (data) {
      setAcceptances(data as Acceptance[]);
      setHasAccepted(data.some(a => a.donor_id === user?.id));
    }
  };

  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (data) {
      setUserProfile(data);
    }
  };

  const handleAcceptRequest = async () => {
    if (!userProfile || !request) return;

    // Check eligibility
    const daysUntilEligible = getDaysUntilEligible(userProfile.last_donation_date);
    if (daysUntilEligible && daysUntilEligible > 0) {
      toast({
        title: 'Not Eligible',
        description: `You can donate again in ${daysUntilEligible} days`,
        variant: 'destructive',
      });
      return;
    }

    if (!userProfile.willing_to_donate || !userProfile.is_available) {
      toast({
        title: 'Not Available',
        description: 'Please update your profile to mark yourself as available',
        variant: 'destructive',
      });
      return;
    }

    if (!canDonate(userProfile.blood_group as any, request.blood_group as any)) {
      toast({
        title: 'Blood Type Mismatch',
        description: 'Your blood type is not compatible with this request',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('request_acceptances')
      .insert({
        request_id: id,
        donor_id: user?.id,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept request',
        variant: 'destructive',
      });
    } else {
      // Create notification for requester
      await supabase.from('notifications').insert({
        user_id: request.requester_id,
        request_id: id,
        type: 'donor_accepted',
        message: `${userProfile.name} (${userProfile.blood_group}) has accepted your blood request for ${request.patient_name}`,
      });

      toast({
        title: 'Request Accepted',
        description: 'The requester will be notified with your contact details',
      });
      setHasAccepted(true);
      fetchAcceptances();
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted';
    }
  };

  if (loading || !request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isRequester = request.requester_id === user?.id;
  const canAccept = userProfile?.willing_to_donate && !hasAccepted && !isRequester;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Request Details</h1>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Main Request Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{request.patient_name}</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-foreground">
                      {request.blood_group}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Blood Group Needed</p>
                    <Badge className={getUrgencyColor(request.urgency_level)}>
                      {request.urgency_level.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Hospital</p>
                  <p className="font-medium">{request.hospital_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {request.city}, {request.district}, {request.state}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <p className="font-medium">{request.illness_condition}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <a href={`tel:${request.mobile_number}`} className="font-medium text-primary hover:underline">
                    {request.mobile_number}
                  </a>
                </div>
              </div>
            </div>

            {canAccept && !hasAccepted && (
              <>
                <Separator />
                <Button onClick={handleAcceptRequest} className="w-full" size="lg">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Accept This Request
                </Button>
              </>
            )}

            {hasAccepted && (
              <div className="p-4 bg-green-500/10 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-600">You've accepted this request</p>
                  <p className="text-sm text-green-600/80">The requester has your contact details</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accepted Donors (visible to requester) */}
        {isRequester && acceptances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Accepted Donors ({acceptances.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {acceptances.map((acceptance) => (
                <div key={acceptance.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{acceptance.profiles.name}</p>
                      <p className="text-sm text-muted-foreground">{acceptance.profiles.blood_group}</p>
                    </div>
                  </div>
                  <a href={`tel:${acceptance.profiles.phone}`}>
                    <Button size="sm">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}