import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';
import { useRole } from '@/hooks/useRole';

interface BloodBankInfo {
  id: string;
  name: string;
  contact_number: string;
  email: string;
  is_verified: boolean;
}

export default function BloodBankDashboard() {
  const { user } = useAuth();
  const { isBloodBank, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bloodBankInfo, setBloodBankInfo] = useState<BloodBankInfo | null>(null);

  useEffect(() => {
    if (!roleLoading && !isBloodBank) {
      navigate('/home');
      return;
    }
    fetchBloodBankData();
  }, [user, isBloodBank, roleLoading]);

  const fetchBloodBankData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: bankData, error: bankError } = await supabase
        .from('blood_banks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (bankError) throw bankError;
      setBloodBankInfo(bankData);
    } catch (error: any) {
      console.error('Error fetching blood bank data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blood bank data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="text-center py-8">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!bloodBankInfo) {
    return (
      <Layout>
        <div className="container mx-auto p-4 max-w-4xl">
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Blood Bank Not Found</h2>
              <p className="text-muted-foreground">Please contact admin to set up your blood bank profile.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blood Bank Dashboard</h1>
            <p className="text-muted-foreground">{bloodBankInfo.name}</p>
          </div>
          {bloodBankInfo.is_verified && (
            <div className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
              Verified
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Welcome to Your Dashboard
            </CardTitle>
            <CardDescription>
              Manage your blood bank operations and view incoming blood requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button asChild className="h-24">
                <a href="/inventory" className="flex flex-col items-center justify-center gap-2">
                  <Plus className="h-6 w-6" />
                  <span>Manage Inventory</span>
                </a>
              </Button>
              <Button asChild variant="outline" className="h-24">
                <a href="/requests" className="flex flex-col items-center justify-center gap-2">
                  <Building2 className="h-6 w-6" />
                  <span>View Blood Requests</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {!bloodBankInfo.is_verified && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="py-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Your blood bank is pending verification. Contact the administrator to get verified.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
