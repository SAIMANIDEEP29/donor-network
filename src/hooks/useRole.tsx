import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'user' | 'admin' | 'blood_bank';

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBloodBank, setIsBloodBank] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setRole('user');
        setIsAdmin(false);
        setIsBloodBank(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        const userRole = (data?.role || 'user') as UserRole;
        setRole(userRole);
        setIsAdmin(userRole === 'admin');
        setIsBloodBank(userRole === 'blood_bank');
      } catch (error) {
        console.error('Error checking role:', error);
        setRole('user');
        setIsAdmin(false);
        setIsBloodBank(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user]);

  return { role, isAdmin, isBloodBank, loading };
}
