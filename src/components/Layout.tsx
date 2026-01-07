import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isMarketplacePage = location.pathname === '/marketplace';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white text-gray-900 sticky top-0 z-50 shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-28">
            <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
              <img
                src="/chatgpt_image_jan_6,_2026,_08_02_38_am.png"
                alt="Danhausa Logistics"
                className="h-16 sm:h-20 md:h-24 w-auto"
              />
            </Link>
            <div className="hidden md:flex space-x-8">
              <a href="/#home" className="relative hover:text-orange-500 transition-all duration-300 font-medium group">
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/#logistics" className="relative hover:text-orange-500 transition-all duration-300 font-medium group">
                Logistics
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <Link to="/marketplace" className="relative hover:text-orange-500 transition-all duration-300 font-medium group">
                Marketplace
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <a href="/#gallery" className="relative hover:text-orange-500 transition-all duration-300 font-medium group">
                Gallery
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/#partners" className="relative hover:text-orange-500 transition-all duration-300 font-medium group">
                Partners
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/#team" className="relative hover:text-orange-500 transition-all duration-300 font-medium group">
                Team
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/#contact" className="relative hover:text-orange-500 transition-all duration-300 font-medium group">
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to={isMarketplacePage ? "/#contact" : "/marketplace"}
                className="hidden sm:block bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 text-sm sm:text-base"
                onClick={closeMobileMenu}
              >
                {isMarketplacePage ? "Contact Us" : "Get Started"}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-gray-900 hover:text-orange-500 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-50 border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <a href="/#home" className="block py-2 text-gray-900 hover:text-orange-500 transition-all duration-300 font-medium hover:translate-x-2" onClick={closeMobileMenu}>Home</a>
              <a href="/#logistics" className="block py-2 text-gray-900 hover:text-orange-500 transition-all duration-300 font-medium hover:translate-x-2" onClick={closeMobileMenu}>Logistics</a>
              <Link to="/marketplace" className="block py-2 text-gray-900 hover:text-orange-500 transition-all duration-300 font-medium hover:translate-x-2" onClick={closeMobileMenu}>Marketplace</Link>
              <a href="/#gallery" className="block py-2 text-gray-900 hover:text-orange-500 transition-all duration-300 font-medium hover:translate-x-2" onClick={closeMobileMenu}>Gallery</a>
              <a href="/#partners" className="block py-2 text-gray-900 hover:text-orange-500 transition-all duration-300 font-medium hover:translate-x-2" onClick={closeMobileMenu}>Partners</a>
              <a href="/#team" className="block py-2 text-gray-900 hover:text-orange-500 transition-all duration-300 font-medium hover:translate-x-2" onClick={closeMobileMenu}>Team</a>
              <a href="/#contact" className="block py-2 text-gray-900 hover:text-orange-500 transition-all duration-300 font-medium hover:translate-x-2" onClick={closeMobileMenu}>Contact</a>
              <Link
                to={isMarketplacePage ? "/#contact" : "/marketplace"}
                className="block sm:hidden bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-all text-center mt-2"
                onClick={closeMobileMenu}
              >
                {isMarketplacePage ? "Contact Us" : "Get Started"}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {children}

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img
                  src="/chatgpt_image_jan_6,_2026,_08_02_38_am.png"
                  alt="Danhausa Logistics"
                  className="h-16 w-auto mb-3"
                />
              </div>
              <p className="text-gray-400 text-sm">
                Your trusted partner for logistics and marketplace solutions.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/#logistics" className="hover:text-orange-400 transition-colors">Express Shipping</a></li>
                <li><a href="/#logistics" className="hover:text-orange-400 transition-colors">Freight Services</a></li>
                <li><Link to="/marketplace" className="hover:text-orange-400 transition-colors">Marketplace</Link></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Track Package</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/#about" className="hover:text-orange-400 transition-colors">About Us</a></li>
                <li><a href="/#gallery" className="hover:text-orange-400 transition-colors">Gallery</a></li>
                <li><a href="/#partners" className="hover:text-orange-400 transition-colors">Partners</a></li>
                <li><a href="/#contact" className="hover:text-orange-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 Danhausa Logistics & Marketplace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
