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

  const overlay = document.createElement("div");
  overlay.id = "site-popup";
  overlay.className = "site-popup";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "site-popup-title");
  overlay.innerHTML = `
    <div class="site-popup-panel">
      <p class="site-popup-title" id="site-popup-title">임시 작업중 입니다.</p>
      <p class="site-popup-text">참고바랍니다.</p>
      <button type="button" class="btn btn-primary site-popup-close">확인</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const closePopup = () => {
    sessionStorage.setItem(popupKey, "1");
    overlay.classList.add("is-hidden");
  };

  overlay.querySelector(".site-popup-close").addEventListener("click", closePopup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });
});
