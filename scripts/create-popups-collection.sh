#!/bin/bash

# Script para criar a collection "popups" no Appwrite
# Executar: ./scripts/create-popups-collection.sh

ENDPOINT="https://database.friburgourgente.com.br/v1"
PROJECT_ID="69f7b8ed000657470871"
DATABASE_ID="friburgourgente"
API_KEY="standard_52e6bde74c5a48d5dbb2d1e6c4fedbbdcbdd1bdb612c6aa453e1d641ff25eca16e329c762eee15d93e9e7b4c54a14fdd69385bc20b7d717bd8791506dfc78220f485d99e8204269839eeade30f50d96bf3a5d4ab6a39c8ed3f5cade995a89d95ef1dbb0a7b18de83f07d69989ec48f2d0e4b1908d05f068a949e5be9be43a2fd"

echo "Creating popups collection..."

# Create collection
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "collectionId": "popups",
    "name": "popups",
    "permissions": ["read(\"any\")"],
    "documentSecurity": false
  }' | head -n 20

sleep 2

# Add attributes
echo "Adding attributes to popups collection..."

# title (string, 200)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/string" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "title", "size": 200, "required": true}' > /dev/null

sleep 1

# type (string, 20)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/string" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "type", "size": 20, "required": true, "default": "image"}' > /dev/null

sleep 1

# imageId (string, 100, nullable)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/string" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "imageId", "size": 100, "required": false}' > /dev/null

sleep 1

# linkUrl (string, 500, nullable)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/string" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "linkUrl", "size": 500, "required": false}' > /dev/null

sleep 1

# groupId (string, 100, nullable)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/string" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "groupId", "size": 100, "required": false}' > /dev/null

sleep 1

# heading (string, 300, nullable)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/string" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "heading", "size": 300, "required": false}' > /dev/null

sleep 1

# description (string, 2000, nullable)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/string" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "description", "size": 2000, "required": false}' > /dev/null

sleep 1

# startsAt (datetime)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/datetime" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "startsAt", "required": true}' > /dev/null

sleep 1

# endsAt (datetime)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/datetime" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "endsAt", "required": true}' > /dev/null

sleep 1

# isActive (boolean)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/boolean" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "isActive", "required": false, "default": true}' > /dev/null

sleep 1

# impressions (integer)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/integer" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "impressions", "required": false, "default": 0}' > /dev/null

sleep 1

# clicks (integer)
curl -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/popups/attributes/integer" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "clicks", "required": false, "default": 0}' > /dev/null

echo "✅ Collection popups criada com sucesso!"
