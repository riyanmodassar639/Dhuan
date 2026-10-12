/**
 * DHUAN Secure API Client
 * Guarantees HTTPS across both client-side and server-side requests.
 */

export const BACKEND_HTTPS_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5000';

export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (typeof window !== 'undefined') {
    // In the browser, use relative proxy so it matches the current window protocol (HTTPS)
    return `/api/backend${cleanPath}`;
  }
  
  // On server-side, connect directly to the secure HTTPS backend
  return `${BACKEND_HTTPS_URL}/api${cleanPath}`;
}
