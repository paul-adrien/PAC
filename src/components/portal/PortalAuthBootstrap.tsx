'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth/auth.store';

/**
 * Hydrate le store auth avec la session (cookies) au montage du layout portal.
 * Un seul endroit pour le fetch user, valable pour toutes les pages sous /portal.
 */
export function PortalAuthBootstrap({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuthStore(s => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}
