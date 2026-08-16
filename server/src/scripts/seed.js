import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { participantService } from '../services/participantService.js';
import { env } from '../config/env.js';

const runSeed = async () => {
  try {
    process.stdout.write('[Seed Script] Connecting to database...\n');
    await connectDatabase(env.MONGODB_URI);

    process.stdout.write('[Seed Script] Resetting and seeding assignment participants (Maya, Tom, Sara, Jack)...\n');
    const seeded = await participantService.seedDefaultParticipants(true);

    process.stdout.write(`[Seed Script] Successfully seeded ${seeded.length} participants:\n`);
    seeded.forEach((p) => {
      process.stdout.write(`  - ${p.name} (${p.location}) [${p.timezone}] | Working Hours: ${p.availability.startTime}-${p.availability.endTime}\n`);
    });

    await disconnectDatabase();
    process.stdout.write('[Seed Script] Completed successfully.\n');
    process.exit(0);
  } catch (error) {
    process.stderr.write(`[Seed Error] Failed to seed database: ${error.message}\n`);
    process.exit(1);
  }
};

runSeed();
