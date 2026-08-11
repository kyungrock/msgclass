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

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-write-form");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const titleInput = document.getElementById("profile-title");
  const authorInput = document.getElementById("profile-author");
  const bodyInput = document.getElementById("profile-body");
  const submitBtn = form.querySelector('button[type="submit"]');
  const pageTitle = document.querySelector(".page-hero h1");

  if (editId) {
    const item = loadProfiles().find((entry) => entry.id === editId);
    if (!item) {
      alert("수정할 프로필을 찾을 수 없습니다.");
      window.location.href = "profile.html";
      return;
    }
    titleInput.value = item.title || "";
    authorInput.value = item.author || "";
    bodyInput.value = item.body || "";
    if (pageTitle) pageTitle.textContent = "프로필 수정";
    if (submitBtn) submitBtn.textContent = "수정하기";
    document.title = "프로필 수정 | 강남클라스";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title || !author || !body) {
      alert("제목, 작성자, 내용을 모두 입력해 주세요.");
      return;
    }

    const items = loadProfiles();

    if (editId) {
      const index = items.findIndex((entry) => entry.id === editId);
      if (index < 0) {
        alert("수정할 프로필을 찾을 수 없습니다.");
        return;
      }
      items[index] = {
        ...items[index],
        title,
        author,
        body,
        updatedAt: new Date().toISOString(),
      };
      saveProfiles(items);
      window.location.href = "profile.html";
      return;
    }

    items.unshift({
      id: String(Date.now()),
      title,
      author,
      body,
      date: formatDate(),
      createdAt: new Date().toISOString(),
      likes: 0,
    });
    saveProfiles(items);
    window.location.href = "profile.html";
  });
});
