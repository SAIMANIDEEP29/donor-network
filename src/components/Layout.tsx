import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: FileText, label: 'Requests', path: '/requests' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
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