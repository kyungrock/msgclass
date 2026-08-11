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

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("profile-list");
  const countEl = document.getElementById("profile-count");
  const emptyEl = document.getElementById("profile-empty");
  const sortEl = document.getElementById("profile-sort");
  const searchEl = document.getElementById("profile-search");

  if (!listEl) return;

  let cachedItems = null;
  let searchTimer = null;

  const render = async ({ force = false } = {}) => {
    const admin = typeof isAdminMode === "function" ? isAdminMode() : false;
    let items = [];

    if (!force && cachedItems) {
      items = cachedItems;
    } else {
      try {
        items = await fetchProfiles();
        cachedItems = items;
      } catch (err) {
        cachedItems = null;
        listEl.innerHTML = "";
        if (emptyEl) {
          emptyEl.hidden = false;
          emptyEl.textContent = err.message || "프로필을 불러오지 못했습니다.";
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
        : "등록된 프로필이 없습니다.";
    }

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
        li.querySelector(".board-item-meta").textContent = formatMeta(profile, { showDate: admin });
        li.querySelector(".board-delete-btn").addEventListener("click", async () => {
          if (!confirm("이 프로필을 삭제할까요?")) return;
          try {
            await deleteProfile(profile.id);
            await render({ force: true });
          } catch (err) {
            alert(err.message || "삭제에 실패했습니다.");
          }
        });
      } else {
        li.innerHTML = `
          <a href="profile-detail.html?id=${encodeURIComponent(profile.id)}">
            <p class="board-item-title"></p>
            <p class="board-item-meta"></p>
          </a>
        `;
        li.querySelector(".board-item-title").textContent = profile.title;
        li.querySelector(".board-item-meta").textContent = formatMeta(profile, { showDate: admin });
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
