import * as sdk from "node-appwrite";

const endpoint = "https://friburgourgente-database.veuxld.easypanel.host/v1";
const project = "69f7b8ed000657470871";
const key = "standard_52e6bde74c5a48d5dbb2d1e6c4fedbbdcbdd1bdb612c6aa453e1d641ff25eca16e329c762eee15d93e9e7b4c54a14fdd69385bc20b7d717bd8791506dfc78220f485d99e8204269839eeade30f50d96bf3a5d4ab6a39c8ed3f5cade995a89d95ef1dbb0a7b18de83f07d69989ec48f2d0e4b1908d05f068a949e5be9be43a2fd";

const client = new sdk.Client()
  .setEndpoint(endpoint)
  .setProject(project)
  .setKey(key);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

async function test() {
  console.log("🔍 Testando conexão com servidor NOVO...\n");

  try {
    // Test database
    const dbs = await databases.list();
    console.log(`✓ Databases: ${dbs.total} encontrados`);

    // Test collections
    try {
      const articles = await databases.listDocuments("friburgourgente", "articles");
      console.log(`✓ Articles: ${articles.total} documentos`);
    } catch (e) {
      console.log(`ℹ Articles: não existe ainda`);
    }

    try {
      const categories = await databases.listDocuments("friburgourgente", "categories");
      console.log(`✓ Categories: ${categories.total} documentos`);
    } catch (e) {
      console.log(`ℹ Categories: não existe ainda`);
    }

    // Test storage
    try {
      const files = await storage.listFiles("covers");
      console.log(`✓ Storage (covers): ${files.total} arquivos`);
    } catch (e) {
      console.log(`ℹ Storage: não existe ainda`);
    }

    console.log("\n✅ NOVO SERVIDOR ESTÁ PRONTO PARA MIGRAÇÃO!\n");
  } catch (e) {
    console.error(`❌ Erro: ${e?.message ?? e}\n`);
  }
}

test();
