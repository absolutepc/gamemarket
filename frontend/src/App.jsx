import { Routes, Route } from 'react-router-dom';
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
import ChatsPage from './pages/ChatsPage';
import ChatPage from './pages/ChatPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="listings/:id" element={<ListingPage />} />
        <Route path="users/:username" element={<ProfilePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="terms-of-sale" element={<TermsOfSalePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="listings/create" element={<CreateListingPage />} />
          <Route path="listings/:id/edit" element={<CreateListingPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="transactions/:id" element={<TransactionPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="chats" element={<ChatsPage />} />
          <Route path="chats/:id" element={<ChatPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
