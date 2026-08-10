const STORAGE_KEY = "gnclass-profile-items";

document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("profile-register-btn");
  const imageInput = document.getElementById("profile-image-input");
  const gallery = document.getElementById("profile-gallery");
  const emptyEl = document.getElementById("profile-empty");
  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  const loadItems = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const saveItems = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const render = () => {
    const items = loadItems();
    gallery.innerHTML = "";
    emptyEl.hidden = items.length > 0;

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "profile-card";

      const img = document.createElement("img");
      img.src = item.imageData;
      img.alt = "등록된 프로필 이미지";
      card.appendChild(img);

      if (admin) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn profile-card-remove";
        removeBtn.textContent = "삭제";
        removeBtn.addEventListener("click", () => {
          const next = loadItems().filter((entry) => entry.id !== item.id);
          saveItems(next);
          render();
        });
        card.appendChild(removeBtn);
      }

      gallery.appendChild(card);
    });
  };

  if (registerBtn && imageInput && admin) {
    registerBtn.addEventListener("click", () => {
      imageInput.click();
    });

    imageInput.addEventListener("change", () => {
      const file = imageInput.files && imageInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const items = loadItems();
        items.unshift({
          id: String(Date.now()),
          imageData: String(reader.result),
          createdAt: new Date().toISOString(),
        });
        saveItems(items);
        imageInput.value = "";
        render();
      };
      reader.readAsDataURL(file);
    });
  }

  render();
});
