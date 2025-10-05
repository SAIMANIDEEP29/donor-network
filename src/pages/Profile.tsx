import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Phone, Mail, Droplet, Settings, LogOut, CheckCircle2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { getDaysUntilEligible } from '@/lib/bloodGroupCompatibility';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  name: string;
  email: string;
  phone: string;
  blood_group: string;
  willing_to_donate: boolean;
  is_available: boolean;
  last_donation_date: string | null;
  city: string;
  district: string;
  state: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleMarkDonation = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ last_donation_date: new Date().toISOString() })
      .eq('id', user?.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark donation',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Donation recorded successfully!',
      });
      fetchProfile();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </Layout>
    );
  }

  const daysUntilEligible = getDaysUntilEligible(profile.last_donation_date);
  const isEligible = daysUntilEligible === null || daysUntilEligible === 0;

  return (
    <Layout>
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-primary/10 to-background">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                <Droplet className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">{profile.name}</CardTitle>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Badge variant="outline" className="text-lg px-4 py-1">
                {profile.blood_group}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span>{profile.city}, {profile.district}, {profile.state}</span>
            </div>
          </CardContent>
        </Card>

        {/* Donation Status */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Willing to Donate</span>
              <Badge variant={profile.willing_to_donate ? "default" : "secondary"}>
                {profile.willing_to_donate ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Availability</span>
              <Badge variant={profile.is_available ? "default" : "secondary"}>
                {profile.is_available ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            
            <Separator />

            {profile.last_donation_date ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Donation:</span>
                  <span className="font-medium">
                    {new Date(profile.last_donation_date).toLocaleDateString()}
                  </span>
                </div>
                {!isEligible && daysUntilEligible !== null && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      You can donate again in {daysUntilEligible} days
                    </p>
                  </div>
                )}
                {isEligible && (
                  <div className="p-3 bg-green-500/10 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      You're eligible to donate!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  No donation history recorded
                </p>
              </div>
            )}

            <Button 
              onClick={handleMarkDonation} 
              className="w-full"
              disabled={!isEligible}
            >
              Mark Donation Done Today
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </Layout>
  );
}