import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { auth } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      setLocation('/login');
    }
  }, [setLocation]);

  if (!auth.isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
