/**
 * Creates the `ads` collection in Appwrite.
 * Run: node scripts/create-ads-collection.mjs <API_KEY>
 *
 * Get an API key from:
 * https://constantino-database.m2lqbf.easypanel.host
 * → Project Settings → API Keys → Create Key
 * Required scopes: databases.write, collections.write, attributes.write, indexes.write
 */

import sdk from "node-appwrite";

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error("Usage: node scripts/create-ads-collection.mjs <API_KEY>");
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint("https://constantino-database.m2lqbf.easypanel.host/v1")
  .setProject("69e00a02003c93871d98")
  .setKey(API_KEY);

const databases = new sdk.Databases(client);
const DB_ID = "friburgourgente";
const COLL_ID = "ads";

async function main() {
  console.log("Creating ads collection...");

  try {
    await databases.createCollection(DB_ID, COLL_ID, "ads", [
      sdk.Permission.read(sdk.Role.any()),
      sdk.Permission.create(sdk.Role.users()),
      sdk.Permission.update(sdk.Role.users()),
      sdk.Permission.delete(sdk.Role.users()),
    ]);
    console.log("✓ Collection created");
  } catch (e) {
    if (e.code === 409) {
      console.log("Collection already exists, continuing...");
    } else {
      throw e;
    }
  }

  const attrs = [
    () => databases.createStringAttribute(DB_ID, COLL_ID, "title", 256, true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, "imageId", 256, false),
    () => databases.createStringAttribute(DB_ID, COLL_ID, "linkUrl", 512, true),
    () => databases.createEnumAttribute(DB_ID, COLL_ID, "format", ["leaderboard", "banner", "sidebar", "square"], true),
    () => databases.createStringAttribute(DB_ID, COLL_ID, "pages", 64, false, undefined, true),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, "startsAt", true),
    () => databases.createDatetimeAttribute(DB_ID, COLL_ID, "endsAt", true),
    () => databases.createBooleanAttribute(DB_ID, COLL_ID, "isActive", true),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, "impressions", false, undefined, undefined, 0),
    () => databases.createIntegerAttribute(DB_ID, COLL_ID, "clicks", false, undefined, undefined, 0),
  ];

  for (const create of attrs) {
    try {
      const attr = await create();
      console.log(`✓ Attribute '${attr.key}' created`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`  Already exists, skipping`);
      } else {
        console.error(`✗ Error: ${e.message}`);
      }
    }
    // Small delay to avoid hitting rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("\n✅ Done! The ads collection is ready.");
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
