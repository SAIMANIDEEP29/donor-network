import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BloodGroup } from '@/lib/bloodGroupCompatibility';

interface Donor {
  id: string;
  blood_group: BloodGroup;
  city: string;
  district: string;
  is_available: boolean;
  willing_to_donate: boolean;
}

export default function FindDonors() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searchCity, setSearchCity] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroup | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchDonors();
  }, [selectedBloodGroup, searchCity]);

  const fetchDonors = async () => {
    let query = supabase
      .from('profiles')
      .select('id, blood_group, city, district, is_available, willing_to_donate')
      .eq('willing_to_donate', true);

    if (selectedBloodGroup !== 'all') {
      query = query.eq('blood_group', selectedBloodGroup);
    }

    if (searchCity) {
      query = query.ilike('city', `%${searchCity}%`);
    }

    const { data } = await query;

    if (data) {
      setDonors(data);
    }
    setLoading(false);
  };

  const filteredDonors = donors.filter(donor => donor.willing_to_donate);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Find Donors</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Search Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by city..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedBloodGroup} onValueChange={(value: any) => setSelectedBloodGroup(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blood Groups</SelectItem>
              {bloodGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Donors List */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {filteredDonors.length} donor{filteredDonors.length !== 1 ? 's' : ''} found
          </p>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading donors...</div>
          ) : filteredDonors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <User className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No donors found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search filters
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDonors.map((donor) => (
              <Card key={donor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-foreground">
                          {donor.blood_group}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{donor.city}, {donor.district}</span>
                        </div>
                        <Badge variant={donor.is_available ? "default" : "secondary"} className="text-xs">
                          {donor.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="bg-accent/50">
          <CardContent className="p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Privacy Note:</p>
            <p>Contact information is only shared after a donor accepts your blood request.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}