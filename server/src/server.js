import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { participantService } from './services/participantService.js';

let server;

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDatabase(env.MONGODB_URI);

    // 2. Auto-seed initial assignment participants (Maya, Tom, Sara, Jack) if DB empty
    if (env.isDevelopment) {
      const seeded = await participantService.seedDefaultParticipants(false);
      process.stdout.write(`[Bootstrap] Active participants in database: ${seeded.length}\n`);
    }

    // 3. Start HTTP Server
    server = app.listen(env.PORT, () => {
      process.stdout.write(`[Server] Meeting Scheduler API running on port ${env.PORT} in ${env.NODE_ENV} mode\n`);
      process.stdout.write(`[Server] Health check available at: http://localhost:${env.PORT}/api/health\n`);
    });

    // 4. Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      process.stdout.write(`\n[Server] Received ${signal}. Initiating graceful shutdown...\n`);
      if (server) {
        server.close(async () => {
          process.stdout.write('[Server] HTTP server closed\n');
          await disconnectDatabase();
          process.stdout.write('[Server] Database connection closed. Shutdown complete.\n');
          process.exit(0);
        });
      } else {
        await disconnectDatabase();
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    process.stderr.write(`[Fatal Error] Server failed to start: ${error.message}\n`);
    process.exit(1);
  }
};

startServer();
