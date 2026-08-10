const STORAGE_KEY = "gnclass-profile-items";
const DEFAULT_PROFILE_IMAGE = "images/profile-content.png";

document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.getElementById("profile-register-btn");
  const imageInput = document.getElementById("profile-image-input");
  const gallery = document.getElementById("profile-gallery");
  const emptyEl = document.getElementById("profile-empty");
  const admin = typeof isAdminMode === "function" ? isAdminMode() : false;

  const loadItems = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      /* ignore */
    }
    return [
      {
        id: "default-1",
        imageData: DEFAULT_PROFILE_IMAGE,
        createdAt: new Date().toISOString(),
        isDefault: true,
      },
    ];
  };

  const saveItems = (items) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.filter((item) => !item.isDefault))
    );
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
      img.alt = "강남클라스 프로필";
      card.appendChild(img);

      if (admin && !item.isDefault) {
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
        const current = loadItems().filter((item) => !item.isDefault);
        current.unshift({
          id: String(Date.now()),
          imageData: String(reader.result),
          createdAt: new Date().toISOString(),
        });
        saveItems(current);
        imageInput.value = "";
        render();
      };
      reader.readAsDataURL(file);
    });
  }

  render();
});
