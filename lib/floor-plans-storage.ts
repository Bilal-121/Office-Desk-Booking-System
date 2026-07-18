import fs from 'fs';
import path from 'path';

interface FloorPlanData {
  floorId: string;
  mapUrl: string;
  uploadedAt: string;
}

const FLOOR_PLANS_FILE = path.join(process.cwd(), '.floor-plans.json');

export function loadFloorPlans(): Map<string, string> {
  try {
    if (fs.existsSync(FLOOR_PLANS_FILE)) {
      const data = fs.readFileSync(FLOOR_PLANS_FILE, 'utf-8');
      const parsed: FloorPlanData[] = JSON.parse(data);
      return new Map(parsed.map((f) => [f.floorId, f.mapUrl]));
    }
  } catch (error) {
    console.error('Failed to load floor plans from file:', error);
  }
  return new Map();
}

export function saveFloorPlans(floorPlans: Map<string, string>): void {
  try {
    const data: FloorPlanData[] = Array.from(floorPlans.entries()).map(([floorId, mapUrl]) => ({
      floorId,
      mapUrl,
      uploadedAt: new Date().toISOString(),
    }));
    fs.writeFileSync(FLOOR_PLANS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save floor plans to file:', error);
  }
}

export function setFloorPlan(floorId: string, mapUrl: string): void {
  const floorPlans = loadFloorPlans();
  floorPlans.set(floorId, mapUrl);
  saveFloorPlans(floorPlans);
  console.log(`✅ Floor plan saved for floor ${floorId}: ${mapUrl}`);
}

export function getFloorPlan(floorId: string): string | null {
  const floorPlans = loadFloorPlans();
  return floorPlans.get(floorId) || null;
}
