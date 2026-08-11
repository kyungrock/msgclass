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
    `'${esc(item.author || "")}',` +
    `'${esc(item.body || "")}',` +
    `'${esc(item.date || "")}',` +
    `'${esc(item.createdAt)}',` +
    `${Number(item.likes) || 0},` +
    `${Number(item.views) || 0},` +
    `NULL);`
  );
}

const reviews = Function(
  `${fs.readFileSync("js/bangmun-reviews-seed.js", "utf8")}; return BANGMUN_REVIEWS_SEED;`
)();
const profiles = Function(
  `${fs.readFileSync("js/nf-profiles-seed.js", "utf8")}; return NF_PROFILES_SEED;`
)();
const notices = Function(
  `${fs.readFileSync("js/gongji-notices-seed.js", "utf8")}; return GONGJI_NOTICES_SEED;`
)();

const attendance = [
  {
    id: "sample-1",
    title: "NF하얀, NF희나, NF유정, 우리, 소이, 다윤, 윤진, 제시, 제니, 아영, 시연",
    author: "운영자",
    body: "",
    date: "2026.08.10",
    createdAt: "2026-08-10T12:00:00.000Z",
    likes: 0,
    views: 0,
  },
];

const lines = [
  "DELETE FROM reviews;",
  "DELETE FROM profiles;",
  "DELETE FROM notices;",
  "DELETE FROM attendance;",
  ...reviews.map((item) => toSqlInsert("reviews", item)),
  ...profiles.map((item) => toSqlInsert("profiles", item)),
  ...notices.map((item) => toSqlInsert("notices", item)),
  ...attendance.map((item) => toSqlInsert("attendance", item)),
];

const outFile = "scripts/seed-boards.sql";
fs.mkdirSync("scripts", { recursive: true });
fs.writeFileSync(outFile, lines.join("\n") + "\n", "utf8");
console.log(
  `Wrote ${outFile}: reviews=${reviews.length}, profiles=${profiles.length}, notices=${notices.length}, attendance=${attendance.length}`
);

execFileSync(
  "npx",
  ["wrangler", "d1", "execute", "msg1000-auth", "--remote", "--file", outFile, "--yes"],
  { stdio: "inherit", shell: true }
);
console.log("Seed complete.");
