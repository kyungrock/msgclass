function formatMeta(item) {
  const views = item.views != null ? ` | 조회 ${item.views}` : "";
  return `${item.author} | ${item.date} | 추천 ${item.likes || 0}${views}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("review-list");
  const countEl = document.getElementById("review-count");
  const emptyEl = document.getElementById("review-empty");
  const sortEl = document.getElementById("review-sort");

  if (!listEl) return;

  const render = async () => {
    const admin = typeof isAdminMode === "function" ? isAdminMode() : false;
    let items = [];
    try {
      items = await fetchReviews();
    } catch (err) {
      listEl.innerHTML = "";
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent = err.message || "후기를 불러오지 못했습니다.";
      }
      if (countEl) countEl.textContent = "0";
      return;
    }

    const sort = sortEl ? sortEl.value : "newest";
    items = [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    if (countEl) countEl.textContent = String(items.length);
    listEl.innerHTML = "";
    if (emptyEl) {
      emptyEl.hidden = items.length > 0;
      emptyEl.textContent = "등록된 후기가 없습니다.";
    }

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
        li.querySelector(".board-delete-btn").addEventListener("click", async () => {
          if (!confirm("이 후기를 삭제할까요?")) return;
          try {
            await deleteReview(review.id);
            await render();
          } catch (err) {
            alert(err.message || "삭제에 실패했습니다.");
          }
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

  if (sortEl) sortEl.addEventListener("change", () => void render());
  void render();
});
