#!/bin/bash

# Importa dados via REST (curl)
# Uso: bash scripts/import-rest.sh <DEV_KEY>

DST_ENDPOINT="https://friburgourgente-database.veuxld.easypanel.host/v1"
DST_PROJECT="69f6ddd7002c4044a9f4"
DST_KEY="$1"

if [ -z "$DST_KEY" ]; then
  echo "Usage: bash scripts/import-rest.sh <DEV_KEY>"
  exit 1
fi

DB="friburgourgente"
BUCKET="covers"
DUMP_FILE="./export/dump.json"

if [ ! -f "$DUMP_FILE" ]; then
  echo "❌ Arquivo não encontrado: $DUMP_FILE"
  echo "Rode antes: node scripts/export-data.mjs <OLD_API_KEY>"
  exit 1
fi

echo "
╔════════════════════════════════════════════════════════════════╗
║  📥 Importando dados via REST (curl)
║  $(date)
╚════════════════════════════════════════════════════════════════╝
"

# Helper para POST com dev key
function dst_post() {
  local path="$1"
  local data="$2"
  curl -s -X POST "$DST_ENDPOINT$path" \
    -H "X-Appwrite-Project: $DST_PROJECT" \
    -H "X-Appwrite-Dev-Key: $DST_KEY" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# 1. Criar database
echo "🔄 Criando database..."
db_result=$(dst_post "/databases" "{\"databaseId\": \"$DB\", \"name\": \"Friburgo Urgente\"}")
if echo "$db_result" | grep -q "\"status\""; then
  echo "  ✓ Database criado"
else
  if echo "$db_result" | grep -q "409"; then
    echo "  ℹ Database já existe"
  else
    echo "  ✗ Erro: $db_result"
  fi
fi

sleep 1

# 2. Criar collections
echo ""
echo "🔄 Criando collections..."

for col in categories articles ads newsletter whatsapp_groups; do
  col_result=$(dst_post "/databases/$DB/collections" "{
    \"collectionId\": \"$col\",
    \"name\": \"$(echo $col | sed 's/^\(.\)/\U\1/')\",
    \"permissions\": [\"role:all\"]
  }")

  if echo "$col_result" | grep -q "\"status\""; then
    echo "  ✓ $col criado"
  else
    if echo "$col_result" | grep -q "409"; then
      echo "  ℹ $col já existe"
    else
      echo "  ✗ Erro: $col_result"
    fi
  fi
  sleep 1
done

# 3. Criar bucket
echo ""
echo "🔄 Criando bucket..."
bucket_result=$(dst_post "/storage/buckets" "{
  \"bucketId\": \"$BUCKET\",
  \"name\": \"Covers\",
  \"permissions\": [\"role:all\"]
}")

if echo "$bucket_result" | grep -q "\"status\""; then
  echo "  ✓ Bucket criado"
else
  if echo "$bucket_result" | grep -q "409"; then
    echo "  ℹ Bucket já existe"
  else
    echo "  ✗ Erro: $bucket_result"
  fi
fi

echo ""
echo "✅ Schema criado!"
echo ""
echo "Próximos passos:"
echo "  1. Atualizar .env com novo endpoint e projectId"
echo "  2. Usar node scripts/import-schema-data.mjs <DEV_KEY> para importar documentos"
