/**
 * Baixa imagens do Unsplash e faz upload como capa dos artigos.
 * Uso: node scripts/upload-covers.mjs <API_KEY>
 */

import * as sdk from "node-appwrite";
import https from "https";
import http from "http";

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error("\nUsage: node scripts/upload-covers.mjs <API_KEY>\n");
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint("https://constantino-database.m2lqbf.easypanel.host/v1")
  .setProject("69e00a02003c93871d98")
  .setKey(API_KEY);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);
const DB = "friburgourgente";
const COL = "articles";
const BUCKET = "covers";

// Artigos criados pelo seed + imagens temáticas do Unsplash (IDs diretos)
const articles = [
  {
    id: "69e0ddf800198f777a8d",
    title: "Obras de revitalização do centro histórico",
    imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80",
    filename: "centro-historico.jpg",
  },
  {
    id: "69e0ddfa00144c288421",
    title: "Câmara Municipal aprova orçamento",
    imageUrl: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=1200&q=80",
    filename: "camara-municipal.jpg",
  },
  {
    id: "69e0ddfc001bceb4859d",
    title: "Polo industrial — crescimento 12%",
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80",
    filename: "polo-industrial.jpg",
  },
  {
    id: "69e0ddfe000673b58d07",
    title: "Hospital Municipal Raul Sertã — UTI",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80",
    filename: "hospital.jpg",
  },
  {
    id: "69e0ddff0029bb2163c7",
    title: "CEFET-RJ — novo campus",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
    filename: "campus-universitario.jpg",
  },
  {
    id: "69e0de01000d5e6d21b1",
    title: "Reflorestamento — 500 hectares",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80",
    filename: "reflorestamento.jpg",
  },
  {
    id: "69e0de030029cedf5a88",
    title: "Operação PM — redução de roubos",
    imageUrl: "https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=1200&q=80",
    filename: "seguranca-publica.jpg",
  },
  {
    id: "69e0de0600380e138eda",
    title: "Nova Friburgo FC — semifinal",
    imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80",
    filename: "futebol.jpg",
  },
  {
    id: "69e0de080027baddedf8",
    title: "Festival de Inverno — programação",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80",
    filename: "festival-inverno.jpg",
  },
  {
    id: "69e0de0a0018c46dcc86",
    title: "Programa habitacional — Conselheiro Paulino",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
    filename: "habitacao.jpg",
  },
  {
    id: "69e0de0c000990596ccc",
    title: "Moda íntima — exportações R$ 52 mi",
    imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80",
    filename: "moda-intima.jpg",
  },
  {
    id: "69e0de0e00080a257783",
    title: "Vacinação contra dengue",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80",
    filename: "vacinacao.jpg",
  },
  {
    id: "69e0de11000893b89f18",
    title: "Defesa Civil — alerta deslizamentos",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
    filename: "chuvas-serra.jpg",
  },
  {
    id: "69e0de130011bc6919e4",
    title: "Robótica nas escolas",
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80",
    filename: "robotica-educacao.jpg",
  },
  {
    id: "69e0de14002e53abbf57",
    title: "Prêmio turismo de montanha",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
    filename: "turismo-montanha.jpg",
  },
];

// ── Download helper (segue redirecionamentos) ─────────────────────────────────

function download(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error("Too many redirects"));
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nProcessando ${articles.length} artigos...\n`);

  for (const art of articles) {
    try {
      process.stdout.write(`  ↓ Baixando imagem para "${art.title.slice(0, 45)}..."  `);

      // 1. Download
      const buffer = await download(art.imageUrl);
      process.stdout.write(`(${(buffer.length / 1024).toFixed(0)} KB)  `);

      // 2. Upload para Appwrite Storage
      const file = await storage.createFile(
        BUCKET,
        sdk.ID.unique(),
        sdk.InputFile.fromBuffer(buffer, art.filename, "image/jpeg")
      );

      // 3. Atualizar artigo com coverImageId
      await databases.updateDocument(DB, COL, art.id, {
        coverImageId: file.$id,
      });

      console.log(`✓  [${file.$id}]`);
    } catch (e) {
      console.log(`\n  ✗ Erro: ${e.message}`);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n✅ Concluído!\n");
}

main();
