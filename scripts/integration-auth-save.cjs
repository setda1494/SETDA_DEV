/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");
const crypto = require("node:crypto");
const db = new PrismaClient();
const email = "integration-" + Date.now() + "@example.invalid";
const password = "local-integration-password";
const token = crypto.randomBytes(32).toString("base64url");
const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
let userId;
(async () => {
  try {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await db.user.create({ data: { email, displayName: "Integration Test", passwordHash } });
    userId = user.id;
    if (!(await argon2.verify(user.passwordHash, password))) throw new Error("ARGON2_VERIFY_FAIL");
    console.log("ARGON2_VERIFY=PASS");
    const expiresAt = new Date(Date.now() + 60000);
    await db.session.create({ data: { userId, tokenHash, expiresAt } });
    const session = await db.session.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!session || session.user.id !== userId || session.expiresAt <= new Date()) throw new Error("SESSION_FAIL");
    console.log("SESSION_DB=PASS");
    await db.gameSave.upsert({ where: { userId_gameKey_slot: { userId, gameKey: "integration_game", slot: "default" } }, create: { userId, gameKey: "integration_game", slot: "default", version: 1, payload: { level: 7, coins: 42 } }, update: { version: 1, payload: { level: 7, coins: 42 } } });
    const save = await db.gameSave.findUnique({ where: { userId_gameKey_slot: { userId, gameKey: "integration_game", slot: "default" } } });
    if (!save || save.version !== 1 || save.payload.level !== 7 || save.payload.coins !== 42) throw new Error("SAVE_FAIL");
    console.log("CLOUD_SAVE_DB=PASS");
    if (user.role !== "USER") throw new Error("DEFAULT_ROLE_FAIL");
    console.log("DEFAULT_ROLE_USER=PASS");
    console.log("INTEGRATION_PASS");
  } finally {
    if (userId) await db.user.delete({ where: { id: userId } }).catch(() => {});
    await db.$disconnect();
  }
})().catch(e => { console.error(e); process.exit(1); });
