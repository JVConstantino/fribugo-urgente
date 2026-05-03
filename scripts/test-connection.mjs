import * as sdk from "node-appwrite";

const endpoint = "https://constantino-database.m2lqbf.easypanel.host/v1";
const project = "69e00a02003c93871d98";
const key = "standard_b367d17bc70ff9f83ec2bac3d9eafbb42466b9f4c7d140bbd96958aa9c3351712bac927b88606272e9c4d83c3ab86ee4d633222c812f8b70d5e9e02edf3471d48a0dcc30242a0d54e970a206e2308e74318586376aee133e791b5dc5008954232ff46801b6a376e18da54bf24ae40534235e65c2b505733b09ab93bbec6c21df";

const client = new sdk.Client()
  .setEndpoint(endpoint)
  .setProject(project)
  .setKey(key);

const databases = new sdk.Databases(client);
const storage = new sdk.Storage(client);

async function test() {
  console.log("🔍 Testando conexão com servidor ANTIGO...\n");

  try {
    // Test database
    const dbs = await databases.list();
    console.log(`✓ Databases: ${dbs.total} encontrados`);

    // Test collections
    const articles = await databases.listDocuments("friburgourgente", "articles");
    console.log(`✓ Articles: ${articles.total} documentos`);

    const categories = await databases.listDocuments("friburgourgente", "categories");
    console.log(`✓ Categories: ${categories.total} documentos`);

    const ads = await databases.listDocuments("friburgourgente", "ads");
    console.log(`✓ Ads: ${ads.total} documentos`);

    const groups = await databases.listDocuments("friburgourgente", "whatsapp_groups");
    console.log(`✓ Whatsapp Groups: ${groups.total} documentos`);

    // Test storage
    const files = await storage.listFiles("covers");
    console.log(`✓ Storage (covers): ${files.total} arquivos`);

    console.log("\n✅ TUDO FUNCIONA! Servidor antigo está OK.\n");
  } catch (e) {
    console.error(`❌ Erro: ${e?.message ?? e}\n`);
  }
}

test();
