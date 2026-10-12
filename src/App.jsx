import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import BagDrawer from './components/cart/BagDrawer';
import FlyToCartContainer from './components/cart/FlyToCart';
import HomePage from './routes/HomePage';
import ShopPage from './routes/ShopPage';
import CategoryPage from './routes/CategoryPage';
import ProductDetailPage from './routes/ProductDetailPage';
import OurStoryPage from './routes/OurStoryPage';
import OurSocialCornerPage from './routes/OurSocialCornerPage';
import InTheNewsPage from './routes/InTheNewsPage';
import ContactPage from './routes/ContactPage';
import PoliciesPage from './routes/PoliciesPage';
import BagPage from './routes/BagPage';
import CheckoutPage from './routes/CheckoutPage';
import OrderConfirmationPage from './routes/OrderConfirmationPage';
import AccountPage from './routes/AccountPage';
import LoginPage from './routes/LoginPage';
import NotFoundPage from './routes/NotFoundPage';

import ScrollProgress from './components/common/ScrollProgress';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppShell() {
  const { pathname } = useLocation();
  const hideFooter = [
    '/login',
    '/account',
    '/bag',
    '/checkout',
    '/terms-and-conditions',
    '/privacy-policy'
  ].includes(pathname) || pathname.startsWith('/order');

  return (
    <div className="flex min-h-screen flex-col bg-ground text-content">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product-category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/our-story" element={<OurStoryPage />} />
          <Route path="/our-social-corner" element={<OurSocialCornerPage />} />
          <Route path="/in-the-news" element={<InTheNewsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/shipping-policy" element={<PoliciesPage />} />
          <Route path="/return-and-exchange-policy" element={<PoliciesPage />} />
          <Route path="/terms-and-conditions" element={<PoliciesPage />} />
          <Route path="/privacy-policy" element={<PoliciesPage />} />
          <Route path="/bag" element={<BagPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/:orderNumber" element={<OrderConfirmationPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {!hideFooter && <Footer />}
      <BagDrawer />
      <FlyToCartContainer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ScrollProgress />
      <AppShell />
    </BrowserRouter>
  );
}
