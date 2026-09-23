import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import BottomTabBar from './BottomTabBar.jsx';

/** App shell: sticky navbar, routed page content, footer, mobile tab bar. */
export default function AppLayout() {
  const location = useLocation();

  // Native-app behaviour: a new screen starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* pb-tabbar keeps content clear of the fixed mobile tab bar */}
      <main className="flex-1 pb-tabbar md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomTabBar />
    </div>
  );
}