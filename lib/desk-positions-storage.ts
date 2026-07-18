import fs from 'fs';
import path from 'path';

export interface StoredDeskPosition {
  deskId: string;
  positionX: number;
  positionY: number;
  updatedAt: string;
}

const DESK_POSITIONS_FILE = path.join(process.cwd(), '.desk-positions.json');

function loadAllDeskPositions(): StoredDeskPosition[] {
  try {
    if (!fs.existsSync(DESK_POSITIONS_FILE)) {
      return [];
    }

    const raw = fs.readFileSync(DESK_POSITIONS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item) =>
        typeof item?.deskId === 'string' &&
        typeof item?.positionX === 'number' &&
        typeof item?.positionY === 'number'
    );
  } catch (error) {
    console.error('Failed to load desk positions from file:', error);
    return [];
  }
}

function saveAllDeskPositions(positions: StoredDeskPosition[]) {
  try {
    fs.writeFileSync(DESK_POSITIONS_FILE, JSON.stringify(positions, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save desk positions to file:', error);
  }
}

export function upsertDeskPositions(positions: Array<{ deskId: string; positionX: number; positionY: number }>) {
  const existing = loadAllDeskPositions();
  const byDeskId = new Map(existing.map((item) => [item.deskId, item]));

  positions.forEach((pos) => {
    byDeskId.set(pos.deskId, {
      deskId: pos.deskId,
      positionX: pos.positionX,
      positionY: pos.positionY,
      updatedAt: new Date().toISOString(),
    });
  });

  saveAllDeskPositions(Array.from(byDeskId.values()));
}

export function getDeskPositionMap(): Map<string, { positionX: number; positionY: number }> {
  const map = new Map<string, { positionX: number; positionY: number }>();
  loadAllDeskPositions().forEach((item) => {
    map.set(item.deskId, { positionX: item.positionX, positionY: item.positionY });
  });
  return map;
}
