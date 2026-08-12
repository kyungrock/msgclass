document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("banned-form");
  const input = document.getElementById("banned-input");
  const listEl = document.getElementById("banned-list");
  const countEl = document.getElementById("banned-count");
  const textEl = document.getElementById("banned-text");
  const saveTextBtn = document.getElementById("banned-save-text");

  const render = () => {
    const words = loadBannedWords();
    countEl.textContent = String(words.length);
    if (textEl) textEl.value = words.join(",");

    listEl.innerHTML = "";
    words.forEach((word) => {
      const li = document.createElement("li");
      li.className = "banned-item";

      const text = document.createElement("span");
      text.textContent = word;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn";
      removeBtn.textContent = "삭제";
      removeBtn.addEventListener("click", async () => {
        try {
          await removeBannedWordAsync(word);
          render();
        } catch (err) {
          alert(err.message || "금지어 삭제에 실패했습니다.");
        }
      });

      li.append(text, removeBtn);
      listEl.appendChild(li);
    });
  };

  try {
    await refreshBannedWords({ migrateLocal: true });
  } catch {
    /* keep local fallback */
  }
  render();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const result = await addBannedWordsAsync(input.value);
      if (!result.ok) {
        alert(result.message);
        return;
      }
      input.value = "";
      input.focus();
      render();
    } catch (err) {
      alert(err.message || "금지어 저장에 실패했습니다.");
    }
  });

  if (saveTextBtn && textEl) {
    saveTextBtn.addEventListener("click", async () => {
      try {
        await persistBannedWords(parseBannedWordsInput(textEl.value));
        render();
        alert("금지어가 콤마 기준으로 저장되었습니다.");
      } catch (err) {
        alert(err.message || "금지어 저장에 실패했습니다.");
      }
    });
  }
});
