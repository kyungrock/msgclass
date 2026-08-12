const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const v = "20260812-02";

function updateListPage(file, pageScript) {
  let html = fs.readFileSync(path.join(root, file), "utf8");
  if (!html.includes('id="member-gate"')) {
    html = html.replace(
      /<ul class="board-list"/,
      `<div id="member-gate" class="login-required-gate" hidden></div>\n    <ul class="board-list"`
    );
  }
  if (!html.includes("member-gate.js")) {
    html = html.replace(
      `<script src="js/auth-ui.js?v=`,
      `<script src="js/member-gate.js?v=${v}"></script>\n  <script src="js/auth-ui.js?v=`
    );
  }
  html = html.replace(/\?v=2026081[12]-\d+/g, `?v=${v}`);
  // ensure page script name still correct after global replace
  fs.writeFileSync(path.join(root, file), html, "utf8");
  console.log("updated", file);
}

function updateDetailPage(file, pageScript) {
  let html = fs.readFileSync(path.join(root, file), "utf8");
  if (!html.includes('id="member-gate"')) {
    html = html.replace(
      /<p class="detail-meta"/,
      `<div id="member-gate" class="login-required-gate" hidden></div>\n    <p class="detail-meta"`
    );
  }
  if (!html.includes("member-gate.js")) {
    html = html.replace(
      `<script src="js/auth-ui.js?v=`,
      `<script src="js/member-gate.js?v=${v}"></script>\n  <script src="js/auth-ui.js?v=`
    );
  }
  html = html.replace(/\?v=2026081[12]-\d+/g, `?v=${v}`);
  fs.writeFileSync(path.join(root, file), html, "utf8");
  console.log("updated", file, pageScript);
}

updateListPage("reviews.html", "reviews.js");
updateListPage("profile.html", "profile.js");
updateDetailPage("review-detail.html", "review-detail.js");
updateDetailPage("profile-detail.html", "profile-detail.js");
