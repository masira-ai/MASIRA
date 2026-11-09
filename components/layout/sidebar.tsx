'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Posteingang', href: '/inbox', icon: '📨' },
  { name: 'Bewertungen', href: '/reviews', icon: '⭐' },
  { name: 'Angebote', href: '/offers', icon: '💼' },
  { name: 'Wissensdatenbank', href: '/knowledge', icon: '📚' },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64 fixed left-0 top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold">Masira</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors flex items-center gap-3"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Abmelden</span>
        </button>
      </div>
    </div>
  );
}
