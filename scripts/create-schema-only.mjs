/**
 * Cria schema (database + collections + bucket) no novo servidor
 * Uso: node scripts/create-schema-only.mjs
 */

import * as sdk from "node-appwrite";

const DST_ENDPOINT = "https://friburgourgente-database.veuxld.easypanel.host/v1";
const DST_PROJECT = "69f7b8ed000657470871";
const DST_KEY = "standard_52e6bde74c5a48d5dbb2d1e6c4fedbbdcbdd1bdb612c6aa453e1d641ff25eca16e329c762eee15d93e9e7b4c54a14fdd69385bc20b7d717bd8791506dfc78220f485d99e8204269839eeade30f50d96bf3a5d4ab6a39c8ed3f5cade995a89d95ef1dbb0a7b18de83f07d69989ec48f2d0e4b1908d05f068a949e5be9be43a2fd";

const client = new sdk.Client()
  .setEndpoint(DST_ENDPOINT)
  .setProject(DST_PROJECT)
  .setKey(DST_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const DB = "friburgourgente";
const BUCKET = "covers";

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createSchema() {
  console.log(`
╔═════════════════════════════════════════════════════════════════════╗
║  🔨 Criando schema no novo servidor
╚═════════════════════════════════════════════════════════════════════╝
  `);

  // 1. Create database
  try {
    await databases.create(DB, "Friburgo Urgente");
    console.log("  ✓ Database criado");
  } catch (e) {
    if (e.code === 409) {
      console.log("  ℹ Database já existe");
    } else {
      throw e;
    }
  }

  await delay(500);

  // 2. Create collections (minimal)
  const collections = ["categories", "articles", "ads", "newsletter", "whatsapp_groups"];

  for (const col of collections) {
    try {
      await databases.createCollection(DB, col, col, undefined, false, []);
      console.log(`  ✓ Collection ${col}`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`  ℹ Collection ${col} já existe`);
      } else {
        console.log(`  ✗ ${col}: ${e?.message}`);
      }
    }

    await delay(500);
  }

  // 3. Create bucket
  try {
    await storage.createBucket(BUCKET, BUCKET, []);
    console.log("  ✓ Bucket criado");
  } catch (e) {
    if (e.code === 409) {
      console.log("  ℹ Bucket já existe");
    } else {
      throw e;
    }
  }

  console.log(`
✅ Schema criado!

Próximo: node scripts/import-documents.mjs
  `);
}

try {
  await createSchema();
} catch (e) {
  console.error(`❌ Erro: ${e?.message ?? e}`);
  process.exit(1);
}
