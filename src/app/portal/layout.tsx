import { PortalAuthBootstrap } from '../../components/portal/PortalAuthBootstrap';
import { PortalHeader } from '../../components/portal/PortalHeader';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 px-4 py-6">
      <PortalAuthBootstrap>
        <PortalHeader />
        {children}
      </PortalAuthBootstrap>
    </main>
  );
}
