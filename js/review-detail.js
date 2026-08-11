const REVIEW_STORAGE_KEY = "gnclass-reviews";

function loadReviews() {
  if (typeof syncSiteContentVersion === "function") syncSiteContentVersion();
  try {
    const data = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || "[]");
    if (Array.isArray(data) && data.length) return data;
  } catch {
    /* ignore */
  }
  return typeof BANGMUN_REVIEWS_SEED !== "undefined" && Array.isArray(BANGMUN_REVIEWS_SEED)
    ? [...BANGMUN_REVIEWS_SEED]
    : [];
}

function saveReviews(items) {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(items));
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const reviews = loadReviews();
  const review = reviews.find((item) => item.id === id) || reviews[0];
  const editLink = document.getElementById("detail-edit");
  const deleteBtn = document.getElementById("detail-delete");
  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  if (!review) {
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
  document.title = `${review.title} | 강남비너스`;

  if (admin && editLink) {
    editLink.href = `review-write.html?id=${encodeURIComponent(review.id)}`;
  }

  if (admin && deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (!confirm("이 후기를 삭제할까요?")) return;
      const next = loadReviews().filter((item) => item.id !== review.id);
      saveReviews(next);
      window.location.href = "reviews.html";
    });
  }
});
