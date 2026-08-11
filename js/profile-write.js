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

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("profile-write-form");
  if (!form) return;

  let user = typeof getCachedAuthUser === "function" ? getCachedAuthUser() : null;
  if (typeof fetchCurrentUser === "function") {
    try {
      user = await fetchCurrentUser();
    } catch {
      user = null;
    }
  }

  if (!user || user.status === "banned") {
    alert("로그인 후 프로필을 등록할 수 있습니다.");
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const titleInput = document.getElementById("profile-title");
  const authorInput = document.getElementById("profile-author");
  const authorNote = document.getElementById("profile-author-note");
  const bodyInput = document.getElementById("profile-body");
  const submitBtn = form.querySelector('button[type="submit"]');
  const pageTitle = document.querySelector(".page-hero h1");
  const authorName = user.nickname || user.username;

  if (authorInput) authorInput.value = authorName;
  if (authorNote) authorNote.textContent = `작성자: ${authorName}`;

  if (editId) {
    const isAdmin = typeof isAdminMode === "function" ? isAdminMode() : false;
    if (!isAdmin) {
      alert("프로필 수정은 관리자만 가능합니다.");
      window.location.href = "profile.html";
      return;
    }
    const item = loadProfiles().find((entry) => entry.id === editId);
    if (!item) {
      alert("수정할 프로필을 찾을 수 없습니다.");
      window.location.href = "profile.html";
      return;
    }
    titleInput.value = item.title || "";
    bodyInput.value = item.body || "";
    if (authorInput) authorInput.value = item.author || authorName;
    if (authorNote) authorNote.textContent = `작성자: ${item.author || authorName}`;
    if (pageTitle) pageTitle.textContent = "프로필 수정";
    if (submitBtn) submitBtn.textContent = "수정하기";
    document.title = "프로필 수정 | 강남비너스";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const author = (authorInput && authorInput.value.trim()) || authorName;
    const body = bodyInput.value.trim();

    if (!title || !body) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    if (typeof findBannedWordInText === "function") {
      const bannedInBody = findBannedWordInText(body);
      if (bannedInBody) {
        alert(`${bannedInBody} 금지어가 있습니다.`);
        return;
      }
      const bannedInTitle = findBannedWordInText(title);
      if (bannedInTitle) {
        alert(`${bannedInTitle} 금지어가 있습니다.`);
        return;
      }
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
      userId: user.id,
    });
    saveProfiles(items);
    window.location.href = "profile.html";
  });
});
