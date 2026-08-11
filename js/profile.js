const PROFILE_STORAGE_KEY = "gnclass-profiles";

function getDefaultProfiles() {
  return typeof NF_PROFILES_SEED !== "undefined" && Array.isArray(NF_PROFILES_SEED)
    ? NF_PROFILES_SEED
    : [];
}

function loadProfiles() {
  if (typeof syncSiteContentVersion === "function") syncSiteContentVersion();
  const defaults = getDefaultProfiles();
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      if (defaults.length) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaults));
      }
      return [...defaults];
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) {
      if (defaults.length) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaults));
      }
      return [...defaults];
    }
    return data;
  } catch {
    return [...defaults];
  }
}

function saveProfiles(items) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(items));
}

function formatMeta(profile) {
  const views = profile.views != null ? ` | 조회 ${profile.views}` : "";
  return `${profile.author} | ${profile.date} | 추천 ${profile.likes || 0}${views}`;
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
