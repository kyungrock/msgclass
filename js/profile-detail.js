const PROFILE_STORAGE_KEY = "gnclass-profiles";

function loadProfiles() {
  try {
    const data = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveProfiles(items) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(items));
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const profiles = loadProfiles();
  const profile = profiles.find((item) => item.id === id) || profiles[0];
  const editLink = document.getElementById("detail-edit");
  const deleteBtn = document.getElementById("detail-delete");
  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  if (!profile) {
    document.getElementById("detail-title").textContent = "프로필을 찾을 수 없습니다";
    document.getElementById("detail-meta").textContent = "";
    document.getElementById("detail-body").textContent = "목록으로 돌아가 다시 선택해 주세요.";
    return;
  }

  document.getElementById("detail-title").textContent = profile.title;
  document.getElementById("detail-meta").textContent =
    `${profile.author} | ${profile.date} | 추천 ${profile.likes || 0}`;
  document.getElementById("detail-body").textContent = profile.body;
  document.title = `${profile.title} | 강남비너스`;

  if (admin && editLink) {
    editLink.href = `profile-write.html?id=${encodeURIComponent(profile.id)}`;
  }

  if (admin && deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (!confirm("이 프로필을 삭제할까요?")) return;
      const next = loadProfiles().filter((item) => item.id !== profile.id);
      saveProfiles(next);
      window.location.href = "profile.html";
    });
  }
});
