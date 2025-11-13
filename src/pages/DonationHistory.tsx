import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { History, Droplet } from 'lucide-react';
import { format } from 'date-fns';

interface DonationRecord {
  id: string;
  blood_request_id: string;
  donated_at: string;
  blood_group: string;
  patient_name: string;
  hospital_name: string;
}

export default function DonationHistory() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDonationHistory();
    }
  }, [user]);

  const fetchDonationHistory = async () => {
    try {
      setLoading(true);
      
      // For now, show empty state until donation tracking is fully implemented
      setDonations([]);
    } catch (error) {
      console.error('Error fetching donation history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <div className="flex items-center gap-2">
          <History className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Donation History</h1>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : donations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Droplet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Donations Yet</h2>
              <p className="text-muted-foreground">Your donation history will appear here once you start donating.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {donations.map((donation) => (
              <Card key={donation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Droplet className="h-5 w-5 text-primary" />
                        {donation.hospital_name}
                      </CardTitle>
                      <CardDescription>
                        Patient: {donation.patient_name}
                      </CardDescription>
                    </div>
                    <Badge variant="default">{donation.blood_group}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Donated on {format(new Date(donation.donated_at), 'PPP')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
