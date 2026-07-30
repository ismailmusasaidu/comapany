export type RelocationType = 'home' | 'office' | 'apartment' | 'business' | 'warehouse' | 'shop' | 'industrial';
export type MoveScope = 'same_city' | 'inter_state' | 'international';
export type ServiceRequired = 'full' | 'transport_only' | 'packing_moving' | 'loading_transport' | 'loading_transport_unloading' | 'storage_moving';
export type PropertyType = 'house' | 'apartment' | 'office' | 'warehouse' | 'shop' | 'other';
export type VehicleType = 'motorcycle' | 'mini_van' | 'cargo_van' | 'pickup' | '3ton' | '5ton' | '10ton' | 'container' | 'recommend';

export interface MoveItem {
  id: string;
  category: string;
  description: string;
  quantity: string;
  weightKg: string;
  fragile: boolean;
  highValue: boolean;
  specialHandling: boolean;
}

export interface MoveLocation {
  country: string;
  state: string;
  city: string;
  address: string;
  buildingName: string;
  propertyType: PropertyType | '';
  floorNumber: string;
  liftAvailable: boolean;
  parkingAvailable: boolean;
}

export interface RelocationDocument {
  name: string;
  type: string;
}

export interface RelocationFormData {
  relocationType: RelocationType | '';
  moveScope: MoveScope | '';
  serviceRequired: ServiceRequired | '';
  preferredDate: string;
  flexibleDate: boolean;

  pickup: MoveLocation;
  delivery: MoveLocation;

  items: MoveItem[];

  additionalServices: string[];

  vehicleType: VehicleType | '';

  contactName: string;
  contactCompany: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsApp: string;

  documents: RelocationDocument[];
  additionalNotes: string;
}

const emptyLocation: MoveLocation = {
  country: '', state: '', city: '', address: '', buildingName: '',
  propertyType: '', floorNumber: '', liftAvailable: false, parkingAvailable: false,
};

export const EMPTY_RELOCATION: RelocationFormData = {
  relocationType: '',
  moveScope: '',
  serviceRequired: '',
  preferredDate: '',
  flexibleDate: false,
  pickup: { ...emptyLocation },
  delivery: { ...emptyLocation },
  items: [],
  additionalServices: [],
  vehicleType: '',
  contactName: '',
  contactCompany: '',
  contactEmail: '',
  contactPhone: '',
  contactWhatsApp: '',
  documents: [],
  additionalNotes: '',
};

export const RELOCATION_TYPES: { value: RelocationType; label: string; desc: string; icon: string }[] = [
  { value: 'home', label: 'Home Relocation', desc: 'Moving household contents from one home to another', icon: 'home' },
  { value: 'office', label: 'Office Relocation', desc: 'Relocating an entire office or workspace', icon: 'office' },
  { value: 'apartment', label: 'Apartment Move', desc: 'Moving into or out of an apartment', icon: 'apartment' },
  { value: 'business', label: 'Business Relocation', desc: 'Relocating a business or commercial premises', icon: 'business' },
  { value: 'warehouse', label: 'Warehouse Relocation', desc: 'Moving warehouse inventory and equipment', icon: 'warehouse' },
  { value: 'shop', label: 'Shop Relocation', desc: 'Relocating a retail shop or store', icon: 'shop' },
  { value: 'industrial', label: 'Industrial Equipment Move', desc: 'Heavy machinery and industrial equipment', icon: 'industrial' },
];

export const MOVE_SCOPES: { value: MoveScope; label: string; desc: string }[] = [
  { value: 'same_city', label: 'Within the Same City', desc: 'Moving within the same city or town' },
  { value: 'inter_state', label: 'Inter-State (Within Nigeria)', desc: 'Moving between states across Nigeria' },
  { value: 'international', label: 'International Relocation', desc: 'Moving to or from another country' },
];

export const SERVICES_REQUIRED: { value: ServiceRequired; label: string; desc: string }[] = [
  { value: 'full', label: 'Full Moving Service', desc: 'Packing, loading, transport, unloading & unpacking' },
  { value: 'transport_only', label: 'Transport Only', desc: 'Just the truck and driver — you handle everything else' },
  { value: 'packing_moving', label: 'Packing & Moving', desc: 'We pack your items and transport them' },
  { value: 'loading_transport', label: 'Loading & Transport', desc: 'We load and drive — you unpack at destination' },
  { value: 'loading_transport_unloading', label: 'Loading, Transport & Unloading', desc: 'We load, drive and unload at destination' },
  { value: 'storage_moving', label: 'Storage & Moving', desc: 'Temporary storage plus transport to final destination' },
];

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'shop', label: 'Shop' },
  { value: 'other', label: 'Other' },
];

export const ITEM_CATEGORIES = [
  'Furniture', 'Electronics', 'Office Equipment', 'Household Items',
  'Kitchen Items', 'Clothing', 'Documents', 'Machinery',
  'Food Products', 'Other',
];

export const ADDITIONAL_MOVING_SERVICES: { value: string; label: string }[] = [
  { value: 'packing', label: 'Professional Packing' },
  { value: 'unpacking', label: 'Unpacking' },
  { value: 'disassembly', label: 'Furniture Disassembly' },
  { value: 'reassembly', label: 'Furniture Reassembly' },
  { value: 'appliance_install', label: 'Appliance Installation' },
  { value: 'temp_storage', label: 'Temporary Storage' },
  { value: 'cleaning', label: 'Cleaning Service' },
  { value: 'disposal', label: 'Disposal of Unwanted Items' },
  { value: 'insurance', label: 'Insurance Coverage' },
];

export const VEHICLE_OPTIONS: { value: VehicleType; label: string; desc: string }[] = [
  { value: 'motorcycle', label: 'Motorcycle', desc: 'Small items, documents, urgent deliveries' },
  { value: 'mini_van', label: 'Mini Van', desc: 'Small moves, few boxes or items' },
  { value: 'cargo_van', label: 'Cargo Van', desc: 'Studio or 1-bedroom apartment' },
  { value: 'pickup', label: 'Pickup Truck', desc: 'Small loads, furniture pieces' },
  { value: '3ton', label: '3-Ton Truck', desc: '2-3 bedroom home or small office' },
  { value: '5ton', label: '5-Ton Truck', desc: 'Large home or medium office' },
  { value: '10ton', label: '10-Ton Truck', desc: 'Large office or warehouse move' },
  { value: 'container', label: 'Container Truck', desc: 'Industrial or international moves' },
  { value: 'recommend', label: 'Recommend the Best Vehicle', desc: 'Let our team choose the right vehicle for your move' },
];

export const RELOCATION_DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'items_photos', label: 'Photos of Items' },
  { value: 'pickup_photos', label: 'Photos of Pickup Location' },
  { value: 'delivery_photos', label: 'Photos of Delivery Location' },
  { value: 'inventory_list', label: 'Inventory List' },
  { value: 'floor_plan', label: 'Floor Plan' },
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
