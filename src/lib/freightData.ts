export type ShipmentScope = 'domestic' | 'international';
export type ShippingMode = 'road' | 'air' | 'sea';
export type ShipmentDirection = 'within_nigeria' | 'import' | 'export';
export type ServiceLevel = 'door_to_door' | 'door_to_port' | 'port_to_door' | 'port_to_port';
export type PackagingType = 'cartons' | 'pallets' | 'drums' | 'bags' | 'crates' | 'container' | 'loose' | 'other';
export type Incoterm = 'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF' | 'DAP' | 'DDP';
export type ContainerLoadType = 'FCL' | 'LCL';
export type ContainerSize = '20ft' | '40ft' | '40hc';

export interface CargoItem {
  id: string;
  commodity: string;
  packaging: PackagingType | '';
  quantity: string;
  weight_kg: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
  stackable: boolean;
}

export interface FreightFormData {
  shipmentScope: ShipmentScope | '';
  shippingMode: ShippingMode | '';
  shipmentDirection: ShipmentDirection | '';
  serviceLevel: ServiceLevel | '';
  preferredPickupDate: string;

  originCountry: string;
  originState: string;
  originCity: string;
  originPort: string;
  originAddress: string;

  destCountry: string;
  destState: string;
  destCity: string;
  destPort: string;
  destAddress: string;

  cargoItems: CargoItem[];

  incoterm: Incoterm | '';
  hazardous: boolean;
  insuranceRequired: boolean;
  cargoValue: string;
  temperatureControlled: boolean;

  containerLoad: ContainerLoadType | '';
  containerSize: ContainerSize | '';
  containerCount: string;

  additionalServices: string[];

  contactName: string;
  contactCompany: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsApp: string;

  shipmentNotes: string;
  documentNames: string[];
}

export const EMPTY_FREIGHT: FreightFormData = {
  shipmentScope: '',
  shippingMode: '',
  shipmentDirection: '',
  serviceLevel: '',
  preferredPickupDate: '',
  originCountry: '',
  originState: '',
  originCity: '',
  originPort: '',
  originAddress: '',
  destCountry: '',
  destState: '',
  destCity: '',
  destPort: '',
  destAddress: '',
  cargoItems: [],
  incoterm: '',
  hazardous: false,
  insuranceRequired: false,
  cargoValue: '',
  temperatureControlled: false,
  containerLoad: '',
  containerSize: '',
  containerCount: '',
  additionalServices: [],
  contactName: '',
  contactCompany: '',
  contactEmail: '',
  contactPhone: '',
  contactWhatsApp: '',
  shipmentNotes: '',
  documentNames: [],
};

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export const COUNTRIES = [
  'Afghanistan', 'Argentina', 'Australia', 'Bangladesh', 'Belgium', 'Brazil',
  'Cambodia', 'Cameroon', 'Canada', 'Chad', 'Chile', 'China', 'Colombia',
  'Congo (DRC)', 'Côte d\'Ivoire', 'Czech Republic', 'Denmark', 'Egypt',
  'Ethiopia', 'Finland', 'France', 'Germany', 'Ghana', 'Greece', 'Guinea',
  'Hong Kong', 'Hungary', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Japan', 'Jordan', 'Kenya', 'Kuwait', 'Lebanon',
  'Liberia', 'Libya', 'Malaysia', 'Mali', 'Mexico', 'Morocco', 'Mozambique',
  'Myanmar', 'Nepal', 'Netherlands', 'New Zealand', 'Niger', 'Nigeria',
  'Norway', 'Oman', 'Pakistan', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Senegal',
  'Sierra Leone', 'Singapore', 'Somalia', 'South Africa', 'South Korea',
  'Spain', 'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tanzania', 'Thailand', 'Togo', 'Tunisia', 'Turkey',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

export const AIRPORTS: Record<string, string[]> = {
  Nigeria: ['Murtala Muhammed Intl (LOS) - Lagos', 'Nnamdi Azikiwe Intl (ABV) - Abuja', 'Aminu Kano Intl (KAN) - Kano', 'Port Harcourt Intl (PHC)', 'Akanu Ibiam (ENU) - Enugu', 'Mallam Aminu Kano (KAN)'],
  China: ['Shanghai Pudong (PVG)', 'Beijing Capital (PEK)', 'Guangzhou Baiyun (CAN)', 'Shenzhen Bao\'an (SZX)', 'Hong Kong Intl (HKG)'],
  India: ['Indira Gandhi Intl (DEL) - New Delhi', 'Chhatrapati Shivaji (BOM) - Mumbai', 'Kempegowda (BLR) - Bengaluru', 'Chennai Intl (MAA)'],
  'United Kingdom': ['Heathrow (LHR) - London', 'Manchester (MAN)', 'Gatwick (LGW) - London', 'Birmingham (BHX)'],
  'United States': ['JFK (JFK) - New York', 'LAX (LAX) - Los Angeles', 'O\'Hare (ORD) - Chicago', 'Hartsfield-Jackson (ATL) - Atlanta', 'Miami Intl (MIA)'],
  Germany: ['Frankfurt (FRA)', 'Munich (MUC)', 'Berlin Brandenburg (BER)'],
  Netherlands: ['Amsterdam Schiphol (AMS)'],
  'South Africa': ['O.R. Tambo (JNB) - Johannesburg', 'Cape Town Intl (CPT)'],
  Kenya: ['Jomo Kenyatta (NBO) - Nairobi'],
  'United Arab Emirates': ['Dubai Intl (DXB)', 'Abu Dhabi (AUH)'],
  Turkey: ['Istanbul Airport (IST)', 'Sabiha Gökçen (SAW)'],
};

export const SEAPORTS: Record<string, string[]> = {
  Nigeria: ['Apapa Port - Lagos', 'Tin Can Island Port - Lagos', 'Port Harcourt Port', 'Calabar Port', 'Onne Port', 'Warri Port'],
  China: ['Shanghai Port', 'Shenzhen Port', 'Ningbo-Zhoushan Port', 'Guangzhou Port', 'Qingdao Port'],
  India: ['Jawaharlal Nehru Port (JNPT) - Mumbai', 'Chennai Port', 'Kolkata Port', 'Mundra Port'],
  'United States': ['Port of Los Angeles', 'Port of Long Beach', 'Port of New York & New Jersey', 'Port of Savannah', 'Port of Houston'],
  'United Kingdom': ['Port of Felixstowe', 'Port of Southampton', 'Port of London', 'Port of Liverpool'],
  Germany: ['Port of Hamburg', 'Port of Bremerhaven'],
  Netherlands: ['Port of Rotterdam'],
  Brazil: ['Port of Santos', 'Port of Itajaí'],
  'South Africa': ['Port of Durban', 'Port of Cape Town'],
  'United Arab Emirates': ['Jebel Ali Port - Dubai', 'Khalifa Port - Abu Dhabi'],
};

export const PACKAGING_OPTIONS: { value: PackagingType; label: string }[] = [
  { value: 'cartons', label: 'Cartons' },
  { value: 'pallets', label: 'Pallets' },
  { value: 'drums', label: 'Drums' },
  { value: 'bags', label: 'Bags' },
  { value: 'crates', label: 'Crates' },
  { value: 'container', label: 'Container' },
  { value: 'loose', label: 'Loose Cargo' },
  { value: 'other', label: 'Other' },
];

export const INCOTERMS: { value: Incoterm; label: string; desc: string }[] = [
  { value: 'EXW', label: 'EXW', desc: 'Ex Works — Buyer handles all transport from seller\'s premises' },
  { value: 'FCA', label: 'FCA', desc: 'Free Carrier — Seller delivers to a named carrier' },
  { value: 'FOB', label: 'FOB', desc: 'Free on Board — Seller delivers goods on board the vessel' },
  { value: 'CFR', label: 'CFR', desc: 'Cost & Freight — Seller pays transport to destination port' },
  { value: 'CIF', label: 'CIF', desc: 'Cost, Insurance & Freight — Seller pays transport + insurance to port' },
  { value: 'DAP', label: 'DAP', desc: 'Delivered at Place — Seller delivers to a named destination' },
  { value: 'DDP', label: 'DDP', desc: 'Delivered Duty Paid — Seller covers all costs including duties' },
];

export const CONTAINER_SIZES: { value: ContainerSize; label: string }[] = [
  { value: '20ft', label: '20ft Standard' },
  { value: '40ft', label: '40ft Standard' },
  { value: '40hc', label: '40ft High Cube' },
];

export const ADDITIONAL_SERVICES = [
  { value: 'customs', label: 'Customs Clearance', intlOnly: true },
  { value: 'warehousing', label: 'Warehousing', intlOnly: false },
  { value: 'packaging', label: 'Packaging', intlOnly: false },
  { value: 'inspection', label: 'Inspection', intlOnly: false },
  { value: 'cargo_insurance', label: 'Cargo Insurance', intlOnly: false },
  { value: 'last_mile', label: 'Last-Mile Delivery', intlOnly: false },
  { value: 'pickup', label: 'Pickup Service', intlOnly: false },
];

export const SHIPPING_MODES: { value: ShippingMode; label: string; desc: string; icon: string }[] = [
  { value: 'road', label: 'Road Freight', desc: 'Trucks & trailers — flexible, door-to-door', icon: 'truck' },
  { value: 'air', label: 'Air Freight', desc: 'Fastest option for urgent or long-distance cargo', icon: 'plane' },
  { value: 'sea', label: 'Sea Freight', desc: 'Most economical for large & heavy shipments', icon: 'ship' },
];

export const SERVICE_LEVELS: { value: ServiceLevel; label: string; desc: string }[] = [
  { value: 'door_to_door', label: 'Door-to-Door', desc: 'Pickup from origin address, delivery to destination address' },
  { value: 'door_to_port', label: 'Door-to-Port', desc: 'Pickup from origin address, delivery to destination port' },
  { value: 'port_to_door', label: 'Port-to-Door', desc: 'From origin port, delivery to destination address' },
  { value: 'port_to_port', label: 'Port-to-Port', desc: 'From origin port to destination port only' },
];
