import Link from 'next/link';
import {
  LayoutDashboard, Calendar, Users, Wrench, Map, MessageSquare, Receipt,
  CreditCard, Star, BarChart3, Sparkles, Workflow, Bell, Settings,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/technicians', label: 'Technicians', icon: Wrench },
  { href: '/services', label: 'Services', icon: Wrench },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/ai', label: 'AI', icon: Sparkles },
  { href: '/automations', label: 'Automations', icon: Workflow },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-graphite/10 bg-forest-950 p-4 text-offwhite md:block">
        <div className="mb-6 px-2 text-lg font-semibold text-mint">ServiceFlow AI</div>
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-offwhite/80 hover:bg-white/5 hover:text-mint"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile nav: Dashboard / Bookings / Map / Customers / More */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-graphite/10 bg-forest-950 py-2 text-offwhite md:hidden">
        {NAV.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-1 text-xs">
            <Icon size={18} />
            {label}
          </Link>
        ))}
        <Link href="/settings" className="flex flex-col items-center gap-1 text-xs">
          <Settings size={18} />
          More
        </Link>
      </nav>

      <main className="flex-1 bg-offwhite p-6 pb-20 dark:bg-forest-900 md:pb-6">{children}</main>
    </div>
  );
}
