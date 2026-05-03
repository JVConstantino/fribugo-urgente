/**
 * Migração Appwrite: servidor antigo → novo servidor
 * Migrações: usuários, database, 5 collections, 1 bucket com todos os arquivos
 *
 * Uso:
 *   node scripts/migrate.mjs \
 *     --src-endpoint https://constantino-database.m2lqbf.easypanel.host/v1 \
 *     --src-project 69e00a02003c93871d98 \
 *     --src-key <OLD_API_KEY> \
 *     --dst-endpoint https://database.friburgourgente.com.br/v1 \
 *     --dst-project 69f6ddd7002c4044a9f4 \
 *     --dst-key <DST_API_KEY>
 */

import * as sdk from "node-appwrite";
import https from "https";
import http from "http";

// ─── Config ──────────────────────────────────────────────────────────────────

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
}

const SRC_ENDPOINT = args["src-endpoint"];
const SRC_PROJECT = args["src-project"];
const SRC_KEY = args["src-key"];
const DST_ENDPOINT = args["dst-endpoint"];
const DST_PROJECT = args["dst-project"];
const DST_KEY = args["dst-key"];

if (!SRC_ENDPOINT || !SRC_PROJECT || !SRC_KEY || !DST_ENDPOINT || !DST_PROJECT || !DST_KEY) {
  console.error(`
Usage: node scripts/migrate.mjs \\
  --src-endpoint https://... \\
  --src-project <ID> \\
  --src-key <KEY> \\
  --dst-endpoint https://... \\
  --dst-project <ID> \\
  --dst-key <KEY>
  `);
  process.exit(1);
}

const srcClient = new sdk.Client()
  .setEndpoint(SRC_ENDPOINT)
  .setProject(SRC_PROJECT)
  .setKey(SRC_KEY);

const dstClient = new sdk.Client()
  .setEndpoint(DST_ENDPOINT)
  .setProject(DST_PROJECT)
  .setKey(DST_KEY);

const srcDatabases = new sdk.Databases(srcClient);
const srcStorage = new sdk.Storage(srcClient);
const dstDatabases = new sdk.Databases(dstClient);
const dstStorage = new sdk.Storage(dstClient);

const DB = "friburgourgente";
const BUCKET = "covers";
const COLLECTIONS = ["categories", "articles", "ads", "newsletter", "whatsapp_groups"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function httpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.request(url, { ...options, headers: { "User-Agent": "Mozilla/5.0", ...options.headers } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpFetch(res.headers.location, options).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ─── Fase 0 — Usuários (REST direto) ────────────────────────────────────────

async function migrateUsers() {
  console.log("\n🔄 Fase 0: Usuários...");
  let count = 0;
  let errors = 0;
  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      const res = await httpFetch(`${SRC_ENDPOINT}/users?limit=${limit}&offset=${offset}`, {
        headers: { "X-Appwrite-Key": SRC_KEY },
      });
      const data = JSON.parse(res.toString());
      if (!data.users || data.users.length === 0) break;

      for (const user of data.users) {
        try {
          const userId = user.$id;
          const email = user.email;
          const password = user.password; // bcrypt hash
          const name = user.name || "";
          const phone = user.phone || "";

          // Criar com bcrypt hash
          await dstClient.call(sdk.Client.REQUEST_METHOD_POST, "/users/bcrypt", {
            headers: { "X-Appwrite-Key": DST_KEY },
            body: {
              userId,
              email,
              password,
              name,
            },
          });

          if (phone) {
            await dstClient.call(sdk.Client.REQUEST_METHOD_PATCH, `/users/${userId}/phone`, {
              headers: { "X-Appwrite-Key": DST_KEY },
              body: { phone },
            });
          }

          if (user.labels && user.labels.length > 0) {
            await dstClient.call(sdk.Client.REQUEST_METHOD_PUT, `/users/${userId}/labels`, {
              headers: { "X-Appwrite-Key": DST_KEY },
              body: { labels: user.labels },
            });
          }

          if (user.prefs && Object.keys(user.prefs).length > 0) {
            await dstClient.call(sdk.Client.REQUEST_METHOD_PATCH, `/users/${userId}/prefs`, {
              headers: { "X-Appwrite-Key": DST_KEY },
              body: { prefs: user.prefs },
            });
          }

          count++;
          process.stdout.write(`\r  ✓ ${count} usuários migrados...`);
        } catch (e) {
          errors++;
          console.log(`\n  ✗ Erro ao migrar user ${user.$id}: ${e?.message ?? e}`);
        }
        await delay(100);
      }

      offset += limit;
    } catch (e) {
      console.log(`\n  ✗ Erro ao listar usuários (offset ${offset}): ${e?.message ?? e}`);
      break;
    }
  }

  console.log(`\n  ✅ Usuários: ${count} migrados, ${errors} erros\n`);
}

// ─── Fase 1 — Schema no destino ─────────────────────────────────────────────

async function createSchema() {
  console.log("🔄 Fase 1: Criando schema no destino...");

  // Database
  try {
    await dstDatabases.create(DB, "Friburgo Urgente");
    console.log("  ✓ Database criado");
  } catch (e) {
    if (e.code !== 409) throw e; // 409 = já existe
    console.log("  ℹ Database já existe");
  }
  await delay(500);

  // Collections
  const collectionSchemas = {
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

  for (const [colId, attrs] of Object.entries(collectionSchemas)) {
    try {
      await dstDatabases.createCollection(
        DB,
        colId,
        colId.charAt(0).toUpperCase() + colId.slice(1),
        undefined,
        undefined,
        ["role:all"]
      );
      console.log(`  ✓ Collection ${colId} criado`);

      for (const attr of attrs) {
        try {
          if (attr.type === "string") {
            await dstDatabases.createStringAttribute(
              DB,
              colId,
              attr.name,
              attr.size,
              attr.required,
              attr.default
            );
          } else if (attr.type === "integer") {
            await dstDatabases.createIntegerAttribute(
              DB,
              colId,
              attr.name,
              attr.required,
              attr.default
            );
          } else if (attr.type === "boolean") {
            await dstDatabases.createBooleanAttribute(
              DB,
              colId,
              attr.name,
              attr.required,
              attr.default
            );
          } else if (attr.type === "datetime") {
            await dstDatabases.createDatetimeAttribute(
              DB,
              colId,
              attr.name,
              attr.required,
              attr.default
            );
          } else if (attr.type === "enum") {
            await dstDatabases.createEnumAttribute(
              DB,
              colId,
              attr.name,
              attr.options,
              attr.required,
              attr.default
            );
          } else if (attr.type === "stringArray") {
            await dstDatabases.createStringAttribute(
              DB,
              colId,
              attr.name,
              attr.size,
              attr.required,
              attr.default,
              true // isArray
            );
          }
          process.stdout.write(`\r    ${colId}.${attr.name}...`);
        } catch (e) {
          if (e.code !== 409) {
            console.log(`\n    ✗ Erro ao criar atributo ${attr.name}: ${e?.message ?? e}`);
          }
        }
        await delay(700); // Appwrite processa atributos de forma assíncrona
      }
      console.log(`\r    ✓ ${colId} pronto              `);
    } catch (e) {
      if (e.code !== 409) {
        console.log(`  ✗ Erro ao criar collection ${colId}: ${e?.message ?? e}`);
      } else {
        console.log(`  ℹ Collection ${colId} já existe`);
      }
    }
  }

  // Bucket
  try {
    await dstStorage.createBucket(BUCKET, BUCKET, ["role:all"], false, false, 30000000, false);
    console.log("  ✓ Bucket criado");
  } catch (e) {
    if (e.code !== 409) throw e;
    console.log("  ℹ Bucket já existe");
  }

  console.log();
}

// ─── Fase 2 — Documentos ─────────────────────────────────────────────────────

async function migrateDocuments() {
  console.log("🔄 Fase 2: Migrando documentos...");

  for (const col of COLLECTIONS) {
    let count = 0;
    let errors = 0;
    let offset = 0;

    while (true) {
      try {
        const result = await srcDatabases.listDocuments(DB, col, [
          sdk.Query.limit(100),
          sdk.Query.offset(offset),
        ]);

        if (result.documents.length === 0) break;

        for (const doc of result.documents) {
          try {
            const payload = { ...doc };
            delete payload.$id;
            delete payload.$createdAt;
            delete payload.$updatedAt;
            delete payload.$permissions;
            delete payload.$databaseId;
            delete payload.$collectionId;

            await dstDatabases.createDocument(DB, col, doc.$id, payload);
            count++;
            process.stdout.write(`\r  ${col}: ${count} docs...`);
          } catch (e) {
            errors++;
            console.log(`\n    ✗ Erro ao criar doc ${doc.$id}: ${e?.message ?? e}`);
          }
          await delay(100);
        }

        offset += 100;
      } catch (e) {
        console.log(`\n  ✗ Erro ao listar docs de ${col}: ${e?.message ?? e}`);
        break;
      }
    }

    console.log(`\r  ${col}: ${count} docs migrados, ${errors} erros          `);
  }

  console.log();
}

// ─── Fase 3 — Arquivos ────────────────────────────────────────────────────

async function migrateFiles() {
  console.log("🔄 Fase 3: Migrando arquivos...");

  let count = 0;
  let errors = 0;
  let offset = 0;
  let fileIdMap = {};

  while (true) {
    try {
      const result = await srcStorage.listFiles(BUCKET, [
        sdk.Query.limit(100),
        sdk.Query.offset(offset),
      ]);

      if (result.files.length === 0) break;

      for (const file of result.files) {
        try {
          const fileId = file.$id;

          // Download
          const downloadUrl = `${SRC_ENDPOINT}/storage/buckets/${BUCKET}/files/${fileId}/download`;
          const buffer = await httpFetch(downloadUrl, {
            headers: { "X-Appwrite-Key": SRC_KEY },
          });

          // Upload com mesmo ID
          let newFileId = fileId;
          try {
            await dstStorage.createFile(
              BUCKET,
              fileId,
              sdk.InputFile.fromBuffer(buffer, file.name, file.mimeType)
            );
            fileIdMap[fileId] = fileId;
          } catch (uploadErr) {
            // Se falhar por ID customizado, usar ID único
            if (uploadErr.code === 400 || uploadErr.code === 409) {
              newFileId = sdk.ID.unique();
              await dstStorage.createFile(
                BUCKET,
                newFileId,
                sdk.InputFile.fromBuffer(buffer, file.name, file.mimeType)
              );
              fileIdMap[fileId] = newFileId;
            } else {
              throw uploadErr;
            }
          }

          count++;
          process.stdout.write(`\r  ✓ ${count} arquivos...`);
        } catch (e) {
          errors++;
          console.log(`\n  ✗ Erro ao migrar arquivo ${file.$id}: ${e?.message ?? e}`);
        }
        await delay(100);
      }

      offset += 100;
    } catch (e) {
      console.log(`\n  ✗ Erro ao listar arquivos: ${e?.message ?? e}`);
      break;
    }
  }

  console.log(`\n  ✅ Arquivos: ${count} migrados, ${errors} erros\n`);

  // Se houver remapping, atualizar docs
  const needsRemap = Object.values(fileIdMap).some((v) => v !== Object.keys(fileIdMap).find((k) => fileIdMap[k] === v));
  if (needsRemap) {
    console.log("  🔄 Remapeando referências de arquivos...");
    // Atualizar articles.coverImageId, ads.imageId, whatsapp_groups.imageId
    for (const [oldId, newId] of Object.entries(fileIdMap)) {
      if (oldId === newId) continue;

      try {
        const articles = await dstDatabases.listDocuments(DB, "articles", [sdk.Query.equal("coverImageId", oldId)]);
        for (const doc of articles.documents) {
          await dstDatabases.updateDocument(DB, "articles", doc.$id, { coverImageId: newId });
        }
      } catch {}

      try {
        const ads = await dstDatabases.listDocuments(DB, "ads", [sdk.Query.equal("imageId", oldId)]);
        for (const doc of ads.documents) {
          await dstDatabases.updateDocument(DB, "ads", doc.$id, { imageId: newId });
        }
      } catch {}

      try {
        const groups = await dstDatabases.listDocuments(DB, "whatsapp_groups", [
          sdk.Query.equal("imageId", oldId),
        ]);
        for (const doc of groups.documents) {
          await dstDatabases.updateDocument(DB, "whatsapp_groups", doc.$id, { imageId: newId });
        }
      } catch {}
    }
    console.log("  ✓ Remapeamento concluído\n");
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`
╔═════════════════════════════════════════════════════════════════════╗
║  Migração Appwrite: ${SRC_ENDPOINT.split("/")[2]} → ${DST_ENDPOINT.split("/")[2]}
╚═════════════════════════════════════════════════════════════════════╝
  `);

  try {
    // await migrateUsers();
    await createSchema();
    await migrateDocuments();
    await migrateFiles();

    console.log(`
╔═════════════════════════════════════════════════════════════════════╗
║  ✅ Migração concluída com sucesso!
║
║  Próximos passos:
║  1. Atualizar .env com novo endpoint/projectId
║  2. Adicionar https://fribugourgente.vercel.app no novo Appwrite
║  3. npm run dev + verificar funcionalidade
║  4. git push → Vercel redeploya
╚═════════════════════════════════════════════════════════════════════╝
    `);
  } catch (e) {
    console.error(`\n❌ Erro durante migração: ${e?.message ?? e}\n`);
    process.exit(1);
  }
}

main();
