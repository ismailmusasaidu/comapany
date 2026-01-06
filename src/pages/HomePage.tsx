import { Truck, Package, ShoppingCart, Globe, Clock, Shield, Phone, Mail, MapPin, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage() {
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
                Seamless <span className="text-orange-400">Logistics</span> &
                <span className="text-orange-400"> Marketplace</span> Solutions
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed animate-slideInLeft delay-200">
                Experience excellence in delivery services and discover quality products in one unified platform. Danhausa connects your business to endless possibilities.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-slideInLeft delay-300">
                <button className="bg-orange-500 hover:bg-orange-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all transform hover:scale-105 shadow-lg shadow-orange-500/50">
                  Explore Services
                </button>
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
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group border-t-4 border-orange-500 animate-slideUp">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Express Shipping</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Lightning-fast delivery for time-sensitive packages. Your cargo reaches its destination when you need it.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-orange-500 mr-3" />
                  Same-day delivery available
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-orange-500 mr-3" />
                  Real-time tracking
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group border-t-4 border-blue-900 animate-slideUp delay-100">
              <div className="bg-gradient-to-br from-blue-900 to-slate-900 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Freight Services</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Comprehensive freight solutions for businesses of all sizes. Handle bulk shipments with ease.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-blue-900 mr-3" />
                  Air and sea freight
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-blue-900 mr-3" />
                  Custom clearance
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group border-t-4 border-red-500 animate-slideUp delay-200">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">24/7 Support</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Round-the-clock customer service to address your logistics needs anytime, anywhere.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-red-500 mr-3" />
                  Always available
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-red-500 mr-3" />
                  Expert guidance
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group border-t-4 border-orange-500 animate-slideUp delay-300">
              <div className="bg-gradient-to-br from-orange-500 to-blue-900 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Corporate Logistics</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Tailored logistics solutions designed for enterprise clients. Streamline supply chains with dedicated support.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-orange-500 mr-3" />
                  Custom supply chain management
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-orange-500 mr-3" />
                  Dedicated account managers
                </li>
              </ul>
            </div>
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
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl font-bold">NT</span>
                </div>
                <p className="text-slate-900 font-semibold text-sm">Nile Trading</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp delay-100">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl font-bold">SE</span>
                </div>
                <p className="text-slate-900 font-semibold text-sm">Sahara Express</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp delay-200">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl font-bold">AG</span>
                </div>
                <p className="text-slate-900 font-semibold text-sm">Atlas Group</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp delay-300">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-blue-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl font-bold">ZC</span>
                </div>
                <p className="text-slate-900 font-semibold text-sm">Zenith Corp</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp delay-400">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl font-bold">MI</span>
                </div>
                <p className="text-slate-900 font-semibold text-sm">Metro Industries</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp delay-100">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-900 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl font-bold">PE</span>
                </div>
                <p className="text-slate-900 font-semibold text-sm">Pinnacle Enterprises</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp delay-200">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-slate-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl font-bold">HS</span>
                </div>
                <p className="text-slate-900 font-semibold text-sm">Horizon Solutions</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp delay-300">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-red-500 to-blue-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl font-bold">VG</span>
                </div>
                <p className="text-slate-900 font-semibold text-sm">Victory Global</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp delay-400">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl font-bold">EC</span>
                </div>
                <p className="text-slate-900 font-semibold text-sm">Eagle Commerce</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all group border border-gray-200 flex items-center justify-center animate-slideUp">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-900 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl font-bold">SM</span>
                </div>
                <p className="text-slate-900 font-semibold text-sm">Summit Markets</p>
              </div>
            </div>
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

            <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group text-center border border-gray-200 animate-slideUp delay-100">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-900 to-slate-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white text-3xl font-bold">FA</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Fatima Ahmed</h3>
              <p className="text-blue-900 font-semibold mb-3">Head of Operations</p>
              <p className="text-gray-600 text-sm mb-4">
                Expert in streamlining operations and optimizing delivery networks.
              </p>
              <div className="flex justify-center space-x-3">
                <a href="#" className="text-gray-400 hover:text-blue-900 transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group text-center border border-gray-200 animate-slideUp delay-200">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white text-3xl font-bold">IK</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Ibrahim Karim</h3>
              <p className="text-red-500 font-semibold mb-3">Technology Director</p>
              <p className="text-gray-600 text-sm mb-4">
                Technology innovator building scalable marketplace and tracking solutions.
              </p>
              <div className="flex justify-center space-x-3">
                <a href="#" className="text-gray-400 hover:text-red-500 transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all group text-center border border-gray-200 animate-slideUp delay-300">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-blue-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white text-3xl font-bold">ZA</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Zainab Akram</h3>
              <p className="text-orange-600 font-semibold mb-3">Customer Success Lead</p>
              <p className="text-gray-600 text-sm mb-4">
                Passionate about building strong customer relationships and satisfaction.
              </p>
              <div className="flex justify-center space-x-3">
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>
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
                    <p className="text-gray-600">+234 (0) 123 456 7890</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-blue-900 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Email</h3>
                    <p className="text-gray-600">info@danhausa.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-red-500 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Location</h3>
                    <p className="text-gray-600">123 Business District, Nigeria</p>
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
