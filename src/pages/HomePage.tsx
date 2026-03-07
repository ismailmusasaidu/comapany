import { Truck, Package, ShoppingCart, Globe, Clock, Shield, Phone, Mail, MapPin, CheckCircle2, Users, TrendingUp } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
      const { data: hero } = await supabase
        .from('hero_section')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (hero) {
        setHeroData(hero);
      }

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('order_index', { ascending: true });

      if (servicesData) {
        setServices(servicesData);
      }

      const { data: teamData } = await supabase
        .from('team_members')
        .select('*')
        .order('order_index', { ascending: true });

      if (teamData) {
        setTeamMembers(teamData);
      }

      const { data: partnersData } = await supabase
        .from('partners')
        .select('*')
        .order('order_index', { ascending: true });

      if (partnersData) {
        setPartners(partnersData);
      }

      const { data: galleryData } = await supabase
        .from('gallery_items')
        .select('*')
        .order('order_index', { ascending: true });

      if (galleryData) {
        setGalleryItems(galleryData);
      }

      const { data: contact } = await supabase
        .from('contact_info')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (contact) {
        setContactInfo(contact);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <section id="home" className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-16 sm:py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="inline-block bg-orange-500/20 border border-orange-500 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6 animate-slideInLeft">
                <span className="text-orange-400 font-semibold text-xs sm:text-sm">Your Trusted Partner</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight animate-slideInLeft delay-100">
                {heroData.title}
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed animate-slideInLeft delay-200">
                {heroData.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-slideInLeft delay-300">
                <a href={heroData.cta_button_link} className="bg-orange-500 hover:bg-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all transform hover:scale-105 shadow-lg shadow-orange-500/50 text-center">
                  {heroData.cta_button_text}
                </a>
                <a href="#contact" className="bg-transparent border-2 border-white hover:bg-white hover:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all text-center">
                  Contact Us
                </a>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4 animate-slideInRight delay-200">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all animate-slideUp delay-300">
                  <Truck className="h-12 w-12 text-orange-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
                  <p className="text-gray-300">Swift and reliable logistics</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all animate-slideUp delay-400">
                  <ShoppingCart className="h-12 w-12 text-orange-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Marketplace</h3>
                  <p className="text-gray-300">Quality products at your fingertips</p>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all animate-slideUp delay-400">
                  <Shield className="h-12 w-12 text-orange-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Secure</h3>
                  <p className="text-gray-300">Your trust is our priority</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all animate-slideUp delay-500">
                  <Globe className="h-12 w-12 text-orange-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Global Reach</h3>
                  <p className="text-gray-300">Connect worldwide</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="logistics" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-block bg-orange-100 text-orange-600 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-4 font-semibold text-xs sm:text-sm">
              LOGISTICS SOLUTIONS
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
              Reliable Delivery <span className="text-orange-500">Everywhere</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              From local deliveries to international freight, we handle your logistics with precision and care.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {services.length > 0 ? (
              services.map((service, index) => (
                <div key={service.id} className={`bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group border-t-4 border-orange-500 animate-slideUp delay-${index * 100}`}>
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {service.icon === 'truck' && <Truck className="h-8 w-8 text-white" />}
                    {service.icon === 'package' && <Package className="h-8 w-8 text-white" />}
                    {service.icon === 'clock' && <Clock className="h-8 w-8 text-white" />}
                    {service.icon === 'users' && <Users className="h-8 w-8 text-white" />}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group border-t-4 border-orange-500 animate-slideUp">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Truck className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Express Shipping</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Lightning-fast delivery for time-sensitive packages.
                  </p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group border-t-4 border-blue-900 animate-slideUp delay-100">
                  <div className="bg-gradient-to-br from-blue-900 to-slate-900 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">Freight Services</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Comprehensive freight solutions for businesses of all sizes.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section id="marketplace" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="animate-slideInLeft">
              <div className="inline-block bg-blue-100 text-blue-900 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-4 font-semibold text-xs sm:text-sm animate-slideUp">
                MARKETPLACE
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 animate-slideUp delay-100">
                Your One-Stop <span className="text-orange-500">Shopping</span> Destination
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed animate-slideUp delay-200">
                Discover a curated selection of quality products from trusted vendors. Shop with confidence knowing every transaction is secure and every product is verified.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Wide Product Range</h3>
                    <p className="text-gray-600">From electronics to fashion, find everything you need in one place.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Secure Transactions</h3>
                    <p className="text-gray-600">Shop safely with our encrypted payment gateway and buyer protection.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Best Deals</h3>
                    <p className="text-gray-600">Competitive prices and exclusive offers for our valued customers.</p>
                  </div>
                </div>
              </div>
              <Link to="/marketplace" className="inline-block mt-8 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
                Browse Marketplace
              </Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl opacity-20 blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-slate-900 to-blue-900 p-8 rounded-3xl shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                    <Users className="h-8 w-8 text-orange-400 mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">10K+</div>
                    <div className="text-gray-300 text-sm">Active Users</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                    <Package className="h-8 w-8 text-orange-400 mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">50K+</div>
                    <div className="text-gray-300 text-sm">Products</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                    <TrendingUp className="h-8 w-8 text-orange-400 mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">99%</div>
                    <div className="text-gray-300 text-sm">Satisfaction</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                    <Globe className="h-8 w-8 text-orange-400 mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">24/7</div>
                    <div className="text-gray-300 text-sm">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">
              Why Choose <span className="text-orange-400">Danhausa</span>?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              We combine decades of logistics expertise with modern marketplace technology to deliver unparalleled service.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center animate-slideUp">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Trusted & Secure</h3>
              <p className="text-gray-300 leading-relaxed">
                Your security is our priority. We use cutting-edge technology to protect your data and transactions.
              </p>
            </div>

            <div className="text-center animate-slideUp delay-100">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Always On Time</h3>
              <p className="text-gray-300 leading-relaxed">
                Punctuality is our promise. We pride ourselves on meeting deadlines and exceeding expectations.
              </p>
            </div>

            <div className="text-center animate-slideUp delay-200">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Customer First</h3>
              <p className="text-gray-300 leading-relaxed">
                Our dedicated team is committed to providing exceptional service and support at every step.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-block bg-orange-100 text-orange-600 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-4 font-semibold text-xs sm:text-sm">
              OUR OPERATIONS
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
              Professional <span className="text-orange-500">Gallery</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Take a look at our state-of-the-art facilities, modern fleet, and operations that power your deliveries.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {galleryItems.length > 0 ? (
              galleryItems.map((item, index) => (
                <div key={item.id} className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all animate-slideUp delay-${index * 100}`}>
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{item.title}</h3>
                      <p className="text-gray-300 text-sm">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all animate-slideUp">
                  <img
                    src="https://images.pexels.com/photos/4393426/pexels-photo-4393426.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Modern Warehouse"
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Modern Warehouse</h3>
                      <p className="text-gray-300 text-sm">State-of-the-art storage facilities</p>
                    </div>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all animate-slideUp delay-100">
                  <img
                    src="https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Delivery Fleet"
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Delivery Fleet</h3>
                      <p className="text-gray-300 text-sm">Modern vehicles for fast delivery</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-10 sm:mt-16 bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-red-500 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Visit Our Facilities</h3>
              <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Interested in seeing our operations firsthand? Schedule a tour of our facilities and experience our commitment to excellence.
              </p>
              <a href="#contact" className="inline-block bg-orange-500 hover:bg-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all transform hover:scale-105 shadow-lg">
                Schedule a Tour
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="partners" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-block bg-blue-100 text-blue-900 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-4 font-semibold text-xs sm:text-sm">
              TRUSTED BY INDUSTRY LEADERS
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
              Our <span className="text-orange-500">Corporate Partners</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Proud to serve leading companies across industries with reliable logistics and marketplace solutions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 mb-12">
            {partners.length > 0 ? (
              partners.map((partner, index) => (
                <div key={partner.id} className={`bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp delay-${index * 100}`}>
                  <div className="text-center">
                    {partner.logo_url ? (
                      <img src={partner.logo_url} alt={partner.name} className="w-20 h-20 mx-auto mb-4 object-contain group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-white text-2xl font-bold">{partner.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <p className="text-slate-900 font-semibold text-sm">{partner.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-white text-2xl font-bold">NT</span>
                    </div>
                    <p className="text-slate-900 font-semibold text-sm">Nile Trading</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 border border-gray-200">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-orange-500 mb-2">200+</div>
                <p className="text-gray-600 font-semibold">Corporate Clients</p>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-blue-900 mb-2">50K+</div>
                <p className="text-gray-600 font-semibold">Deliveries Monthly</p>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-red-500 mb-2">98%</div>
                <p className="text-gray-600 font-semibold">Client Retention</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="team" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-block bg-orange-100 text-orange-600 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-4 font-semibold text-xs sm:text-sm">
              OUR TEAM
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
              Meet Our <span className="text-orange-500">Expert Team</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Dedicated professionals committed to delivering excellence in logistics and marketplace solutions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {teamMembers.length > 0 ? (
              teamMembers.map((member, index) => (
                <div key={member.id} className={`bg-gradient-to-br from-slate-50 to-gray-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group text-center border border-gray-200 animate-slideUp delay-${index * 100}`}>
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.name} className="w-24 h-24 mx-auto mb-6 rounded-full object-cover group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-white text-3xl font-bold">{member.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h3>
                  <p className="text-orange-500 font-semibold mb-3">{member.position}</p>
                  <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                  <div className="flex justify-center space-x-3">
                    <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                      <Globe className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group text-center border border-gray-200 animate-slideUp">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-white text-3xl font-bold">AH</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Aminu Hassan</h3>
                  <p className="text-orange-500 font-semibold mb-3">Chief Executive Officer</p>
                  <p className="text-gray-600 text-sm mb-4">
                    Visionary leader with 15+ years in logistics and supply chain management.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                      <Globe className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section id="contact" className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="animate-slideInLeft">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 animate-slideUp">
                Get In <span className="text-orange-500">Touch</span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 animate-slideUp delay-100">
                Have questions or ready to start? Our team is here to help you find the perfect solution for your needs.
              </p>

              <div className="space-y-6 animate-slideUp delay-200">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Phone</h3>
                    <p className="text-gray-600">{contactInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-blue-900 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Email</h3>
                    <p className="text-gray-600">{contactInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-red-500 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Location</h3>
                    <p className="text-gray-600">{contactInfo.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl animate-slideInRight">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Service Interest</label>
                  <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors">
                    <option>Logistics Services</option>
                    <option>Marketplace</option>
                    <option>Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Tell us about your needs..."
                  ></textarea>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
