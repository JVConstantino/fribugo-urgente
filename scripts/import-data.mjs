/**
 * Importa TODOS os dados para o novo servidor (documentos + arquivos)
 * Lê do arquivo dump.json e cria schema + sobe dados
 *
 * Uso: node scripts/import-data.mjs <DEV_KEY>
 */

import * as sdk from "node-appwrite";
import fs from "fs";
import path from "path";

const DEV_KEY = process.argv[2];
if (!DEV_KEY) {
  console.error("\nUsage: node scripts/import-data.mjs <DEV_KEY>\n");
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint("https://friburgourgente-database.veuxld.easypanel.host/v1")
  .setProject("69f6ddd7002c4044a9f4");

// Usar dev key em vez de API key
client.headers["X-Appwrite-Dev-Key"] = DEV_KEY;
delete client.headers["X-Appwrite-Key"];

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const DB = "friburgourgente";
const BUCKET = "covers";
const DUMP_PATH = "./export/dump.json";

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createSchema() {
  console.log("🔄 Criando schema...\n");

  // Database
  try {
    await databases.create(DB, "Friburgo Urgente");
    console.log("  ✓ Database criado");
  } catch (e) {
    if (e.code !== 409) throw e;
    console.log("  ℹ Database já existe");
  }
  await delay(500);

  // Collections
  const schemas = {
    categories: [
      { name: "name", type: "string", size: 256, required: true },
      { name: "slug", type: "string", size: 256, required: true },
      { name: "color", type: "string", size: 32, required: true },
      { name: "icon", type: "string", size: 64, required: false },
      { name: "sortOrder", type: "integer", required: true },
    ],
    articles: [
      { name: "title", type: "string", size: 256, required: true },
      { name: "slug", type: "string", size: 256, required: true },
      { name: "content", type: "string", size: 500000, required: true },
      { name: "excerpt", type: "string", size: 1000, required: true },
      { name: "coverImageId", type: "string", size: 256, required: false },
      { name: "categoryId", type: "string", size: 36, required: true },
      { name: "authorId", type: "string", size: 36, required: true },
      { name: "isBreaking", type: "boolean", required: true },
      { name: "isPublished", type: "boolean", required: true },
      { name: "publishedAt", type: "datetime", required: true },
      { name: "views", type: "integer", required: true, default: 0 },
      { name: "tags", type: "stringArray", size: 256, required: false },
    ],
    ads: [
      { name: "title", type: "string", size: 256, required: true },
      { name: "imageId", type: "string", size: 256, required: false },
      { name: "linkUrl", type: "string", size: 512, required: true },
      { name: "format", type: "enum", options: ["leaderboard", "banner", "sidebar", "square"], required: true },
      { name: "pages", type: "stringArray", size: 64, required: false },
      { name: "startsAt", type: "datetime", required: true },
      { name: "endsAt", type: "datetime", required: true },
      { name: "isActive", type: "boolean", required: true },
      { name: "impressions", type: "integer", required: false, default: 0 },
      { name: "clicks", type: "integer", required: false, default: 0 },
    ],
    newsletter: [
      { name: "email", type: "string", size: 256, required: true },
      { name: "subscribedAt", type: "string", size: 64, required: true },
      { name: "isActive", type: "boolean", required: true },
    ],
    whatsapp_groups: [
      { name: "title", type: "string", size: 256, required: true },
      { name: "description", type: "string", size: 512, required: false, default: "" },
      { name: "link", type: "string", size: 512, required: true },
      { name: "category", type: "string", size: 128, required: false, default: "" },
      { name: "imageId", type: "string", size: 256, required: false },
      { name: "isActive", type: "boolean", required: true, default: true },
      { name: "sortOrder", type: "integer", required: false, default: 0 },
    ],
  };

  for (const [colId, attrs] of Object.entries(schemas)) {
    try {
      await databases.createCollection(
        DB,
        colId,
        colId.charAt(0).toUpperCase() + colId.slice(1),
        undefined,
        false,
        ["role:all"]
      );
      console.log(`  ✓ Collection ${colId}`);

      for (const attr of attrs) {
        try {
          if (attr.type === "string") {
            await databases.createStringAttribute(DB, colId, attr.name, attr.size, attr.required, attr.default);
          } else if (attr.type === "integer") {
            await databases.createIntegerAttribute(DB, colId, attr.name, attr.required, attr.default);
          } else if (attr.type === "boolean") {
            await databases.createBooleanAttribute(DB, colId, attr.name, attr.required, attr.default);
          } else if (attr.type === "datetime") {
            await databases.createDatetimeAttribute(DB, colId, attr.name, attr.required, attr.default);
          } else if (attr.type === "enum") {
            await databases.createEnumAttribute(DB, colId, attr.name, attr.options, attr.required, attr.default);
          } else if (attr.type === "stringArray") {
            await databases.createStringAttribute(DB, colId, attr.name, attr.size, attr.required, attr.default, true);
          }
          process.stdout.write(`\r    ${colId}.${attr.name}...`);
        } catch (e) {
          if (e.code !== 409) {
            console.log(`\n    ✗ ${attr.name}: ${e?.message ?? e}`);
          }
        }
        await delay(700);
      }
      console.log(`\r    ✓ ${colId} pronto              `);
    } catch (e) {
      if (e.code !== 409) {
        console.log(`  ✗ ${colId}: ${e?.message ?? e}`);
      }
    }
  }

  // Bucket
  try {
    await storage.createBucket(BUCKET, BUCKET, undefined, false, false, ["role:all"]);
    console.log("  ✓ Bucket criado");
  } catch (e) {
    if (e.code !== 409) throw e;
    console.log("  ℹ Bucket já existe");
  }

  console.log();
}

async function importDocuments(collections) {
  console.log("📄 Importando documentos...\n");

  for (const [col, docs] of Object.entries(collections)) {
    let count = 0;
    let errors = 0;

    for (const doc of docs) {
      try {
        const payload = { ...doc };
        delete payload.$id;
        delete payload.$createdAt;
        delete payload.$updatedAt;
        delete payload.$permissions;
        delete payload.$databaseId;
        delete payload.$collectionId;

        await databases.createDocument(DB, col, doc.$id, payload);
        count++;
        process.stdout.write(`\r  ${col}: ${count}/${docs.length}...`);
      } catch (e) {
        errors++;
        console.log(`\n    ✗ Doc ${doc.$id}: ${e?.message ?? e}`);
      }
      await delay(100);
    }

    console.log(`\r  ${col}: ${count}/${docs.length} ✓${errors > 0 ? ` (${errors} erros)` : ""}              `);
  }

  console.log();
}

async function importFiles(files) {
  console.log("🖼️  Importando arquivos...\n");

  let count = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const buffer = Buffer.from(file.data, "base64");
      await storage.createFile(
        BUCKET,
        file.$id,
        sdk.InputFile.fromBuffer(buffer, file.name, file.mimeType)
      );
      count++;
      process.stdout.write(`\r  ✓ ${count}/${files.length}...`);
    } catch (e) {
      errors++;
      console.log(`\n  ✗ ${file.$id}: ${e?.message ?? e}`);
    }
    await delay(100);
  }

  console.log(`\n  ✓ ${count}/${files.length}${errors > 0 ? ` (${errors} erros)` : ""}\n`);
}

async function main() {
  console.log(`
╔═════════════════════════════════════════════════════════════════════╗
║  📥 Importando dados para o novo servidor
║  ${new Date().toISOString()}
╚═════════════════════════════════════════════════════════════════════╝
  `);

  try {
    if (!fs.existsSync(DUMP_PATH)) {
      console.error(`\n❌ Arquivo não encontrado: ${DUMP_PATH}\n`);
      console.error(`Antes rode: node scripts/export-data.mjs <OLD_API_KEY>\n`);
      process.exit(1);
    }

    const dump = JSON.parse(fs.readFileSync(DUMP_PATH, "utf8"));
    console.log(`📦 Dump carregado (${(fs.statSync(DUMP_PATH).size / 1024 / 1024).toFixed(2)} MB)\n`);

    // await createSchema(); // Schema já foi criado
    await importDocuments(dump.collections);
    await importFiles(dump.files);

    console.log(`
╔═════════════════════════════════════════════════════════════════════╗
║  ✅ Importação concluída!
║
║  Próximos passos:
║  1. Atualizar .env com novo endpoint/projectId:
║     VITE_APPWRITE_ENDPOINT=https://friburgourgente-database.veuxld.easypanel.host/v1
║     VITE_APPWRITE_PROJECT_ID=69f6ddd7002c4044a9f4
║  2. npm run dev + verificar funcionalidade
║  3. git push → Vercel redeploya
╚═════════════════════════════════════════════════════════════════════╝
    `);
  } catch (e) {
    console.error(`\n❌ Erro: ${e?.message ?? e}\n`);
    process.exit(1);
  }
}

main();
