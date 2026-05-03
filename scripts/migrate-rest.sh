#!/bin/bash

# Migração Appwrite via REST (curl)
# Uso: bash scripts/migrate-rest.sh <SRC_KEY> <DST_KEY>

SRC_ENDPOINT="https://constantino-database.m2lqbf.easypanel.host/v1"
SRC_PROJECT="69e00a02003c93871d98"
SRC_KEY="$1"

DST_ENDPOINT="https://database.friburgourgente.com.br/v1"
DST_PROJECT="69f6ddd7002c4044a9f4"
DST_KEY="$2"

if [ -z "$SRC_KEY" ] || [ -z "$DST_KEY" ]; then
  echo "Usage: bash scripts/migrate-rest.sh <SRC_API_KEY> <DST_API_KEY>"
  exit 1
fi

DB="friburgourgente"
BUCKET="covers"

# Helper para POST
function dst_post() {
  local path="$1"
  local data="$2"
  curl -s -X POST "$DST_ENDPOINT$path" \
    -H "X-Appwrite-Project: $DST_PROJECT" \
    -H "X-Appwrite-Key: $DST_KEY" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# Helper para GET
function src_get() {
  local path="$1"
  curl -s -X GET "$SRC_ENDPOINT$path" \
    -H "X-Appwrite-Project: $SRC_PROJECT" \
    -H "X-Appwrite-Key: $SRC_KEY"
}

function dst_get() {
  local path="$1"
  curl -s -X GET "$DST_ENDPOINT$path" \
    -H "X-Appwrite-Project: $DST_PROJECT" \
    -H "X-Appwrite-Key: $DST_KEY"
}

echo "
╔════════════════════════════════════════════════════════════════╗
║  Migração Appwrite via REST: src → dst
║  $(date)
╚════════════════════════════════════════════════════════════════╝
"

# Teste básico
echo "🔍 Testando conexões..."
echo "  Testando origem..."
src_test=$(src_get "/health" 2>&1)
if echo "$src_test" | grep -q "status"; then
  echo "  ✓ Origem OK"
else
  echo "  ✗ Erro na origem: $src_test"
  exit 1
fi

echo "  Testando destino..."
dst_test=$(dst_get "/health" 2>&1)
if echo "$dst_test" | grep -q "status"; then
  echo "  ✓ Destino OK"
else
  echo "  ✗ Erro no destino: $dst_test"
  exit 1
fi

# Criar database no destino
echo ""
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

# Criar collections
echo ""
echo "🔄 Criando collections..."

collections=("categories" "articles" "ads" "newsletter" "whatsapp_groups")

for col in "${collections[@]}"; do
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
      echo "  ✗ Erro em $col: $col_result"
    fi
  fi
  sleep 1
done

# Criar bucket
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
echo "✅ Schema criado no destino!"
echo ""
echo "Próximos passos:"
echo "  1. Copiar documentos (use o painel Appwrite ou um script adicional)"
echo "  2. Copiar arquivos do bucket"
echo "  3. Atualizar .env com novo endpoint"
