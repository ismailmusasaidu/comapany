import { Truck, Package, ShoppingCart, Globe, Clock, Shield, Phone, Mail, MapPin, Users, TrendingUp, ArrowRight, Star, Zap, CheckCircle, ChevronLeft, ChevronRight, Bike, Store, FileText, CreditCard, BadgeCheck, Upload, X, MessageCircle, Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface HeroData {
  title: string;
  subtitle: string;
  cta_button_text: string;
  cta_button_link: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  image_url: string;
}

interface Partner {
  id: string;
  name: string;
  logo_url: string;
}

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  hours: string;
}

interface AboutData {
  title: string;
  description: string;
  mission: string;
  vision: string;
}

interface WhatsAppSettings {
  phone_number: string;
  delivery_message: string;
  logistics_message: string;
  is_enabled: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  truck: <Truck className="h-7 w-7 text-white" />,
  package: <Package className="h-7 w-7 text-white" />,
  clock: <Clock className="h-7 w-7 text-white" />,
  users: <Users className="h-7 w-7 text-white" />,
};

export default function HomePage() {
  const [heroData, setHeroData] = useState<HeroData>({
    title: 'Seamless Logistics & Marketplace Solutions',
    subtitle: 'Experience excellence in delivery services and discover quality products in one unified platform.',
    cta_button_text: 'Explore Services',
    cta_button_link: '#logistics',
  });
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: 'info@danhausa.com',
    phone: '+234 (0) 123 456 7890',
    address: '123 Business District, Nigeria',
    hours: 'Mon-Fri: 9AM-6PM',
  });
  const [aboutData, setAboutData] = useState<AboutData>({
    title: 'Why Choose Danhausa?',
    description: 'We combine decades of logistics expertise with modern marketplace technology to deliver unparalleled service.',
    mission: 'Your security is our priority. We use cutting-edge technology to protect your data and transactions.',
    vision: 'Punctuality is our promise. We pride ourselves on meeting deadlines and exceeding expectations.',
  });
  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: hero } = await supabase.from('hero_section').select('*').limit(1).maybeSingle();
      if (hero) setHeroData(hero);

      const { data: servicesData } = await supabase.from('services').select('*').order('order_index', { ascending: true });
      if (servicesData) setServices(servicesData);

      const { data: teamData } = await supabase.from('team_members').select('*').order('order_index', { ascending: true });
      if (teamData) setTeamMembers(teamData);

      const { data: partnersData } = await supabase.from('partners').select('*').order('order_index', { ascending: true });
      if (partnersData) setPartners(partnersData);

      const { data: galleryData } = await supabase.from('gallery_items').select('*').order('order_index', { ascending: true });
      if (galleryData) setGalleryItems(galleryData);

      const { data: contact } = await supabase.from('contact_info').select('*').limit(1).maybeSingle();
      if (contact) setContactInfo(contact);

      const { data: about } = await supabase.from('about_section').select('*').limit(1).maybeSingle();
      if (about) setAboutData(about);

      const { data: wa } = await supabase.from('whatsapp_settings').select('*').limit(1).maybeSingle();
      if (wa && wa.is_enabled && wa.phone_number) setWhatsapp(wa);
    };
    fetchData();
  }, []);

  const defaultServices = [
    { id: '1', title: 'Express Shipping', description: 'Lightning-fast delivery for time-sensitive packages with real-time tracking.', icon: 'truck' },
    { id: '2', title: 'Freight Services', description: 'Comprehensive freight solutions for businesses of all sizes, domestic and international.', icon: 'package' },
    { id: '3', title: 'Same-Day Delivery', description: 'Need it now? Our same-day delivery service gets your package there by evening.', icon: 'clock' },
    { id: '4', title: 'Business Logistics', description: 'End-to-end supply chain management tailored for growing enterprises.', icon: 'users' },
  ];

  const displayServices = services.length > 0 ? services : defaultServices;

  const defaultGallery = [
    { id: '1', title: 'Modern Warehouse', description: 'State-of-the-art storage facilities', image_url: 'https://images.pexels.com/photos/4393426/pexels-photo-4393426.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: '2', title: 'Delivery Fleet', description: 'Modern vehicles for fast delivery', image_url: 'https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: '3', title: 'Logistics Hub', description: 'Our central operations center', image_url: 'https://images.pexels.com/photos/4481534/pexels-photo-4481534.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: '4', title: 'Packaging Quality', description: 'Careful packaging for every order', image_url: 'https://images.pexels.com/photos/4246096/pexels-photo-4246096.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: '5', title: 'Team at Work', description: 'Dedicated professionals every day', image_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: '6', title: 'Global Network', description: 'Reaching every corner of the world', image_url: 'https://images.pexels.com/photos/2422588/pexels-photo-2422588.jpeg?auto=compress&cs=tinysrgb&w=800' },
  ];

  const displayGallery = galleryItems.length > 0 ? galleryItems : defaultGallery;

  const defaultPartners = [
    { id: '1', name: 'Nile Trading', logo_url: '' },
    { id: '2', name: 'West Africa Exports', logo_url: '' },
    { id: '3', name: 'Lagos Merchants', logo_url: '' },
    { id: '4', name: 'Kano Goods Co.', logo_url: '' },
    { id: '5', name: 'Abuja Distribution', logo_url: '' },
  ];

  const displayPartners = partners.length > 0 ? partners : defaultPartners;

  const defaultTeam = [
    { id: '1', name: 'Aminu Hassan', position: 'Chief Executive Officer', bio: 'Visionary leader with 15+ years in logistics and supply chain management.', image_url: '' },
    { id: '2', name: 'Fatima Bello', position: 'Operations Director', bio: 'Expert in streamlining operations and delivering on-time results.', image_url: '' },
    { id: '3', name: 'Ibrahim Musa', position: 'Head of Technology', bio: 'Tech innovator driving digital transformation across our platforms.', image_url: '' },
    { id: '4', name: 'Aisha Garba', position: 'Customer Experience Lead', bio: 'Dedicated to providing exceptional service at every touchpoint.', image_url: '' },
  ];

  const displayTeam = teamMembers.length > 0 ? teamMembers : defaultTeam;

  const [partnerIndex, setPartnerIndex] = useState(0);
  const partnerAutoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const partnerVisibleCount = 5;
  const partnerMaxIndex = Math.max(0, displayPartners.length - partnerVisibleCount);

  const stopPartnerAuto = useCallback(() => {
    if (partnerAutoRef.current) clearInterval(partnerAutoRef.current);
  }, []);

  const startPartnerAuto = useCallback(() => {
    stopPartnerAuto();
    partnerAutoRef.current = setInterval(() => {
      setPartnerIndex(prev => (prev >= partnerMaxIndex ? 0 : prev + 1));
    }, 2800);
  }, [partnerMaxIndex, stopPartnerAuto]);

  useEffect(() => {
    startPartnerAuto();
    return stopPartnerAuto;
  }, [startPartnerAuto, stopPartnerAuto]);

  const partnerPrev = () => { setPartnerIndex(prev => Math.max(0, prev - 1)); startPartnerAuto(); };
  const partnerNext = () => { setPartnerIndex(prev => (prev >= partnerMaxIndex ? 0 : prev + 1)); startPartnerAuto(); };

  const [onboardingTab, setOnboardingTab] = useState<'rider' | 'vendor'>('rider');

  const [contactForm, setContactForm] = useState({ name: '', email: '', service_interest: 'Logistics Services', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    setContactError('');
    try {
      const { error } = await supabase.from('contact_messages').insert([contactForm]);
      if (error) throw error;
      setContactSuccess(true);
      setContactForm({ name: '', email: '', service_interest: 'Logistics Services', message: '' });
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const galleryAutoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const galleryVisibleCount = 3;

  const startGalleryAuto = useCallback(() => {
    if (galleryAutoRef.current) clearInterval(galleryAutoRef.current);
    galleryAutoRef.current = setInterval(() => {
      setGalleryIndex(prev => {
        const max = Math.max(0, displayGallery.length - galleryVisibleCount);
        return prev >= max ? 0 : prev + 1;
      });
    }, 3500);
  }, [displayGallery.length]);

  useEffect(() => { startGalleryAuto(); return () => { if (galleryAutoRef.current) clearInterval(galleryAutoRef.current); }; }, [startGalleryAuto]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') setLightboxIndex(i => i !== null ? Math.min(i + 1, displayGallery.length - 1) : null);
      if (e.key === 'ArrowLeft') setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null);
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, displayGallery.length]);

  const [teamIndex, setTeamIndex] = useState(0);
  const teamSlideRef = useRef<HTMLDivElement>(null);
  const teamAutoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [teamVisibleCount, setTeamVisibleCount] = useState(4);

  useEffect(() => {
    const updateVisible = () => {
      const w = window.innerWidth;
      if (w < 640) setTeamVisibleCount(1);
      else if (w < 768) setTeamVisibleCount(2);
      else if (w < 1024) setTeamVisibleCount(3);
      else setTeamVisibleCount(4);
    };
    updateVisible();
    window.addEventListener('resize', updateVisible);
    return () => window.removeEventListener('resize', updateVisible);
  }, []);

  const maxIndex = Math.max(0, displayTeam.length - teamVisibleCount);

  useEffect(() => {
    setTeamIndex(prev => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const stopAuto = useCallback(() => {
    if (teamAutoRef.current) clearInterval(teamAutoRef.current);
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    teamAutoRef.current = setInterval(() => {
      setTeamIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    }, 3500);
  }, [maxIndex, stopAuto]);

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [startAuto, stopAuto]);

  const teamPrev = () => {
    setTeamIndex(prev => Math.max(0, prev - 1));
    startAuto();
  };

  const teamNext = () => {
    setTeamIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    startAuto();
  };

  return (
    <>
      {/* ── HERO ── */}
      <section id="home" className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl animate-floatSlow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-floatSlow" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 lg:pt-24 lg:pb-0">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-slideInLeft">
              <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/40 rounded-full px-4 py-2 mb-6">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-orange-300 font-semibold text-xs tracking-widest uppercase">Your Trusted Partner</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
                <span className="text-white">{heroData.title.split(' ').slice(0, 2).join(' ')}</span>
                <br />
                <span className="text-gradient">{heroData.title.split(' ').slice(2).join(' ')}</span>
              </h1>
              <p className="text-lg lg:text-xl text-gray-300 mb-10 leading-relaxed max-w-lg animate-slideInLeft delay-100">
                {heroData.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-slideInLeft delay-200">
                <a
                  href={heroData.cta_button_link}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30"
                >
                  {heroData.cta_button_text}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white hover:bg-white hover:text-slate-900 px-8 py-4 rounded-xl font-bold text-base transition-all duration-300"
                >
                  Contact Us
                </a>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-12 pt-10 border-t border-white/10 animate-slideInLeft delay-300">
                {[
                  { value: '200+', label: 'Corporate Clients' },
                  { value: '50K+', label: 'Monthly Deliveries' },
                  { value: '98%', label: 'On-Time Rate' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl lg:text-3xl font-bold text-gradient">{stat.value}</div>
                    <div className="text-gray-400 text-xs mt-1 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4 animate-slideInRight delay-200">
              {[
                { icon: <Truck className="h-8 w-8 text-orange-400" />, title: 'Fast Delivery', desc: 'Swift & reliable logistics' },
                { icon: <ShoppingCart className="h-8 w-8 text-orange-400" />, title: 'Marketplace', desc: 'Quality at your fingertips' },
                { icon: <Shield className="h-8 w-8 text-orange-400" />, title: 'Secure', desc: 'Your trust is our priority' },
                { icon: <Globe className="h-8 w-8 text-orange-400" />, title: 'Global Reach', desc: 'Connect worldwide' },
              ].map((card, i) => (
                <div
                  key={card.title}
                  className={`glass rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 animate-slideUp delay-${(i + 3) * 100}`}
                >
                  <div className="mb-4 p-3 bg-orange-500/20 rounded-xl w-fit">{card.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                  <p className="text-gray-400 text-sm">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* ── SERVICES ── */}
      <section id="logistics" className="py-20 lg:py-28 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="flex justify-center">
              <span className="section-badge bg-orange-100 text-orange-600">Logistics Solutions</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Reliable Delivery <span className="text-gradient">Everywhere</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              From local deliveries to international freight, we handle your logistics with precision and care.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayServices.map((service, index) => (
              <div
                key={service.id}
                className={`group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-orange-100 transition-all duration-300 hover:-translate-y-2 animate-slideUp delay-${index * 100}`}
              >
                <div className="bg-gradient-to-br from-orange-500 to-red-500 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/30">
                  {iconMap[service.icon] ?? <Truck className="h-7 w-7 text-white" />}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{service.description}</p>
                <div className="mt-6 flex items-center gap-1 text-orange-500 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKETPLACE TEASER ── */}
      <section id="marketplace" className="py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="animate-slideInLeft">
              <span className="section-badge bg-blue-100 text-blue-800">Marketplace</span>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                Your One-Stop <span className="text-gradient">Shopping</span> Destination
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Discover a curated selection of quality products from trusted vendors. Shop with confidence knowing every transaction is secure and every product is verified.
              </p>
              <div className="space-y-5 mb-10">
                {[
                  { icon: <ShoppingCart className="h-5 w-5 text-orange-500" />, bg: 'bg-orange-50', title: 'Wide Product Range', desc: 'From electronics to fashion, find everything in one place.' },
                  { icon: <Shield className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50', title: 'Secure Transactions', desc: 'Shop safely with our encrypted payment gateway.' },
                  { icon: <TrendingUp className="h-5 w-5 text-green-600" />, bg: 'bg-green-50', title: 'Best Deals Daily', desc: 'Competitive prices and exclusive offers for valued customers.' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className={`${item.bg} p-3 rounded-xl flex-shrink-0`}>{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/25"
              >
                Browse Marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="relative animate-slideInRight">
              <div className="absolute -inset-8 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: <Users className="h-7 w-7 text-orange-400" />, value: '10K+', label: 'Active Users' },
                    { icon: <Package className="h-7 w-7 text-orange-400" />, value: '50K+', label: 'Products' },
                    { icon: <Star className="h-7 w-7 text-orange-400" />, value: '99%', label: 'Satisfaction' },
                    { icon: <Globe className="h-7 w-7 text-orange-400" />, value: '24/7', label: 'Support' },
                  ].map((stat) => (
                    <div key={stat.label} className="glass rounded-2xl p-5 hover:bg-white/20 transition-all">
                      {stat.icon}
                      <div className="text-2xl font-bold text-white mt-3 mb-1">{stat.value}</div>
                      <div className="text-gray-400 text-xs">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '50px 50px'}}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <span className="section-badge bg-white/10 text-orange-300 border border-orange-500/20">About Us</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-5">{aboutData.title}</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">{aboutData.description}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {[
              { icon: <Shield className="h-8 w-8 text-white" />, title: 'Our Mission', text: aboutData.mission },
              { icon: <TrendingUp className="h-8 w-8 text-white" />, title: 'Our Vision', text: aboutData.vision },
              { icon: <Users className="h-8 w-8 text-white" />, title: 'Our Values', text: 'Our dedicated team is committed to providing exceptional service and support at every step of your journey.' },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`group glass rounded-2xl p-8 flex flex-col hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 animate-slideUp delay-${i * 100}`}
              >
                <div className="bg-gradient-to-br from-orange-500 to-red-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                <p className="text-gray-400 leading-relaxed flex-1">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section id="gallery" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center">
              <span className="section-badge bg-orange-100 text-orange-600">Our Operations</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Professional <span className="text-gradient">Gallery</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A look at our state-of-the-art facilities, modern fleet, and operations that power your deliveries.
            </p>
          </div>

          {/* Slider */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${galleryIndex * (100 / galleryVisibleCount)}%)` }}
              >
                {displayGallery.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 px-2"
                    style={{ width: `${100 / galleryVisibleCount}%` }}
                  >
                    <button
                      onClick={() => { setLightboxIndex(index); if (galleryAutoRef.current) clearInterval(galleryAutoRef.current); }}
                      className="group relative w-full overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 block cursor-zoom-in"
                    >
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
                          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                        <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.description}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Prev / Next */}
            <button
              onClick={() => { setGalleryIndex(prev => Math.max(0, prev - 1)); startGalleryAuto(); }}
              disabled={galleryIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2.5 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 z-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => { setGalleryIndex(prev => Math.min(Math.max(0, displayGallery.length - galleryVisibleCount), prev + 1)); startGalleryAuto(); }}
              disabled={galleryIndex >= Math.max(0, displayGallery.length - galleryVisibleCount)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2.5 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 z-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.max(1, displayGallery.length - galleryVisibleCount + 1) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setGalleryIndex(i); startGalleryAuto(); }}
                  className={`rounded-full transition-all duration-300 ${galleryIndex === i ? 'w-6 h-2.5 bg-orange-500' : 'w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          </div>

          {/* Lightbox */}
          {lightboxIndex !== null && (
            <div
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setLightboxIndex(null)}
            >
              <button
                className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 rounded-full p-2.5 text-white transition-all"
                onClick={() => setLightboxIndex(null)}
              >
                <X className="h-6 w-6" />
              </button>

              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white transition-all disabled:opacity-20"
                disabled={lightboxIndex === 0}
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? Math.max(0, i - 1) : null); }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <div
                className="max-w-4xl w-full mx-12"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={displayGallery[lightboxIndex].image_url}
                  alt={displayGallery[lightboxIndex].title}
                  className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
                />
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-bold text-white">{displayGallery[lightboxIndex].title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{displayGallery[lightboxIndex].description}</p>
                  <p className="text-gray-600 text-xs mt-2">{lightboxIndex + 1} / {displayGallery.length} &nbsp;·&nbsp; Press ← → to navigate, Esc to close</p>
                </div>
              </div>

              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white transition-all disabled:opacity-20"
                disabled={lightboxIndex === displayGallery.length - 1}
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? Math.min(displayGallery.length - 1, i + 1) : null); }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}

          <div className="mt-16 bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-10 lg:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <Zap className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-3xl lg:text-4xl font-bold mb-4">Visit Our Facilities</h3>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Interested in seeing our operations firsthand? Schedule a tour and experience our commitment to excellence.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30"
              >
                Schedule a Tour
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section id="partners" className="py-20 lg:py-28 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center">
              <span className="section-badge bg-blue-100 text-blue-800">Trusted By Industry Leaders</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Our <span className="text-gradient">Corporate Partners</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Proud to serve leading companies across industries with reliable logistics solutions.
            </p>
          </div>

          <div className="relative mb-16">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${partnerIndex * (100 / partnerVisibleCount)}%)` }}
              >
                {displayPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex-shrink-0 w-1/2 sm:w-1/3 lg:w-1/5 px-2.5"
                  >
                    <div className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-orange-100 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 h-full">
                      <div className="text-center">
                        {partner.logo_url ? (
                          <img src={partner.logo_url} alt={partner.name} className="w-16 h-16 mx-auto mb-3 object-contain group-hover:scale-110 transition-transform" />
                        ) : (
                          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-orange-500/20">
                            <span className="text-white text-lg font-bold">{partner.name.substring(0, 2).toUpperCase()}</span>
                          </div>
                        )}
                        <p className="text-slate-700 font-semibold text-xs">{partner.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {displayPartners.length > partnerVisibleCount && (
              <>
                <button
                  onClick={partnerPrev}
                  disabled={partnerIndex === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={partnerNext}
                  disabled={partnerIndex >= partnerMaxIndex}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {displayPartners.length > partnerVisibleCount && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: partnerMaxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setPartnerIndex(i); startPartnerAuto(); }}
                    className={`h-2 rounded-full transition-all duration-300 ${i === partnerIndex ? 'bg-orange-500 w-6' : 'bg-gray-300 w-2 hover:bg-orange-300'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { value: '200+', label: 'Corporate Clients', color: 'text-orange-500' },
                { value: '50K+', label: 'Deliveries Monthly', color: 'text-blue-700' },
                { value: '98%', label: 'Client Retention', color: 'text-red-500' },
              ].map((stat) => (
                <div key={stat.label} className="group">
                  <div className={`text-3xl sm:text-4xl md:text-5xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-transform inline-block`}>{stat.value}</div>
                  <p className="text-gray-500 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center">
              <span className="section-badge bg-orange-100 text-orange-600">Our Team</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Meet Our <span className="text-gradient">Expert Team</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Dedicated professionals committed to delivering excellence in logistics and marketplace solutions.
            </p>
          </div>

          <div className="relative">
            <div className="overflow-hidden" ref={teamSlideRef}>
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${teamIndex * (100 / teamVisibleCount)}%)` }}
              >
                {displayTeam.map((member) => (
                  <div
                    key={member.id}
                    className="flex-shrink-0 px-3"
                    style={{ width: `${100 / teamVisibleCount}%` }}
                  >
                    <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 h-full">
                      <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-8 flex items-center justify-center">
                        {member.image_url ? (
                          <img src={member.image_url} alt={member.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-white/20 group-hover:ring-orange-400/50 transition-all" />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center ring-4 ring-white/20 group-hover:ring-orange-400/50 transition-all shadow-lg">
                            <span className="text-white text-2xl font-bold">{member.name.split(' ').map((n: string) => n[0]).join('')}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-6 text-center">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h3>
                        <p className="text-orange-500 font-semibold text-sm mb-3">{member.position}</p>
                        <p className="text-gray-500 text-sm leading-relaxed">{member.bio}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {displayTeam.length > teamVisibleCount && (
              <>
                <button
                  onClick={teamPrev}
                  disabled={teamIndex === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={teamNext}
                  disabled={teamIndex >= maxIndex}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {displayTeam.length > teamVisibleCount && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setTeamIndex(i); startAuto(); }}
                    className={`h-2 rounded-full transition-all duration-300 ${i === teamIndex ? 'bg-orange-500 w-6' : 'bg-gray-300 w-2 hover:bg-orange-300'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ONBOARDING ── */}
      <section id="onboarding" className="py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <div className="flex justify-center mb-4">
              <span className="section-badge bg-orange-100 text-orange-700">Join Our Network</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Get <span className="text-gradient">Onboard</span> Today
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Whether you want to deliver or sell, joining Danhausa is fast and straightforward.
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1 shadow-inner">
              <button
                onClick={() => setOnboardingTab('rider')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  onboardingTab === 'rider'
                    ? 'bg-white text-orange-600 shadow-md shadow-orange-100'
                    : 'text-gray-500 hover:text-slate-700'
                }`}
              >
                <Bike className="h-4 w-4" />
                Become a Rider
              </button>
              <button
                onClick={() => setOnboardingTab('vendor')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  onboardingTab === 'vendor'
                    ? 'bg-white text-blue-600 shadow-md shadow-blue-100'
                    : 'text-gray-500 hover:text-slate-700'
                }`}
              >
                <Store className="h-4 w-4" />
                Become a Vendor
              </button>
            </div>
          </div>

          {/* Rider Content */}
          {onboardingTab === 'rider' && (
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Steps */}
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">How to Join as a Rider</h3>
                <p className="text-gray-500 mb-8">Start earning on your own schedule. Follow these simple steps to get approved and start delivering.</p>
                <div className="space-y-5">
                  {[
                    { step: '01', icon: <FileText className="h-5 w-5" />, title: 'Submit Application', desc: 'Fill out our online rider application form with your personal details and preferred delivery zones.' },
                    { step: '02', icon: <Upload className="h-5 w-5" />, title: 'Upload Documents', desc: 'Provide a valid government-issued ID, proof of address, and a recent passport photograph.' },
                    { step: '03', icon: <BadgeCheck className="h-5 w-5" />, title: 'Background Verification', desc: 'Our team reviews your application and runs a quick background check — usually within 24–48 hours.' },
                    { step: '04', icon: <CreditCard className="h-5 w-5" />, title: 'Training & Activation', desc: 'Attend a short onboarding briefing, set up your wallet for payouts, and go live!' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Step {item.step}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div>
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 text-white mb-6 shadow-2xl shadow-orange-500/25">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Bike className="h-5 w-5" /> Rider Requirements</h3>
                  <ul className="space-y-3">
                    {[
                      'Minimum age of 18 years',
                      'Valid government-issued ID (NIN, Voters Card, or Passport)',
                      'Proof of address (utility bill or bank statement)',
                      'Passport photograph (white background)',
                      'Functional smartphone with internet access',
                      'Personal delivery motorcycle or bicycle in good condition',
                      'Proof of vehicle ownership or lease agreement',
                      'Valid vehicle registration and insurance',
                      'Good knowledge of local delivery routes',
                      'Ability to carry packages up to 15 kg',
                    ].map((req) => (
                      <li key={req} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-orange-200 flex-shrink-0 mt-0.5" />
                        <span className="text-orange-50">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                  <p className="text-sm text-orange-800 font-medium">Ready to start earning?</p>
                  <p className="text-xs text-orange-600 mt-1 mb-4">Applications are reviewed within 1-2 business days.</p>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30"
                  >
                    Apply as Rider <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Vendor Content */}
          {onboardingTab === 'vendor' && (
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Steps */}
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">How to Join as a Vendor</h3>
                <p className="text-gray-500 mb-8">List your products on our marketplace and reach thousands of customers across the region.</p>
                <div className="space-y-5">
                  {[
                    { step: '01', icon: <FileText className="h-5 w-5" />, title: 'Register Your Business', desc: 'Complete the vendor registration form with your business name, category, and contact details.' },
                    { step: '02', icon: <Upload className="h-5 w-5" />, title: 'Submit Documents', desc: 'Upload your CAC registration, tax ID (TIN), and a valid ID of the business owner or director.' },
                    { step: '03', icon: <BadgeCheck className="h-5 w-5" />, title: 'Account Verification', desc: 'Our compliance team verifies your documents and activates your vendor dashboard within 48–72 hours.' },
                    { step: '04', icon: <Store className="h-5 w-5" />, title: 'List Products & Go Live', desc: 'Upload your product catalogue, configure pricing and delivery options, and start receiving orders.' },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/30 group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Step {item.step}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div>
                <div className="bg-gradient-to-br from-blue-700 to-slate-900 rounded-3xl p-8 text-white mb-6 shadow-2xl shadow-blue-700/25">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Store className="h-5 w-5" /> Vendor Requirements</h3>
                  <ul className="space-y-3">
                    {[
                      'Registered business entity (sole proprietor, LLC, or corporation)',
                      'CAC certificate or business registration document',
                      'Valid Tax Identification Number (TIN)',
                      'Valid government-issued ID of owner or director',
                      'Active business bank account',
                      'Business address and proof of location',
                      'Product catalogue or list of items to be sold',
                      'High-quality product images (min 800×800px)',
                      'Agreed delivery lead times per product category',
                      'Compliance with Danhausa marketplace policies',
                    ].map((req) => (
                      <li key={req} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-blue-300 flex-shrink-0 mt-0.5" />
                        <span className="text-blue-50">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <p className="text-sm text-blue-900 font-medium">Ready to grow your business?</p>
                  <p className="text-xs text-blue-600 mt-1 mb-4">Our vendor support team will guide you through every step.</p>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-700/30"
                  >
                    Apply as Vendor <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── WHATSAPP BOOKING ── */}
      {whatsapp && (
        <section id="whatsapp-booking" className="py-20 lg:py-28 bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#075E54] relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
            <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="wa-dots" width="6" height="6" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#wa-dots)" />
            </svg>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="text-center mb-14">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl mb-5 border border-white/20">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Book via WhatsApp
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                Chat with us directly on WhatsApp to book a delivery or request logistics services — fast, simple, and personal.
              </p>
            </div>

            {/* Cards */}
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Delivery card */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 flex flex-col items-center text-center group hover:bg-white/15 transition-all duration-300">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Truck className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delivery Booking</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Send a package anywhere — same state, inter-state, or international. Get a quote and confirm your booking instantly.
                </p>
                <a
                  href={`https://wa.me/${whatsapp.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(whatsapp.delivery_message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-2.5 bg-white text-[#075E54] hover:bg-green-50 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full justify-center"
                >
                  <MessageCircle className="h-5 w-5" />
                  Book a Delivery
                </a>
              </div>

              {/* Logistics card */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 flex flex-col items-center text-center group hover:bg-white/15 transition-all duration-300">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Logistics Request</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Need bulk freight, warehousing, or a custom logistics plan? Describe your needs and our team will respond promptly.
                </p>
                <a
                  href={`https://wa.me/${whatsapp.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(whatsapp.logistics_message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-2.5 bg-white/10 border-2 border-white/50 text-white hover:bg-white hover:text-[#075E54] px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5 w-full justify-center"
                >
                  <MessageCircle className="h-5 w-5" />
                  Logistics Request
                </a>
              </div>
            </div>

            {/* Bottom note */}
            <div className="mt-10 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2.5">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-medium">
                  WhatsApp: +{whatsapp.phone_number.replace(/\D/g, '')}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 lg:py-28 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="flex justify-center">
              <span className="section-badge bg-orange-100 text-orange-600">What Clients Say</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Trusted by <span className="text-gradient">Thousands</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Hear from businesses and individuals who rely on Danhausa every day for their logistics needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Chukwuemeka Obi',
                role: 'E-commerce Business Owner, Lagos',
                avatar: 'CO',
                rating: 5,
                text: "Danhausa has completely transformed how I handle deliveries. My customers receive their orders on time, every time. The business portal makes bulk booking incredibly simple.",
                tag: 'Business Portal',
                color: 'from-orange-500 to-red-500',
              },
              {
                name: 'Amina Yusuf',
                role: 'Online Fashion Vendor, Kano',
                avatar: 'AY',
                rating: 5,
                text: "I ship clothes to customers across Nigeria weekly. The inter-state delivery is fast and the real-time tracking keeps my customers informed. Highly recommend!",
                tag: 'Inter-State Delivery',
                color: 'from-blue-600 to-blue-800',
              },
              {
                name: 'Tunde Adeyemi',
                role: 'Import/Export Trader, Abuja',
                avatar: 'TA',
                rating: 5,
                text: "The international shipping service handled my cargo from Dubai seamlessly. Customs clearance was smooth and I was updated at every step. Top-class service.",
                tag: 'International Shipping',
                color: 'from-slate-700 to-slate-900',
              },
              {
                name: 'Grace Eze',
                role: 'Pharmaceutical Distributor, Port Harcourt',
                avatar: 'GE',
                rating: 5,
                text: "Fragile goods need special care — Danhausa gets it right. My medical supplies always arrive intact. The fragile package handling is exceptional.",
                tag: 'Fragile Delivery',
                color: 'from-orange-500 to-red-500',
              },
              {
                name: 'Ibrahim Suleiman',
                role: 'Delivery Agent, Kaduna',
                avatar: 'IS',
                rating: 5,
                text: "I joined as a rider six months ago and the experience has been great. The platform is easy to use, payouts are prompt, and the support team is always available.",
                tag: 'Agent Portal',
                color: 'from-blue-600 to-blue-800',
              },
              {
                name: 'Ngozi Okonkwo',
                role: 'HR Manager, Enugu',
                avatar: 'NO',
                rating: 5,
                text: "We use Danhausa for all our official document deliveries across the country. The price calculator is very useful and the bookings are always confirmed quickly.",
                tag: 'Express Shipping',
                color: 'from-slate-700 to-slate-900',
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                <div className="flex items-start gap-3 mb-5">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <span className="text-white text-sm font-bold">{t.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm leading-tight">{t.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-tight">{t.role}</p>
                  </div>
                  <Quote className="h-6 w-6 text-orange-200 flex-shrink-0 mt-0.5" />
                </div>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">{t.text}</p>
                <div className="mt-5 pt-4 border-t border-gray-50">
                  <span className="inline-block bg-orange-50 text-orange-600 text-xs font-semibold px-3 py-1 rounded-full border border-orange-100">
                    {t.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <div className="inline-flex items-center gap-8 bg-white rounded-2xl px-10 py-6 border border-gray-100 shadow-sm">
              {[
                { value: '4.9/5', label: 'Average Rating' },
                { value: '2,400+', label: 'Reviews' },
                { value: '98%', label: 'Would Recommend' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-gradient">{s.value}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COVERAGE MAP ── */}
      <section id="coverage" className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <span className="section-badge bg-white/10 text-orange-300 border border-orange-500/20">Coverage</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              We Deliver <span className="text-gradient">Everywhere</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From Lagos to London, Kano to Kuala Lumpur — our network spans all 36 Nigerian states and key international destinations.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-14">
            {[
              {
                icon: <MapPin className="h-7 w-7 text-white" />,
                label: 'Same-State Delivery',
                color: 'from-orange-500 to-red-500',
                desc: 'Fast, same-day and next-day delivery within any Nigerian state.',
                zones: ['Lagos', 'Kano', 'Abuja', 'Rivers', 'Kaduna', 'Oyo', 'Enugu', 'Delta', '+ All 36 States'],
              },
              {
                icon: <Truck className="h-7 w-7 text-white" />,
                label: 'Inter-State Delivery',
                color: 'from-blue-600 to-blue-800',
                desc: 'Reliable door-to-door delivery connecting all Nigerian states.',
                zones: ['Lagos → Kano', 'Abuja → PH', 'Ibadan → Enugu', 'Kaduna → Lagos', 'Aba → Abuja', 'Benin → Kano', '+ 200+ Routes'],
              },
              {
                icon: <Globe className="h-7 w-7 text-white" />,
                label: 'International Shipping',
                color: 'from-slate-600 to-slate-800',
                desc: 'Import and export to major global destinations with customs support.',
                zones: ['United Kingdom', 'United States', 'United Arab Emirates', 'China', 'India', 'Germany', '+ 50+ Countries'],
              },
            ].map((c, i) => (
              <div key={i} className="glass rounded-2xl p-7 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-5 shadow-lg`}>
                  {c.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{c.label}</h3>
                <p className="text-gray-400 text-sm mb-5 leading-relaxed">{c.desc}</p>
                <ul className="space-y-2">
                  {c.zones.map((z) => (
                    <li key={z} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                      <span className="text-gray-300">{z}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Visual stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '36', label: 'Nigerian States' },
              { value: '50+', label: 'Countries Reached' },
              { value: '200+', label: 'Delivery Routes' },
              { value: '24/7', label: 'Operations' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-5 text-center hover:bg-white/20 transition-all">
                <div className="text-3xl font-bold text-gradient mb-1">{s.value}</div>
                <div className="text-gray-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14">
            <div className="flex justify-center">
              <span className="section-badge bg-blue-100 text-blue-800">FAQ</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Common <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Everything you need to know before your first delivery.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How do I track my package?',
                a: 'Visit our Track Order page and enter your order ID. Order IDs start with BK- (agent bookings), BB- (business bookings), LR- (logistics requests), or BR- (business requests). You\'ll see real-time status updates including pickup, transit, and delivery confirmation.',
              },
              {
                q: 'How long does inter-state delivery take?',
                a: 'Inter-state deliveries typically take 1–3 business days depending on origin and destination. Major routes like Lagos–Abuja and Kano–Lagos are usually completed within 24–48 hours. Express options are available for urgent shipments.',
              },
              {
                q: 'What items cannot be shipped?',
                a: 'We do not ship illegal substances, weapons, counterfeit goods, live animals (without proper documentation), or hazardous materials not declared and cleared for transport. For international shipments, additional customs restrictions may apply.',
              },
              {
                q: 'How is the delivery fee calculated?',
                a: 'Delivery fees are calculated based on distance between pickup and delivery locations, package type (document, parcel, fragile, heavy), and weight. Use our free Shipping Calculator to get an instant quote before booking.',
              },
              {
                q: 'Can I book for someone else to receive the package?',
                a: 'Yes. When booking, provide the recipient\'s name, phone number, and delivery address. Our team will contact the recipient upon arrival. No account is required for the recipient.',
              },
              {
                q: 'Do you handle customs for international shipments?',
                a: 'Yes. For international shipments, our team assists with customs documentation and clearance. You\'ll need to provide an accurate description and declared value of the goods. Our tracking system also shows customs clearance status in real-time.',
              },
              {
                q: 'What is the difference between Agent, Business, and Individual portals?',
                a: 'The Individual Portal is for personal deliveries — anyone can sign up and book. The Business Portal is for companies with regular logistics needs and includes bulk booking and invoicing. The Agent Portal is for our certified delivery couriers who carry out deliveries on our behalf.',
              },
              {
                q: 'Is there insurance for lost or damaged packages?',
                a: 'All shipments carry basic liability coverage. For high-value items, we recommend declaring the full value during booking for extended coverage. Contact our support team for large-value or sensitive shipments that need specific insurance arrangements.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-2xl overflow-hidden hover:border-orange-200 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 group"
                >
                  <span className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-orange-600 transition-colors">
                    {item.q}
                  </span>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${openFaq === i ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-500'}`}>
                    {openFaq === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-48' : 'max-h-0'}`}>
                  <p className="px-6 pb-5 text-gray-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-7 text-center">
            <p className="font-bold text-slate-900 mb-1">Still have questions?</p>
            <p className="text-gray-500 text-sm mb-4">Our team is available Mon–Fri 9AM–6PM to help you.</p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25"
            >
              Contact Support <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 lg:py-28 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="animate-slideInLeft">
              <span className="section-badge bg-orange-100 text-orange-600">Get In Touch</span>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Let's <span className="text-gradient">Talk</span>
              </h2>
              <p className="text-lg text-gray-500 mb-10 leading-relaxed">
                Have questions or ready to start? Our team is here to help you find the perfect solution for your needs.
              </p>

              <div className="space-y-6 mb-10">
                {[
                  { icon: <Phone className="h-5 w-5 text-white" />, bg: 'from-orange-500 to-red-500', label: 'Phone', value: contactInfo.phone },
                  { icon: <Mail className="h-5 w-5 text-white" />, bg: 'from-blue-600 to-blue-800', label: 'Email', value: contactInfo.email },
                  { icon: <MapPin className="h-5 w-5 text-white" />, bg: 'from-red-500 to-pink-600', label: 'Location', value: contactInfo.address },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 group">
                    <div className={`bg-gradient-to-br ${item.bg} p-3.5 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                      <p className="text-slate-800 font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold text-slate-800">Business Hours</span>
                </div>
                <p className="text-gray-500 text-sm">{contactInfo.hours}</p>
              </div>
            </div>

            <div className="animate-slideInRight">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-10">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h3>
                {contactSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-green-100 rounded-full p-4 mb-4">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h4>
                    <p className="text-gray-500 mb-6">Thanks for reaching out. We'll get back to you shortly.</p>
                    <button
                      onClick={() => setContactSuccess(false)}
                      className="text-orange-500 font-semibold hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    {contactError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {contactError}
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all text-slate-800 placeholder-gray-400"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all text-slate-800 placeholder-gray-400"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Service Interest</label>
                      <select
                        value={contactForm.service_interest}
                        onChange={(e) => setContactForm(f => ({ ...f, service_interest: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all text-slate-800 bg-white"
                      >
                        <option>Logistics Services</option>
                        <option>Marketplace</option>
                        <option>Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                      <textarea
                        rows={4}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all text-slate-800 placeholder-gray-400 resize-none"
                        placeholder="Tell us about your needs..."
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={contactSubmitting}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-60 text-white py-4 rounded-xl font-bold text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/25"
                    >
                      {contactSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
