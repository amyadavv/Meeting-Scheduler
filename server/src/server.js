import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { participantService } from './services/participantService.js';

let server;

const startServer = async () => {
  try {
    // 1. Start HTTP Server first so port 5000 is open immediately
    server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`[Server] Meeting Scheduler API running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      console.log(`[Server] Health check available at: http://localhost:${env.PORT}/api/health`);
    });

    // 2. Connect Database
    await connectDatabase(env.MONGODB_URI);

    // 3. Auto-seed initial assignment participants if DB empty
    if (env.isDevelopment) {
      const seeded = await participantService.seedDefaultParticipants(false);
      console.log(`[Bootstrap] Active participants in database: ${seeded.length}`);
    }

    // 4. Graceful Shutdown Handlers
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
      if (server) {
        server.close(async () => {
          console.log('[Server] HTTP server closed');
          await disconnectDatabase();
          console.log('[Server] Database connection closed. Shutdown complete.');
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
    console.error(`[Fatal Error] Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();
