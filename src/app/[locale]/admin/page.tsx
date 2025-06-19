import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminBoard from '@/components/domains/admin/AdminBoard';

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/auth/signin');
  }

  // Check if user is admin (for now, we'll just check if they're authenticated)
  // Later we'll add proper role checking
  if (
    session.user.role !== 'admin' &&
    session.user.email !== 'admin@uploadhaven.com'
  ) {
    redirect('/dashboard');
  }

  return <AdminBoard />;
}
