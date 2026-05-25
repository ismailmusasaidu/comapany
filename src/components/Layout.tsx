import { Menu, X, Truck, ArrowUp, ChevronDown, Package, MapPin, Users, Building2, UserCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isMarketplacePage = location.pathname === '/marketplace';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const portalsRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (portalsRef.current && !portalsRef.current.contains(e.target as Node)) setPortalsOpen(false);
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) setCompanyOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const NavLink = ({ href, label, isRouter = false, onClick }: { href: string; label: string; isRouter?: boolean; onClick?: () => void }) => {
    const cls = "relative px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 group whitespace-nowrap";
    const underline = <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-orange-500 to-red-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full origin-left" />;
    return isRouter
      ? <Link to={href} className={cls} onClick={onClick}>{label}{underline}</Link>
      : <a href={href} className={cls} onClick={onClick}>{label}{underline}</a>;
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-slate-900/98 backdrop-blur-xl shadow-2xl shadow-black/30'
          : 'bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950'
      }`}>

        {/* ── Top utility bar ── */}
        <div className="hidden lg:block border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-9">
              <p className="text-gray-500 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                All services operational — Nigeria & beyond
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <Link to="/track" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Track Order
                </Link>
                <span className="text-gray-700">|</span>
                <Link to="/agent/login" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <UserCheck className="h-3 w-3" /> Agent Portal
                </Link>
                <span className="text-gray-700">|</span>
                <Link to="/business/login" className="hover:text-orange-400 transition-colors flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Business Portal
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main nav bar ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* Logo */}
            <Link to="/" className="flex items-center group flex-shrink-0" onClick={closeMobileMenu}>
              <img
                src="/ChatGPT_Image_Mar_6,_2026,_06_30_55_PM.png"
                alt="Danhausa Logistics"
                className="h-12 sm:h-14 w-auto transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-0.5">
              <NavLink href="/#home" label="Home" />
              <NavLink href="/#logistics" label="Services" />
              <NavLink href="/marketplace" label="Marketplace" isRouter />
              <NavLink href="/track" label="Track Order" isRouter />

              {/* Company dropdown */}
              <div className="relative" ref={companyRef}>
                <button
                  onClick={() => { setCompanyOpen(p => !p); setPortalsOpen(false); }}
                  className="relative flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 group whitespace-nowrap"
                >
                  Company
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${companyOpen ? 'rotate-180' : ''}`} />
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-orange-500 to-red-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full origin-left" />
                </button>
                {companyOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                    <div className="p-1.5 space-y-0.5">
                      {[
                        { href: '/#about', label: 'About Us', icon: Users },
                        { href: '/#gallery', label: 'Gallery', icon: Package },
                        { href: '/#partners', label: 'Partners', icon: Building2 },
                        { href: '/#team', label: 'Our Team', icon: UserCheck },
                        { href: '/#onboarding', label: 'Join Us', icon: Truck },
                        { href: '/#contact', label: 'Contact', icon: MapPin },
                      ].map(item => (
                        <a key={item.label} href={item.href}
                          onClick={() => setCompanyOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group">
                          <item.icon className="h-4 w-4 text-orange-400 group-hover:text-orange-300" />
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Portals dropdown */}
              <div className="relative" ref={portalsRef}>
                <button
                  onClick={() => { setPortalsOpen(p => !p); setCompanyOpen(false); }}
                  className="relative flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 group whitespace-nowrap"
                >
                  Portals
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${portalsOpen ? 'rotate-180' : ''}`} />
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-orange-500 to-red-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full origin-left" />
                </button>
                {portalsOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
                    <div className="p-3 border-b border-white/5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Partner Access</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link to="/agent/login" onClick={() => setPortalsOpen(false)}
                        className="flex items-start gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                          <UserCheck className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Agent Portal</p>
                          <p className="text-xs text-gray-500">Delivery agents & couriers</p>
                        </div>
                      </Link>
                      <Link to="/business/login" onClick={() => setPortalsOpen(false)}
                        className="flex items-start gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                          <Building2 className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Business Portal</p>
                          <p className="text-xs text-gray-500">Companies & enterprises</p>
                        </div>
                      </Link>
                      <Link to="/track" onClick={() => setPortalsOpen(false)}
                        className="flex items-start gap-3 px-3 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all group">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                          <MapPin className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Track Order</p>
                          <p className="text-xs text-gray-500">Real-time shipment tracking</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA + mobile toggle */}
            <div className="flex items-center gap-3">
              <Link
                to={isMarketplacePage ? '/#contact' : '/marketplace'}
                className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                onClick={closeMobileMenu}
              >
                <Truck className="h-4 w-4" />
                {isMarketplacePage ? 'Contact Us' : 'Get Started'}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(p => !p)}
                className="md:hidden p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-slate-800 border-t border-white/5 divide-y divide-white/5">

            {/* Main nav links */}
            <div className="px-3 py-2 space-y-0.5">
              {[
                { href: '/#home', label: 'Home', isRouter: false },
                { href: '/#logistics', label: 'Services', isRouter: false },
                { href: '/marketplace', label: 'Marketplace', isRouter: true },
                { href: '/#about', label: 'About Us', isRouter: false },
                { href: '/#gallery', label: 'Gallery', isRouter: false },
                { href: '/#partners', label: 'Partners', isRouter: false },
                { href: '/#team', label: 'Our Team', isRouter: false },
                { href: '/#onboarding', label: 'Join Us', isRouter: false },
                { href: '/#contact', label: 'Contact', isRouter: false },
              ].map(link =>
                link.isRouter ? (
                  <Link key={link.label} to={link.href} onClick={closeMobileMenu}
                    className="flex items-center px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm font-medium">
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href} onClick={closeMobileMenu}
                    className="flex items-center px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm font-medium">
                    {link.label}
                  </a>
                )
              )}
            </div>

            {/* Portals — 3 equal cards */}
            <div className="px-3 py-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2.5 px-1">Portals</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { to: '/track', icon: MapPin, label: 'Track Order', sub: 'Track shipment' },
                  { to: '/agent/login', icon: UserCheck, label: 'Agent', sub: 'Agents & couriers' },
                  { to: '/business/login', icon: Building2, label: 'Business', sub: 'Companies' },
                ].map(({ to, icon: Icon, label, sub }) => (
                  <Link key={to} to={to} onClick={closeMobileMenu}
                    className="flex flex-col items-center gap-1.5 p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-center">
                    <div className="w-9 h-9 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-orange-400" />
                    </div>
                    <p className="text-xs font-semibold text-white leading-tight">{label}</p>
                    <p className="text-xs text-gray-500 leading-tight hidden sm:block">{sub}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="px-3 py-3">
              <Link
                to={isMarketplacePage ? '/#contact' : '/marketplace'}
                onClick={closeMobileMenu}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-all"
              >
                <Truck className="h-4 w-4" />
                {isMarketplacePage ? 'Contact Us' : 'Get Started'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16 md:pt-[4.5rem] lg:pt-[6.25rem]">
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
                <li><Link to="/track" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Track Package</Link></li>
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
