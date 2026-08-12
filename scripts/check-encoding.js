const { execSync } = require("child_process");
const fs = require("fs");

const commits = [
  "c6be1bd",
  "113a27b",
  "fa5aed7",
  "672c759",
  "0ddf9a0",
  "da01b61",
];

for (const c of commits) {
  try {
    const buf = execSync(`git show ${c}:review-detail.html`, {
      encoding: "buffer",
      maxBuffer: 5 * 1024 * 1024,
    });
    const s = buf.toString("utf8");
    const title = (s.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
    const ok =
      s.includes("강남더라임") ||
      s.includes("강남비너스") ||
      s.includes("후기 상세") ||
      s.includes("GN CLASS");
    const brokenClose = /content="[^"]*\?\s*\/>/.test(s) || /<\/?title>/.test(s) === false;
    console.log(
      [
        c,
        "len=" + buf.length,
        "ok=" + ok,
        "title=" + JSON.stringify(title),
      ].join(" ")
    );
  } catch (e) {
    console.log(c, "ERR");
  }
}

// Also dump fa5aed7 bytes around og:site_name
const buf = execSync("git show fa5aed7:review-detail.html", { encoding: "buffer" });
fs.writeFileSync("tmp-rd-fa5aed7.html", buf);
console.log("wrote tmp-rd-fa5aed7.html");
