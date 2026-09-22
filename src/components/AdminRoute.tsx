import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { LoadingState } from '@/components/ui/LoadingState';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, roleLoading } = useUser();
  if (roleLoading) return <LoadingState />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
