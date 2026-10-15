'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide the public navbar on dashboard and standalone probe routes
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/probe')) {
    return null;
  }

  return <Navbar />;
}
