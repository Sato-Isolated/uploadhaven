import { DashboardClient } from '@/domains/user-management/presentation/components/DashboardClient';
import { Header } from '@/shared/presentation/components/Header';
import { Footer } from '@/shared/presentation/components/Footer';

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <DashboardClient />
      </main>

      <Footer />
    </div>
  );
}
