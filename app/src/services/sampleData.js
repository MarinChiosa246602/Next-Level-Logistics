export const sampleFarms = [
  {
    farm_id: '00000000-0000-0000-0000-000000000000',
    name: 'De Groene Vallei Farm',
    region: 'Limburg',
    coordinates: { lat: 50.85, lng: 5.75 },
  },
  {
    farm_id: '22222222-2222-2222-2222-222222222222',
    name: 'Brabantse Oogst Coop',
    region: 'North Brabant',
    coordinates: { lat: 51.45, lng: 4.95 },
  },
  {
    farm_id: '33333333-3333-3333-3333-333333333333',
    name: 'Maas Valley Produce',
    region: 'Limburg',
    coordinates: { lat: 50.92, lng: 5.82 },
  },
];

export const sampleLocations = [
  {
    location_id: '00000000-0000-0000-0001-000000000000',
    farm_id: '00000000-0000-0000-0000-000000000000',
    label: 'North Greenhouse - Tomatoes',
    field_name: 'North Greenhouse',
    crop_type: 'Tomatoes',
  },
  {
    location_id: '00000000-0000-0000-0002-000000000000',
    farm_id: '00000000-0000-0000-0000-000000000000',
    label: 'South Field - Carrots',
    field_name: 'South Field',
    crop_type: 'Carrots',
  },
  {
    location_id: '00000000-0000-0000-0003-000000000000',
    farm_id: '00000000-0000-0000-0000-000000000000',
    label: 'East Plot - Peppers',
    field_name: 'East Plot',
    crop_type: 'Peppers',
  },
  {
    location_id: '00000000-0000-0000-0004-000000000000',
    farm_id: '00000000-0000-0000-0000-000000000000',
    label: 'West Shed - Lettuce',
    field_name: 'West Shed',
    crop_type: 'Lettuce',
  },
  {
    location_id: '00000000-0000-0000-0005-000000000000',
    farm_id: '00000000-0000-0000-0000-000000000000',
    label: 'Main Garden - Mixed Vegetables',
    field_name: 'Main Garden',
    crop_type: 'Mixed Vegetables',
  },
  {
    location_id: '00000000-0000-0000-0006-000000000000',
    farm_id: '22222222-2222-2222-2222-222222222222',
    label: 'Field A - Apples',
    field_name: 'Field A',
    crop_type: 'Apples',
  },
  {
    location_id: '00000000-0000-0000-0007-000000000000',
    farm_id: '33333333-3333-3333-3333-333333333333',
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
