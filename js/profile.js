function formatMeta(item) {
  const views = item.views != null ? ` | 조회 ${item.views}` : "";
  return `${item.author} | ${item.date} | 추천 ${item.likes || 0}${views}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("profile-list");
  const countEl = document.getElementById("profile-count");
  const emptyEl = document.getElementById("profile-empty");
  const sortEl = document.getElementById("profile-sort");

  if (!listEl) return;

  const render = async () => {
    const admin = typeof isAdminMode === "function" ? isAdminMode() : false;
    let items = [];
    try {
      items = await fetchProfiles();
    } catch (err) {
      listEl.innerHTML = "";
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent = err.message || "프로필을 불러오지 못했습니다.";
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
      emptyEl.textContent = "등록된 프로필이 없습니다.";
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
        li.querySelector(".board-item-meta").textContent = formatMeta(profile);
        li.querySelector(".board-delete-btn").addEventListener("click", async () => {
          if (!confirm("이 프로필을 삭제할까요?")) return;
          try {
            await deleteProfile(profile.id);
            await render();
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
        li.querySelector(".board-item-meta").textContent = formatMeta(profile);
      }

      listEl.appendChild(li);
    });
  };

  if (sortEl) sortEl.addEventListener("change", () => void render());
  void render();
});
