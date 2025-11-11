import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, User, Bell, Shield, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isBloodBank, role } = useRole();
  
  const navItems = isBloodBank 
    ? [
        { icon: Home, label: 'Dashboard', path: '/blood-bank/dashboard' },
        { icon: FileText, label: 'Requests', path: '/requests' },
        { icon: Bell, label: 'Notifications', path: '/notifications' },
        { icon: User, label: 'Profile', path: '/profile' },
      ]
    : [
        { icon: Home, label: 'Home', path: '/home' },
        { icon: FileText, label: 'Requests', path: '/requests' },
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: Bell, label: 'Notifications', path: '/notifications' },
      ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {isBloodBank ? (
                  <>
                    <Link to="/blood-bank/dashboard" className="flex items-center gap-3 text-lg">
                      <Home className="w-5 h-5" /> Dashboard
                    </Link>
                    <Link to="/requests" className="flex items-center gap-3 text-lg">
                      <FileText className="w-5 h-5" /> Blood Requests
                    </Link>
                    <Link to="/find-donors" className="flex items-center gap-3 text-lg">
                      <User className="w-5 h-5" /> Find Donors
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/home" className="flex items-center gap-3 text-lg">
                      <Home className="w-5 h-5" /> Home
                    </Link>
                    <Link to="/requests" className="flex items-center gap-3 text-lg">
                      <FileText className="w-5 h-5" /> My Requests
                    </Link>
                    <Link to="/find-donors" className="flex items-center gap-3 text-lg">
                      <User className="w-5 h-5" /> Find Donors
                    </Link>
                    <Link to="/blood-banks" className="flex items-center gap-3 text-lg">
                      <User className="w-5 h-5" /> Blood Banks
                    </Link>
                  </>
                )}
                <Link to="/about" className="flex items-center gap-3 text-lg">
                  <User className="w-5 h-5" /> About
                </Link>
                <Link to="/settings" className="flex items-center gap-3 text-lg">
                  <User className="w-5 h-5" /> Settings
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-3 text-lg text-primary">
                    <Shield className="w-5 h-5" /> Admin Panel
                  </Link>
                )}
                <Button variant="outline" onClick={handleLogout} className="mt-4">
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold">Life Pulse</h1>
          <Link to="/notifications">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 pb-20">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 flex items-center justify-around px-4 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}