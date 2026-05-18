export const sampleFarms = [
  {
    farm_id: '00000000-0000-0000-0000-000000000000',
    name: 'De Groene Vallei Farm',
    region: 'Limburg',
    coordinates: { lat: 50.85, lng: 5.75 },
  },
  {
    farm_id: 'farm-002',
    name: 'Brabantse Oogst Coop',
    region: 'North Brabant',
    coordinates: { lat: 51.45, lng: 4.95 },
  },
  {
    farm_id: 'farm-003',
    name: 'Maas Valley Produce',
    region: 'Limburg',
    coordinates: { lat: 50.92, lng: 5.82 },
  },
];

export const sampleLocations = [
  {
    location_id: 'loc-001',
    farm_id: '00000000-0000-0000-0000-000000000000',
    label: 'North Greenhouse - Tomatoes',
    field_name: 'North Greenhouse',
    crop_type: 'Tomatoes',
  },
  {
    location_id: 'loc-002',
    farm_id: '00000000-0000-0000-0000-000000000000',
    label: 'South Field - Carrots',
    field_name: 'South Field',
    crop_type: 'Carrots',
  },
  {
    location_id: 'loc-003',
    farm_id: '00000000-0000-0000-0000-000000000000',
    label: 'East Plot - Peppers',
    field_name: 'East Plot',
    crop_type: 'Peppers',
  },
  {
    location_id: 'loc-004',
    farm_id: '00000000-0000-0000-0000-000000000000',
    label: 'West Shed - Lettuce',
    field_name: 'West Shed',
    crop_type: 'Lettuce',
  },
  {
    location_id: 'loc-005',
    farm_id: '00000000-0000-0000-0000-000000000000',
    label: 'Main Garden - Mixed Vegetables',
    field_name: 'Main Garden',
    crop_type: 'Mixed Vegetables',
  },
  {
    location_id: 'loc-006',
    farm_id: 'farm-002',
    label: 'Field A - Apples',
    field_name: 'Field A',
    crop_type: 'Apples',
  },
  {
    location_id: 'loc-007',
    farm_id: 'farm-003',
    label: 'Asparagus Beds',
    field_name: 'Asparagus Beds',
    crop_type: 'Asparagus',
  },
];

export const productTypes = [
  'Tomatoes',
  'Carrots',
  'Apples',
  'Wheat',
  'Peppers',
  'Pears',
  'Asparagus',
  'Lettuce',
  'Beans',
  'Potatoes',
  'Strawberries',
  'Cucumbers',
];
