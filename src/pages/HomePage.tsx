import { Truck, Package, ShoppingCart, Globe, Clock, Shield, Phone, Mail, MapPin, Users, TrendingUp, ArrowRight, Star, Zap, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 lg:py-0">
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
            <span className="section-badge bg-orange-100 text-orange-600 mb-4">Logistics Solutions</span>
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
              <span className="section-badge bg-blue-100 text-blue-800 mb-4">Marketplace</span>
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
            <span className="section-badge bg-white/10 text-orange-300 border border-orange-500/20 mb-4">About Us</span>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">{aboutData.title}</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">{aboutData.description}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Shield className="h-8 w-8 text-white" />, title: 'Our Mission', text: aboutData.mission },
              { icon: <TrendingUp className="h-8 w-8 text-white" />, title: 'Our Vision', text: aboutData.vision },
              { icon: <Users className="h-8 w-8 text-white" />, title: 'Our Values', text: 'Our dedicated team is committed to providing exceptional service and support at every step of your journey.' },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`group glass rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 animate-slideUp delay-${i * 100}`}
              >
                <div className="bg-gradient-to-br from-orange-500 to-red-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                <p className="text-gray-400 leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section id="gallery" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-badge bg-orange-100 text-orange-600 mb-4">Our Operations</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Professional <span className="text-gradient">Gallery</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A look at our state-of-the-art facilities, modern fleet, and operations that power your deliveries.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayGallery.map((item, index) => (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 animate-slideUp delay-${(index % 6) * 100}`}
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

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
            <span className="section-badge bg-blue-100 text-blue-800 mb-4">Trusted By Industry Leaders</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Our <span className="text-gradient">Corporate Partners</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Proud to serve leading companies across industries with reliable logistics solutions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-16">
            {displayPartners.map((partner, index) => (
              <div
                key={partner.id}
                className={`group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-orange-100 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 animate-slideUp delay-${(index % 5) * 100}`}
              >
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
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 lg:p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { value: '200+', label: 'Corporate Clients', color: 'text-orange-500' },
                { value: '50K+', label: 'Deliveries Monthly', color: 'text-blue-700' },
                { value: '98%', label: 'Client Retention', color: 'text-red-500' },
              ].map((stat) => (
                <div key={stat.label} className="group">
                  <div className={`text-5xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-transform inline-block`}>{stat.value}</div>
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
            <span className="section-badge bg-orange-100 text-orange-600 mb-4">Our Team</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Meet Our <span className="text-gradient">Expert Team</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Dedicated professionals committed to delivering excellence in logistics and marketplace solutions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayTeam.map((member, index) => (
              <div
                key={member.id}
                className={`group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slideUp delay-${(index % 4) * 100}`}
              >
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
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 lg:py-28 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="animate-slideInLeft">
              <span className="section-badge bg-orange-100 text-orange-600 mb-4">Get In Touch</span>
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
                <form className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all text-slate-800 placeholder-gray-400"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all text-slate-800 placeholder-gray-400"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Service Interest</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all text-slate-800 bg-white">
                      <option>Logistics Services</option>
                      <option>Marketplace</option>
                      <option>Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10 focus:outline-none transition-all text-slate-800 placeholder-gray-400 resize-none"
                      placeholder="Tell us about your needs..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-bold text-base transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/25"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
