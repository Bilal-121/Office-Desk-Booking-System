import fs from 'fs';
import path from 'path';

export interface StoredDesk {
  id: string;
  floorId: string;
  deskNumber: string;
  isActive: boolean;
  createdAt: string;
}

const DESKS_FILE = path.join(process.cwd(), '.desks.json');

function loadAllDesks(): StoredDesk[] {
  try {
    if (!fs.existsSync(DESKS_FILE)) {
      return [];
    }

    const raw = fs.readFileSync(DESKS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        typeof item?.id === 'string' &&
        typeof item?.floorId === 'string' &&
        typeof item?.deskNumber === 'string' &&
        typeof item?.isActive === 'boolean'
    );
  } catch (error) {
    console.error('Failed to load desks from file:', error);
    return [];
  }
}

function saveAllDesks(desks: StoredDesk[]) {
  try {
    fs.writeFileSync(DESKS_FILE, JSON.stringify(desks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save desks to file:', error);
  }
}

export function getDesksForFloor(floorId: string): StoredDesk[] {
  const allDesks = loadAllDesks();
  return allDesks.filter((desk) => desk.floorId === floorId && desk.isActive);
}

export function addDesk(floorId: string, deskNumber: string): StoredDesk {
  const allDesks = loadAllDesks();
  
  const newDesk: StoredDesk = {
    id: `desk-${floorId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    floorId,
    deskNumber,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  allDesks.push(newDesk);
  saveAllDesks(allDesks);
  
  return newDesk;
}

export function removeDesk(deskId: string): boolean {
  const allDesks = loadAllDesks();
  const deskIndex = allDesks.findIndex((desk) => desk.id === deskId);
  
  if (deskIndex === -1) {
    return false;
  }

  // Soft delete by setting isActive to false
  allDesks[deskIndex].isActive = false;
  saveAllDesks(allDesks);
  
  return true;
}

export function hasCustomDesks(floorId: string): boolean {
  const allDesks = loadAllDesks();
  return allDesks.some((desk) => desk.floorId === floorId && desk.isActive);
}

export function getNextDeskNumber(floorId: string): string {
  const floorDesks = getDesksForFloor(floorId);
  
  if (floorDesks.length === 0) {
    return 'Desk-1';
  }

  // Extract numbers from existing desk numbers and find the max
  const numbers = floorDesks
    .map((desk) => {
      const match = desk.deskNumber.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((num) => !isNaN(num));

  const maxNumber = Math.max(...numbers, 0);
  return `Desk-${maxNumber + 1}`;
}
