import { useAuthStore, isAdmin } from '@/stores/authStore';
import AdminDashboard from './dashboard/AdminDashboard';
import EmployeeDashboard from './dashboard/EmployeeDashboard';

export default function Dashboard() {
  const { user } = useAuthStore();

  if (isAdmin(user?.role)) {
    return <AdminDashboard />;
  }

  return <EmployeeDashboard />;
}
