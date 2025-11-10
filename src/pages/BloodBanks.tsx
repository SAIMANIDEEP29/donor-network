import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Phone, Mail, Building2, Search } from 'lucide-react';

interface BloodBank {
  id: string;
  name: string;
  contact_number: string;
  email: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  is_verified: boolean;
  inventory: {
    blood_group: string;
    units_available: number;
  }[];
}

export default function BloodBanks() {
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const { toast } = useToast();

  const fetchBloodBanks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('blood_banks')
        .select(`
          *,
          inventory:blood_inventory(blood_group, units_available)
        `)
        .eq('is_verified', true)
        .eq('is_active', true);

      if (searchCity) {
        query = query.ilike('city', `%${searchCity}%`);
      }
      if (searchDistrict) {
        query = query.ilike('district', `%${searchDistrict}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBloodBanks(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBloodBanks();
  }, []);

  const handleSearch = () => {
    fetchBloodBanks();
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blood Banks</h1>
            <p className="text-muted-foreground">Find verified blood banks near you</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Blood Banks</CardTitle>
            <CardDescription>Filter by city or district</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Enter city"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Enter district"
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} className="sm:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">Loading blood banks...</div>
        ) : bloodBanks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No blood banks found in this area</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bloodBanks.map((bank) => (
              <Card key={bank.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {bank.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {bank.city}, {bank.district}, {bank.state}
                      </CardDescription>
                    </div>
                    {bank.is_verified && (
                      <Badge variant="default">Verified</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{bank.contact_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{bank.email}</span>
                    </div>
                    {bank.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{bank.address}, {bank.pincode}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Available Blood Units</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {bank.inventory.map((item) => (
                        <div
                          key={item.blood_group}
                          className="text-center p-2 rounded-md bg-secondary"
                        >
                          <div className="font-bold text-sm">{item.blood_group}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.units_available} units
                          </div>
                        </div>
                      ))}
                      {bank.inventory.length === 0 && (
                        <div className="col-span-4 text-center text-sm text-muted-foreground py-2">
                          No inventory data available
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
