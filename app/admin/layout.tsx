'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ChefHat,
  Users,
  ShoppingBag,
  LogOut,
  ArrowLeft,
  LayoutGrid,
  Utensils,
  Tag,
  Settings2,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [mainSiteUrl, setMainSiteUrl] = useState('/');

  useEffect(() => {
    const isSub = window.location.hostname.startsWith('admin.');
    setIsSubdomain(isSub);
    if (isSub) {
      setMainSiteUrl(window.location.origin.replace('admin.', ''));
    }
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!res.ok) {
          setIsAuthenticated(false);
          const isSub = window.location.hostname.startsWith('admin.');
          const loginPath = isSub ? '/login' : '/admin/login';
          if (pathname !== loginPath) {
            router.replace(loginPath);
          }
        } else {
          setIsAuthenticated(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    verifySession();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      const isSub = window.location.hostname.startsWith('admin.');
      router.replace(isSub ? '/login' : '/admin/login');
    }
  };

  const links = [
    { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Orders', href: '/admin/orders', icon: <ShoppingBag size={20} /> },
    { name: 'Tables', href: '/admin/tables', icon: <LayoutGrid size={20} /> },
    { name: 'Kitchen', href: '/admin/kitchen', icon: <ChefHat size={20} /> },
    { name: 'Menu', href: '/admin/menu', icon: <Utensils size={20} /> },
    { name: 'Coupons', href: '/admin/coupons', icon: <Tag size={20} /> },
    { name: 'Control', href: '/admin/control', icon: <Settings2 size={20} /> },
    { name: 'Staff', href: '/admin/staff', icon: <Users size={20} /> },
    { name: 'Credit Reports', href: '/admin/credit-reports', icon: <FileSpreadsheet size={20} /> },
    { name: 'Main Report', href: '/admin/main-report', icon: <BarChart3 size={20} /> },
  ];

  const isLoginPage = pathname === '/admin/login' || pathname === '/login';

  // Show a full-screen loader while verifying
  if (isLoading) {
    return (
      <div className="h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-pulse text-brand-red font-bold text-xl tracking-widest uppercase">
          Loading...
        </div>
      </div>
    );
  }

  // On the login page OR not yet authenticated → render children only (no sidebar)
  if (isLoginPage || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-brand-bg flex overflow-hidden">
      <aside className="w-64 bg-[#212529] text-white hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-8 border-b border-gray-800 flex flex-col items-center">
          <img
            src="https://drive-thrueats.online/logo.png"
            alt="Logo"
            className="w-24 h-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold text-white tracking-widest uppercase">Admin</h2>
            <div className="h-1 w-12 bg-brand-red mx-auto mt-1 rounded-full" />
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          {links.map((link) => {
            const resolvedHref = isSubdomain ? (link.href.replace('/admin', '') || '/') : link.href;
            const isActive = isSubdomain 
              ? (pathname === (link.href.replace('/admin', '') || '/'))
              : (pathname === link.href);

            return (
              <Link
                key={link.name}
                href={resolvedHref}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive
                    ? 'bg-brand-red text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-2">
          <a
            href={mainSiteUrl}
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl font-bold transition-all"
          >
            <ArrowLeft size={20} /> Back to Site
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-white hover:bg-red-900/40 rounded-xl font-bold transition-all text-left"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden bg-[#212529] text-white p-4 flex items-center justify-between">
          <img
            src="https://drive-thrueats.online/logo.png"
            alt="Logo"
            className="h-8 w-auto brightness-0 invert"
          />
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="text-red-400">
              <LogOut size={20} />
            </button>
            <a href={mainSiteUrl}>
              <ArrowLeft className="text-gray-400" />
            </a>
          </div>
        </header>

        <div className="md:hidden bg-[#1a1d20] overflow-x-auto scrollbar-hide border-b border-gray-800">
          <div className="flex px-4 py-3 gap-2 w-max">
            {links.map((link) => {
              const resolvedHref = isSubdomain ? (link.href.replace('/admin', '') || '/') : link.href;
              const isActive = isSubdomain 
                ? (pathname === (link.href.replace('/admin', '') || '/'))
                : (pathname === link.href);

              return (
                <Link
                  key={link.name}
                  href={resolvedHref}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    isActive ? 'bg-brand-red text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
