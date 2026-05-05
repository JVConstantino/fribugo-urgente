#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupDir = path.join(__dirname, '..', 'backups', '2026-05-05');

// Map Appwrite fields to Supabase fields
const fieldMappings = {
  articles: { '$id': 'id', 'authorId': 'authorId', 'categoryId': 'categoryId', 'content': 'content', 'coverImageId': 'coverImageId', 'excerpt': 'excerpt', 'isBreaking': 'isBreaking', 'isPublished': 'isPublished', 'publishedAt': 'publishedAt', 'slug': 'slug', 'tags': 'tags', 'title': 'title', 'views': 'views', '$createdAt': 'created_at' },
  categories: { '$id': 'id', 'color': 'color', 'icon': 'icon', 'name': 'name', 'slug': 'slug', 'sortOrder': 'sortOrder' },
  ads: { '$id': 'id', 'clicks': 'clicks', 'endsAt': 'endsAt', 'format': 'format', 'imageId': 'imageId', 'impressions': 'impressions', 'isActive': 'isActive', 'linkUrl': 'linkUrl', 'pages': 'pages', 'startsAt': 'startsAt', 'title': 'title' },
  whatsapp_groups: { '$id': 'id', 'category': 'category', 'description': 'description', 'imageId': 'imageId', 'isActive': 'isActive', 'link': 'link', 'sortOrder': 'sortOrder', 'title': 'title' },
  user_news: { '$id': 'id', 'title': 'title', 'categoryId': 'categoryId', 'description': 'description', 'location': 'location', 'whatHappened': 'whatHappened', 'mediaIds': 'mediaIds', 'authorName': 'authorName', 'authorPhone': 'authorPhone', 'authorEmail': 'authorEmail', 'status': 'status', 'aiSummary': 'aiSummary', 'aiCategory': 'aiCategory', 'aiAnalysis': 'aiAnalysis', 'adminNotes': 'adminNotes', '$createdAt': 'created_at' },
  newsletter: { '$id': 'id', 'email': 'email', 'isActive': 'isActive', 'subscribedAt': 'subscribedAt', '$createdAt': 'created_at' },
  ai_config: { '$id': 'id', 'provider': 'provider', 'apiKey': 'apiKey', 'endpoint': 'endpoint', 'model': 'model', 'systemPrompt': 'systemPrompt', 'isActive': 'isActive' },
  system_settings: { '$id': 'id', 'key': 'key', 'value': 'value' },
  popups: { '$id': 'id', 'title': 'title', 'type': 'type', 'imageId': 'imageId', 'linkUrl': 'linkUrl', 'groupId': 'groupId', 'heading': 'heading', 'description': 'description', 'startsAt': 'startsAt', 'endsAt': 'endsAt', 'isActive': 'isActive', 'impressions': 'impressions', 'clicks': 'clicks' },
};

const collections = ['articles', 'categories', 'newsletter', 'ads', 'whatsapp_groups', 'user_news', 'ai_config', 'system_settings', 'popups'];

let sql = `-- Supabase Data Import SQL\n-- Generated for migration from Appwrite\n-- Run this in Supabase SQL Editor\n\nBEGIN;\n\n`;

for (const collection of collections) {
  const filePath = path.join(backupDir, \`\${collection}.json\`);
  const mapping = fieldMappings[collection];

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!Array.isArray(data) || data.length === 0) {
      sql += \`-- \${collection}: no data\n\n\`;
      continue;
    }

    sql += \`-- \${collection}: \${data.length} records\nINSERT INTO \${collection} ("\`;
    
    const fields = Object.values(mapping).sort();
    sql += fields.join('", "') + '") VALUES\n';

    const rows = data.map(record => {
      const vals = fields.map(supabaseField => {
        const appwriteField = Object.entries(mapping).find(([, val]) => val === supabaseField)?.[0];
        const val = record[appwriteField];

        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return \`'\${val.replace(/'/g, "''")}\'\`;
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (Array.isArray(val)) {
          const arr = val.map(v => \`"\${String(v).replace(/"/g, '\\\\"')}"\`).join(',');
          return \`'{\${arr}}'\`;
        }
        return String(val);
      });
      return \`(\${vals.join(', ')})\`;
    });

    sql += rows.join(',\n') + '\nON CONFLICT (id) DO NOTHING;\n\n';
  } catch (err) {
    console.error(\`Error: \${collection}.json - \${err.message}\`);
  }
}

sql += 'COMMIT;\n';

fs.writeFileSync(path.join(__dirname, 'supabase-import-data.sql'), sql);
console.log(\`✅ Generated: scripts/supabase-import-data.sql (\${(sql.length / 1024).toFixed(2)} KB)\`);
