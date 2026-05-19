import { authorizePage } from '@/lib/authorization';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin role check is implicitly done in authorizePage if we require an impossible permission, 
  // or better, we just check if they have a core admin permission.
  // We can pass an empty array to just ensure they are logged in, but we want STRICT ADMIN.
  // Actually, passing a dummy permission that only Admin has works, or we can just fetch the user.
  const user = await authorizePage([]); // Validates auth
  if (user.role?.name !== 'Admin') {
    const { notFound } = await import('next/navigation');
    return notFound();
  }
  return <>{children}</>;
}
