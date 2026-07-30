export type StorageType = 'general' | 'short_term' | 'long_term' | 'business_inventory' | 'ecommerce' | 'household' | 'furniture' | 'document' | 'cold' | 'bulk';
export type CustomerType = 'individual' | 'business' | 'corporate';
export type StorageDuration = 'lt_1m' | '1_3m' | '3_6m' | '6_12m' | 'gt_1y';
export type GoodsCategory = 'foodstuffs' | 'fresh_produce' | 'household' | 'furniture' | 'electronics' | 'documents' | 'clothing' | 'machinery' | 'building_materials' | 'office_equipment' | 'medical_supplies' | 'other';

export interface WarehouseGoodsItem {
  id: string;
  itemName: string;
  category: GoodsCategory | '';
  quantity: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  fragile: boolean;
  highValue: boolean;
  hazardous: boolean;
  temperatureControlled: boolean;
}

export interface WarehouseDocument {
  name: string;
  type: string;
}

export interface WarehouseFormData {
  storageType: StorageType | '';
  customerType: CustomerType | '';
  storageDuration: StorageDuration | '';
  preferredStartDate: string;
  estimatedEndDate: string;

  requirePickup: boolean;
  pickupCountry: string;
  pickupState: string;
  pickupCity: string;
  pickupAddress: string;
  pickupDate: string;

  requireDelivery: boolean;
  deliveryAddress: string;
  deliveryDate: string;

  goods: WarehouseGoodsItem[];

  storageRequirements: string[];
  additionalServices: string[];

  contactName: string;
  contactCompany: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsApp: string;
  rcNumber: string;
  businessAddress: string;

  documents: WarehouseDocument[];
  additionalNotes: string;
}

export const EMPTY_WAREHOUSE: WarehouseFormData = {
  storageType: '',
  customerType: '',
  storageDuration: '',
  preferredStartDate: '',
  estimatedEndDate: '',
  requirePickup: false,
  pickupCountry: '',
  pickupState: '',
  pickupCity: '',
  pickupAddress: '',
  pickupDate: '',
  requireDelivery: false,
  deliveryAddress: '',
  deliveryDate: '',
  goods: [],
  storageRequirements: [],
  additionalServices: [],
  contactName: '',
  contactCompany: '',
  contactEmail: '',
  contactPhone: '',
  contactWhatsApp: '',
  rcNumber: '',
  businessAddress: '',
  documents: [],
  additionalNotes: '',
};

export const STORAGE_TYPES: { value: StorageType; label: string; desc: string }[] = [
  { value: 'general', label: 'General Warehousing', desc: 'Standard storage for any goods' },
  { value: 'short_term', label: 'Short-Term Storage', desc: 'Temporary storage for a few weeks' },
  { value: 'long_term', label: 'Long-Term Storage', desc: 'Extended storage for months or years' },
  { value: 'business_inventory', label: 'Business Inventory Storage', desc: 'Store and manage business stock' },
  { value: 'ecommerce', label: 'E-commerce Inventory Storage', desc: 'Storage with fulfilment for online sellers' },
  { value: 'household', label: 'Household Storage', desc: 'Store household items during moves' },
  { value: 'furniture', label: 'Furniture Storage', desc: 'Safe storage for furniture pieces' },
  { value: 'document', label: 'Document Storage', desc: 'Secure archive for documents and files' },
  { value: 'cold', label: 'Cold Storage', desc: 'Refrigerated storage for perishables' },
  { value: 'bulk', label: 'Bulk Goods Storage', desc: 'Large-volume bulk storage' },
];

export const CUSTOMER_TYPES: { value: CustomerType; label: string; desc: string }[] = [
  { value: 'individual', label: 'Individual', desc: 'Personal storage needs' },
  { value: 'business', label: 'Business', desc: 'SME or small business' },
  { value: 'corporate', label: 'Corporate', desc: 'Large corporation or enterprise' },
];

export const STORAGE_DURATIONS: { value: StorageDuration; label: string }[] = [
  { value: 'lt_1m', label: 'Less than 1 Month' },
  { value: '1_3m', label: '1–3 Months' },
  { value: '3_6m', label: '3–6 Months' },
  { value: '6_12m', label: '6–12 Months' },
  { value: 'gt_1y', label: 'More than 1 Year' },
];

export const GOODS_CATEGORIES: { value: GoodsCategory; label: string }[] = [
  { value: 'foodstuffs', label: 'Foodstuffs' },
  { value: 'fresh_produce', label: 'Fresh Produce' },
  { value: 'household', label: 'Household Items' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'documents', label: 'Documents' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'machinery', label: 'Machinery' },
  { value: 'building_materials', label: 'Building Materials' },
  { value: 'office_equipment', label: 'Office Equipment' },
  { value: 'medical_supplies', label: 'Medical Supplies' },
  { value: 'other', label: 'Other' },
];

export const STORAGE_REQUIREMENTS: { value: string; label: string }[] = [
  { value: 'climate_controlled', label: 'Climate Controlled' },
  { value: 'cold_storage', label: 'Cold Storage' },
  { value: 'frozen_storage', label: 'Frozen Storage' },
  { value: 'humidity_controlled', label: 'Humidity Controlled' },
  { value: 'secure_locked', label: 'Secure Locked Storage' },
  { value: 'cctv_monitoring', label: 'CCTV Monitoring' },
  { value: 'high_security', label: 'High Security Storage' },
  { value: 'insurance_required', label: 'Insurance Required' },
];

export const WAREHOUSE_ADDITIONAL_SERVICES: { value: string; label: string }[] = [
  { value: 'inventory_management', label: 'Inventory Management' },
  { value: 'stock_counting', label: 'Stock Counting' },
  { value: 'order_fulfilment', label: 'Order Fulfilment' },
  { value: 'pick_pack', label: 'Pick & Pack' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'labelling', label: 'Labelling' },
  { value: 'barcode_management', label: 'Barcode Management' },
  { value: 'repackaging', label: 'Repackaging' },
  { value: 'quality_inspection', label: 'Quality Inspection' },
  { value: 'last_mile_delivery', label: 'Last-Mile Delivery' },
  { value: 'distribution_services', label: 'Distribution Services' },
];

export const WAREHOUSE_DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'inventory_list', label: 'Inventory List' },
  { value: 'commercial_invoice', label: 'Commercial Invoice' },
  { value: 'product_catalogue', label: 'Product Catalogue' },
  { value: 'goods_photos', label: 'Photos of Goods' },
  { value: 'insurance_docs', label: 'Insurance Documents' },
  { value: 'other', label: 'Other Supporting Documents' },
];

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
