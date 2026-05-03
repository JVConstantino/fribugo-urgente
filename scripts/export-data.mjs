/**
 * Exporta TODOS os dados do servidor antigo (documentos + arquivos)
 * Salva em um arquivo dump.json comprimido
 *
 * Uso: node scripts/export-data.mjs <API_KEY>
 */

import * as sdk from "node-appwrite";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error("\nUsage: node scripts/export-data.mjs <API_KEY>\n");
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint("https://constantino-database.m2lqbf.easypanel.host/v1")
  .setProject("69e00a02003c93871d98")
  .setKey(API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

const DB = "friburgourgente";
const BUCKET = "covers";
const COLLECTIONS = ["categories", "articles", "ads", "newsletter", "whatsapp_groups"];
const EXPORT_DIR = "./export";

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

async function exportDocuments() {
  console.log("📄 Exportando documentos...\n");
  const data = {};

  for (const col of COLLECTIONS) {
    let allDocs = [];
    let offset = 0;

    while (true) {
      try {
        const result = await databases.listDocuments(DB, col, [
          sdk.Query.limit(100),
          sdk.Query.offset(offset),
        ]);

        if (result.documents.length === 0) break;
        allDocs.push(...result.documents);
        process.stdout.write(`\r  ${col}: ${allDocs.length} docs...`);
        offset += 100;
      } catch (e) {
        console.log(`\n  ✗ Erro ao listar ${col}: ${e?.message ?? e}`);
        break;
      }
      await delay(100);
    }

    data[col] = allDocs;
    console.log(`\n  ✓ ${col}: ${allDocs.length} documentos`);
  }

  return data;
}

async function exportFiles() {
  console.log("\n🖼️  Exportando arquivos...\n");
  const files = [];
  let offset = 0;

  while (true) {
    try {
      const result = await storage.listFiles(BUCKET, [
        sdk.Query.limit(100),
        sdk.Query.offset(offset),
      ]);

      if (result.files.length === 0) break;

      for (const file of result.files) {
        try {
          const downloadUrl = `https://constantino-database.m2lqbf.easypanel.host/v1/storage/buckets/${BUCKET}/files/${file.$id}/view`;
          const buffer = await httpFetch(downloadUrl);

          files.push({
            $id: file.$id,
            name: file.name,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            data: buffer.toString("base64"),
          });

          process.stdout.write(`\r  ✓ ${files.length} arquivos...`);
        } catch (e) {
          console.log(`\n  ✗ Erro ao baixar ${file.$id}: ${e?.message ?? e}`);
        }
        await delay(100);
      }

      offset += 100;
    } catch (e) {
      console.log(`\n  ✗ Erro ao listar arquivos: ${e?.message ?? e}`);
      break;
    }
  }

  console.log(`\n  ✓ ${files.length} arquivos exportados\n`);
  return files;
}

async function main() {
  console.log(`
╔═════════════════════════════════════════════════════════════════════╗
║  📤 Exportando dados do servidor antigo
║  $(date)
╚═════════════════════════════════════════════════════════════════════╝
  `);

  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  try {
    const docs = await exportDocuments();
    const files = await exportFiles();

    const dump = {
      timestamp: new Date().toISOString(),
      collections: docs,
      files,
    };

    const dumpPath = path.join(EXPORT_DIR, "dump.json");
    fs.writeFileSync(dumpPath, JSON.stringify(dump, null, 2));

    console.log(`
╔═════════════════════════════════════════════════════════════════════╗
║  ✅ Exportação concluída!
║
║  Arquivo: ${dumpPath}
║  Tamanho: ${(fs.statSync(dumpPath).size / 1024 / 1024).toFixed(2)} MB
║
║  Próximo: node scripts/import-data.mjs <NEW_MASTER_KEY>
╚═════════════════════════════════════════════════════════════════════╝
    `);
  } catch (e) {
    console.error(`\n❌ Erro: ${e?.message ?? e}\n`);
    process.exit(1);
  }
}

main();
