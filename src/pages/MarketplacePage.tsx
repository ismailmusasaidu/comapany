import { ShoppingCart, Smartphone, Shield, Star, TrendingUp, Package, Heart, Download, ArrowRight, CheckCircle, Users, Globe, ChevronLeft, ChevronRight, Zap, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

interface FeaturedProduct {
  id: string;
  title: string;
  description: string;
  image_url: string;
  rating: number;
}

interface MarketplacePartner {
  id: string;
  name: string;
  logo_url: string;
}

interface HeroData {
  title: string;
  subtitle: string;
  download_url: string;
}

export default function MarketplacePage() {
  const [partnerIndex, setPartnerIndex] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [partners, setPartners] = useState<MarketplacePartner[]>([]);
  const [heroData, setHeroData] = useState<HeroData>({
    title: 'Shop Smart, Shop Danhausa',
    subtitle: 'Your trusted online marketplace for quality products at unbeatable prices. Download our app today and start shopping!',
    download_url: 'https://play.google.com/store',
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: heroResult } = await supabase.from('marketplace_hero').select('*').limit(1).maybeSingle();
      if (heroResult) setHeroData(heroResult);

      const { data: categoriesData } = await supabase.from('marketplace_categories').select('*').order('order_index', { ascending: true });
      if (categoriesData) setCategories(categoriesData);

      const { data: productsData } = await supabase.from('marketplace_featured_products').select('*').order('order_index', { ascending: true });
      if (productsData) setFeaturedProducts(productsData);

      const { data: partnersData } = await supabase.from('marketplace_partners').select('*').order('order_index', { ascending: true });
      if (partnersData) setPartners(partnersData);
    };
    fetchData();
  }, []);

  const handlePrevPartner = () => {
    setPartnerIndex((prev) => (prev === 0 ? Math.max(0, partners.length - 3) : prev - 1));
  };

  const handleNextPartner = () => {
    setPartnerIndex((prev) => (prev >= partners.length - 3 ? 0 : prev + 1));
  };

  const defaultCategories = [
    { id: '1', title: 'Electronics', description: 'Latest gadgets & devices', image_url: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: '2', title: 'Fashion', description: 'Trendy apparel & accessories', image_url: 'https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: '3', title: 'Home & Living', description: 'Furniture, decor & more', image_url: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { id: '4', title: 'Food & Groceries', description: 'Fresh produce & pantry staples', image_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800' },
  ];

  const defaultProducts = [
    { id: '1', title: 'Premium Smartphone', description: 'Latest flagship device with stunning camera and long battery life.', image_url: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800', rating: 4.8 },
    { id: '2', title: 'Designer Handbag', description: 'Elegant leather handbag crafted with premium materials.', image_url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800', rating: 4.6 },
    { id: '3', title: 'Smart Home Speaker', description: 'Voice-controlled smart speaker with rich, room-filling sound.', image_url: 'https://images.pexels.com/photos/4790253/pexels-photo-4790253.jpeg?auto=compress&cs=tinysrgb&w=800', rating: 4.7 },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : defaultProducts;

  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/6 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl animate-floatSlow"></div>
          <div className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-floatSlow" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-8 transition-colors text-sm font-medium group">
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/40 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-orange-300 font-semibold text-xs tracking-widest uppercase">Danhausa Marketplace</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight animate-slideUp">
              {heroData.title.split(' ').slice(0, 2).join(' ')}{' '}
              <span className="text-gradient">{heroData.title.split(' ').slice(2).join(' ')}</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-slideUp delay-100">
              {heroData.subtitle}
            </p>
            <a
              href={heroData.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30 animate-slideUp delay-200"
            >
              <Download className="h-5 w-5" />
              Download on Play Store
            </a>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mt-16 animate-slideUp delay-300">
            {[
              { icon: <Package className="h-6 w-6 text-white" />, value: '50,000+', label: 'Products' },
              { icon: <Users className="h-6 w-6 text-white" />, value: '10,000+', label: 'Active Users' },
              { icon: <Star className="h-6 w-6 text-white" />, value: '4.8/5', label: 'App Rating' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-6 hover:bg-white/20 transition-all group">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md shadow-orange-500/30">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center">
              <span className="section-badge bg-orange-100 text-orange-600">Browse Categories</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              What We <span className="text-gradient">Offer</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Discover a world of possibilities with our diverse product categories
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayCategories.map((category, index) => (
              <div
                key={category.id}
                className={`group relative overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer animate-slideUp delay-${(index % 4) * 100}`}
              >
                <img
                  src={category.image_url}
                  alt={category.title}
                  className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{category.title}</h3>
                  <p className="text-gray-300 text-sm group-hover:text-orange-300 transition-colors">{category.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-orange-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Shop now <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY OUR APP ── */}
      <section className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-8 animate-slideInLeft">
              <div>
                <span className="section-badge bg-orange-100 text-orange-600">App Features</span>
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mt-4">
                  Why Choose <span className="text-gradient">Our App?</span>
                </h2>
              </div>

              {[
                { icon: <Shield className="h-5 w-5 text-orange-500" />, bg: 'bg-orange-50', title: 'Secure Payments', desc: 'Shop with confidence using our encrypted payment gateway. Your financial data is always protected.' },
                { icon: <TrendingUp className="h-5 w-5 text-blue-700" />, bg: 'bg-blue-50', title: 'Best Deals Daily', desc: 'Exclusive app-only discounts and flash sales. Save more on your favorite products every day.' },
                { icon: <Heart className="h-5 w-5 text-red-500" />, bg: 'bg-red-50', title: 'Wishlist & Favorites', desc: 'Save products for later and get notified when they go on sale.' },
                { icon: <CheckCircle className="h-5 w-5 text-green-600" />, bg: 'bg-green-50', title: 'Easy Returns', desc: 'Not satisfied? Return within 30 days for a full refund, no questions asked.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 group">
                  <div className={`${item.bg} p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative animate-slideInRight">
              <div className="absolute -inset-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-3xl blur-3xl"></div>
              <img
                src="https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Shopping on mobile"
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '50px 50px'}}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="flex justify-center">
              <span className="section-badge bg-white/10 text-orange-300 border border-orange-500/20">Top Picks</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Featured <span className="text-gradient">Products</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Explore our most popular items loved by thousands of customers
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {displayProducts.map((product, index) => (
              <div
                key={product.id}
                className={`group bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slideUp delay-${(index % 3) * 100}`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg">
                    <Heart className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" />
                  </div>
                  <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Tag className="h-3 w-3" /> New
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: Math.floor(product.rating) }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{product.rating}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{product.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">{product.description}</p>
                  <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND PARTNERS ── */}
      {partners.length > 0 && (
        <section className="py-20 lg:py-28 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
            <div className="flex justify-center">
              <span className="section-badge bg-blue-100 text-blue-800">Brand Partners</span>
            </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Trusted by <span className="text-gradient">Leading Brands</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">Partner with the brands that millions love</p>
            </div>

            <div className="relative px-14">
              <div className="flex gap-5 overflow-hidden">
                {partners.length > 0 && (
                  <div className="flex-1 min-w-0 block md:hidden">
                    <div className="bg-white rounded-2xl p-6 shadow-md h-40 flex items-center justify-center overflow-hidden">
                      <img src={partners[partnerIndex]?.logo_url} alt={partners[partnerIndex]?.name} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <p className="text-center mt-4 font-semibold text-slate-900 text-sm">{partners[partnerIndex]?.name}</p>
                  </div>
                )}
                {partners.slice(partnerIndex, partnerIndex + 3).map((partner) => (
                  <div key={partner.id} className="flex-1 min-w-0 hidden md:block">
                    <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow h-48 flex items-center justify-center overflow-hidden">
                      <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <p className="text-center mt-4 font-semibold text-slate-900 text-sm">{partner.name}</p>
                  </div>
                ))}
              </div>

              <button onClick={handlePrevPartner} className="absolute left-0 top-1/3 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-2.5 rounded-xl transition-all hover:scale-110 shadow-md" aria-label="Previous partner">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={handleNextPartner} className="absolute right-0 top-1/3 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-2.5 rounded-xl transition-all hover:scale-110 shadow-md" aria-label="Next partner">
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: partners.length }).map((_, i) => (
                  <button key={i} onClick={() => setPartnerIndex(i)} className={`h-2 rounded-full transition-all ${i === partnerIndex ? 'bg-orange-500 w-8' : 'bg-gray-300 w-2'}`} aria-label={`Go to partner ${i + 1}`} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── DOWNLOAD CTA ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-10 lg:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <div className="bg-white/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-5">Ready to Start Shopping?</h2>
              <p className="text-lg text-orange-50 mb-10 max-w-2xl mx-auto leading-relaxed">
                Download the Danhausa Marketplace app now and enjoy exclusive deals, fast checkout, and seamless shopping experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={heroData.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl"
                >
                  <Download className="h-5 w-5" />
                  Download on Play Store
                </a>
                <Link
                  to="/#contact"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/60 hover:border-white hover:bg-white hover:text-orange-600 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300"
                >
                  Contact Us
                </Link>
              </div>
              <p className="mt-6 text-sm text-orange-100">Available on Android &middot; Coming soon to iOS</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Shield className="h-7 w-7 text-orange-500" />, bg: 'bg-orange-100', title: 'Buyer Protection', desc: '100% secure transactions' },
              { icon: <Package className="h-7 w-7 text-blue-700" />, bg: 'bg-blue-100', title: 'Fast Delivery', desc: 'Quick shipping nationwide' },
              { icon: <Globe className="h-7 w-7 text-red-500" />, bg: 'bg-red-100', title: 'Wide Selection', desc: 'Thousands of products' },
              { icon: <Zap className="h-7 w-7 text-green-600" />, bg: 'bg-green-100', title: 'Quality Guarantee', desc: 'Verified sellers only' },
            ].map((badge) => (
              <div key={badge.title} className="group">
                <div className={`${badge.bg} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  {badge.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{badge.title}</h3>
                <p className="text-gray-500 text-sm">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
