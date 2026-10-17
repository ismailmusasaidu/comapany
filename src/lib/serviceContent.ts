export interface ServiceContent {
  icon: string;
  tagline: string;
  overview: string;
  features: string[];
  process: string[];
  idealFor: string[];
  faqs: { q: string; a: string }[];
}

export const SERVICE_CONTENT: Record<string, ServiceContent> = {
  truck: {
    icon: 'truck',
    tagline: 'Reliable road haulage across Nigeria and beyond',
    overview:
      'Move goods of every size with our nationwide road transport network. Whether you need a full truckload, shared space, or cross-border routes, we match the right vehicle and verified carrier to your cargo — then track it live from pickup to delivery. Every shipment is fully insured, so your goods are protected at every kilometre.',
    features: [
      'Full truckload and less-than-truckload options',
      'Nationwide road transport and cross-border routes',
      'Live GPS tracking on every shipment',
      'Fully insured cargo with verified carriers',
    ],
    process: [
      'Request a quote with cargo and route details',
      'We match the right vehicle and schedule pickup',
      'Track your freight in real time during transit',
      'Receive proof of safe, on-time delivery',
    ],
    idealFor: ['Manufacturers', 'Distributors', 'Wholesalers'],
    faqs: [
      { q: 'What counts as a full truckload?', a: 'Generally any shipment large enough to fill or nearly fill an entire truck. For smaller cargo we offer shared space so you only pay for the portion you use.' },
      { q: 'Can you handle cross-border routes?', a: 'Yes. We run established routes to neighbouring countries with the required customs documentation handled for you.' },
    ],
  },
  warehouse: {
    icon: 'warehouse',
    tagline: 'Secure storage and seamless order fulfillment',
    overview:
      'Keep your inventory safe in our climate-monitored facilities while we handle the busy work. Our teams pick, pack and dispatch orders as they come in, syncing your stock levels so you always know what is available. From short-term overflow space to long-term warehousing, scale storage up or down as your business grows.',
    features: [
      'Secure, climate-monitored storage facilities',
      'Inventory management with order syncing',
      'Pick, pack and dispatch services',
      'Flexible short and long-term warehousing',
    ],
    process: [
      'Send your inventory to our warehouse',
      'We catalogue and store it safely',
      'Orders are picked, packed and dispatched',
      'Track stock levels in real time',
    ],
    idealFor: ['Online shops', 'Retail chains', 'Growing brands'],
    faqs: [
      { q: 'Can I view my stock levels in real time?', a: 'Yes. Our fulfillment system keeps your counts in sync, showing exactly how much stock is on hand and when reorders are needed.' },
      { q: 'Is storage charged monthly?', a: 'We offer both monthly plans and flexible short-term storage, so you only pay for the space and duration you actually use.' },
    ],
  },
  zap: {
    icon: 'zap',
    tagline: 'Time-critical delivery with speed and precision',
    overview:
      'When every minute counts, our express delivery service gets your package there fast. With same-day and next-day windows, priority handling and dedicated riders, urgent parcels and documents reach their destination quickly — with live updates so you always know exactly where they are.',
    features: [
      'Same-day and next-day delivery windows',
      'Priority handling for urgent parcels',
      'Real-time status updates at every step',
      'Dedicated riders for time-critical orders',
    ],
    process: [
      'Book express delivery in minutes',
      'A dedicated rider is assigned immediately',
      'Track live progress to the destination',
      'Recipient confirms with proof of delivery',
    ],
    idealFor: ['E-commerce brands', 'Retailers', 'Individuals'],
    faqs: [
      { q: 'What is the cutoff for same-day delivery?', a: 'Book before midday and your parcel is dispatched the same day; orders after the cutoff go out with the next available rider.' },
      { q: 'Can I send urgent documents?', a: 'Absolutely. Our express service is perfect for documents, contracts and small urgent parcels.' },
    ],
  },
  package: {
    icon: 'package',
    tagline: 'Heavy-duty cargo logistics for high-volume shipments',
    overview:
      'For large, heavy or high-volume freight, our bulk cargo service delivers capacity and control. We handle containerized cargo, break-bulk and heavy equipment, with port operations, consolidation and a dedicated account manager who keeps your shipments on schedule and on budget.',
    features: [
      'Containerized and break-bulk cargo handling',
      'Port operations and heavy equipment haulage',
      'Consolidation for cost-efficient shipping',
      'Dedicated account manager for large volumes',
    ],
    process: [
      'Share your cargo specs and destination',
      'We plan the most cost-efficient routing',
      'Cargo is consolidated, handled and moved',
      'Dedicated manager tracks it end to end',
    ],
    idealFor: ['Importers', 'Exporters', 'Large-scale enterprises'],
    faqs: [
      { q: 'What is cargo consolidation?', a: 'We combine smaller shipments heading the same way into one load, significantly reducing transport costs while keeping your goods secure.' },
      { q: 'Can you move heavy machinery?', a: 'Yes. Our heavy haulage partners are equipped for oversized and overweight cargo, including permits and special handling.' },
    ],
  },
  'file-check': {
    icon: 'file-check',
    tagline: 'Hassle-free customs brokerage and compliance',
    overview:
      'Avoid delays and unexpected charges at the border. Our licensed brokers manage complete import and export documentation, calculate and remit duties and taxes, and ensure full compliance — so your shipment clears quickly and you stay focused on your business.',
    features: [
      'Complete import and export documentation',
      'Duty and tax calculation and remittance',
      'Licensed customs brokerage and clearance',
      'Compliance support to avoid shipment delays',
    ],
    process: [
      'Provide your shipment and trade details',
      'We prepare complete documentation',
      'Duties and taxes are calculated and paid',
      'Your cargo clears customs without delays',
    ],
    idealFor: ['Importers', 'Exporters', 'Freight forwarders'],
    faqs: [
      { q: 'Which documents do I need?', a: 'We usually need the commercial invoice, packing list and bill of lading or airway bill. Our team guides you through anything missing.' },
      { q: 'Can you pay duties on my behalf?', a: 'Yes. We calculate the applicable duties and taxes, then remit them for you and add the exact figure to your invoice.' },
    ],
  },
  'map-pin': {
    icon: 'map-pin',
    tagline: 'The final mile, delivered right to the door',
    overview:
      'The last mile is where customer experience is won or lost. Our last-mile delivery brings orders to your customers with flexible time slots, safe drop-offs and clear proof of delivery — plus easy returns so the whole experience stays smooth for you and your buyers.',
    features: [
      'Doorstep delivery with flexible time slots',
      'Multiple delivery attempts and safe drop-off',
      'Proof of delivery with recipient confirmation',
      'Easy returns and reverse logistics',
    ],
    process: [
      'Choose a delivery window',
      'We schedule the route for maximum efficiency',
      'Recipient confirms delivery in real time',
      'Returns and exchanges are handled easily',
    ],
    idealFor: ['Retailers', 'Restaurants', 'Service providers'],
    faqs: [
      { q: 'What happens if the recipient is away?', a: 'We attempt delivery multiple times and can leave the package at a safe, agreed location, keeping the recipient informed throughout.' },
      { q: 'Do you offer returns pickup?', a: 'Yes. We can collect returns from your customers and bring them back to you as part of the same flow.' },
    ],
  },
  home: {
    icon: 'home',
    tagline: 'Stress-free moving for homes and offices',
    overview:
      'Moving should be exciting, not exhausting. Our relocation teams pack, transport and unpack your belongings with care — using protective materials and covered vehicles — for local and interstate moves alike. Every move is insured, so you can settle in with total peace of mind.',
    features: [
      'Home and office moves, locally and interstate',
      'Professional packing and unpacking teams',
      'Protective materials for fragile items',
      'Transit insurance for complete peace of mind',
    ],
    process: [
      'We survey your space and itemise the move',
      'Our team packs everything safely and labels it',
      'Belongings are transported in covered vehicles',
      'We unload and unpack at your new location',
    ],
    idealFor: ['Families', 'Professionals', 'Businesses'],
    faqs: [
      { q: 'Do you provide packing materials?', a: 'Yes. Boxes, bubble wrap and protective covers are included, and fragile items get extra care and padding.' },
      { q: 'Are interstate moves covered?', a: 'We handle moves between states, with insurance coverage and tracking throughout the journey.' },
    ],
  },
  snowflake: {
    icon: 'snowflake',
    tagline: 'Temperature-controlled transport for sensitive goods',
    overview:
      'Perishable and temperature-sensitive products demand precision. Our cold chain service uses refrigerated vehicles and storage with round-the-clock temperature monitoring, so food, flowers and other sensitive cargo stay within the exact range they need from origin to destination.',
    features: [
      'Temperature-controlled vehicles and storage',
      'Cold storage for perishable and frozen goods',
      'Pharmaceutical-grade handling standards',
      '24/7 temperature monitoring and alerts',
    ],
    process: [
      'Specify your required temperature range',
      'We assign matching refrigerated transport',
      'Temperature is monitored continuously in transit',
      'Goods arrive in perfect, compliant condition',
    ],
    idealFor: ['Food producers', 'Retailers', 'Pharmacies'],
    faqs: [
      { q: 'What temperature ranges can you maintain?', a: 'We support chilled, frozen and ambient-controlled ranges, and monitor conditions continuously with instant alerts if anything drifts.' },
      { q: 'Do you provide cold storage too?', a: 'Yes. We offer refrigerated warehousing for short and long-term storage alongside our cold transport.' },
    ],
  },
  'heart-pulse': {
    icon: 'heart-pulse',
    tagline: 'Specialized delivery for medical and pharmaceutical supplies',
    overview:
      'Healthcare logistics demands speed, care and compliance. We deliver medical and pharmaceutical supplies with sensitive handling protocols and prioritized routing, meeting regulatory standards so clinics, hospitals and pharmacies receive exactly what they need — when they need it.',
    features: [
      'Time-sensitive medical supply delivery',
      'Sensitive and secure handling protocols',
      'Regulatory compliance for healthcare items',
      'Prioritized routing for urgent orders',
    ],
    process: [
      'Tell us the delivery priority and requirements',
      'We assign a compliant, secure route',
      'Shipment is tracked with priority handling',
      'Supplies are delivered with full documentation',
    ],
    idealFor: ['Hospitals', 'Clinics', 'Pharmacies'],
    faqs: [
      { q: 'Do you handle controlled or sensitive items?', a: 'Yes, under strict handling and documentation protocols in line with healthcare regulations.' },
      { q: 'Can you support urgent same-day needs?', a: 'Urgent medical orders are prioritised and routed for the fastest safe delivery possible.' },
    ],
  },
  plane: {
    icon: 'plane',
    tagline: 'Global freight and forwarding for worldwide trade',
    overview:
      'Take your business beyond borders. Our import and export service combines air and sea freight with end-to-end forwarding — trade documentation, compliance and a worldwide agent network all managed for you, so global trade is as simple as local delivery.',
    features: [
      'Air and sea freight for global trade',
      'End-to-end freight forwarding support',
      'Trade documentation and compliance',
      'Worldwide agent network for smooth transit',
    ],
    process: [
      'Share your route, cargo and deadline',
      'We recommend air or sea based on cost and speed',
      'We manage docs, customs and carrier booking',
      'Track your shipment to its final destination',
    ],
    idealFor: ['Traders', 'Manufacturers', 'Global brands'],
    faqs: [
      { q: 'How do I choose between air and sea?', a: 'Air is faster and ideal for urgent or high-value cargo; sea is more cost-effective for large volumes. We recommend the best fit for your deadline and budget.' },
      { q: 'Do you handle all export paperwork?', a: 'Yes. We complete the trade documentation and compliance requirements so your goods move without border friction.' },
    ],
  },
};

export const DEFAULT_SERVICE_CONTENT = SERVICE_CONTENT.truck;
