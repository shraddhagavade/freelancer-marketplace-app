import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';
import Freelancers from './pages/Freelancers';
import FreelancerDetails from './pages/FreelancerDetails';
import ClientDetails from './pages/ClientDetails';
import Dashboard from './pages/dashboard/Dashboard';
import FreelancerProfilePage from './pages/dashboard/FreelancerProfilePage';
import ClientProfilePage from './pages/dashboard/ClientProfilePage';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-canvas">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/freelancers" element={<Freelancers />} />
          <Route path="/freelancers/:id" element={<FreelancerDetails />} />
          <Route path="/clients/:id" element={<ClientDetails />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute role="CLIENT"><CreateProject /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/dashboard/profile" element={<ProtectedRoute role="FREELANCER"><FreelancerProfilePage /></ProtectedRoute>} />
          <Route path="/dashboard/company" element={<ProtectedRoute role="CLIENT"><ClientProfilePage /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
