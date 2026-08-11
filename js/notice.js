const NOTICE_STORAGE_KEY = "gnclass-notices";

function getDefaultNotices() {
  return typeof GONGJI_NOTICES_SEED !== "undefined" && Array.isArray(GONGJI_NOTICES_SEED)
    ? GONGJI_NOTICES_SEED
    : [];
}

function loadNotices() {
  if (typeof syncSiteContentVersion === "function") syncSiteContentVersion();
  const defaults = getDefaultNotices();
  try {
    const raw = localStorage.getItem(NOTICE_STORAGE_KEY);
    if (!raw) {
      if (defaults.length) {
        localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(defaults));
      }
      return [...defaults];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) {
      if (defaults.length) {
        localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(defaults));
      }
      return [...defaults];
    }
    return data;
  } catch {
    return [...defaults];
  }
}

function saveNotices(items) {
  localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(items));
}

function formatMeta(notice) {
  const views = notice.views != null ? ` | 조회 ${notice.views}` : "";
  return `${notice.author} | ${notice.date} | 추천 ${notice.likes || 0}${views}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("notice-list");
  const countEl = document.getElementById("notice-count");
  const emptyEl = document.getElementById("notice-empty");
  const sortEl = document.getElementById("notice-sort");

  if (!listEl) return;

  const render = () => {
    const admin = typeof isAdminMode === "function" ? isAdminMode() : false;
    let items = loadNotices();
    const sort = sortEl ? sortEl.value : "newest";

    items = [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    if (countEl) countEl.textContent = String(items.length);
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.hidden = items.length > 0;

    items.forEach((notice) => {
      const li = document.createElement("li");
      li.className = "board-item";

      if (admin) {
        li.innerHTML = `
          <div class="board-item-row">
            <a class="board-item-main" href="notice-detail.html?id=${encodeURIComponent(notice.id)}">
              <p class="board-item-title"></p>
              <p class="board-item-meta"></p>
            </a>
            <a class="btn board-edit-btn" href="notice-write.html?id=${encodeURIComponent(notice.id)}">수정</a>
            <button type="button" class="btn board-delete-btn">삭제</button>
          </div>
        `;
        li.querySelector(".board-item-title").textContent = notice.title;
        li.querySelector(".board-item-meta").textContent = formatMeta(notice);
        li.querySelector(".board-delete-btn").addEventListener("click", () => {
          if (!confirm("이 공지를 삭제할까요?")) return;
          const next = loadNotices().filter((item) => item.id !== notice.id);
          saveNotices(next);
          render();
        });
      } else {
        li.innerHTML = `
          <a href="notice-detail.html?id=${encodeURIComponent(notice.id)}">
            <p class="board-item-title"></p>
            <p class="board-item-meta"></p>
          </a>
        `;
        li.querySelector(".board-item-title").textContent = notice.title;
        li.querySelector(".board-item-meta").textContent = formatMeta(notice);
      }

      listEl.appendChild(li);
    });
  };

  if (sortEl) {
    sortEl.addEventListener("change", render);
  }

  render();
});
