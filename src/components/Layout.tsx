import { Menu, X, Truck, ArrowUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isMarketplacePage = location.pathname === '/marketplace';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const navLinks = [
    { label: 'Home', href: '/#home', isLink: false },
    { label: 'Logistics', href: '/#logistics', isLink: false },
    { label: 'Marketplace', href: '/marketplace', isLink: true },
    { label: 'Gallery', href: '/#gallery', isLink: false },
    { label: 'Partners', href: '/#partners', isLink: false },
    { label: 'Team', href: '/#team', isLink: false },
    { label: 'Contact', href: '/#contact', isLink: false },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/20 border-b border-orange-500/10'
          : 'bg-gradient-to-r from-slate-900 to-blue-900 border-b border-orange-500/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
            <Link to="/" className="flex items-center group" onClick={closeMobileMenu}>
              <img
                src="/ChatGPT_Image_Mar_6,_2026,_06_30_55_PM.png"
                alt="Danhausa Logistics"
                className="h-14 sm:h-16 md:h-20 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) =>
                link.isLink ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="relative px-3 py-2 text-sm font-medium text-gray-200 hover:text-white transition-colors duration-200 group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="relative px-3 py-2 text-sm font-medium text-gray-200 hover:text-white transition-colors duration-200 group"
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-400 transition-all duration-300 group-hover:w-full rounded-full"></span>
                  </a>
                )
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Link
                to={isMarketplacePage ? '/#contact' : '/marketplace'}
                className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                onClick={closeMobileMenu}
              >
                <Truck className="h-4 w-4" />
                {isMarketplacePage ? 'Contact Us' : 'Get Started'}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-screen' : 'max-h-0'}`}>
          <div className="bg-slate-800/95 backdrop-blur-xl border-t border-white/5 px-4 py-4 space-y-1">
            {navLinks.map((link) =>
              link.isLink ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="flex items-center px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="flex items-center px-4 py-3 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </a>
              )
            )}
            <div className="pt-2 border-t border-white/10">
              <Link
                to={isMarketplacePage ? '/#contact' : '/marketplace'}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-xl font-semibold transition-all"
                onClick={closeMobileMenu}
              >
                <Truck className="h-4 w-4" />
                {isMarketplacePage ? 'Contact Us' : 'Get Started'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 md:pt-24">
        {children}
      </div>

      <footer className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 py-16 border-b border-white/10">
            <div className="md:col-span-1">
              <img
                src="/ChatGPT_Image_Mar_6,_2026,_06_30_55_PM.png"
                alt="Danhausa Logistics"
                className="h-16 w-auto mb-5"
              />
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Your trusted partner for seamless logistics and marketplace solutions across Nigeria and beyond.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-medium">All services operational</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-base mb-5 text-white">Services</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="/#logistics" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Express Shipping</a></li>
                <li><a href="/#logistics" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Freight Services</a></li>
                <li><Link to="/marketplace" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Marketplace</Link></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Track Package</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-5 text-white">Company</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="/#about" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">About Us</a></li>
                <li><a href="/#gallery" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Gallery</a></li>
                <li><a href="/#partners" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Partners</a></li>
                <li><a href="/#contact" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-5 text-white">Legal</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">&copy; 2026 Danhausa Logistics &amp; Marketplace. All rights reserved.</p>
            <div className="flex items-center gap-6 text-gray-500 text-xs">
              <span>Made with care in Nigeria</span>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <span>v2.0</span>
            </div>
          </div>
        </div>
      </footer>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-300 hover:scale-110 hover:shadow-orange-500/50 ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </div>
  );
}
