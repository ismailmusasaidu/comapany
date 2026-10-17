import {
  Menu, X, Truck, ArrowUp, ChevronDown, ChevronRight, Package, MapPin, Users,
  Building2, UserCheck, Calculator, User, Phone, Mail, Clock, Globe,
  Zap, Snowflake, Warehouse as WarehouseIcon, Ship, FileCheck, Home as HomeIcon,
  Boxes, HandHeart, ShieldCheck, LogIn,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import AIChatbot from './AIChatbot';

interface LayoutProps {
  children: React.ReactNode;
}

type MenuKey = 'services' | 'portals' | 'company' | null;

const MAIN_LINKS = [
  { href: '/', label: 'Home', hash: true, match: '/' },
  { href: '/logistics', label: 'Services', match: '/logistics' },
  { href: '/marketplace', label: 'Marketplace', match: '/marketplace' },
  { href: '/track', label: 'Track Order', match: '/track' },
  { href: '/shipping-calculator', label: 'Price Calculator', match: '/shipping-calculator' },
];

const SERVICE_MENU: { href: string; label: string; desc: string; icon: typeof Zap; accent: string }[] = [
  { href: '/logistics/zap', label: 'Express Delivery', desc: 'Same-day & next-day parcels', icon: Zap, accent: 'text-amber-400 bg-amber-500/10' },
  { href: '/logistics/plane', label: 'Import & Export', desc: 'Air, sea & land freight', icon: Ship, accent: 'text-sky-400 bg-sky-500/10' },
  { href: '/logistics/file-check', label: 'Customs Clearance', desc: 'Fast, compliant clearing', icon: FileCheck, accent: 'text-emerald-400 bg-emerald-500/10' },
  { href: '/logistics/snowflake', label: 'Cold Chain', desc: 'Temperature-controlled transport', icon: Snowflake, accent: 'text-cyan-400 bg-cyan-500/10' },
  { href: '/logistics/warehouse', label: 'Warehousing', desc: 'Secure storage & fulfilment', icon: WarehouseIcon, accent: 'text-orange-400 bg-orange-500/10' },
  { href: '/logistics/home', label: 'Relocation', desc: 'Home & office moving', icon: Boxes, accent: 'text-rose-400 bg-rose-500/10' },
];

const QUICK_TOOLS: { href: string; label: string; desc: string; icon: typeof Zap }[] = [
  { href: '/track', label: 'Track Order', desc: 'Real-time shipment status', icon: MapPin },
  { href: '/shipping-calculator', label: 'Price Calculator', desc: 'Instant shipping quotes', icon: Calculator },
  { href: '/marketplace', label: 'Marketplace', desc: 'Shop from trusted vendors', icon: Package },
];

const PORTALS: { href: string; label: string; desc: string; icon: typeof Zap }[] = [
  { href: '/agent/login', label: 'Agent Portal', desc: 'Delivery agents & couriers', icon: UserCheck },
  { href: '/business/login', label: 'Business Portal', desc: 'Companies & enterprises', icon: Building2 },
  { href: '/individual/login', label: 'Individual Portal', desc: 'Personal deliveries', icon: User },
];

const COMPANY_MENU: { href: string; label: string; desc: string; icon: typeof Zap }[] = [
  { href: '/#about', label: 'About Us', desc: 'Who we are & what we stand for', icon: Users },
  { href: '/#team', label: 'Our Team', desc: 'The people behind the company', icon: HandHeart },
  { href: '/#gallery', label: 'Gallery', desc: 'Our work in pictures', icon: Package },
  { href: '/#partners', label: 'Partners', desc: 'Organisations we work with', icon: Building2 },
  { href: '/#onboarding', label: 'Join Us', desc: 'Careers & agent onboarding', icon: ShieldCheck },
  { href: '/#contact', label: 'Contact', desc: 'Talk to our team', icon: Phone },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isMarketplacePage = location.pathname === '/marketplace';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const navRef = useRef<HTMLElement>(null);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setMobileSection(null);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setShowBackToTop(y > 400);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docH > 0 ? Math.min(100, (y / docH) * 100) : 0);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setOpenMenu(null);
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  // Escape closes, outside click closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenMenu(null); setMobileMenuOpen(false); }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const isActive = (item: (typeof MAIN_LINKS)[number]) =>
    item.hash ? location.pathname === '/' : location.pathname.startsWith(item.match);

  const toggleMenu = (key: Exclude<MenuKey, null>) =>
    setOpenMenu(prev => (prev === key ? null : key));

  const hoverOpen = (key: Exclude<MenuKey, null>) => setOpenMenu(key);

  const DesktopLink = ({ item }: { item: (typeof MAIN_LINKS)[number] }) => {
    const active = isActive(item);
    const cls = `relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
      active ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
    }`;
    const dot = active && (
      <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.9)]" />
    );
    return item.hash
      ? <a href={item.href} className={cls}>{item.label}{dot}</a>
      : <Link to={item.href} className={cls}>{item.label}{dot}</Link>;
  };

  const DropdownShell = ({ menu, children, wide = false }: { menu: Exclude<MenuKey, null>; children: React.ReactNode; wide?: boolean }) => (
    <div
      className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 ${wide ? 'w-[560px]' : 'w-80'} origin-top transition-all duration-200 z-50 ${
        openMenu === menu ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-[#0b1220] border border-white/15 rounded-2xl shadow-2xl shadow-black/70 ring-1 ring-black/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-orange-500 via-red-400 to-orange-500" />
        {children}
      </div>
    </div>
  );

  const MenuItem = ({ href, label, desc, icon: Icon, accent, onClick }: {
    href: string; label: string; desc: string; icon: typeof Zap; accent?: string; onClick: () => void;
  }) => {
    const inner = (
      <>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${accent ?? 'bg-orange-500/15 text-orange-400 group-hover:bg-orange-500/30'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-white leading-tight">{label}</p>
          <p className="text-xs text-slate-300 group-hover:text-slate-100 mt-0.5 leading-snug">{desc}</p>
        </div>
      </>
    );
    const cls = 'group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 hover:bg-white/10 text-left w-full';
    return href.startsWith('/#')
      ? <a href={href} onClick={onClick} className={cls}>{inner}</a>
      : <Link to={href} onClick={onClick} className={cls}>{inner}</Link>;
  };

  const MenuTrigger = ({ menu, label, icon: Icon }: { menu: Exclude<MenuKey, null>; label: string; icon: typeof Zap }) => (
    <button
      onClick={() => toggleMenu(menu)}
      onMouseEnter={() => hoverOpen(menu)}
      className={`relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
        openMenu === menu ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="h-4 w-4 text-orange-400" />
      {label}
      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openMenu === menu ? 'rotate-180' : ''}`} />
    </button>
  );

  const mobileSectionHeader = null;

  return (
    <div className="min-h-screen bg-white">
      <nav ref={navRef} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-black/30 border-b border-white/10'
          : 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border-b border-white/5'
      }`}>
        {/* ── Top utility bar ── */}
        <div className={`hidden lg:block border-b border-white/5 transition-all duration-300 overflow-hidden ${scrolled ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-10">
              <div className="flex items-center gap-5 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  All services operational — Nigeria &amp; beyond
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="h-3 w-3 text-orange-400" /> Mon–Sat, 8:00–18:00
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <a href="tel:+2348000000000" className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 transition-colors">
                  <Phone className="h-3 w-3" /> +234 800 000 0000
                </a>
                <a href="mailto:info@danhausa.com" className="flex items-center gap-1.5 text-slate-400 hover:text-orange-400 transition-colors">
                  <Mail className="h-3 w-3" /> info@danhausa.com
                </a>
                <span className="text-slate-700">|</span>
                {PORTALS.map(p => (
                  <Link key={p.href} to={p.href} className="flex items-center gap-1 text-slate-400 hover:text-orange-400 transition-colors">
                    <p.icon className="h-3 w-3" /> {p.label.replace(' Portal', '')}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main nav bar ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-[4.5rem]'}`}>
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0" onClick={closeMobileMenu}>
              <img
                src="/logo.png"
                alt="Danhausa Logistics"
                className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                style={{ mixBlendMode: 'screen' }}
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {MAIN_LINKS.map(item => <DesktopLink key={item.label} item={item} />)}

              {/* Services mega menu */}
              <div className="relative" onMouseLeave={() => setOpenMenu(m => (m === 'services' ? null : m))}>
                <MenuTrigger menu="services" label="More Services" icon={Globe} />
                <DropdownShell menu="services" wide>
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-1">
                      {SERVICE_MENU.map(item => (
                        <MenuItem key={item.label} {...item} onClick={() => setOpenMenu(null)} />
                      ))}
                    </div>
                    <div className="mt-2 pt-3 border-t border-white/5 grid grid-cols-3 gap-1">
                      {QUICK_TOOLS.map(item => (
                        <MenuItem key={item.label} {...item} onClick={() => setOpenMenu(null)} />
                      ))}
                    </div>
                  </div>
                </DropdownShell>
              </div>

              {/* Portals mega menu */}
              <div className="relative" onMouseLeave={() => setOpenMenu(m => (m === 'portals' ? null : m))}>
                <MenuTrigger menu="portals" label="Portals" icon={LogIn} />
                <DropdownShell menu="portals">
                  <div className="p-3">
                    <p className="px-1.5 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Partner Access</p>
                    <div className="space-y-1">
                      {PORTALS.map(item => (
                        <MenuItem key={item.label} {...item} onClick={() => setOpenMenu(null)} />
                      ))}
                    </div>
                    <div className="mt-2 pt-3 border-t border-white/5">
                      <MenuItem href="/track" label="Track a Shipment" desc="Enter your tracking number" icon={MapPin} onClick={() => setOpenMenu(null)} />
                    </div>
                  </div>
                </DropdownShell>
              </div>

              {/* Company mega menu */}
              <div className="relative" onMouseLeave={() => setOpenMenu(m => (m === 'company' ? null : m))}>
                <MenuTrigger menu="company" label="Company" icon={Building2} />
                <DropdownShell menu="company" wide>
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-1">
                      {COMPANY_MENU.map(item => (
                        <MenuItem key={item.label} {...item} onClick={() => setOpenMenu(null)} />
                      ))}
                    </div>
                  </div>
                </DropdownShell>
              </div>
            </div>

            {/* CTA + mobile toggle */}
            <div className="flex items-center gap-2.5">
              <Link
                to={isMarketplacePage ? '/#contact' : '/marketplace'}
                className="hidden lg:inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
              >
                <Truck className="h-4 w-4" />
                {isMarketplacePage ? 'Contact Us' : 'Get Started'}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(p => !p)}
                className="lg:hidden relative p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Scroll progress */}
        <div className="h-[2px] bg-transparent">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-400 transition-[width] duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* ── Mobile drawer ── */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-[85vh] overflow-y-auto opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-slate-900 border-t border-white/5">

            {/* Primary links */}
            <div className="px-3 pt-3 space-y-1">
              {[
                { href: '/', label: 'Home', hash: true, icon: HomeIcon },
                { href: '/marketplace', label: 'Marketplace', icon: Package },
                { href: '/track', label: 'Track Order', icon: MapPin },
                { href: '/shipping-calculator', label: 'Price Calculator', icon: Calculator },
              ].map(link => {
                const Icon = link.icon;
                const active = link.hash ? location.pathname === '/' : location.pathname.startsWith(link.href);
                const cls = `flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-sm font-medium ${
                  active ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`;
                const inner = (
                  <>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-400'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {link.label}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />}
                  </>
                );
                return link.hash
                  ? <a key={link.label} href={link.href} onClick={closeMobileMenu} className={cls}>{inner}</a>
                  : <Link key={link.label} to={link.href} onClick={closeMobileMenu} className={cls}>{inner}</Link>;
              })}
            </div>

            {/* Services accordion */}
            <div className="px-3 pt-3">
              <button onClick={() => setMobileSection(s => (s === 'services' ? null : 'services'))}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all">
                <span className="flex items-center gap-3 text-sm font-medium">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-orange-400" />
                  </span>
                  Our Services
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${mobileSection === 'services' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${mobileSection === 'services' ? 'max-h-96' : 'max-h-0'}`}>
                <div className="pl-3 pb-2 ml-4 border-l border-white/10 space-y-0.5 mt-1">
                  {SERVICE_MENU.map(item => (
                    <Link key={item.label} to={item.href} onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                      <item.icon className="h-4 w-4 text-orange-400/80" />
                      <span>
                        {item.label}
                        <span className="block text-[11px] text-slate-500">{item.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Portals accordion */}
            <div className="px-3 pt-1.5">
              <button onClick={() => setMobileSection(s => (s === 'portals' ? null : 'portals'))}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all">
                <span className="flex items-center gap-3 text-sm font-medium">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <LogIn className="h-4 w-4 text-orange-400" />
                  </span>
                  Portals
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${mobileSection === 'portals' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${mobileSection === 'portals' ? 'max-h-72' : 'max-h-0'}`}>
                <div className="pl-3 pb-2 ml-4 border-l border-white/10 space-y-0.5 mt-1">
                  {PORTALS.map(item => (
                    <Link key={item.label} to={item.href} onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                      <item.icon className="h-4 w-4 text-orange-400/80" />
                      <span>
                        {item.label}
                        <span className="block text-[11px] text-slate-500">{item.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Company accordion */}
            <div className="px-3 pt-1.5">
              <button onClick={() => setMobileSection(s => (s === 'company' ? null : 'company'))}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all">
                <span className="flex items-center gap-3 text-sm font-medium">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-orange-400" />
                  </span>
                  Company
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${mobileSection === 'company' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${mobileSection === 'company' ? 'max-h-96' : 'max-h-0'}`}>
                <div className="pl-3 pb-2 ml-4 border-l border-white/10 space-y-0.5 mt-1">
                  {COMPANY_MENU.map(item => (
                    <a key={item.label} href={item.href} onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                      <item.icon className="h-4 w-4 text-orange-400/80" />
                      <span>
                        {item.label}
                        <span className="block text-[11px] text-slate-500">{item.desc}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="px-3 py-4 space-y-2.5">
              <Link
                to={isMarketplacePage ? '/#contact' : '/marketplace'}
                onClick={closeMobileMenu}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
              >
                <Truck className="h-4 w-4" />
                {isMarketplacePage ? 'Contact Us' : 'Get Started'}
              </Link>
              <p className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                All services operational — Nigeria &amp; beyond
              </p>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-[4.5rem] lg:pt-[7.5rem]">
        {children}
      </div>

      <footer className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 py-16 border-b border-white/10">
            <div className="md:col-span-1">
              <div className="flex items-center mb-5">
                <img
                  src="/logo.png"
                  alt="Danhausa Logistics"
                  className="h-18 w-auto object-contain"
                  style={{ mixBlendMode: 'screen' }}
                />
              </div>
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
                <li><Link to="/logistics" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Express Shipping</Link></li>
                <li><Link to="/logistics" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Freight Services</Link></li>
                <li><Link to="/marketplace" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Marketplace</Link></li>
                <li><Link to="/track" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Track Package</Link></li>
                <li><Link to="/shipping-calculator" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block duration-200">Price Calculator</Link></li>
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

      <AIChatbot />
    </div>
  );
}
