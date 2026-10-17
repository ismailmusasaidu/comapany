import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Truck, Package, Zap, FileCheck, MapPin, Home, Snowflake, HeartPulse, Plane,
  Warehouse, Clock, Users, ArrowRight, CheckCircle, Shield, Globe, Phone,
  Calculator, MessageCircle, ChevronRight, type LucideIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SERVICE_IMAGES, DEFAULT_SERVICE_IMAGE } from '../lib/serviceImages';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface ServiceDetail {
  icon: string;
  features: string[];
  idealFor: string[];
}

const iconComponents: Record<string, LucideIcon> = {
  truck: Truck,
  package: Package,
  clock: Clock,
  users: Users,
  zap: Zap,
  warehouse: Warehouse,
  'file-check': FileCheck,
  'map-pin': MapPin,
  home: Home,
  snowflake: Snowflake,
  'heart-pulse': HeartPulse,
  plane: Plane,
};

const getServiceIcon = (icon: string, cls = 'h-7 w-7') => {
  const Icon = iconComponents[icon] ?? Truck;
  return <Icon className={cls} />;
};

const DETAILS: Record<string, ServiceDetail> = {
  truck: {
    icon: 'truck',
    features: [
      'Full truckload and less-than-truckload options',
      'Nationwide road transport and cross-border routes',
      'Live GPS tracking on every shipment',
      'Fully insured cargo with verified carriers',
    ],
    idealFor: ['Manufacturers', 'Distributors', 'Wholesalers'],
  },
  package: {
    icon: 'package',
    features: [
      'Containerized and break-bulk cargo handling',
      'Port operations and heavy equipment haulage',
      'Consolidation for cost-efficient shipping',
      'Dedicated account manager for large volumes',
    ],
    idealFor: ['Importers', 'Exporters', 'Large-scale enterprises'],
  },
  zap: {
    icon: 'zap',
    features: [
      'Same-day and next-day delivery windows',
      'Priority handling for urgent parcels',
      'Real-time status updates at every step',
      'Dedicated riders for time-critical orders',
    ],
    idealFor: ['E-commerce brands', 'Retailers', 'Individuals'],
  },
  warehouse: {
    icon: 'warehouse',
    features: [
      'Secure, climate-monitored storage facilities',
      'Inventory management with order syncing',
      'Pick, pack and dispatch services',
      'Flexible short and long-term warehousing',
    ],
    idealFor: ['Online shops', 'Retail chains', 'Growing brands'],
  },
  'file-check': {
    icon: 'file-check',
    features: [
      'Complete import and export documentation',
      'Duty and tax calculation and remittance',
      'Licensed customs brokerage and clearance',
      'Compliance support to avoid shipment delays',
    ],
    idealFor: ['Importers', 'Exporters', 'Freight forwarders'],
  },
  'map-pin': {
    icon: 'map-pin',
    features: [
      'Doorstep delivery with flexible time slots',
      'Multiple delivery attempts and safe drop-off',
      'Proof of delivery with recipient confirmation',
      'Easy returns and reverse logistics',
    ],
    idealFor: ['Retailers', 'Restaurants', 'Service providers'],
  },
  home: {
    icon: 'home',
    features: [
      'Home and office moves, locally and interstate',
      'Professional packing and unpacking teams',
      'Protective materials for fragile items',
      'Transit insurance for complete peace of mind',
    ],
    idealFor: ['Families', 'Professionals', 'Businesses'],
  },
  snowflake: {
    icon: 'snowflake',
    features: [
      'Temperature-controlled vehicles and storage',
      'Cold storage for perishable and frozen goods',
      'Pharmaceutical-grade handling standards',
      '24/7 temperature monitoring and alerts',
    ],
    idealFor: ['Food producers', 'Retailers', 'Pharmacies'],
  },
  'heart-pulse': {
    icon: 'heart-pulse',
    features: [
      'Time-sensitive medical supply delivery',
      'Sensitive and secure handling protocols',
      'Regulatory compliance for healthcare items',
      'Prioritized routing for urgent orders',
    ],
    idealFor: ['Hospitals', 'Clinics', 'Pharmacies'],
  },
  plane: {
    icon: 'plane',
    features: [
      'Air and sea freight for global trade',
      'End-to-end freight forwarding support',
      'Trade documentation and compliance',
      'Worldwide agent network for smooth transit',
    ],
    idealFor: ['Traders', 'Manufacturers', 'Global brands'],
  },
};

const FALLBACK_SERVICES: Service[] = [
  { id: 'truck', title: 'Freight Transport', description: 'Reliable road haulage for goods of every size, across Nigeria and beyond.', icon: 'truck' },
  { id: 'warehouse', title: 'Warehouse & Order Fulfillment', description: 'Secure storage and seamless fulfillment that keeps your business moving.', icon: 'warehouse' },
  { id: 'zap', title: 'Express Delivery', description: 'Time-critical courier services delivered with speed and precision.', icon: 'zap' },
  { id: 'package', title: 'Bulk Cargo', description: 'Heavy-duty cargo logistics for large, high-volume shipments.', icon: 'package' },
  { id: 'file-check', title: 'Customs Clearance', description: 'Hassle-free customs brokerage and compliance for cross-border trade.', icon: 'file-check' },
  { id: 'map-pin', title: 'Last-Mile Delivery', description: 'The final, most important mile — delivered right to your customer\'s door.', icon: 'map-pin' },
  { id: 'home', title: 'Relocation Services', description: 'Stress-free moving for homes and offices, anywhere you go.', icon: 'home' },
  { id: 'snowflake', title: 'Cold Chain Logistics', description: 'Temperature-controlled transport for sensitive and perishable goods.', icon: 'snowflake' },
  { id: 'heart-pulse', title: 'Healthcare Logistics', description: 'Specialized delivery for medical and pharmaceutical supplies.', icon: 'heart-pulse' },
  { id: 'plane', title: 'Import & Export', description: 'Global freight and forwarding that connects your business to the world.', icon: 'plane' },
];

export default function LogisticsPage() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .order('order_index', { ascending: true });
      if (data && data.length > 0) setServices(data);
    };
    fetchData();
  }, []);

  const displayServices = services.length > 0 ? services : FALLBACK_SERVICES;

  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '46px 46px' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-orange-300 text-sm font-semibold px-4 py-2 rounded-full mb-6 backdrop-blur">
              <Truck className="h-4 w-4" /> Our Logistics Solutions
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              End-to-End Logistics, <span className="text-gradient">Delivered</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              From road freight to global trade, we move goods safely, on time, and at the right
              cost. Explore our full range of logistics services below.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#services" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-7 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30">
                Explore Services <ArrowRight className="h-5 w-5" />
              </a>
              <Link to="/shipping-calculator" className="inline-flex items-center gap-2 border border-white/30 hover:bg-white hover:text-slate-900 px-7 py-4 rounded-xl font-bold transition-all duration-300">
                <Calculator className="h-5 w-5" /> Get a Price Estimate
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16">
            {[
              { value: '10+', label: 'Logistics Services' },
              { value: '98%', label: 'On-Time Delivery' },
              { value: '24/7', label: 'Live Tracking' },
              { value: '36', label: 'States Covered' },
            ].map(stat => (
              <div key={stat.label} className="backdrop-blur bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES LIST ── */}
      <section id="services" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-badge bg-orange-100 text-orange-600">What We Offer</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mt-4 mb-5">
              A Service for <span className="text-gradient">Every Shipment</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Choose the solution that fits your cargo, timeline and budget — each backed by our
              tracking, insurance and support.
            </p>
          </div>

          <div className="space-y-8">
            {displayServices.map((service, idx) => {
              const detail = DETAILS[service.icon] ?? DETAILS.truck;
              const image = SERVICE_IMAGES[service.icon] ?? DEFAULT_SERVICE_IMAGE;
              return (
                <div
                  key={service.id}
                  id={service.icon}
                  className="scroll-mt-28 grid lg:grid-cols-2 gap-0 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                >
                  <div className={`relative min-h-64 lg:min-h-full ${idx % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <img src={image} alt={service.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                    <div className="absolute bottom-5 left-5 flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-4 py-2 rounded-full text-white text-sm font-semibold">
                      <Shield className="h-4 w-4 text-orange-300" /> Insured &amp; Tracked
                    </div>
                  </div>

                  <div className={`p-8 lg:p-12 ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                        {getServiceIcon(service.icon, 'h-7 w-7 text-white')}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{service.title}</h3>
                        <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Service {String(idx + 1).padStart(2, '0')}</span>
                      </div>
                    </div>

                    <p className="text-gray-500 leading-relaxed mb-6">{service.description}</p>

                    <div className="grid sm:grid-cols-2 gap-3 mb-6">
                      {detail.features.map(feature => (
                        <div key={feature} className="flex items-start gap-2.5">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600 leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-7">
                      {detail.idealFor.map(tag => (
                        <span key={tag} className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">{tag}</span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link to={`/logistics/${service.icon}`} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105">
                        Learn More <ArrowRight className="h-4 w-4" />
                      </Link>
                      <a href="/#contact" className="inline-flex items-center gap-2 border border-gray-200 hover:border-orange-400 hover:text-orange-600 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300">
                        Request a Quote
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="section-badge bg-blue-100 text-blue-800">Why Danhausa</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mt-4 mb-4">
              Built to <span className="text-gradient">Outperform</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Insured Cargo', text: 'Every shipment is covered end-to-end for your peace of mind.' },
              { icon: Globe, title: 'Wide Coverage', text: 'Nationwide reach plus global freight through our partner network.' },
              { icon: Clock, title: 'On-Time Promise', text: 'Punctual delivery backed by real-time tracking at every step.' },
              { icon: Phone, title: 'Dedicated Support', text: 'A real person on your shipment, whenever you need answers.' },
            ].map(item => (
              <div key={item.title} className="group bg-gray-50 hover:bg-white rounded-3xl border border-gray-100 p-8 text-center hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 lg:py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <MessageCircle className="h-14 w-14 text-orange-400 mx-auto mb-6" />
          <h2 className="text-3xl lg:text-4xl font-bold mb-5">Not sure which service fits?</h2>
          <p className="text-gray-300 text-lg mb-9 max-w-2xl mx-auto">
            Tell us what you need to move and our specialists will recommend the best, most
            cost-effective solution — usually within a few hours.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/#contact" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30">
              Talk to a Specialist <ArrowRight className="h-5 w-5" />
            </a>
            <Link to="/track" className="inline-flex items-center gap-2 border border-white/30 hover:bg-white hover:text-slate-900 px-8 py-4 rounded-xl font-bold transition-all duration-300">
              Track an Order <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
