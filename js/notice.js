const NOTICE_STORAGE_KEY = "gnclass-notices";

const DEFAULT_NOTICES = [
  {
    id: "sample-1",
    title: "010 8316 6955 번호 이동합니다",
    author: "운영자",
    body: "연락처가 변경되었습니다.\n\n새 번호: 010-8316-6955",
    date: "2025.07.04",
    createdAt: "2025-07-04T12:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-2",
    title: "텔레그램 문의 가능합니다.",
    author: "운영자",
    body: "텔레그램으로도 문의가 가능합니다.",
    date: "2025.04.10",
    createdAt: "2025-04-10T12:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-3",
    title: "사이트 이용 안내",
    author: "관리자",
    body: "강남 클라스 사이트 이용 안내입니다.\n출근부, 프로필, 공지사항을 확인해 주세요.",
    date: "2025.01.12",
    createdAt: "2025-01-12T12:00:00.000Z",
    likes: 0,
  },
];

function loadNotices() {
  try {
    const raw = localStorage.getItem(NOTICE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(DEFAULT_NOTICES));
      return [...DEFAULT_NOTICES];
    }
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [...DEFAULT_NOTICES];
  } catch {
    return [...DEFAULT_NOTICES];
  }
}

function saveNotices(items) {
  localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(items));
}

function formatMeta(notice) {
  return `${notice.author} | ${notice.date} | 추천 ${notice.likes || 0}`;
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
