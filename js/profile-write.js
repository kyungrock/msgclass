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

  if (!user || user.role !== "admin") {
    alert("관리자만 프로필을 등록할 수 있습니다.");
    window.location.href = "profile.html";
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
    try {
      const item = await fetchProfile(editId);
      titleInput.value = item.title || "";
      bodyInput.value = item.body || "";
      if (authorInput) authorInput.value = item.author || authorName;
      if (authorNote) authorNote.textContent = `작성자: ${item.author || authorName}`;
      if (pageTitle) pageTitle.textContent = "프로필 수정";
      if (submitBtn) submitBtn.textContent = "수정하기";
      document.title = "프로필 수정 | 강남더라임";
    } catch {
      alert("수정할 프로필을 찾을 수 없습니다.");
      window.location.href = "profile.html";
      return;
    }
  }

  form.addEventListener("submit", async (e) => {
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

    if (submitBtn) submitBtn.disabled = true;
    try {
      if (editId) {
        await updateProfile(editId, { title, author, body });
      } else {
        await createProfile({ title, body });
      }
      window.location.href = "profile.html";
    } catch (err) {
      alert(err.message || "저장에 실패했습니다.");
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
