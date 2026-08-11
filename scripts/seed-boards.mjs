import fs from "fs";
import { execFileSync } from "child_process";

function esc(value) {
  return String(value ?? "")
    .replace(/'/g, "''")
    .replace(/\r\n/g, "\n");
}

function toSqlInsert(table, item) {
  return (
    `INSERT OR REPLACE INTO ${table} ` +
    `(id, title, author, body, date, created_at, likes, views, user_id) VALUES (` +
    `'${esc(item.id)}',` +
    `'${esc(item.title)}',` +
    `'${esc(item.author)}',` +
    `'${esc(item.body)}',` +
    `'${esc(item.date)}',` +
    `'${esc(item.createdAt)}',` +
    `${Number(item.likes) || 0},` +
    `${Number(item.views) || 0},` +
    `NULL);`
  );
}

// Load seed arrays by evaluating the JS files in a sandbox-like way
const reviewsSrc = fs.readFileSync("js/bangmun-reviews-seed.js", "utf8");
const profilesSrc = fs.readFileSync("js/nf-profiles-seed.js", "utf8");
const reviews = Function(`${reviewsSrc}; return BANGMUN_REVIEWS_SEED;`)();
const profiles = Function(`${profilesSrc}; return NF_PROFILES_SEED;`)();

const lines = [
  "DELETE FROM reviews;",
  "DELETE FROM profiles;",
  ...reviews.map((item) => toSqlInsert("reviews", item)),
  ...profiles.map((item) => toSqlInsert("profiles", item)),
];

const outFile = "scripts/seed-boards.sql";
fs.mkdirSync("scripts", { recursive: true });
fs.writeFileSync(outFile, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${outFile}: reviews=${reviews.length}, profiles=${profiles.length}`);

execFileSync(
  "npx",
  ["wrangler", "d1", "execute", "msg1000-auth", "--remote", "--file", outFile, "--yes"],
  { stdio: "inherit", shell: true }
);
console.log("Seed complete.");
