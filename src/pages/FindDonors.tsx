import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, ArrowLeft, User, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BloodGroup } from '@/lib/bloodGroupCompatibility';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Donor {
  id: string;
  name: string;
  phone: string;
  blood_group: BloodGroup;
  city: string;
  district: string;
  is_available: boolean;
  willing_to_donate: boolean;
  distance?: number;
}

export default function FindDonors() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searchCity, setSearchCity] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroup | 'all'>('all');
  const [maxDistance, setMaxDistance] = useState('50');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [useNearbySearch, setUseNearbySearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchDonors();
  }, [selectedBloodGroup, searchCity, searchDistrict, useNearbySearch, userLocation, maxDistance]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setUseNearbySearch(true);
          toast({
            title: 'Location found',
            description: 'Searching for nearby donors...',
          });
        },
        (error) => {
          toast({
            title: 'Location error',
            description: 'Could not get your location. Please search by city instead.',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: 'Location not supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      });
    }
  };

  const fetchDonors = async () => {
    setLoading(true);

    if (useNearbySearch && userLocation) {
      // Use geospatial search
      const { data, error } = await supabase.rpc('find_nearby_donors' as any, {
        p_blood_group: selectedBloodGroup !== 'all' ? selectedBloodGroup : null,
        p_district: searchDistrict || null,
        p_user_lat: userLocation.lat,
        p_user_lng: userLocation.lng,
        p_max_distance_km: parseInt(maxDistance) || 50
      });

      if (error) {
        toast({
          title: 'Search error',
          description: error.message,
          variant: 'destructive',
        });
      } else if (data) {
        setDonors(data as Donor[]);
      }
    } else {
      // Regular search by city/district
      let query = supabase
        .from('profiles')
        .select('id, name, phone, blood_group, city, district, is_available, willing_to_donate')
        .eq('willing_to_donate', true);

      if (selectedBloodGroup !== 'all') {
        query = query.eq('blood_group', selectedBloodGroup);
      }

      if (searchCity) {
        query = query.ilike('city', `%${searchCity}%`);
      }

      if (searchDistrict) {
        query = query.ilike('district', `%${searchDistrict}%`);
      }

      const { data } = await query;

      if (data) {
        setDonors(data as Donor[]);
      }
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
        <Card className="bg-accent/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Search Method</Label>
              <Button 
                variant={useNearbySearch ? "default" : "outline"}
                size="sm"
                onClick={getUserLocation}
                disabled={useNearbySearch}
              >
                <Navigation className="w-4 h-4 mr-2" />
                {useNearbySearch ? 'Using Location' : 'Find Nearby'}
              </Button>
            </div>

            {useNearbySearch && (
              <div className="space-y-2">
                <Label htmlFor="maxDistance">Search Radius (km)</Label>
                <Input
                  id="maxDistance"
                  type="number"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  placeholder="50"
                  min="1"
                  max="500"
                />
              </div>
            )}

            {!useNearbySearch && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by city..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by district..."
                    value={searchDistrict}
                    onChange={(e) => setSearchDistrict(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select value={selectedBloodGroup} onValueChange={(value: any) => setSelectedBloodGroup(value)}>
                <SelectTrigger id="bloodGroup">
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

            {useNearbySearch && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setUseNearbySearch(false);
                  setUserLocation(null);
                }}
              >
                Switch to City Search
              </Button>
            )}
          </CardContent>
        </Card>

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
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-foreground">
                          {donor.blood_group}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{donor.name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{donor.city}, {donor.district}</span>
                          {donor.distance && (
                            <span className="text-primary">• {donor.distance.toFixed(1)} km away</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={donor.is_available ? "default" : "secondary"} className="text-xs">
                        {donor.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                      <a 
                        href={`tel:${donor.phone}`}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        {donor.phone}
                      </a>
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