'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide the public navbar on the dashboard routes
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return <Navbar />;
}
