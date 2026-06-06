'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import StatusHeader from './StatusHeader';

export default function PublicLayoutWrapper({ children, subdomain }: { children: React.ReactNode, subdomain?: string }) {
  const pathname = usePathname();
  
  const isPortal = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/waiter') || 
    pathname.startsWith('/staff') || 
    pathname.startsWith('/chef') ||
    subdomain === 'admin' ||
    subdomain === 'waiter' ||
    subdomain === 'chef' ||
    subdomain === 'staff';

  // If we are in the admin, waiter, or staff portals, DO NOT render the public Navbar/Footer/StatusHeader.
  if (isPortal) {
    return <main className="flex-1 flex flex-col">{children}</main>;
  }

  // Otherwise, it's the public restaurant theme.
  return (
    <>
      <Navbar />
      <StatusHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
