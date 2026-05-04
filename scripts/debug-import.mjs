/**
 * Debug import - with error messages
 */

import fs from "fs";
import https from "https";

const DST_ENDPOINT = "https://friburgourgente-database.veuxld.easypanel.host/v1";
const DST_PROJECT = "69f7b8ed000657470871";
const DST_KEY = "standard_52e6bde74c5a48d5dbb2d1e6c4fedbbdcbdd1bdb612c6aa453e1d641ff25eca16e329c762eee15d93e9e7b4c54a14fdd69385bc20b7d717bd8791506dfc78220f485d99e8204269839eeade30f50d96bf3a5d4ab6a39c8ed3f5cade995a89d95ef1dbb0a7b18de83f07d69989ec48f2d0e4b1908d05f068a949e5be9be43a2fd";

const DB = "friburgourgente";
const DUMP_FILE = "./export/dump.json";

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      method: "POST",
      headers: {
        "X-Appwrite-Project": DST_PROJECT,
        "X-Appwrite-Key": DST_KEY,
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = https.request(url, options, (res) => {
      let result = "";
      res.on("data", (chunk) => (result += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(result));
        } catch {
          resolve(result);
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function importData() {
  const dump = JSON.parse(fs.readFileSync(DUMP_FILE, "utf8"));

  // Test only categories with special chars
  const col = "categories";
  const docs = dump.collections[col];

  for (const doc of docs) {
    try {
      const payload = { ...doc };
      delete payload.$id;
      delete payload.$createdAt;
      delete payload.$updatedAt;
      delete payload.$permissions;
      delete payload.$databaseId;
      delete payload.$collectionId;

      const url = `${DST_ENDPOINT}/databases/${DB}/collections/${col}/documents`;
      const body = { documentId: doc.$id, data: payload };

      const result = await httpPost(url, body);

      if (result.$id) {
        console.log(`✓ ${doc.$id}`);
      } else {
        console.log(`✗ ${doc.$id}: ${result.message}`);
      }
    } catch (e) {
      console.log(`✗ ${doc.$id}: ${e?.message ?? e}`);
    }
  }
}

importData().catch((e) => {
  console.error(`Error: ${e?.message ?? e}`);
  process.exit(1);
});
