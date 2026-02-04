type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AuthCard({ title, subtitle, children }: Props) {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-orange-300 via-amber-200 to-orange-400 opacity-40 blur-xl" />
      <div className="relative rounded-2xl bg-white/90 p-8 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
