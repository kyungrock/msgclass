document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const editLink = document.getElementById("detail-edit");
  const deleteBtn = document.getElementById("detail-delete");
  const actionsEl = document.getElementById("detail-actions");
  const titleEl = document.getElementById("detail-title");
  const metaEl = document.getElementById("detail-meta");
  const bodyEl = document.getElementById("detail-body");
  const gateEl = document.getElementById("member-gate");
  const commentsEl = document.getElementById("review-comments");
  const commentsListEl = document.getElementById("review-comments-list");
  const commentsEmptyEl = document.getElementById("review-comments-empty");
  const commentForm = document.getElementById("review-comment-form");
  const commentBody = document.getElementById("review-comment-body");
  const commentSubmit = document.getElementById("review-comment-submit");
  const nextUrl = id
    ? `review-detail.html?id=${encodeURIComponent(id)}`
    : "reviews.html";

  const member = await requireMemberToView(gateEl, { nextUrl });
  if (!member) {
    if (titleEl) titleEl.textContent = "후기";
    if (metaEl) metaEl.textContent = "";
    if (bodyEl) bodyEl.textContent = "";
    if (commentsEl) commentsEl.hidden = true;
    return;
  }
  if (gateEl) gateEl.hidden = true;

  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  let review = null;
  try {
    if (!id) throw new Error("missing id");
    review = await fetchReview(id);
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      renderLoginRequiredGate(gateEl, { nextUrl });
      if (titleEl) titleEl.textContent = "후기";
      if (metaEl) metaEl.textContent = "";
      if (bodyEl) bodyEl.textContent = "";
      if (commentsEl) commentsEl.hidden = true;
      return;
    }
    if (titleEl) titleEl.textContent = "후기를 찾을 수 없습니다";
    if (metaEl) metaEl.textContent = "";
    if (bodyEl) bodyEl.textContent = "목록으로 돌아가 다시 선택해 주세요.";
    if (commentsEl) commentsEl.hidden = true;
    return;
  }

  titleEl.textContent = review.title;
  const views = review.views != null ? ` | 조회 ${review.views}` : "";
  const datePart = admin && review.date ? ` | ${review.date}` : "";
  metaEl.textContent = `${review.author}${datePart}${views}`;
  bodyEl.textContent = review.body;

  const pageUrl = `https://msg1000.com/review-detail.html?id=${encodeURIComponent(review.id)}`;
  const bodyPreview = String(review.body || "").replace(/\s+/g, " ").trim().slice(0, 110);
  const desc = `${review.title}. ${bodyPreview} - 강남더라임 후기`.slice(0, 155);
  document.title = `${review.title} | 강남더라임`;
  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) descEl.setAttribute("content", desc);
  const canonical = document.getElementById("canonical-link");
  if (canonical) canonical.setAttribute("href", pageUrl);
  const ogTitle = document.getElementById("og-title");
  if (ogTitle) ogTitle.setAttribute("content", `${review.title} | 강남더라임`);
  const ogDesc = document.getElementById("og-description");
  if (ogDesc) ogDesc.setAttribute("content", desc);
  const ogUrl = document.getElementById("og-url");
  if (ogUrl) ogUrl.setAttribute("content", pageUrl);

  const isOwner =
    review.userId != null && Number(review.userId) === Number(member.id);
  const canManage = admin || isOwner;

  if (actionsEl) {
    actionsEl.hidden = !canManage;
    actionsEl.removeAttribute("data-admin-only");
  }

  if (canManage && editLink) {
    editLink.href = `review-write.html?id=${encodeURIComponent(review.id)}`;
  }

  if (canManage && deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("이 후기를 삭제할까요?")) return;
      try {
        await deleteReview(review.id);
        window.location.href = "reviews.html";
      } catch (err) {
        alert(err.message || "삭제에 실패했습니다.");
      }
    });
  }

  const formatCommentDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 16);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}.${m}.${day} ${hh}:${mm}`;
  };

  const renderComments = async () => {
    if (!commentsEl || !commentsListEl) return;
    commentsEl.hidden = false;
    if (commentForm) commentForm.hidden = !admin;

    let items = [];
    try {
      items = await fetchReviewComments(review.id);
    } catch (err) {
      commentsListEl.innerHTML = "";
      if (commentsEmptyEl) {
        commentsEmptyEl.hidden = false;
        commentsEmptyEl.textContent = err.message || "댓글을 불러오지 못했습니다.";
      }
      return;
    }

    commentsListEl.innerHTML = "";
    if (commentsEmptyEl) {
      commentsEmptyEl.hidden = items.length > 0;
      commentsEmptyEl.textContent = "등록된 댓글이 없습니다.";
    }

    items.forEach((comment) => {
      const li = document.createElement("li");
      li.className = "comment-item";
      li.innerHTML = `
        <div class="comment-head">
          <span class="comment-author"></span>
          <span class="comment-date"></span>
        </div>
        <p class="comment-body"></p>
      `;
      li.querySelector(".comment-author").textContent = comment.author || "관리자";
      li.querySelector(".comment-date").textContent = formatCommentDate(comment.createdAt);
      li.querySelector(".comment-body").textContent = comment.body || "";

      if (admin) {
        const del = document.createElement("button");
        del.type = "button";
        del.className = "btn comment-delete-btn";
        del.textContent = "삭제";
        del.addEventListener("click", async () => {
          if (!confirm("이 댓글을 삭제할까요?")) return;
          try {
            await deleteReviewComment(review.id, comment.id);
            await renderComments();
          } catch (err) {
            alert(err.message || "댓글 삭제에 실패했습니다.");
          }
        });
        li.appendChild(del);
      }

      commentsListEl.appendChild(li);
    });
  };

  if (commentForm) {
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!admin) return;
      const body = commentBody ? commentBody.value.trim() : "";
      if (!body) {
        alert("댓글 내용을 입력해 주세요.");
        return;
      }
      if (commentSubmit) commentSubmit.disabled = true;
      try {
        await createReviewComment(review.id, { body });
        if (commentBody) commentBody.value = "";
        await renderComments();
      } catch (err) {
        alert(err.message || "댓글 등록에 실패했습니다.");
      } finally {
        if (commentSubmit) commentSubmit.disabled = false;
      }
    });
  }

  await renderComments();
});
