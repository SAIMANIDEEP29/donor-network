import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Save } from 'lucide-react';
import { useRole } from '@/hooks/useRole';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface BloodBankInfo {
  id: string;
  name: string;
  contact_number: string;
  email: string;
  is_verified: boolean;
}

interface Inventory {
  [key: string]: number;
}

export default function BloodBankDashboard() {
  const { user } = useAuth();
  const { isBloodBank, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bloodBankInfo, setBloodBankInfo] = useState<BloodBankInfo | null>(null);
  const [inventory, setInventory] = useState<Inventory>({});

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
      
      // Fetch blood bank info
      const { data: bankData, error: bankError } = await supabase
        .from('blood_banks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (bankError) throw bankError;
      setBloodBankInfo(bankData);

      // Fetch inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('blood_inventory')
        .select('*')
        .eq('blood_bank_id', bankData.id);

      if (inventoryError) throw inventoryError;

      const inventoryMap: Inventory = {};
      inventoryData?.forEach((item) => {
        inventoryMap[item.blood_group] = item.units_available;
      });
      setInventory(inventoryMap);
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

  const handleSaveInventory = async () => {
    if (!bloodBankInfo) return;

    try {
      setSaving(true);

      // Update or insert inventory for each blood group
      for (const bloodGroup of BLOOD_GROUPS) {
        const units = inventory[bloodGroup] || 0;

        const { error } = await supabase
          .from('blood_inventory')
          .upsert({
            blood_bank_id: bloodBankInfo.id,
            blood_group: bloodGroup as any,
            units_available: units,
          });

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Inventory updated successfully',
      });
      
      fetchBloodBankData();
    } catch (error: any) {
      console.error('Error saving inventory:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInventoryChange = (bloodGroup: string, value: string) => {
    const units = parseInt(value) || 0;
    setInventory((prev) => ({
      ...prev,
      [bloodGroup]: units,
    }));
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
              Blood Inventory Management
            </CardTitle>
            <CardDescription>
              Update the number of blood units available for each blood group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BLOOD_GROUPS.map((bloodGroup) => (
                <div key={bloodGroup} className="space-y-2">
                  <Label htmlFor={bloodGroup} className="font-semibold">{bloodGroup}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={bloodGroup}
                      type="number"
                      min="0"
                      value={inventory[bloodGroup] || 0}
                      onChange={(e) => handleInventoryChange(bloodGroup, e.target.value)}
                      placeholder="0"
                      className="text-lg"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      units
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSaveInventory}
                disabled={saving}
                className="flex-1 sm:flex-none"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Inventory'}
              </Button>
              <p className="text-sm text-muted-foreground self-center">
                Re-entering a blood group will update its units
              </p>
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
