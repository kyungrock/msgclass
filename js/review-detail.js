document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const editLink = document.getElementById("detail-edit");
  const deleteBtn = document.getElementById("detail-delete");
  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  let review = null;
  try {
    if (!id) throw new Error("missing id");
    review = await fetchReview(id);
  } catch {
    document.getElementById("detail-title").textContent = "후기를 찾을 수 없습니다";
    document.getElementById("detail-meta").textContent = "";
    document.getElementById("detail-body").textContent = "목록으로 돌아가 다시 선택해 주세요.";
    return;
  }

  document.getElementById("detail-title").textContent = review.title;
  const views = review.views != null ? ` | 조회 ${review.views}` : "";
  document.getElementById("detail-meta").textContent =
    `${review.author} | ${review.date} | 추천 ${review.likes || 0}${views}`;
  document.getElementById("detail-body").textContent = review.body;

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

  if (admin && editLink) {
    editLink.href = `review-write.html?id=${encodeURIComponent(review.id)}`;
  }

  if (admin && deleteBtn) {
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
});
