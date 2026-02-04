import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      {children}
    </main>
  );
}
