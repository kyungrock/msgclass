const REVIEW_STORAGE_KEY = "gnclass-reviews";

function getDefaultReviews() {
  return typeof BANGMUN_REVIEWS_SEED !== "undefined" && Array.isArray(BANGMUN_REVIEWS_SEED)
    ? BANGMUN_REVIEWS_SEED
    : [];
}

function loadReviews() {
  if (typeof syncSiteContentVersion === "function") syncSiteContentVersion();
  const defaults = getDefaultReviews();
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!raw) {
      if (defaults.length) {
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(defaults));
      }
      return [...defaults];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) {
      if (defaults.length) {
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(defaults));
      }
      return [...defaults];
    }
    return data;
  } catch {
    return [...defaults];
  }
}

function saveReviews(items) {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(items));
}

function formatMeta(review) {
  const views = review.views != null ? ` | 조회 ${review.views}` : "";
  return `${review.author} | ${review.date} | 추천 ${review.likes || 0}${views}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("review-list");
  const countEl = document.getElementById("review-count");
  const emptyEl = document.getElementById("review-empty");
  const sortEl = document.getElementById("review-sort");

  if (!listEl) return;

  const render = () => {
    const admin = typeof isAdminMode === "function" ? isAdminMode() : false;
    let items = loadReviews();
    const sort = sortEl ? sortEl.value : "newest";

    items = [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    if (countEl) countEl.textContent = String(items.length);
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.hidden = items.length > 0;

    items.forEach((review) => {
      const li = document.createElement("li");
      li.className = "board-item";

      if (admin) {
        li.innerHTML = `
          <div class="board-item-row">
            <a class="board-item-main" href="review-detail.html?id=${encodeURIComponent(review.id)}">
              <p class="board-item-title"></p>
              <p class="board-item-meta"></p>
            </a>
            <a class="btn board-edit-btn" href="review-write.html?id=${encodeURIComponent(review.id)}">수정</a>
            <button type="button" class="btn board-delete-btn">삭제</button>
          </div>
        `;
        li.querySelector(".board-item-title").textContent = review.title;
        li.querySelector(".board-item-meta").textContent = formatMeta(review);
        li.querySelector(".board-delete-btn").addEventListener("click", () => {
          if (!confirm("이 후기를 삭제할까요?")) return;
          const next = loadReviews().filter((item) => item.id !== review.id);
          saveReviews(next);
          render();
        });
      } else {
        li.innerHTML = `
          <a href="review-detail.html?id=${encodeURIComponent(review.id)}">
            <p class="board-item-title"></p>
            <p class="board-item-meta"></p>
          </a>
        `;
        li.querySelector(".board-item-title").textContent = review.title;
        li.querySelector(".board-item-meta").textContent = formatMeta(review);
      }

      listEl.appendChild(li);
    });
  };

  if (sortEl) {
    sortEl.addEventListener("change", render);
  }

  render();
});
