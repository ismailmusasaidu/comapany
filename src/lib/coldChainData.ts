export type CargoCategory = 'pharmaceuticals' | 'laboratory' | 'fresh_produce' | 'frozen_food' | 'other';
export type ShipmentFrequency = 'one_time' | 'daily' | 'weekly' | 'monthly';

export interface ColdChainFormData {
  cargoCategory: CargoCategory | '';
  temperatureKnown: 'yes' | 'no' | '';
  minTemp: string;
  maxTemp: string;
  cargoWeightKg: string;
  pickupAddress: string;
  deliveryAddress: string;
  preferredPickupDate: string;
  shipmentFrequency: ShipmentFrequency | '';
  handlingRequirements: string;
}

export const EMPTY_COLDCHAIN: ColdChainFormData = {
  cargoCategory: '',
  temperatureKnown: '',
  minTemp: '',
  maxTemp: '',
  cargoWeightKg: '',
  pickupAddress: '',
  deliveryAddress: '',
  preferredPickupDate: '',
  shipmentFrequency: '',
  handlingRequirements: '',
};

export const CARGO_CATEGORIES = [
  { value: 'pharmaceuticals', label: 'Pharmaceuticals / medical supplies' },
  { value: 'laboratory', label: 'Laboratory samples / biological products' },
  { value: 'fresh_produce', label: 'Fresh produce / dairy' },
  { value: 'frozen_food', label: 'Frozen food / meat / seafood' },
  { value: 'other', label: 'Other temperature-sensitive cargo' },
];

export const SHIPMENT_FREQUENCIES = [
  { value: 'one_time', label: 'One-time shipment' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function buildColdChainTitle(data: ColdChainFormData): string {
  const cargo = CARGO_CATEGORIES.find(c => c.value === data.cargoCategory)?.label || 'Temperature-sensitive cargo';
  return `Cold Chain — ${cargo}`;
}

export function buildColdChainDescription(data: ColdChainFormData): string {
  const cargo = CARGO_CATEGORIES.find(c => c.value === data.cargoCategory)?.label || data.cargoCategory;
  const freq = SHIPMENT_FREQUENCIES.find(f => f.value === data.shipmentFrequency)?.label || data.shipmentFrequency;
  const tempKnown = data.temperatureKnown === 'yes' ? 'Yes' : 'No';
  return [
    `Cargo Category: ${cargo}`,
    `Temperature Range Known: ${tempKnown}`,
    data.temperatureKnown === 'yes' && (data.minTemp || data.maxTemp || true) ? `Temperature Range: ${data.minTemp || '—'}°C to ${data.maxTemp || '—'}°C` : '',
    data.cargoWeightKg ? `Total Cargo Weight: ${data.cargoWeightKg} kg` : '',
    `Pickup Address: ${data.pickupAddress}`,
    `Delivery Address: ${data.deliveryAddress}`,
    data.preferredPickupDate ? `Preferred Pickup Date: ${new Date(data.preferredPickupDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : '',
    `Shipment Frequency: ${freq}`,
    data.handlingRequirements ? `Additional Handling Requirements: ${data.handlingRequirements}` : '',
  ].filter(Boolean).join('\n');
}
