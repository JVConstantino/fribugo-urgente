#!/usr/bin/env node

const ENDPOINT = "https://friburgourgente-database.veuxld.easypanel.host/v1";
const PROJECT_ID = "69f7b8ed000657470871";
const API_KEY = "standard_52e6bde74c5a48d5dbb2d1e6c4fedbbdcbdd1bdb612c6aa453e1d641ff25eca16e329c762eee15d93e9e7b4c54a14fdd69385bc20b7d717bd8791506dfc78220f485d99e8204269839eeade30f50d96bf3a5d4ab6a39c8ed3f5cade995a89d95ef1dbb0a7b18de83f07d69989ec48f2d0e4b1908d05f068a949e5be9be43a2fd";
const DATABASE_ID = "friburgourgente";
const COLLECTION_ID = "categories";

const categories = [
  { id: "politica", name: "Política" },
  { id: "seguranca", name: "Segurança" },
  { id: "saude", name: "Saúde" },
  { id: "educacao", name: "Educação" },
];

async function fixCategoryNames() {
  console.log("🔄 Corrigindo nomes das categorias no banco...\n");

  for (const cat of categories) {
    try {
      const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${cat.id}`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "X-Appwrite-Project": PROJECT_ID,
          "X-Appwrite-Key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: cat.name }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✓ ${cat.id}: "${data.name}"`);
      } else {
        console.log(`✗ ${cat.id}: ${data.message || "erro desconhecido"}`);
      }
    } catch (error) {
      console.log(`✗ ${cat.id}: ${error.message}`);
    }
  }

  console.log("\n✅ Concluído!");
}

fixCategoryNames();
