import { useAuth } from '../../context/AuthContext';
import FreelancerDashboard from './FreelancerDashboard';
import ClientDashboard from './ClientDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'CLIENT') {
    return <ClientDashboard />;
  }
  return <FreelancerDashboard />;
}
