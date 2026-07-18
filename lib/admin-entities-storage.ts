import fs from 'fs';
import path from 'path';

export interface StoredOffice {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFloor {
  id: string;
  officeId: string;
  name: string;
  floorNumber: number;
  mapUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminEntitiesStore {
  offices: StoredOffice[];
  floors: StoredFloor[];
}

const ADMIN_ENTITIES_FILE = path.join(process.cwd(), '.admin-entities.json');

function getDefaultStore(): AdminEntitiesStore {
  const now = new Date().toISOString();
  return {
    offices: [
      {
        id: 'office-1',
        name: 'Main Office',
        address: '123 Main St',
        city: 'Cape Town',
        country: 'South Africa',
        timezone: 'UTC',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    floors: [
      {
        id: 'floor-1',
        officeId: 'office-1',
        name: 'Ground Floor',
        floorNumber: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'floor-2',
        officeId: 'office-1',
        name: 'First Floor',
        floorNumber: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

function loadStore(): AdminEntitiesStore {
  try {
    if (!fs.existsSync(ADMIN_ENTITIES_FILE)) {
      return getDefaultStore();
    }

    const raw = fs.readFileSync(ADMIN_ENTITIES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.offices) || !Array.isArray(parsed.floors)) {
      return getDefaultStore();
    }

    return {
      offices: parsed.offices,
      floors: parsed.floors,
    };
  } catch (error) {
    console.error('Failed to load admin entities:', error);
    return getDefaultStore();
  }
}

function saveStore(store: AdminEntitiesStore) {
  try {
    fs.writeFileSync(ADMIN_ENTITIES_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save admin entities:', error);
  }
}

export function getStoredOffices(): StoredOffice[] {
  const store = loadStore();
  return store.offices
    .filter((office) => office.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getStoredFloors(): StoredFloor[] {
  const store = loadStore();
  return store.floors
    .filter((floor) => floor.isActive)
    .sort((a, b) => a.floorNumber - b.floorNumber);
}

export function addStoredOffice(input: {
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  isActive?: boolean;
}): StoredOffice {
  const store = loadStore();
  const now = new Date().toISOString();

  const office: StoredOffice = {
    id: `office-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    address: input.address,
    city: input.city,
    country: input.country,
    timezone: input.timezone,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  store.offices.push(office);
  saveStore(store);
  return office;
}

export function addStoredFloor(input: {
  officeId: string;
  name: string;
  floorNumber: number;
  isActive?: boolean;
  mapUrl?: string;
}): StoredFloor {
  const store = loadStore();
  const now = new Date().toISOString();

  const floor: StoredFloor = {
    id: `floor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    officeId: input.officeId,
    name: input.name,
    floorNumber: input.floorNumber,
    mapUrl: input.mapUrl,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  store.floors.push(floor);
  saveStore(store);
  return floor;
}
