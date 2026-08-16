import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function setup() {
  // Start in-memory MongoDB once globally for the entire test suite
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'meeting_scheduler_test'
    }
  });

  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.TEST_MONGODB_URI = mongoServer.getUri();
}

export async function teardown() {
  if (mongoServer) {
    await mongoServer.stop();
  }
}
