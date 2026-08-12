function formatMeta(item, { showDate = false } = {}) {
  const views = item.views != null ? ` | 조회 ${item.views}` : "";
  const datePart = showDate && item.date ? ` | ${item.date}` : "";
  return `${item.author}${datePart}${views}`;
}

function matchesQuery(item, query) {
  if (!query) return true;
  const haystack = [item.title, item.author, item.body]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");
  return haystack.includes(query);
}

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("review-list");
  const countEl = document.getElementById("review-count");
  const emptyEl = document.getElementById("review-empty");
  const sortEl = document.getElementById("review-sort");
  const searchEl = document.getElementById("review-search");
  const toolbarEl = document.querySelector(".board-toolbar");
  const gateEl = document.getElementById("member-gate");

  if (!listEl) return;

  const member = await requireMemberToView(gateEl || emptyEl, {
    nextUrl: "reviews.html",
  });
  if (!member) {
    listEl.innerHTML = "";
    if (toolbarEl) toolbarEl.hidden = true;
    if (countEl) countEl.textContent = "0";
    if (emptyEl && gateEl) emptyEl.hidden = true;
    return;
  }
  if (gateEl) gateEl.hidden = true;

  let cachedItems = null;
  let searchTimer = null;

  const render = async ({ force = false } = {}) => {
    const isAdmin = member.role === "admin";
    let items = [];

    if (!force && cachedItems) {
      items = cachedItems;
    } else {
      try {
        items = await fetchReviews();
        cachedItems = items;
      } catch (err) {
        cachedItems = null;
        listEl.innerHTML = "";
        if (err.status === 401 || err.status === 403) {
          if (toolbarEl) toolbarEl.hidden = true;
          renderLoginRequiredGate(gateEl || emptyEl, { nextUrl: "reviews.html" });
          if (emptyEl && gateEl) emptyEl.hidden = true;
          if (countEl) countEl.textContent = "0";
          return;
        }
        if (emptyEl) {
          emptyEl.hidden = false;
          emptyEl.textContent = err.message || "후기를 불러오지 못했습니다.";
        }
        if (countEl) countEl.textContent = "0";
        return;
      }
    }

    const query = searchEl ? searchEl.value.trim().toLowerCase() : "";
    const sort = sortEl ? sortEl.value : "newest";

    items = items.filter((item) => matchesQuery(item, query));
    items = [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    if (countEl) countEl.textContent = String(items.length);
    listEl.innerHTML = "";
    if (emptyEl) {
      emptyEl.hidden = items.length > 0;
      emptyEl.textContent = query
        ? "검색 결과가 없습니다."
        : "등록된 후기가 없습니다.";
    }

    items.forEach((review) => {
      const li = document.createElement("li");
      li.className = "board-item";
      const ownerId = review.userId != null ? review.userId : review.user_id;
      const isOwner =
        member &&
        ownerId != null &&
        String(ownerId) === String(member.id);
      // 본인 글만 수정/삭제 (관리자도 남의 후기는 불가)
      const canManage = isOwner;

      if (canManage) {
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
        li.querySelector(".board-item-meta").textContent = formatMeta(review, {
          showDate: isAdmin,
        });
        li.querySelector(".board-delete-btn").addEventListener("click", async () => {
          if (!confirm("이 후기를 삭제할까요?")) return;
          try {
            await deleteReview(review.id);
            await render({ force: true });
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
        li.querySelector(".board-item-meta").textContent = formatMeta(review, {
          showDate: isAdmin,
        });
      }

      listEl.appendChild(li);
    });
  };

  if (sortEl) sortEl.addEventListener("change", () => void render());
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => void render(), 150);
    });
  }
  void render({ force: true });
});
