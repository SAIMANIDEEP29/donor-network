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
import { Package, Save } from 'lucide-react';
import { useRole } from '@/hooks/useRole';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface BloodBankInfo {
  id: string;
  name: string;
}

interface Inventory {
  [key: string]: number;
}

export default function Inventory() {
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
    fetchInventoryData();
  }, [user, isBloodBank, roleLoading]);

  const fetchInventoryData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: bankData, error: bankError } = await supabase
        .from('blood_banks')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

      if (bankError) throw bankError;
      setBloodBankInfo(bankData);

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
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory data',
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
      
      fetchInventoryData();
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

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <div className="flex items-center gap-2">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Blood Inventory</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Blood Units</CardTitle>
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
            <div className="mt-6">
              <Button
                onClick={handleSaveInventory}
                disabled={saving}
                className="w-full md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Inventory'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
