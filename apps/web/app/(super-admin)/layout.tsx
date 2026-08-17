import Link from 'next/link';
import { Building2, LifeBuoy, ShieldCheck } from 'lucide-react';

const NAV = [
  { href: '/super-admin/businesses', label: 'Businesses', icon: Building2 },
  { href: '/super-admin/support', label: 'Support Tickets', icon: LifeBuoy },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-graphite/10 bg-forest-950 p-4 text-offwhite md:block">
        <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold text-mint">
          <ShieldCheck size={18} /> Super Admin
        </div>
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-offwhite/80 hover:bg-white/5 hover:text-mint">
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-offwhite p-6 dark:bg-forest-900">{children}</main>
    </div>
  );
}
