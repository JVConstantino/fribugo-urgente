#!/bin/bash

# Importa documentos via REST (curl) - compatível com qualquer versão do Appwrite
# Uso: bash scripts/import-via-rest.sh

SRC_ENDPOINT="https://constantino-database.m2lqbf.easypanel.host/v1"
SRC_PROJECT="69e00a02003c93871d98"
SRC_KEY="standard_b367d17bc70ff9f83ec2bac3d9eafbb42466b9f4c7d140bbd96958aa9c3351712bac927b88606272e9c4d83c3ab86ee4d633222c812f8b70d5e9e02edf3471d48a0dcc30242a0d54e970a206e2308e74318586376aee133e791b5dc5008954232ff46801b6a376e18da54bf24ae40534235e65c2b505733b09ab93bbec6c21df"

DST_ENDPOINT="https://friburgourgente-database.veuxld.easypanel.host/v1"
DST_PROJECT="69f7b8ed000657470871"
DST_KEY="standard_52e6bde74c5a48d5dbb2d1e6c4fedbbdcbdd1bdb612c6aa453e1d641ff25eca16e329c762eee15d93e9e7b4c54a14fdd69385bc20b7d717bd8791506dfc78220f485d99e8204269839eeade30f50d96bf3a5d4ab6a39c8ed3f5cade995a89d95ef1dbb0a7b18de83f07d69989ec48f2d0e4b1908d05f068a949e5be9be43a2fd"

DB="friburgourgente"

echo "
╔═════════════════════════════════════════════════════════════════════╗
║  📥 Importando dados via REST (curl)
║  $(date)
╚═════════════════════════════════════════════════════════════════════╝
"

# Função para fazer POST no destino
function dst_post() {
  local path="$1"
  local data="$2"
  curl -s -X POST "$DST_ENDPOINT$path" \
    -H "X-Appwrite-Project: $DST_PROJECT" \
    -H "X-Appwrite-Key: $DST_KEY" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# Função para GET na origem
function src_get() {
  curl -s -X GET "$SRC_ENDPOINT$1" \
    -H "X-Appwrite-Project: $SRC_PROJECT" \
    -H "X-Appwrite-Key: $SRC_KEY"
}

# Importar cada collection
for col in categories articles ads newsletter whatsapp_groups; do
  echo "🔄 Importando $col..."

  offset=0
  count=0
  errors=0

  while true; do
    # Buscar documentos em lotes de 100
    docs_json=$(src_get "/databases/$DB/collections/$col/documents?limit=100&offset=$offset")

    # Checar se tem documentos
    if ! echo "$docs_json" | grep -q '"documents":\['; then
      break
    fi

    # Extrair cada documento e enviar para o destino
    echo "$docs_json" | jq -c '.documents[]' 2>/dev/null | while read -r doc; do
      if [ ! -z "$doc" ]; then
        # Remover campos internos do Appwrite
        doc_clean=$(echo "$doc" | jq 'del(.$createdAt, .$updatedAt, .$permissions, .$databaseId, .$collectionId)')
        doc_id=$(echo "$doc_clean" | jq -r '.$id')

        # Fazer POST no destino
        result=$(dst_post "/databases/$DB/collections/$col/documents" "$doc_clean")

        if echo "$result" | grep -q '"$id"'; then
          count=$((count + 1))
          echo -n "."
        else
          errors=$((errors + 1))
        fi
      fi
    done

    offset=$((offset + 100))
  done

  echo ""
  echo "  ✓ $col: $count importados, $errors erros"
  sleep 1
done

echo ""
echo "✅ Importação concluída!"
echo ""
echo "Próximos passos:"
echo "  1. Recarregar o navegador em http://localhost:5174"
echo "  2. Verificar se os dados aparecem"
echo "  3. npm run build && git push para deploy"
