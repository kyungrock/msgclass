import { execFileSync } from "child_process";
import crypto from "crypto";
import fs from "fs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/update-admin-password.mjs <new-password>");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto
  .pbkdf2Sync(password, Buffer.from(salt, "hex"), 100000, 32, "sha256")
  .toString("hex");

const sql =
  `UPDATE users ` +
  `SET password_salt = '${salt}', ` +
  `password_hash = '${hash}', ` +
  `updated_at = datetime('now') ` +
  `WHERE username = 'admin' COLLATE NOCASE;`;

const sqlFile = "scripts/update-admin-password.sql";
fs.mkdirSync("scripts", { recursive: true });
fs.writeFileSync(sqlFile, sql, "utf8");

execFileSync(
  "npx",
  ["wrangler", "d1", "execute", "msg1000-auth", "--remote", "--file", sqlFile, "--yes"],
  { stdio: "inherit", shell: true }
);
fs.unlinkSync(sqlFile);
console.log("Admin password updated.");
