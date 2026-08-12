const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const file = path.join(root, "review-detail.html");
let html = fs.readFileSync(file, "utf8");
const v = "20260812-03";

if (!html.includes('id="review-comments"')) {
  html = html.replace(
    `    <div class="detail-actions" id="detail-actions" data-admin-only hidden>
      <a class="btn" id="detail-edit" href="#">수정</a>
      <button type="button" class="btn" id="detail-delete">삭제</button>
    </div>
  </main>`,
    `    <div class="detail-actions" id="detail-actions" hidden>
      <a class="btn" id="detail-edit" href="#">수정</a>
      <button type="button" class="btn" id="detail-delete">삭제</button>
    </div>

    <section class="review-comments" id="review-comments" hidden>
      <h2 class="section-title">댓글</h2>
      <ul class="comment-list" id="review-comments-list"></ul>
      <p class="board-empty" id="review-comments-empty" hidden>등록된 댓글이 없습니다.</p>
      <form class="comment-form" id="review-comment-form" hidden>
        <label>
          댓글 작성
          <textarea id="review-comment-body" rows="4" maxlength="2000" placeholder="관리자 댓글을 입력하세요." required></textarea>
        </label>
        <button type="submit" class="btn btn-primary" id="review-comment-submit">댓글 등록</button>
      </form>
    </section>
  </main>`
  );
}

html = html.replace(/\?v=2026081[12]-\d+/g, `?v=${v}`);
fs.writeFileSync(file, html, "utf8");
console.log("patched review-detail.html");

for (const name of ["reviews.html", "review-write.html"]) {
  const p = path.join(root, name);
  let t = fs.readFileSync(p, "utf8");
  t = t.replace(/\?v=2026081[12]-\d+/g, `?v=${v}`);
  fs.writeFileSync(p, t, "utf8");
  console.log("bumped", name);
}
