import ProtectedRoute from '@/components/ProtectedRoute';
import { ReactNode } from 'react';

export default ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>
    <div className="mt-10 mb-32">{children}</div>
  </ProtectedRoute>
);
