document.addEventListener("DOMContentLoaded", () => {
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
      removeBtn.addEventListener("click", () => {
        removeBannedWord(word);
        render();
      });

      li.append(text, removeBtn);
      listEl.appendChild(li);
    });
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const result = addBannedWords(input.value);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    input.value = "";
    input.focus();
    render();
  });

  if (saveTextBtn && textEl) {
    saveTextBtn.addEventListener("click", () => {
      setBannedWordsFromText(textEl.value);
      render();
      alert("금지어가 콤마 기준으로 저장되었습니다.");
    });
  }

  render();
});
