const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'prospects.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

function strip(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

function jsonBackend() {
  let cache = null;

  function read() {
    if (cache) return cache;
    if (!fs.existsSync(FILE)) return null;
    try {
      const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      cache = Array.isArray(data) ? data : [];
    } catch {
      cache = [];
    }
    return cache;
  }

  function write(list) {
    cache = list;
    fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
  }

  return {
    name: 'json',
    async isSeeded() {
      return read() !== null;
    },
    async markSeeded() {
      if (read() === null) write([]);
    },
    async all() {
      return [...(read() || [])];
    },
    async get(id) {
      return (read() || []).find((p) => p.id === id) || null;
    },
    async insertMany(docs) {
      write([...(read() || []), ...docs]);
    },
    async put(doc) {
      const list = read() || [];
      const i = list.findIndex((p) => p.id === doc.id);
      if (i === -1) list.push(doc);
      else list[i] = doc;
      write(list);
    },
    async remove(id) {
      const list = read() || [];
      const next = list.filter((p) => p.id !== id);
      if (next.length === list.length) return false;
      write(next);
      return true;
    },
    async replaceAll(docs) {
      write(docs);
    },
    async getSettings() {
      if (!fs.existsSync(SETTINGS_FILE)) return null;
      try {
        return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      } catch {
        return null;
      }
    },
    async saveSettings(settings) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    }
  };
}

function mongoBackend(uri) {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  let ready = null;

  function connect() {
    if (!ready) {
      ready = (async () => {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || 'pulselocal');
        const prospects = db.collection('prospects');
        const meta = db.collection('meta');
        await prospects.createIndex({ id: 1 }, { unique: true });
        return { prospects, meta };
      })().catch((err) => {
        ready = null;
        throw err;
      });
    }
    return ready;
  }

  return {
    name: 'mongodb',
    connect,
    async isSeeded() {
      const { meta } = await connect();
      return Boolean(await meta.findOne({ _id: 'prospects_seeded' }));
    },
    async markSeeded() {
      const { meta } = await connect();
      await meta.updateOne({ _id: 'prospects_seeded' }, { $set: { at: new Date() } }, { upsert: true });
    },
    async all() {
      const { prospects } = await connect();
      return (await prospects.find({}).toArray()).map(strip);
    },
    async get(id) {
      const { prospects } = await connect();
      return strip(await prospects.findOne({ id }));
    },
    async insertMany(docs) {
      if (!docs.length) return;
      const { prospects } = await connect();
      await prospects.insertMany(docs.map((d) => ({ ...d })));
    },
    async put(doc) {
      const { prospects } = await connect();
      await prospects.replaceOne({ id: doc.id }, strip(doc), { upsert: true });
    },
    async remove(id) {
      const { prospects } = await connect();
      const res = await prospects.deleteOne({ id });
      return res.deletedCount > 0;
    },
    async replaceAll(docs) {
      const { prospects } = await connect();
      await prospects.deleteMany({});
      if (docs.length) await prospects.insertMany(docs.map((d) => ({ ...d })));
    },
    async getSettings() {
      const { meta } = await connect();
      const doc = await meta.findOne({ _id: 'settings' });
      return doc ? doc.value : null;
    },
    async saveSettings(settings) {
      const { meta } = await connect();
      await meta.updateOne({ _id: 'settings' }, { $set: { value: settings, at: new Date() } }, { upsert: true });
    }
  };
}

const backend = process.env.MONGODB_URI ? mongoBackend(process.env.MONGODB_URI) : jsonBackend();

module.exports = backend;
