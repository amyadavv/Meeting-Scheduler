import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

/**
 * Resolves a mongodb+srv:// URI into standard replica-set seedlist using DNS-over-HTTPS
 * to bypass local ISP/router UDP 53 DNS SRV blocking.
 */
async function resolveSrvWithDoH(srvUri) {
  try {
    const match = srvUri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
    if (!match) return srvUri;

    const [, auth, host, dbPath = '/test', query = ''] = match;
    const srvName = `_mongodb._tcp.${host}`;

    // Query SRV via DNS-over-HTTPS (Google & Cloudflare fallbacks)
    let srvData = null;
    try {
      const res = await fetch(`https://dns.google/resolve?name=${srvName}&type=SRV`, { signal: AbortSignal.timeout(4000) });
      srvData = await res.json();
    } catch {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${srvName}&type=SRV`, {
        headers: { 'Accept': 'application/dns-json' },
        signal: AbortSignal.timeout(4000)
      });
      srvData = await res.json();
    }

    if (!srvData?.Answer || srvData.Answer.length === 0) {
      return srvUri;
    }

    const hostList = srvData.Answer.map((ans) => {
      const parts = ans.data.trim().split(/\s+/);
      const port = parts[2] || '27017';
      const target = (parts[3] || '').replace(/\.$/, '');
      return `${target}:${port}`;
    }).filter(Boolean);

    if (hostList.length === 0) return srvUri;

    // Query TXT for replicaSet and authSource
    let txtParams = 'authSource=admin&replicaSet=atlas-57iice-shard-0';
    try {
      const txtRes = await fetch(`https://dns.google/resolve?name=${host}&type=TXT`, { signal: AbortSignal.timeout(3000) });
      const txtJson = await txtRes.json();
      if (txtJson?.Answer?.[0]?.data) {
        txtParams = txtJson.Answer[0].data.replace(/"/g, '');
      }
    } catch {
      // Use fallback params
    }

    const standardUri = `mongodb://${auth}@${hostList.join(',')}${dbPath}?ssl=true&${txtParams}&retryWrites=true&w=majority`;
    console.log('[Database] DNS-over-HTTPS successfully resolved standard MongoDB replica-set nodes');
    return standardUri;
  } catch (err) {
    console.warn(`[Database] DoH resolution fallback skipped: ${err.message}`);
    return srvUri;
  }
}

export const connectDatabase = async (uri = env.MONGODB_URI) => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  let connectionUri = uri;

  try {
    console.log('[Database] Connecting to MongoDB Atlas...');
    
    // First try connecting with provided URI with short timeout
    let connection;
    try {
      connection = await mongoose.connect(connectionUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        autoIndex: true
      });
    } catch (initialErr) {
      // If initial connection failed on mongodb+srv:// due to DNS SRV blocking, fallback to DoH
      if (connectionUri.startsWith('mongodb+srv://')) {
        console.log('[Database] Standard SRV lookup failed. Attempting DNS-over-HTTPS resolution fallback...');
        const resolvedUri = await resolveSrvWithDoH(connectionUri);
        if (resolvedUri !== connectionUri) {
          connectionUri = resolvedUri;
          connection = await mongoose.connect(connectionUri, {
            serverSelectionTimeoutMS: 20000,
            connectTimeoutMS: 20000,
            autoIndex: true
          });
        } else {
          throw initialErr;
        }
      } else {
        throw initialErr;
      }
    }

    isConnected = true;
    console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.log('[Database] MongoDB disconnected');
    });

    return connection;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    if (!env.isTest && env.isProduction) {
      process.exit(1);
    }
    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
};
