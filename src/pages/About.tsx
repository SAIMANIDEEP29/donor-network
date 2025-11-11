import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Droplet, Heart, Users, MapPin, Bell, Shield } from 'lucide-react';

export default function About() {
  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-destructive rounded-full flex items-center justify-center">
              <Droplet className="w-10 h-10 text-destructive-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">About LifePulse</h1>
          <p className="text-lg text-muted-foreground">
            Built for faster, safer blood access
          </p>
        </div>

        {/* Mission Section */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-destructive" />
              <h2 className="text-2xl font-bold">Our Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              LifePulse is dedicated to connecting blood recipients with compatible donors in emergency situations. 
              We believe that access to blood should be fast, reliable, and available to everyone who needs it. 
              Our platform leverages technology to create a network of willing donors who can respond quickly 
              when lives are on the line.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Real-time Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Instant notifications to all compatible donors in the area when emergencies arise
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Location-based Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Find the nearest compatible donors using advanced geolocation technology
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Verified Donors</h3>
                <p className="text-sm text-muted-foreground">
                  All donors are verified and tracked with donation history for safety
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Blood Bank Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with verified blood banks and check real-time inventory availability
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <Card className="bg-gradient-to-r from-destructive/10 to-primary/10">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <p className="text-3xl font-bold">Every 2 seconds</p>
                <p className="text-sm text-muted-foreground">Someone needs blood</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold">1 donation</p>
                <p className="text-sm text-muted-foreground">Can save up to 3 lives</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold">56 days</p>
                <p className="text-sm text-muted-foreground">Safe donation interval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Create a Request</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit an emergency blood request with patient details, location, and required blood group
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Instant Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Compatible donors nearby receive instant notifications about the emergency request
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Connect & Save Lives</h3>
                  <p className="text-sm text-muted-foreground">
                    Donors accept the request and connect directly with you to proceed with donation
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="text-2xl font-bold">Get in Touch</h2>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Have questions or need support? We're here to help.
              </p>
              <div className="space-y-1">
                <p className="font-medium">Email: support@lifepulse.app</p>
                <p className="font-medium">Phone: +91 90 0000 0000</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>© 2025 LifePulse. Built for faster, safer blood access.</p>
        </div>
      </div>
    </Layout>
  );
}
