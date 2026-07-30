export type ClearanceType = 'import' | 'export';
export type TransportMode = 'air' | 'sea' | 'road';
export type ShipmentStatus = 'arrived' | 'in_transit' | 'ready_export' | 'not_shipped';
export type PackagingType = 'cartons' | 'pallets' | 'drums' | 'bags' | 'crates' | 'container' | 'loose' | 'other';
export type ContainerLoadType = 'FCL' | 'LCL';
export type ContainerSize = '20ft' | '40ft' | '40hc';

export interface CustomsCargoItem {
  id: string;
  commodity: string;
  hsCode: string;
  packaging: PackagingType | '';
  quantity: string;
  weightKg: string;
  cargoValue: string;
  currency: string;
  hazardous: boolean;
  perishable: boolean;
  temperatureControlled: boolean;
}

export interface CustomsDocument {
  name: string;
  type: string;
}

export interface CustomsFormData {
  clearanceType: ClearanceType | '';
  transportMode: TransportMode | '';
  shipmentStatus: ShipmentStatus | '';
  portOfEntry: string;
  expectedDate: string;

  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  whatsapp: string;
  rcNumber: string;
  tin: string;
  businessAddress: string;

  countryOrigin: string;
  countryDestination: string;
  supplierConsignee: string;
  invoiceNumber: string;

  cargoItems: CustomsCargoItem[];

  containerLoad: ContainerLoadType | '';
  containerSize: ContainerSize | '';
  containerCount: string;
  containerNumber: string;
  sealNumber: string;

  requiredServices: string[];

  documents: CustomsDocument[];

  additionalNotes: string;
}

export const EMPTY_CUSTOMS: CustomsFormData = {
  clearanceType: '',
  transportMode: '',
  shipmentStatus: '',
  portOfEntry: '',
  expectedDate: '',
  fullName: '',
  companyName: '',
  email: '',
  phone: '',
  whatsapp: '',
  rcNumber: '',
  tin: '',
  businessAddress: '',
  countryOrigin: '',
  countryDestination: '',
  supplierConsignee: '',
  invoiceNumber: '',
  cargoItems: [],
  containerLoad: '',
  containerSize: '',
  containerCount: '',
  containerNumber: '',
  sealNumber: '',
  requiredServices: [],
  documents: [],
  additionalNotes: '',
};

export const PORTS_OF_ENTRY = [
  'Apapa Port - Lagos',
  'Tin Can Island Port - Lagos',
  'Port Harcourt Port',
  'Calabar Port',
  'Onne Port',
  'Warri Port',
  'Murtala Muhammed International Airport - Lagos',
  'Nnamdi Azikiwe International Airport - Abuja',
  'Aminu Kano International Airport - Kano',
  'Port Harcourt International Airport',
  'Kano Inland Dry Port',
  'Kaduna Inland Dry Port',
  'Ibadan Inland Dry Port',
  'Other',
];

export const COUNTRIES = [
  'Afghanistan', 'Argentina', 'Australia', 'Bangladesh', 'Belgium', 'Brazil',
  'Cambodia', 'Cameroon', 'Canada', 'Chad', 'Chile', 'China', 'Colombia',
  'Congo (DRC)', "Côte d'Ivoire", 'Czech Republic', 'Denmark', 'Egypt',
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

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CNY', 'JPY', 'INR', 'AED', 'ZAR', 'CAD'];

export const CONTAINER_SIZES: { value: ContainerSize; label: string }[] = [
  { value: '20ft', label: '20ft Standard' },
  { value: '40ft', label: '40ft Standard' },
  { value: '40hc', label: '40ft High Cube' },
];

export const CUSTOMS_SERVICES: { value: string; label: string }[] = [
  { value: 'import_clearance', label: 'Import Customs Clearance' },
  { value: 'export_clearance', label: 'Export Customs Clearance' },
  { value: 'documentation', label: 'Customs Documentation' },
  { value: 'duty_tax', label: 'Duty & Tax Processing' },
  { value: 'soncap', label: 'SONCAP Assistance' },
  { value: 'nafdac', label: 'NAFDAC Clearance' },
  { value: 'nesrea', label: 'NESREA Clearance' },
  { value: 'quarantine', label: 'Quarantine Inspection' },
  { value: 'terminal_handling', label: 'Terminal Handling' },
  { value: 'inspection_support', label: 'Customs Inspection Support' },
  { value: 'delivery_after', label: 'Delivery After Clearance' },
];

export const CUSTOMS_DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'commercial_invoice', label: 'Commercial Invoice' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'bill_of_lading', label: 'Bill of Lading' },
  { value: 'air_waybill', label: 'Air Waybill' },
  { value: 'form_m', label: 'Form M (optional)' },
  { value: 'paar', label: 'PAAR (optional)' },
  { value: 'soncap_cert', label: 'SONCAP Certificate' },
  { value: 'nafdac_cert', label: 'NAFDAC Certificate' },
  { value: 'cert_of_origin', label: 'Certificate of Origin' },
  { value: 'import_permit', label: 'Import Permit' },
  { value: 'insurance_cert', label: 'Insurance Certificate' },
  { value: 'other', label: 'Other Supporting Documents' },
];

export const TRANSPORT_MODES: { value: TransportMode; label: string; desc: string }[] = [
  { value: 'air', label: 'Air Freight', desc: 'Via international airport' },
  { value: 'sea', label: 'Sea Freight', desc: 'Via seaport — may need container info' },
  { value: 'road', label: 'Road Freight', desc: 'Via land border crossing' },
];

export const SHIPMENT_STATUSES: { value: ShipmentStatus; label: string; desc: string; importOnly?: boolean; exportOnly?: boolean }[] = [
  { value: 'arrived', label: 'Shipment Arrived', desc: 'Goods have arrived at the port', importOnly: true },
  { value: 'in_transit', label: 'Shipment In Transit', desc: 'Goods are on the way to Nigeria', importOnly: true },
  { value: 'ready_export', label: 'Shipment Ready for Export', desc: 'Goods are packed and ready to ship out', exportOnly: true },
  { value: 'not_shipped', label: 'Shipment Not Yet Shipped', desc: 'Goods are still being prepared', exportOnly: true },
];
