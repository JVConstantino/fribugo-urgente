/**
 * Script de setup das collections do Appwrite
 *
 * Executar com: node setup-appwrite.mjs
 *
 * Requer variáveis de ambiente:
 *   VITE_APPWRITE_ENDPOINT
 *   VITE_APPWRITE_PROJECT_ID
 *   VITE_APPWRITE_API_KEY  (criar no console: Settings → API Keys)
 */

import { Client, Databases, Storage, ID, Permission, Role } from "node-appwrite";

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || "https://friburgourgente-database.veuxld.easypanel.host/v1";
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || "69f7b8ed000657470871";
const API_KEY = process.env.VITE_APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "friburgourgente";

if (!API_KEY) {
  console.error("❌ Defina a variável VITE_APPWRITE_API_KEY");
  console.error("   Crie em: Appwrite Console → Settings → API Keys → Create API Key");
  console.error("   Permissões necessárias: collections.write, documents.write, buckets.write, files.write");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

async function createCollectionIfNotExists(name, attrs) {
  try {
    await databases.getCollection(DATABASE_ID, name);
    console.log(`✅ Collection "${name}" já existe`);
  } catch {
    console.log(`📦 Criando collection "${name}"...`);
    await databases.createCollection(DATABASE_ID, name, name, [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ]);
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Always try to create attributes (skip if already exists)
  for (const attr of attrs) {
    console.log(`   └─ Criando atributo "${attr.key}"...`);
    try {
      if (attr.type === "string") {
        if (attr.array) {
          await databases.createStringAttribute(DATABASE_ID, name, attr.key, attr.size || 255, attr.required || false, undefined, true);
        } else {
          await databases.createStringAttribute(DATABASE_ID, name, attr.key, attr.size || 255, attr.required || false, attr.default);
        }
      } else if (attr.type === "boolean") {
        await databases.createBooleanAttribute(DATABASE_ID, name, attr.key, attr.required || false, attr.default);
      }
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("already exists")) {
        console.log(`      ⏭️  Já existe`);
      } else {
        console.log(`      ⚠️  ${msg}`);
      }
    }
  }
  console.log(`✅ Atributos de "${name}" configurados`);
}

async function createBucketIfNotExists(name) {
  try {
    await storage.getBucket(name);
    console.log(`✅ Bucket "${name}" já existe`);
    return;
  } catch {
    // não existe
  }

  console.log(`📦 Criando bucket "${name}"...`);
  await storage.createBucket({
    bucketId: name,
    name: name,
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
      Permission.update(Role.any()),
      Permission.delete(Role.any()),
    ],
    fileSecurity: false,
    enabled: true,
    maximumFileSize: 30000000,
    allowedFileExtensions: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "webm"],
  });
  console.log(`✅ Bucket "${name}" criado (max 30MB)`);
}

async function main() {
  console.log("🚀 Setup do Friburgo Urgente - Appwrite\n");

  // 1. system_settings
  await createCollectionIfNotExists("system_settings", [
    { key: "key", type: "string", size: 100, required: true },
    { key: "value", type: "string", size: 5000 },
  ]);

  // 2. ai_config
  await createCollectionIfNotExists("ai_config", [
    { key: "provider", type: "string", size: 50 },
    { key: "apiKey", type: "string", size: 500 },
    { key: "endpoint", type: "string", size: 500 },
    { key: "model", type: "string", size: 200 },
    { key: "systemPrompt", type: "string", size: 5000 },
    { key: "isActive", type: "boolean", default: true },
  ]);

  // 3. user_news
  await createCollectionIfNotExists("user_news", [
    { key: "title", type: "string", size: 500, required: true },
    { key: "categoryId", type: "string", size: 50 },
    { key: "description", type: "string", size: 5000 },
    { key: "location", type: "string", size: 500 },
    { key: "whatHappened", type: "string", size: 2000 },
    { key: "mediaIds", type: "string", size: 50, array: true },
    { key: "authorName", type: "string", size: 200 },
    { key: "authorPhone", type: "string", size: 20 },
    { key: "authorEmail", type: "string", size: 200 },
    { key: "status", type: "string", size: 20, default: "pending" },
    { key: "aiSummary", type: "string", size: 2000 },
    { key: "aiCategory", type: "string", size: 100 },
    { key: "aiAnalysis", type: "string", size: 5000 },
    { key: "adminNotes", type: "string", size: 2000 },
  ]);

  // 4. Bucket de mídia
  await createBucketIfNotExists("user_media");

  console.log("\n✅ Setup concluído!");
  console.log("   Acesse o admin e configure o webhook do N8n em /admin/configuracoes");
}

main().catch((err) => {
  console.error("❌ Erro:", err.message);
  process.exit(1);
});
