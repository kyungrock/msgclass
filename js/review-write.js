document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("review-write-form");
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
    alert("로그인 후 후기를 등록할 수 있습니다.");
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("id");
  const titleInput = document.getElementById("review-title");
  const authorInput = document.getElementById("review-author");
  const authorNote = document.getElementById("review-author-note");
  const bodyInput = document.getElementById("review-body");
  const submitBtn = form.querySelector('button[type="submit"]');
  const pageTitle = document.querySelector(".page-hero h1");
  const authorName = user.nickname || user.username;

  if (authorInput) authorInput.value = authorName;
  if (authorNote) authorNote.textContent = `작성자: ${authorName}`;

  if (editId) {
    try {
      const item = await fetchReview(editId);
      const ownerId = item.userId != null ? item.userId : item.user_id;
      const isOwner =
        ownerId != null && String(ownerId) === String(user.id);
      const isAdmin = user.role === "admin";
      if (!isOwner && !isAdmin) {
        alert("본인이 작성한 후기만 수정할 수 있습니다.");
        window.location.href = "reviews.html";
        return;
      }
      titleInput.value = item.title || "";
      bodyInput.value = item.body || "";
      if (authorInput) authorInput.value = item.author || authorName;
      if (authorNote) authorNote.textContent = `작성자: ${item.author || authorName}`;
      if (pageTitle) pageTitle.textContent = "후기 수정";
      if (submitBtn) submitBtn.textContent = "수정하기";
      document.title = "후기 수정 | 강남더라임";
    } catch {
      alert("수정할 후기를 찾을 수 없습니다.");
      window.location.href = "reviews.html";
      return;
    }
  }

  const backLink = document.querySelector(".back-link");
  if (backLink) backLink.href = "reviews.html";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const author = (authorInput && authorInput.value.trim()) || authorName;
    const body = bodyInput.value.trim();

    if (!title || !body) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    if (typeof findBannedWordInTextAsync === "function") {
      const bannedInBody = await findBannedWordInTextAsync(body);
      if (bannedInBody) {
        alert(`${bannedInBody} 금지어가 있습니다.`);
        return;
      }
      const bannedInTitle = await findBannedWordInTextAsync(title);
      if (bannedInTitle) {
        alert(`${bannedInTitle} 금지어가 있습니다.`);
        return;
      }
    } else if (typeof findBannedWordInText === "function") {
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
        await updateReview(editId, { title, author, body });
      } else {
        await createReview({ title, body });
      }
      window.location.href = "reviews.html";
    } catch (err) {
      alert(err.message || "저장에 실패했습니다.");
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
