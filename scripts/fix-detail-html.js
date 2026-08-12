const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const files = [
  "review-detail.html",
  "profile-detail.html",
  "reviews.html",
  "profile.html",
];

for (const file of files) {
  const buf = execSync(`git show fa5aed7:${file}`, { encoding: "buffer" });
  const text = buf.toString("utf8");
  const updated = text.replace(/\?v=20260811-\d+/g, "?v=20260811-27");
  fs.writeFileSync(path.join(root, file), updated, { encoding: "utf8" });
  const ok =
    updated.includes("강남더라임") ||
    updated.includes("후기") ||
    updated.includes("프로필");
  console.log(file, "ok=" + ok, "len=" + Buffer.byteLength(updated, "utf8"));
}
