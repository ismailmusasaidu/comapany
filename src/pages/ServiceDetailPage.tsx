import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Truck, ArrowRight, CheckCircle, Shield, Clock, Globe, Phone, ChevronLeft,
  MapPin, Package, Users, Zap, Warehouse, FileCheck, Home, Snowflake,
  HeartPulse, Plane, Calculator, Quote, type LucideIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SERVICE_IMAGES, DEFAULT_SERVICE_IMAGE } from '../lib/serviceImages';
import { SERVICE_CONTENT, DEFAULT_SERVICE_CONTENT } from '../lib/serviceContent';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const iconComponents: Record<string, LucideIcon> = {
  truck: Truck,
  package: Package,
  clock: Truck,
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

const FALLBACK_TITLES: Record<string, string> = {
  truck: 'Freight Transport',
  warehouse: 'Warehouse & Order Fulfillment',
  zap: 'Express Delivery',
  package: 'Bulk Cargo',
  'file-check': 'Customs Clearance',
  'map-pin': 'Last-Mile Delivery',
  home: 'Relocation Services',
  snowflake: 'Cold Chain Logistics',
  'heart-pulse': 'Healthcare Logistics',
  plane: 'Import & Export',
};

export default function ServiceDetailPage() {
  const { icon = '' } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchService = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('icon', icon)
        .maybeSingle();
      if (!cancelled) {
        if (!error && data) setService(data);
        setLoading(false);
      }
    };
    fetchService();
    return () => {
      cancelled = true;
    };
  }, [icon]);

  const content = SERVICE_CONTENT[icon] ?? DEFAULT_SERVICE_CONTENT;
  const image = SERVICE_IMAGES[icon];

  if (!image) return <Navigate to="/logistics" replace />;

  const Icon = iconComponents[icon] ?? Truck;
  const title = service?.title ?? FALLBACK_TITLES[icon] ?? 'Logistics Service';
  const description = service?.description ?? content.overview;

  const scrollToQuote = () => {
    document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' });
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img src={image} alt={title} className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white text-sm font-semibold mb-8 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Services
          </button>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/40 mb-6">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight max-w-3xl mb-5">{title}</h1>
          <p className="text-lg text-gray-300 max-w-2xl leading-relaxed mb-8">{content.tagline}</p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={scrollToQuote}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-7 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30"
            >
              Request a Quote <ArrowRight className="h-5 w-5" />
            </button>
            <Link to="/shipping-calculator" className="inline-flex items-center gap-2 border border-white/30 hover:bg-white hover:text-slate-900 px-7 py-4 rounded-xl font-bold transition-all duration-300">
              <Calculator className="h-5 w-5" /> Estimate Cost
            </Link>
          </div>
        </div>
      </section>

      {/* ── OVERVIEW + FEATURES ── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <span className="section-badge bg-orange-100 text-orange-600 mb-4">Overview</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
              What <span className="text-gradient">We Deliver</span>
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg mb-8">{content.overview}</p>

            <div className="grid sm:grid-cols-2 gap-4">
              {content.features.map(feature => (
                <div key={feature} className="flex items-start gap-3 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-900 rounded-3xl p-8 text-white sticky top-28">
              <h3 className="text-xl font-bold mb-6">Perfect For</h3>
              <div className="space-y-3 mb-8">
                {content.idealFor.map(group => (
                  <div key={group} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    <span className="text-sm font-medium">{group}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-400" />
                  <span className="text-sm">Fully insured cargo</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-400" />
                  <span className="text-sm">On-time guarantee</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-400" />
                  <span className="text-sm">Real-time tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="section-badge bg-blue-100 text-blue-800">How It Works</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-4">
              A Simple, <span className="text-gradient">Transparent Process</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.process.map((step, idx) => (
              <div key={step} className="relative bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-lg mb-5 shadow-lg shadow-orange-500/30">
                  {idx + 1}
                </div>
                <p className="text-gray-600 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="section-badge bg-green-100 text-green-700">Common Questions</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mt-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
          </div>
          <div className="space-y-4">
            {content.faqs.map(faq => (
              <details key={faq.q} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none font-semibold text-slate-900 hover:text-orange-600 transition-colors">
                  {faq.q}
                  <span className="text-orange-500 group-open:rotate-45 transition-transform duration-300 text-xl leading-none">+</span>
                </summary>
                <p className="px-6 pb-6 text-gray-500 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE CTA ── */}
      <section id="quote" className="py-20 lg:py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <Quote className="h-12 w-12 text-orange-400 mx-auto mb-6" />
          <h2 className="text-3xl lg:text-4xl font-bold mb-5">Ready to use {title}?</h2>
          <p className="text-gray-300 text-lg mb-9 max-w-2xl mx-auto">
            {description}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/#contact" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30">
              <Phone className="h-5 w-5" /> Get a Free Quote
            </a>
            <Link to="/shipping-calculator" className="inline-flex items-center gap-2 border border-white/30 hover:bg-white hover:text-slate-900 px-8 py-4 rounded-xl font-bold transition-all duration-300">
              <Calculator className="h-5 w-5" /> Calculate Cost
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
