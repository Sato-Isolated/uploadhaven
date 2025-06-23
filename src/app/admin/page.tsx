import { AdminDashboard } from '@/domains/admin/presentation/components/AdminDashboard';
import { Header } from '@/shared/presentation/components/Header';
import { Footer } from '@/shared/presentation/components/Footer';

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <AdminDashboard />
      </main>

      <Footer />
    </div>
  );
}
