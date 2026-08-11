document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");

  if (toggle && nav) {
    const closeMenu = () => {
      toggle.classList.remove("is-open");
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "메뉴 열기");
    };

    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      toggle.classList.toggle("is-open", open);
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  const isMainPage =
    /(?:^|\/)(index\.html)?$/i.test(window.location.pathname) ||
    window.location.pathname.endsWith("/");
  const popupKey = "gnclass-popup-dismissed";
  const alreadyDismissed = sessionStorage.getItem(popupKey) === "1";

  if (!isMainPage || alreadyDismissed || document.getElementById("site-popup")) {
    return;
  }

  const config =
    typeof loadPopupConfig === "function"
      ? loadPopupConfig()
      : { enabled: true, title: "임시 작업중 입니다.", body: "참고바랍니다." };

  if (!config.enabled) return;

  const overlay = document.createElement("div");
  overlay.id = "site-popup";
  overlay.className = "site-popup";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "site-popup-title");

  const panel = document.createElement("div");
  panel.className = "site-popup-panel";

  const titleEl = document.createElement("p");
  titleEl.className = "site-popup-title";
  titleEl.id = "site-popup-title";
  titleEl.textContent = config.title || "알림";

  const bodyEl = document.createElement("p");
  bodyEl.className = "site-popup-text";
  bodyEl.textContent = config.body || "";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn btn-primary site-popup-close";
  closeBtn.textContent = "확인";

  panel.appendChild(titleEl);
  panel.appendChild(bodyEl);
  panel.appendChild(closeBtn);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const closePopup = () => {
    sessionStorage.setItem(popupKey, "1");
    overlay.classList.add("is-hidden");
  };

  closeBtn.addEventListener("click", closePopup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });
});
