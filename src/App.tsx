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
import AdminMarketplaceHeroPage from './pages/AdminMarketplaceHeroPage';
import AdminMarketplaceCategoriesPage from './pages/AdminMarketplaceCategoriesPage';
import AdminMarketplaceFeaturedPage from './pages/AdminMarketplaceFeaturedPage';
import AdminMarketplacePartnersPage from './pages/AdminMarketplacePartnersPage';
import AdminContactMessagesPage from './pages/AdminContactMessagesPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AgentRegisterPage from './pages/AgentRegisterPage';
import AgentLoginPage from './pages/AgentLoginPage';
import AgentDashboardPage from './pages/AgentDashboardPage';
import AgentDeliveryBookingPage from './pages/AgentDeliveryBookingPage';
import AgentLogisticsPage from './pages/AgentLogisticsPage';
import AdminAgentsPage from './pages/AdminAgentsPage';
import BusinessRegisterPage from './pages/BusinessRegisterPage';
import BusinessLoginPage from './pages/BusinessLoginPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import BusinessDeliveryBookingPage from './pages/BusinessDeliveryBookingPage';
import BusinessLogisticsPage from './pages/BusinessLogisticsPage';
import AdminBusinessesPage from './pages/AdminBusinessesPage';
import AdminDeliveryBookingPage from './pages/AdminDeliveryBookingPage';
import AdminDeliveryRequestPage from './pages/AdminDeliveryRequestPage';
import AdminMessagingPage from './pages/AdminMessagingPage';
import AdminDeliveryFeesPage from './pages/AdminDeliveryFeesPage';
import AgentMessagesPage from './pages/AgentMessagesPage';
import BusinessMessagesPage from './pages/BusinessMessagesPage';
import AgentOrdersPage from './pages/AgentOrdersPage';
import BusinessOrdersPage from './pages/BusinessOrdersPage';
import AdminWhatsAppPage from './pages/AdminWhatsAppPage';

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
        <Route path="/admin/marketplace-hero" element={<ProtectedRoute element={<AdminMarketplaceHeroPage />} />} />
        <Route path="/admin/marketplace-categories" element={<ProtectedRoute element={<AdminMarketplaceCategoriesPage />} />} />
        <Route path="/admin/marketplace-featured" element={<ProtectedRoute element={<AdminMarketplaceFeaturedPage />} />} />
        <Route path="/admin/marketplace-partners" element={<ProtectedRoute element={<AdminMarketplacePartnersPage />} />} />
        <Route path="/admin/messages" element={<ProtectedRoute element={<AdminContactMessagesPage />} />} />
        <Route path="/admin/agents" element={<ProtectedRoute element={<AdminAgentsPage />} />} />
        <Route path="/admin/businesses" element={<ProtectedRoute element={<AdminBusinessesPage />} />} />
        <Route path="/admin/booking/new" element={<ProtectedRoute element={<AdminDeliveryBookingPage />} />} />
        <Route path="/admin/delivery-request/new" element={<ProtectedRoute element={<AdminDeliveryRequestPage />} />} />
        <Route path="/admin/private-messages" element={<ProtectedRoute element={<AdminMessagingPage />} />} />
        <Route path="/admin/delivery-fees" element={<ProtectedRoute element={<AdminDeliveryFeesPage />} />} />
        <Route path="/admin/whatsapp" element={<ProtectedRoute element={<AdminWhatsAppPage />} />} />

        <Route path="/agent/messages" element={<AgentMessagesPage />} />
        <Route path="/business/messages" element={<BusinessMessagesPage />} />

        <Route path="/agent/register" element={<AgentRegisterPage />} />
        <Route path="/agent/login" element={<AgentLoginPage />} />
        <Route path="/agent/dashboard" element={<AgentDashboardPage />} />
        <Route path="/agent/orders" element={<AgentOrdersPage />} />
        <Route path="/agent/booking/new" element={<AgentDeliveryBookingPage />} />
        <Route path="/agent/logistics/new" element={<AgentLogisticsPage />} />

        <Route path="/business/register" element={<BusinessRegisterPage />} />
        <Route path="/business/login" element={<BusinessLoginPage />} />
        <Route path="/business/dashboard" element={<BusinessDashboardPage />} />
        <Route path="/business/orders" element={<BusinessOrdersPage />} />
        <Route path="/business/booking/new" element={<BusinessDeliveryBookingPage />} />
        <Route path="/business/logistics/new" element={<BusinessLogisticsPage />} />

        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/track" element={<OrderTrackingPage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
