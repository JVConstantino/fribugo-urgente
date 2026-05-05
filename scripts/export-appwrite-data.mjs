#!/usr/bin/env node

/**
 * Export all Appwrite collections to JSON backup
 * Usage: node scripts/export-appwrite-data.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ENDPOINT = 'https://database.friburgourgente.com.br/v1';
const PROJECT_ID = '69f7b8ed000657470871';
const API_KEY = 'standard_52e6bde74c5a48d5dbb2d1e6c4fedbbdcbdd1bdb612c6aa453e1d641ff25eca16e329c762eee15d93e9e7b4c54a14fdd69385bc20b7d717bd8791506dfc78220f485d99e8204269839eeade30f50d96bf3a5d4ab6a39c8ed3f5cade995a89d95ef1dbb0a7b18de83f07d69989ec48f2d0e4b1908d05f068a949e5be9be43a2fd';
const DATABASE_ID = 'friburgourgente';

const COLLECTIONS = [
  'articles',
  'categories',
  'newsletter',
  'ads',
  'whatsapp_groups',
  'user_news',
  'ai_config',
  'system_settings',
  'popups',
];

const BACKUP_DIR = path.join(__dirname, '..', 'backups', new Date().toISOString().split('T')[0]);

async function exportCollection(collectionId) {
  console.log(`📦 Exportando ${collectionId}...`);
  const documents = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents?limit=${limit}&offset=${offset}`;
    const response = await fetch(url, {
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`❌ Erro ao exportar ${collectionId}:`, response.status, response.statusText);
      throw new Error(`Failed to export ${collectionId}`);
    }

    const data = await response.json();
    documents.push(...data.documents);

    if (data.documents.length < limit) break;
    offset += limit;
  }

  console.log(`✅ ${collectionId}: ${documents.length} documentos`);
  return documents;
}

async function main() {
  try {
    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    console.log(`📁 Backup dir: ${BACKUP_DIR}\n`);

    // Export all collections
    const allData = {};
    let totalDocs = 0;

    for (const collectionId of COLLECTIONS) {
      allData[collectionId] = await exportCollection(collectionId);
      totalDocs += allData[collectionId].length;
    }

    // Write JSON files
    for (const [collectionId, documents] of Object.entries(allData)) {
      const filepath = path.join(BACKUP_DIR, `${collectionId}.json`);
      fs.writeFileSync(filepath, JSON.stringify(documents, null, 2));
    }

    // Write schema documentation
    const schema = `# Appwrite Schema Backup — ${new Date().toISOString().split('T')[0]}

## Collections Exported

${COLLECTIONS.map((col) => `- **${col}**: ${allData[col].length} documents`).join('\n')}

## Total Documents: ${totalDocs}

## Field Reference

### articles
- title (string)
- slug (string, unique)
- content (string)
- excerpt (string)
- coverImageId (string, nullable)
- categoryId (string)
- authorId (string)
- isBreaking (boolean)
- isPublished (boolean)
- publishedAt (datetime)
- views (number)
- tags (string[])

### categories
- name (string)
- slug (string, unique)
- color (string)
- icon (string)
- sortOrder (number)

### newsletter
- email (string, unique)
- isActive (boolean)
- subscribedAt (datetime)

### ads
- title (string)
- imageId (string, nullable)
- linkUrl (string)
- format (string: leaderboard|banner|sidebar|square)
- pages (string[]: home|article|category|all)
- startsAt (datetime)
- endsAt (datetime)
- isActive (boolean)
- impressions (number)
- clicks (number)
- dailyLimit (number, nullable)

### whatsapp_groups
- title (string)
- description (string)
- link (string)
- category (string)
- imageId (string, nullable)
- isActive (boolean)
- sortOrder (number)

### user_news
- title (string)
- categoryId (string, nullable)
- description (string)
- location (string)
- whatHappened (string)
- mediaIds (string[])
- authorName (string)
- authorPhone (string)
- authorEmail (string)
- status (string: pending|processing|processed|rejected)
- aiSummary (string, nullable)
- aiCategory (string, nullable)
- aiAnalysis (string, nullable)
- adminNotes (string, nullable)

### ai_config
- provider (string)
- apiKey (string)
- endpoint (string)
- model (string)
- systemPrompt (string)
- isActive (boolean)

### system_settings
- key (string, unique)
- value (string)

### popups
- title (string)
- type (string: image|group)
- imageId (string, nullable)
- linkUrl (string, nullable)
- groupId (string, nullable)
- heading (string, nullable)
- description (string, nullable)
- startsAt (datetime)
- endsAt (datetime)
- isActive (boolean)
- impressions (number)
- clicks (number)
`;

    const schemaPath = path.join(BACKUP_DIR, '_schema.md');
    fs.writeFileSync(schemaPath, schema);

    console.log(`\n✅ Backup completo!`);
    console.log(`📁 Arquivo de schema: ${schemaPath}`);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
