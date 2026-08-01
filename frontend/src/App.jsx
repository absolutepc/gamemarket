import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ListingPage from './pages/ListingPage';
import CreateListingPage from './pages/CreateListingPage';
import ProfilePage from './pages/ProfilePage';
import TransactionsPage from './pages/TransactionsPage';
import TransactionPage from './pages/TransactionPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WalletPage from './pages/WalletPage';
import RulesPage from './pages/RulesPage';
import FaqPage from './pages/FaqPage';
import SupportPage from './pages/SupportPage';
import TermsOfSalePage from './pages/TermsOfSalePage';
import PrivacyPage from './pages/PrivacyPage';
import UserAgreementPage from './pages/UserAgreementPage';
import ChatsPage from './pages/ChatsPage';
import ChatPage from './pages/ChatPage';
import VkCallbackPage from './pages/VkCallbackPage';
import AppleCallbackPage from './pages/AppleCallbackPage';
import AdminDisputesPage from './pages/AdminDisputesPage';
import AppsPage from './pages/AppsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import useAuthStore from './store/authStore';

/** /users without username → own profile or login */
function UsersIndexRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.username) return <Navigate to={`/users/${user.username}`} replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="apps" element={<AppsPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="listings/:id" element={<ListingPage />} />
        <Route path="users" element={<UsersIndexRedirect />} />
        <Route path="users/:username" element={<ProfilePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="auth/vk/callback" element={<VkCallbackPage />} />
        <Route path="auth/apple/callback" element={<AppleCallbackPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="terms-of-sale" element={<TermsOfSalePage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="user-agreement" element={<UserAgreementPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="listings/create" element={<CreateListingPage />} />
          <Route path="listings/:id/edit" element={<CreateListingPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="transactions/:id" element={<TransactionPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="chats" element={<ChatsPage />} />
          <Route path="chats/:id" element={<ChatPage />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="admin/disputes" element={<AdminDisputesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
