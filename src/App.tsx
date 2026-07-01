import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

const HomePage = lazy(() => import('./pages/HomePage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminHeroPage = lazy(() => import('./pages/AdminHeroPage'));
const AdminServicesPage = lazy(() => import('./pages/AdminServicesPage'));
const AdminTeamPage = lazy(() => import('./pages/AdminTeamPage'));
const AdminPartnersPage = lazy(() => import('./pages/AdminPartnersPage'));
const AdminGalleryPage = lazy(() => import('./pages/AdminGalleryPage'));
const AdminContactPage = lazy(() => import('./pages/AdminContactPage'));
const AdminAboutPage = lazy(() => import('./pages/AdminAboutPage'));
const AdminMarketplaceHeroPage = lazy(() => import('./pages/AdminMarketplaceHeroPage'));
const AdminMarketplaceCategoriesPage = lazy(() => import('./pages/AdminMarketplaceCategoriesPage'));
const AdminMarketplaceFeaturedPage = lazy(() => import('./pages/AdminMarketplaceFeaturedPage'));
const AdminMarketplacePartnersPage = lazy(() => import('./pages/AdminMarketplacePartnersPage'));
const AdminContactMessagesPage = lazy(() => import('./pages/AdminContactMessagesPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const AgentRegisterPage = lazy(() => import('./pages/AgentRegisterPage'));
const AgentLoginPage = lazy(() => import('./pages/AgentLoginPage'));
const AgentDashboardPage = lazy(() => import('./pages/AgentDashboardPage'));
const AgentDeliveryBookingPage = lazy(() => import('./pages/AgentDeliveryBookingPage'));
const AgentLogisticsPage = lazy(() => import('./pages/AgentLogisticsPage'));
const AdminAgentsPage = lazy(() => import('./pages/AdminAgentsPage'));
const BusinessRegisterPage = lazy(() => import('./pages/BusinessRegisterPage'));
const BusinessLoginPage = lazy(() => import('./pages/BusinessLoginPage'));
const BusinessDashboardPage = lazy(() => import('./pages/BusinessDashboardPage'));
const BusinessDeliveryBookingPage = lazy(() => import('./pages/BusinessDeliveryBookingPage'));
const BusinessLogisticsPage = lazy(() => import('./pages/BusinessLogisticsPage'));
const AdminBusinessesPage = lazy(() => import('./pages/AdminBusinessesPage'));
const AdminDeliveryBookingPage = lazy(() => import('./pages/AdminDeliveryBookingPage'));
const AdminDeliveryRequestPage = lazy(() => import('./pages/AdminDeliveryRequestPage'));
const AdminMessagingPage = lazy(() => import('./pages/AdminMessagingPage'));
const AdminDeliveryFeesPage = lazy(() => import('./pages/AdminDeliveryFeesPage'));
const AgentMessagesPage = lazy(() => import('./pages/AgentMessagesPage'));
const BusinessMessagesPage = lazy(() => import('./pages/BusinessMessagesPage'));
const AgentOrdersPage = lazy(() => import('./pages/AgentOrdersPage'));
const BusinessOrdersPage = lazy(() => import('./pages/BusinessOrdersPage'));
const AdminWhatsAppPage = lazy(() => import('./pages/AdminWhatsAppPage'));
const ShippingCalculatorPage = lazy(() => import('./pages/ShippingCalculatorPage'));
const IndividualRegisterPage = lazy(() => import('./pages/IndividualRegisterPage'));
const IndividualLoginPage = lazy(() => import('./pages/IndividualLoginPage'));
const IndividualDashboardPage = lazy(() => import('./pages/IndividualDashboardPage'));
const IndividualOrdersPage = lazy(() => import('./pages/IndividualOrdersPage'));
const IndividualDeliveryBookingPage = lazy(() => import('./pages/IndividualDeliveryBookingPage'));
const IndividualLogisticsPage = lazy(() => import('./pages/IndividualLogisticsPage'));
const IndividualMessagesPage = lazy(() => import('./pages/IndividualMessagesPage'));
const AdminOrdersAnalyticsPage = lazy(() => import('./pages/AdminOrdersAnalyticsPage'));
const AdminInvoiceGeneratorPage = lazy(() => import('./pages/AdminInvoiceGeneratorPage'));
const AdminIndividualsPage = lazy(() => import('./pages/AdminIndividualsPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

function ProtectedRoute({ element }: { element: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  return user ? element : <Navigate to="/admin/login" />;
}

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/admin/orders-analytics" element={<ProtectedRoute element={<AdminOrdersAnalyticsPage />} />} />
          <Route path="/admin/invoice-generator" element={<ProtectedRoute element={<AdminInvoiceGeneratorPage />} />} />
          <Route path="/admin/individuals" element={<ProtectedRoute element={<AdminIndividualsPage />} />} />

          <Route path="/agent/messages" element={<AgentMessagesPage />} />
          <Route path="/business/messages" element={<BusinessMessagesPage />} />

          <Route path="/agent/register" element={<AgentRegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
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

          <Route path="/individual/register" element={<IndividualRegisterPage />} />
          <Route path="/individual/login" element={<IndividualLoginPage />} />
          <Route path="/individual/dashboard" element={<IndividualDashboardPage />} />
          <Route path="/individual/orders" element={<IndividualOrdersPage />} />
          <Route path="/individual/booking/new" element={<IndividualDeliveryBookingPage />} />
          <Route path="/individual/logistics/new" element={<IndividualLogisticsPage />} />
          <Route path="/individual/messages" element={<IndividualMessagesPage />} />

          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/track" element={<OrderTrackingPage />} />
                  <Route path="/shipping-calculator" element={<ShippingCalculatorPage />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
