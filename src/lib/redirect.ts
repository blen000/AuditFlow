export const ALLOWED_REDIRECT_HOSTS = [
  'localhost:3000',
  'localhost:9002',
  // Add production domains here
];

export function isSafeRedirect(url: string | null | undefined, requestUrl: string): boolean {
  if (!url) return true;
  
  // Relative paths are always safe (starting with / but not //)
  if (url.startsWith('/') && !url.startsWith('//')) return true;

  try {
    const target = new URL(url);
    const origin = new URL(requestUrl);
    
    // Check if host is in allowlist or matches origin
    return ALLOWED_REDIRECT_HOSTS.includes(target.host) || target.host === origin.host;
  } catch (e) {
    return false;
  }
}
