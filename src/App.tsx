import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminHeroPage from './pages/AdminHeroPage';
import AdminServicesPage from './pages/AdminServicesPage';
import AdminTeamPage from './pages/AdminTeamPage';
import AdminPartnersPage from './pages/AdminPartnersPage';
import AdminGalleryPage from './pages/AdminGalleryPage';
import AdminContactPage from './pages/AdminContactPage';
import AdminAboutPage from './pages/AdminAboutPage';

function ProtectedRoute({ element }: { element: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  return user ? element : <Navigate to="/admin/login" />;
}

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute element={<AdminDashboardPage />} />} />
        <Route path="/admin/hero" element={<ProtectedRoute element={<AdminHeroPage />} />} />
        <Route path="/admin/services" element={<ProtectedRoute element={<AdminServicesPage />} />} />
        <Route path="/admin/team" element={<ProtectedRoute element={<AdminTeamPage />} />} />
        <Route path="/admin/partners" element={<ProtectedRoute element={<AdminPartnersPage />} />} />
        <Route path="/admin/gallery" element={<ProtectedRoute element={<AdminGalleryPage />} />} />
        <Route path="/admin/contact" element={<ProtectedRoute element={<AdminContactPage />} />} />
        <Route path="/admin/about" element={<ProtectedRoute element={<AdminAboutPage />} />} />

        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
