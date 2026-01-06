import { ShoppingCart, Smartphone, Shield, Star, TrendingUp, Package, Heart, Download, ArrowRight, CheckCircle2, Users, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const partners = [
  { id: 1, name: 'TechPro', logo: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: 2, name: 'StyleHub', logo: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: 3, name: 'HomeNest', logo: 'https://images.pexels.com/photos/1799500/pexels-photo-1799500.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: 4, name: 'BeautyGlow', logo: 'https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: 5, name: 'FitnessMax', logo: 'https://images.pexels.com/photos/1092444/pexels-photo-1092444.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: 6, name: 'EcoLife', logo: 'https://images.pexels.com/photos/1308882/pexels-photo-1308882.jpeg?auto=compress&cs=tinysrgb&w=600' },
];

export default function MarketplacePage() {
  const [partnerIndex, setPartnerIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  const handlePrevPartner = () => {
    setPartnerIndex((prev) => (prev === 0 ? Math.max(0, partners.length - itemsPerPage) : prev - 1));
  };

  const handleNextPartner = () => {
    setPartnerIndex((prev) => (prev >= partners.length - itemsPerPage ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-12 sm:py-16 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/" className="inline-flex items-center text-orange-400 hover:text-orange-300 mb-6 sm:mb-8 transition-colors text-sm sm:text-base">
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2 rotate-180" />
            Back to Home
          </Link>
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-block bg-orange-500/20 border border-orange-500 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6">
              <span className="text-orange-400 font-semibold text-xs sm:text-sm">DANHAUSA MARKETPLACE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-4">
              Shop Smart, Shop <span className="text-orange-400">Danhausa</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
              Your trusted online marketplace for quality products at unbeatable prices. Download our app today and start shopping!
            </p>
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all transform hover:scale-105 shadow-lg shadow-orange-500/50"
            >
              <Download className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              Download on Play Store
            </a>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-10 sm:mt-16">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Package className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">50,000+ Products</h3>
              <p className="text-gray-300">Extensive catalog across all categories</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">10,000+ Users</h3>
              <p className="text-gray-300">Trusted by thousands daily</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl hover:bg-white/20 transition-all">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <Star className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">4.8/5 Rating</h3>
              <p className="text-gray-300">Highly rated on Play Store</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
              What We <span className="text-orange-500">Offer</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Discover a world of possibilities with our diverse product categories
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-10 sm:mb-16">
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <img
                src="https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Electronics"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Electronics</h3>
                  <p className="text-gray-300 text-sm">Latest gadgets & devices</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <img
                src="https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Fashion"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Fashion</h3>
                  <p className="text-gray-300 text-sm">Trendy clothing & accessories</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <img
                src="https://images.pexels.com/photos/1599791/pexels-photo-1599791.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Home & Living"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Home & Living</h3>
                  <p className="text-gray-300 text-sm">Quality furniture & decor</p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all">
              <img
                src="https://images.pexels.com/photos/2292953/pexels-photo-2292953.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Beauty & Health"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Beauty & Health</h3>
                  <p className="text-gray-300 text-sm">Premium care products</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
                Why Choose <span className="text-orange-500">Our App?</span>
              </h2>

              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 p-3 rounded-lg flex-shrink-0">
                  <Shield className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Secure Payments</h3>
                  <p className="text-gray-600">Shop with confidence using our encrypted payment gateway. Your financial data is always protected.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-blue-900" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Best Deals Daily</h3>
                  <p className="text-gray-600">Exclusive app-only discounts and flash sales. Save more on your favorite products.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-red-100 p-3 rounded-lg flex-shrink-0">
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Wishlist & Favorites</h3>
                  <p className="text-gray-600">Save products for later and get notified when they go on sale.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-lg flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Easy Returns</h3>
                  <p className="text-gray-600">Not satisfied? Return within 30 days for a full refund, no questions asked.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl opacity-20 blur-2xl"></div>
              <img
                src="https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Shopping on mobile"
                className="relative rounded-3xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 px-4">
              Featured <span className="text-orange-400">Products</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Explore our most popular items loved by thousands of customers
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
              <div className="relative overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Wireless Headphones"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  20% OFF
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-2">(245 reviews)</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Premium Wireless Headphones</h3>
                <p className="text-gray-600 mb-4">High-quality sound with noise cancellation</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-orange-500">$79.99</span>
                    <span className="text-sm text-gray-500 line-through ml-2">$99.99</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
              <div className="relative overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/1805053/pexels-photo-1805053.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Smart Watch"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  NEW
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-gray-300" />
                  <span className="text-sm text-gray-600 ml-2">(128 reviews)</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Fitness Smart Watch</h3>
                <p className="text-gray-600 mb-4">Track your health and fitness goals</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-orange-500">$149.99</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group">
              <div className="relative overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Camera"
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-blue-900 text-white px-3 py-1 rounded-full text-sm font-bold">
                  TRENDING
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-2">(532 reviews)</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Professional DSLR Camera</h3>
                <p className="text-gray-600 mb-4">Capture stunning photos and videos</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-orange-500">$899.99</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
              Trusted by <span className="text-orange-500">Leading Brands</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Partner with the brands that millions love
            </p>
          </div>

          <div className="relative px-12 sm:px-16">
            <div className="flex gap-4 sm:gap-6 overflow-hidden">
              <div className="flex-1 min-w-0 block md:hidden">
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow h-40 sm:h-48 flex items-center justify-center overflow-hidden">
                  <img
                    src={partners[partnerIndex].logo}
                    alt={partners[partnerIndex].name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <p className="text-center mt-4 font-semibold text-slate-900">{partners[partnerIndex].name}</p>
              </div>
              {partners.slice(partnerIndex, partnerIndex + 3).map((partner) => (
                <div key={partner.id} className="flex-1 min-w-0 hidden md:block">
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow h-48 flex items-center justify-center overflow-hidden">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <p className="text-center mt-4 font-semibold text-slate-900">{partner.name}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handlePrevPartner}
              className="absolute left-0 top-1/3 sm:top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-2 sm:p-3 rounded-full transition-all transform hover:scale-110 z-10 shadow-lg"
              aria-label="Previous partner"
            >
              <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={handleNextPartner}
              className="absolute right-0 top-1/3 sm:top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white p-2 sm:p-3 rounded-full transition-all transform hover:scale-110 z-10 shadow-lg"
              aria-label="Next partner"
            >
              <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
            </button>

            <div className="flex justify-center gap-2 mt-6 sm:mt-8">
              {Array.from({ length: partners.length }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPartnerIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === partnerIndex ? 'bg-orange-500 w-8' : 'bg-gray-300 w-2'
                  }`}
                  aria-label={`Go to partner ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10">
              <Smartphone className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                Ready to Start Shopping?
              </h2>
              <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90">
                Download the Danhausa Marketplace app now and enjoy exclusive deals, fast checkout, and seamless shopping experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-orange-500 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  <Download className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                  Download on Play Store
                </a>
                <Link
                  to="/#contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-transparent border-2 border-white hover:bg-white hover:text-orange-500 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all"
                >
                  Contact Us
                </Link>
              </div>
              <p className="mt-4 sm:mt-6 text-xs sm:text-sm opacity-75">
                Available on Android - Coming soon to iOS
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Buyer Protection</h3>
              <p className="text-gray-600 text-sm">100% secure transactions</p>
            </div>
            <div>
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-blue-900" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-sm">Quick shipping nationwide</p>
            </div>
            <div>
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Wide Selection</h3>
              <p className="text-gray-600 text-sm">Thousands of products</p>
            </div>
            <div>
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Quality Guarantee</h3>
              <p className="text-gray-600 text-sm">Verified sellers only</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
