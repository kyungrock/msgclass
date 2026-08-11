const PROFILE_STORAGE_KEY = "gnclass-profiles";

const DEFAULT_PROFILES = [
  {
    id: "sample-1",
    title: "수애",
    author: "관리자",
    body: "강남비너스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T12:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-2",
    title: "보라",
    author: "관리자",
    body: "강남비너스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T11:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-3",
    title: "제니",
    author: "관리자",
    body: "강남비너스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T10:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-4",
    title: "아영",
    author: "관리자",
    body: "강남비너스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T09:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-5",
    title: "소나",
    author: "관리자",
    body: "강남비너스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T08:00:00.000Z",
    likes: 0,
  },
  {
    id: "sample-6",
    title: "제시",
    author: "관리자",
    body: "강남비너스 프로필입니다.",
    date: "2026.08.10",
    createdAt: "2026-08-10T07:00:00.000Z",
    likes: 0,
  },
];

function loadProfiles() {
  if (typeof syncSiteContentVersion === "function") syncSiteContentVersion();
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES));
      return [...DEFAULT_PROFILES];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES));
      return [...DEFAULT_PROFILES];
    }
    return data;
  } catch {
    return [...DEFAULT_PROFILES];
  }
}

function saveProfiles(items) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(items));
}

function formatMeta(profile) {
  return `${profile.author} | ${profile.date} | 추천 ${profile.likes || 0}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("profile-list");
  const countEl = document.getElementById("profile-count");
  const emptyEl = document.getElementById("profile-empty");
  const sortEl = document.getElementById("profile-sort");

  if (!listEl) return;

  const render = () => {
    const admin = typeof isAdminMode === "function" ? isAdminMode() : false;
    let items = loadProfiles();
    const sort = sortEl ? sortEl.value : "newest";

    items = [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    if (countEl) countEl.textContent = String(items.length);
    listEl.innerHTML = "";
    if (emptyEl) emptyEl.hidden = items.length > 0;

    items.forEach((profile) => {
      const li = document.createElement("li");
      li.className = "board-item";

      if (admin) {
        li.innerHTML = `
          <div class="board-item-row">
            <a class="board-item-main" href="profile-detail.html?id=${encodeURIComponent(profile.id)}">
              <p class="board-item-title"></p>
              <p class="board-item-meta"></p>
            </a>
            <a class="btn board-edit-btn" href="profile-write.html?id=${encodeURIComponent(profile.id)}">수정</a>
            <button type="button" class="btn board-delete-btn">삭제</button>
          </div>
        `;
        li.querySelector(".board-item-title").textContent = profile.title;
        li.querySelector(".board-item-meta").textContent = formatMeta(profile);
        li.querySelector(".board-delete-btn").addEventListener("click", () => {
          if (!confirm("이 프로필을 삭제할까요?")) return;
          const next = loadProfiles().filter((item) => item.id !== profile.id);
          saveProfiles(next);
          render();
        });
      } else {
        li.innerHTML = `
          <a href="profile-detail.html?id=${encodeURIComponent(profile.id)}">
            <p class="board-item-title"></p>
            <p class="board-item-meta"></p>
          </a>
        `;
        li.querySelector(".board-item-title").textContent = profile.title;
        li.querySelector(".board-item-meta").textContent = formatMeta(profile);
      }

      listEl.appendChild(li);
    });
  };

  if (sortEl) {
    sortEl.addEventListener("change", render);
  }

  render();
});
