#!/bin/bash

# Create attributes with correct Appwrite 1.8.1 type-specific endpoints
# Endpoints: /attributes/string, /attributes/boolean, /attributes/integer, /attributes/datetime, /attributes/enum

ENDPOINT="https://friburgourgente-database.veuxld.easypanel.host/v1"
PROJECT="69f7b8ed000657470871"
KEY="standard_52e6bde74c5a48d5dbb2d1e6c4fedbbdcbdd1bdb612c6aa453e1d641ff25eca16e329c762eee15d93e9e7b4c54a14fdd69385bc20b7d717bd8791506dfc78220f485d99e8204269839eeade30f50d96bf3a5d4ab6a39c8ed3f5cade995a89d95ef1dbb0a7b18de83f07d69989ec48f2d0e4b1908d05f068a949e5be9be43a2fd"
DB="friburgourgente"

function create_string() {
  local col=$1
  local key=$2
  local size=$3
  local required=$4

  curl -s -X POST "$ENDPOINT/databases/$DB/collections/$col/attributes/string" \
    -H "X-Appwrite-Project: $PROJECT" \
    -H "X-Appwrite-Key: $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"size\":$size,\"required\":$required}" > /dev/null

  echo "  ✓ $col.$key (string)"
  sleep 1
}

function create_boolean() {
  local col=$1
  local key=$2
  local required=$3

  curl -s -X POST "$ENDPOINT/databases/$DB/collections/$col/attributes/boolean" \
    -H "X-Appwrite-Project: $PROJECT" \
    -H "X-Appwrite-Key: $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"required\":$required}" > /dev/null

  echo "  ✓ $col.$key (boolean)"
  sleep 1
}

function create_integer() {
  local col=$1
  local key=$2
  local required=$3

  curl -s -X POST "$ENDPOINT/databases/$DB/collections/$col/attributes/integer" \
    -H "X-Appwrite-Project: $PROJECT" \
    -H "X-Appwrite-Key: $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"required\":$required}" > /dev/null

  echo "  ✓ $col.$key (integer)"
  sleep 1
}

function create_datetime() {
  local col=$1
  local key=$2
  local required=$3

  curl -s -X POST "$ENDPOINT/databases/$DB/collections/$col/attributes/datetime" \
    -H "X-Appwrite-Project: $PROJECT" \
    -H "X-Appwrite-Key: $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"required\":$required}" > /dev/null

  echo "  ✓ $col.$key (datetime)"
  sleep 1
}

function create_enum() {
  local col=$1
  local key=$2
  local required=$3
  shift 3
  local elements="$@"

  curl -s -X POST "$ENDPOINT/databases/$DB/collections/$col/attributes/enum" \
    -H "X-Appwrite-Project: $PROJECT" \
    -H "X-Appwrite-Key: $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"elements\":[$elements],\"required\":$required}" > /dev/null

  echo "  ✓ $col.$key (enum)"
  sleep 1
}

echo "🔄 Criando atributos..."

# ============ categories ============
create_string "categories" "name" 256 true
create_string "categories" "slug" 256 true
create_string "categories" "color" 32 true
create_string "categories" "icon" 64 false
create_integer "categories" "sortOrder" true

# ============ articles ============
create_string "articles" "title" 256 true
create_string "articles" "slug" 256 true
create_string "articles" "content" 500000 true
create_string "articles" "excerpt" 1000 true
create_string "articles" "coverImageId" 256 false
create_string "articles" "categoryId" 36 true
create_string "articles" "authorId" 36 true
create_boolean "articles" "isBreaking" true
create_boolean "articles" "isPublished" true
create_datetime "articles" "publishedAt" true
create_integer "articles" "views" true

# ============ ads ============
create_string "ads" "title" 256 true
create_string "ads" "imageId" 256 false
create_string "ads" "linkUrl" 512 true
create_enum "ads" "format" true "\"leaderboard\"" "\"banner\"" "\"sidebar\"" "\"square\""
create_boolean "ads" "isActive" true
create_datetime "ads" "startsAt" true
create_datetime "ads" "endsAt" true
create_integer "ads" "impressions" false
create_integer "ads" "clicks" false

# ============ newsletter ============
create_string "newsletter" "email" 256 true
create_string "newsletter" "subscribedAt" 64 true
create_boolean "newsletter" "isActive" true

# ============ whatsapp_groups ============
create_string "whatsapp_groups" "title" 256 true
create_string "whatsapp_groups" "description" 512 false
create_string "whatsapp_groups" "link" 512 true
create_string "whatsapp_groups" "category" 128 false
create_string "whatsapp_groups" "imageId" 256 false
create_boolean "whatsapp_groups" "isActive" true
create_integer "whatsapp_groups" "sortOrder" false

echo ""
echo "✅ Atributos criados!"
echo ""
echo "Aguardando indexação (30s)..."
sleep 30
echo "Pronto para importar documentos!"
