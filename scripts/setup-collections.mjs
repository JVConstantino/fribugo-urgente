/**
 * Creates the `ads` and `whatsapp_groups` collections in Appwrite.
 *
 * HOW TO GET AN API KEY:
 *  1. Open https://constantino-database.m2lqbf.easypanel.host
 *  2. Login → select the project "friburgourgente"
 *  3. Go to: Overview → Integrations → API Keys → Create API Key
 *  4. Name: "setup", Expiry: never, Scopes: check all database scopes
 *  5. Copy the secret key
 *
 * USAGE:
 *   node scripts/setup-collections.mjs <YOUR_API_KEY>
 */

import * as sdk from "node-appwrite";

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error("\nUsage: node scripts/setup-collections.mjs <API_KEY>\n");
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint("https://constantino-database.m2lqbf.easypanel.host/v1")
  .setProject("69e00a02003c93871d98")
  .setKey(API_KEY);

const databases = new sdk.Databases(client);
const DB = "friburgourgente";

async function createCollectionSafe(id, name, permissions) {
  try {
    await databases.createCollection(DB, id, name, permissions);
    console.log(`✓ Collection '${id}' created`);
  } catch (e) {
    if (e.code === 409) {
      console.log(`  Collection '${id}' already exists`);
    } else {
      throw e;
    }
  }
}

async function createAttr(fn, key) {
  try {
    await fn();
    console.log(`  ✓ ${key}`);
  } catch (e) {
    if (e.code === 409) {
      console.log(`    ${key} already exists`);
    } else {
      console.error(`  ✗ ${key}: ${e.message}`);
    }
  }
  await delay(400);
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function setupAds() {
  console.log("\n── ads collection ──────────────────────");
  const perms = [
    sdk.Permission.read(sdk.Role.any()),
    sdk.Permission.create(sdk.Role.users()),
    sdk.Permission.update(sdk.Role.users()),
    sdk.Permission.delete(sdk.Role.users()),
  ];
  await createCollectionSafe("ads", "ads", perms);

  const attrs = [
    ["title",       () => databases.createStringAttribute(DB, "ads", "title", 256, true)],
    ["imageId",     () => databases.createStringAttribute(DB, "ads", "imageId", 256, false)],
    ["linkUrl",     () => databases.createStringAttribute(DB, "ads", "linkUrl", 512, true)],
    ["format",      () => databases.createEnumAttribute(DB, "ads", "format", ["leaderboard","banner","sidebar","square"], true)],
    ["pages",       () => databases.createStringAttribute(DB, "ads", "pages", 64, false, undefined, true)],
    ["startsAt",    () => databases.createDatetimeAttribute(DB, "ads", "startsAt", true)],
    ["endsAt",      () => databases.createDatetimeAttribute(DB, "ads", "endsAt", true)],
    ["isActive",    () => databases.createBooleanAttribute(DB, "ads", "isActive", true)],
    ["impressions", () => databases.createIntegerAttribute(DB, "ads", "impressions", false, undefined, undefined, 0)],
    ["clicks",      () => databases.createIntegerAttribute(DB, "ads", "clicks", false, undefined, undefined, 0)],
  ];

  for (const [key, fn] of attrs) await createAttr(fn, key);
}

async function setupGroups() {
  console.log("\n── whatsapp_groups collection ──────────");
  const perms = [
    sdk.Permission.read(sdk.Role.any()),
    sdk.Permission.create(sdk.Role.users()),
    sdk.Permission.update(sdk.Role.users()),
    sdk.Permission.delete(sdk.Role.users()),
  ];
  await createCollectionSafe("whatsapp_groups", "whatsapp_groups", perms);

  const attrs = [
    ["title",       () => databases.createStringAttribute(DB, "whatsapp_groups", "title", 256, true)],
    ["description", () => databases.createStringAttribute(DB, "whatsapp_groups", "description", 512, false, "")],
    ["link",        () => databases.createStringAttribute(DB, "whatsapp_groups", "link", 512, true)],
    ["category",    () => databases.createStringAttribute(DB, "whatsapp_groups", "category", 128, false, "")],
    ["imageId",     () => databases.createStringAttribute(DB, "whatsapp_groups", "imageId", 256, false)],
    ["isActive",    () => databases.createBooleanAttribute(DB, "whatsapp_groups", "isActive", true, true)],
    ["sortOrder",   () => databases.createIntegerAttribute(DB, "whatsapp_groups", "sortOrder", false, undefined, undefined, 0)],
  ];

  for (const [key, fn] of attrs) await createAttr(fn, key);
}

async function main() {
  console.log("Setting up Appwrite collections…");
  try {
    await setupAds();
    await setupGroups();
    console.log("\n✅ All done! Both collections are ready.\n");
  } catch (e) {
    console.error("\n❌ Fatal error:", e.message);
    if (e.code === 401) {
      console.error("   → API key is missing scopes. Make sure you checked all database scopes.");
    }
    process.exit(1);
  }
}

main();
