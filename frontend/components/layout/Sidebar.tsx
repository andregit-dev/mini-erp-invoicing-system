'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menu = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/customers', label: 'Customers' },
  { href: '/invoices', label: 'Invoices' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Mini ERP</h1>
      </div>
      <nav className="space-y-1">
        {menu.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`
              block rounded-lg px-3 py-2 text-sm transition-colors
              ${pathname === href ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
            `}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
