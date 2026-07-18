import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@company.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@company.com',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
      preferences: {
        create: {
          needsMonitor: true,
          needsStandingDesk: false,
          prefersQuietArea: false,
          needsWindow: false,
          needsPowerOutlet: true,
        },
      },
    },
  });
  console.log('Created admin user:', admin.email);

  // Create teams
  const engineeringTeam = await prisma.team.create({
    data: {
      name: 'Engineering',
      description: 'Software Development Team',
    },
  });

  const designTeam = await prisma.team.create({
    data: {
      name: 'Design',
      description: 'Product Design Team',
    },
  });

  const salesTeam = await prisma.team.create({
    data: {
      name: 'Sales',
      description: 'Sales and Business Development',
    },
  });

  console.log('Created teams');

  // Create test users
  const userPassword = await bcrypt.hash('Password123!', 10);
  
  const john = await prisma.user.create({
    data: {
      email: 'john.doe@company.com',
      password: userPassword,
      name: 'John Doe',
      role: 'USER',
      teamId: engineeringTeam.id,
      preferences: {
        create: {
          needsMonitor: true,
          needsStandingDesk: false,
          prefersQuietArea: true,
          needsWindow: false,
          needsPowerOutlet: true,
        },
      },
    },
  });

  const jane = await prisma.user.create({
    data: {
      email: 'jane.smith@company.com',
      password: userPassword,
      name: 'Jane Smith',
      role: 'USER',
      teamId: engineeringTeam.id,
      preferences: {
        create: {
          needsMonitor: true,
          needsStandingDesk: true,
          prefersQuietArea: false,
          needsWindow: true,
          needsPowerOutlet: true,
        },
      },
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice.johnson@company.com',
      password: userPassword,
      name: 'Alice Johnson',
      role: 'USER',
      teamId: designTeam.id,
      preferences: {
        create: {
          needsMonitor: true,
          needsStandingDesk: false,
          prefersQuietArea: false,
          needsWindow: true,
          needsPowerOutlet: true,
        },
      },
    },
  });

  console.log('Created test users');

  // Update user preferences embeddings
  await prisma.$executeRaw`
    UPDATE user_preferences
    SET embedding = ARRAY[
      CASE WHEN "needsMonitor" THEN 1.0 ELSE 0.0 END,
      CASE WHEN "needsStandingDesk" THEN 1.0 ELSE 0.0 END,
      CASE WHEN "prefersQuietArea" THEN 1.0 ELSE 0.0 END,
      CASE WHEN "needsWindow" THEN 1.0 ELSE 0.0 END,
      CASE WHEN "needsPowerOutlet" THEN 1.0 ELSE 0.0 END
    ]::vector
  `;

  console.log('Updated user preference embeddings');

  // Create desk features
  const features = [
    { name: 'Monitor', description: 'External monitor available', icon: 'monitor' },
    { name: 'Standing Desk', description: 'Height-adjustable desk', icon: 'move-vertical' },
    { name: 'Quiet Zone', description: 'Located in quiet area', icon: 'volume-x' },
    { name: 'Window View', description: 'Desk near window', icon: 'sun' },
    { name: 'Power Outlet', description: 'Power outlet nearby', icon: 'plug' },
    { name: 'Whiteboard', description: 'Whiteboard nearby', icon: 'presentation' },
    { name: 'Meeting Room Adjacent', description: 'Near meeting room', icon: 'users' },
  ];

  const createdFeatures = await Promise.all(
    features.map((feature) =>
      prisma.deskFeature.create({
        data: feature,
      })
    )
  );

  console.log('Created desk features');

  // Create office
  const mainOffice = await prisma.office.create({
    data: {
      name: 'San Francisco HQ',
      address: '123 Market Street',
      city: 'San Francisco',
      country: 'USA',
      timezone: 'America/Los_Angeles',
      isActive: true,
    },
  });

  console.log('Created office');

  // Create floors
  const floor1 = await prisma.floor.create({
    data: {
      officeId: mainOffice.id,
      name: 'First Floor',
      floorNumber: 1,
      isActive: true,
    },
  });

  const floor2 = await prisma.floor.create({
    data: {
      officeId: mainOffice.id,
      name: 'Second Floor',
      floorNumber: 2,
      isActive: true,
    },
  });

  console.log('Created floors');

  // Create zones
  const engineeringZone = await prisma.zone.create({
    data: {
      floorId: floor1.id,
      name: 'Engineering Zone',
      description: 'Dedicated space for engineering team',
      isActive: true,
    },
  });

  const designZone = await prisma.zone.create({
    data: {
      floorId: floor1.id,
      name: 'Design Zone',
      description: 'Creative space for designers',
      isActive: true,
    },
  });

  const quietZone = await prisma.zone.create({
    data: {
      floorId: floor2.id,
      name: 'Quiet Zone',
      description: 'Focus area with minimal noise',
      isActive: true,
    },
  });

  console.log('Created zones');

  // Create desks on Floor 1 - Engineering Zone
  const engineeringDesks = [];
  for (let i = 1; i <= 10; i++) {
    const desk = await prisma.desk.create({
      data: {
        floorId: floor1.id,
        zoneId: engineeringZone.id,
        deskNumber: `1-ENG-${String(i).padStart(3, '0')}`,
        isActive: true,
      },
    });
    engineeringDesks.push(desk);
  }

  // Create desks on Floor 1 - Design Zone
  const designDesks = [];
  for (let i = 1; i <= 8; i++) {
    const desk = await prisma.desk.create({
      data: {
        floorId: floor1.id,
        zoneId: designZone.id,
        deskNumber: `1-DSN-${String(i).padStart(3, '0')}`,
        isActive: true,
      },
    });
    designDesks.push(desk);
  }

  // Create desks on Floor 2 - Quiet Zone
  const quietDesks = [];
  for (let i = 1; i <= 6; i++) {
    const desk = await prisma.desk.create({
      data: {
        floorId: floor2.id,
        zoneId: quietZone.id,
        deskNumber: `2-QUI-${String(i).padStart(3, '0')}`,
        isActive: true,
      },
    });
    quietDesks.push(desk);
  }

  console.log('Created desks');

  // Add spatial coordinates and features to desks
  // Engineering zone desks - arranged in a grid
  for (let i = 0; i < engineeringDesks.length; i++) {
    const x = -122.4 + (i % 5) * 0.0001; // Longitude
    const y = 37.79 + Math.floor(i / 5) * 0.0001; // Latitude
    
    await prisma.$executeRaw`
      UPDATE desks 
      SET location = ST_SetSRID(ST_MakePoint(${x}, ${y}), 4326)
      WHERE id = ${engineeringDesks[i].id}
    `;

    // Add features to every other desk
    if (i % 2 === 0) {
      await prisma.deskFeatureMap.create({
        data: {
          deskId: engineeringDesks[i].id,
          deskFeatureId: createdFeatures[0].id, // Monitor
        },
      });
      await prisma.deskFeatureMap.create({
        data: {
          deskId: engineeringDesks[i].id,
          deskFeatureId: createdFeatures[4].id, // Power Outlet
        },
      });
    }

    if (i % 3 === 0) {
      await prisma.deskFeatureMap.create({
        data: {
          deskId: engineeringDesks[i].id,
          deskFeatureId: createdFeatures[1].id, // Standing Desk
        },
      });
    }
  }

  // Design zone desks
  for (let i = 0; i < designDesks.length; i++) {
    const x = -122.399 + (i % 4) * 0.0001;
    const y = 37.79 + Math.floor(i / 4) * 0.0001;
    
    await prisma.$executeRaw`
      UPDATE desks 
      SET location = ST_SetSRID(ST_MakePoint(${x}, ${y}), 4326)
      WHERE id = ${designDesks[i].id}
    `;

    // Design desks have monitors and windows
    await prisma.deskFeatureMap.create({
      data: {
        deskId: designDesks[i].id,
        deskFeatureId: createdFeatures[0].id, // Monitor
      },
    });

    if (i < 4) {
      await prisma.deskFeatureMap.create({
        data: {
          deskId: designDesks[i].id,
          deskFeatureId: createdFeatures[3].id, // Window View
        },
      });
    }
  }

  // Quiet zone desks
  for (let i = 0; i < quietDesks.length; i++) {
    const x = -122.4 + (i % 3) * 0.0001;
    const y = 37.791 + Math.floor(i / 3) * 0.0001;
    
    await prisma.$executeRaw`
      UPDATE desks 
      SET location = ST_SetSRID(ST_MakePoint(${x}, ${y}), 4326)
      WHERE id = ${quietDesks[i].id}
    `;

    // All quiet zone desks have quiet zone feature
    await prisma.deskFeatureMap.create({
      data: {
        deskId: quietDesks[i].id,
        deskFeatureId: createdFeatures[2].id, // Quiet Zone
      },
    });

    await prisma.deskFeatureMap.create({
      data: {
        deskId: quietDesks[i].id,
        deskFeatureId: createdFeatures[4].id, // Power Outlet
      },
    });
  }

  console.log('Added desk locations and features');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
