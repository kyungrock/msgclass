function formatMeta(item, { showDate = false } = {}) {
  const views = item.views != null ? ` | 조회 ${item.views}` : "";
  const datePart = showDate && item.date ? ` | ${item.date}` : "";
  return `${item.author}${datePart}${views}`;
}

function matchesQuery(item, query) {
  if (!query) return true;
  const haystack = [item.title, item.author, item.body]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");
  return haystack.includes(query);
}

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("review-list");
  const countEl = document.getElementById("review-count");
  const emptyEl = document.getElementById("review-empty");
  const sortEl = document.getElementById("review-sort");
  const searchEl = document.getElementById("review-search");
  const pagerEl = document.getElementById("review-pagination");
  const toolbarEl = document.querySelector(".board-toolbar");
  const gateEl = document.getElementById("member-gate");
  const PAGE_SIZE = 30;
  const PAGE_WINDOW = 5;

  if (!listEl) return;

  const member = await requireMemberToView(gateEl || emptyEl, {
    nextUrl: "reviews.html",
  });
  if (!member) {
    listEl.innerHTML = "";
    if (toolbarEl) toolbarEl.hidden = true;
    if (pagerEl) pagerEl.hidden = true;
    if (countEl) countEl.textContent = "0";
    if (emptyEl && gateEl) emptyEl.hidden = true;
    return;
  }
  if (gateEl) gateEl.hidden = true;

  let cachedItems = null;
  let searchTimer = null;
  let currentPage = Math.max(
    1,
    parseInt(new URLSearchParams(location.search).get("page") || "1", 10) || 1
  );

  const setPageInUrl = (page) => {
    const url = new URL(location.href);
    if (page <= 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(page));
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  };

  const goToPage = (page) => {
    if (page === currentPage) return;
    currentPage = page;
    setPageInUrl(page);
    void render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const makePagerBtn = (label, { page, active = false, disabled = false, ariaLabel } = {}) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pager-btn" + (active ? " is-active" : "");
    btn.textContent = label;
    if (ariaLabel) btn.setAttribute("aria-label", ariaLabel);
    if (active) btn.setAttribute("aria-current", "page");
    if (disabled) {
      btn.disabled = true;
      return btn;
    }
    if (page != null) {
      btn.addEventListener("click", () => goToPage(page));
    }
    return btn;
  };

  const renderPager = (totalPages) => {
    if (!pagerEl) return;
    pagerEl.innerHTML = "";
    if (totalPages <= 1) {
      pagerEl.hidden = true;
      return;
    }
    pagerEl.hidden = false;

    const groupIndex = Math.floor((currentPage - 1) / PAGE_WINDOW);
    const startPage = groupIndex * PAGE_WINDOW + 1;
    const endPage = Math.min(totalPages, startPage + PAGE_WINDOW - 1);

    if (startPage > 1) {
      pagerEl.appendChild(
        makePagerBtn("‹", {
          page: startPage - 1,
          ariaLabel: "이전 페이지 구간",
        })
      );
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pagerEl.appendChild(
        makePagerBtn(String(page), {
          page,
          active: page === currentPage,
          ariaLabel: `${page}페이지`,
        })
      );
    }

    if (endPage < totalPages) {
      pagerEl.appendChild(
        makePagerBtn("›", {
          page: endPage + 1,
          ariaLabel: "다음 페이지 구간",
        })
      );
    }
  };

  const render = async ({ force = false, resetPage = false } = {}) => {
    const isAdmin = member.role === "admin";
    let items = [];

    if (!force && cachedItems) {
      items = cachedItems;
    } else {
      try {
        items = await fetchReviews();
        cachedItems = items;
      } catch (err) {
        cachedItems = null;
        listEl.innerHTML = "";
        if (pagerEl) pagerEl.hidden = true;
        if (err.status === 401 || err.status === 403) {
          if (toolbarEl) toolbarEl.hidden = true;
          renderLoginRequiredGate(gateEl || emptyEl, { nextUrl: "reviews.html" });
          if (emptyEl && gateEl) emptyEl.hidden = true;
          if (countEl) countEl.textContent = "0";
          return;
        }
        if (emptyEl) {
          emptyEl.hidden = false;
          emptyEl.textContent = err.message || "후기를 불러오지 못했습니다.";
        }
        if (countEl) countEl.textContent = "0";
        return;
      }
    }

    if (resetPage) currentPage = 1;

    const query = searchEl ? searchEl.value.trim().toLowerCase() : "";
    const sort = sortEl ? sortEl.value : "newest";

    items = items.filter((item) => matchesQuery(item, query));
    items = [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt || a.date).getTime();
      const bTime = new Date(b.createdAt || b.date).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    const total = items.length;
    const usePager = !!pagerEl;
    const totalPages = usePager
      ? Math.max(1, Math.ceil(total / PAGE_SIZE))
      : 1;
    if (usePager && currentPage > totalPages) currentPage = totalPages;
    if (usePager) setPageInUrl(currentPage);

    const start = usePager ? (currentPage - 1) * PAGE_SIZE : 0;
    const pageItems = usePager
      ? items.slice(start, start + PAGE_SIZE)
      : items;

    if (countEl) countEl.textContent = String(total);
    listEl.innerHTML = "";
    if (emptyEl) {
      emptyEl.hidden = total > 0;
      emptyEl.textContent = query
        ? "검색 결과가 없습니다."
        : "등록된 후기가 없습니다.";
    }

    pageItems.forEach((review) => {
      const li = document.createElement("li");
      li.className = "board-item";
      const ownerId = review.userId != null ? review.userId : review.user_id;
      const isOwner =
        member &&
        ownerId != null &&
        String(ownerId) === String(member.id);
      const canManage = isOwner || isAdmin;

      if (canManage) {
        li.innerHTML = `
          <div class="board-item-row">
            <a class="board-item-main" href="review-detail.html?id=${encodeURIComponent(review.id)}">
              <p class="board-item-title"></p>
              <p class="board-item-meta"></p>
            </a>
            <a class="btn board-edit-btn" href="review-write.html?id=${encodeURIComponent(review.id)}">수정</a>
            <button type="button" class="btn board-delete-btn">삭제</button>
          </div>
        `;
        li.querySelector(".board-item-title").textContent = review.title;
        li.querySelector(".board-item-meta").textContent = formatMeta(review, {
          showDate: isAdmin,
        });
        li.querySelector(".board-delete-btn").addEventListener("click", async () => {
          if (!confirm("이 후기를 삭제할까요?")) return;
          try {
            await deleteReview(review.id);
            await render({ force: true });
          } catch (err) {
            alert(err.message || "삭제에 실패했습니다.");
          }
        });
      } else {
        li.innerHTML = `
          <a href="review-detail.html?id=${encodeURIComponent(review.id)}">
            <p class="board-item-title"></p>
            <p class="board-item-meta"></p>
          </a>
        `;
        li.querySelector(".board-item-title").textContent = review.title;
        li.querySelector(".board-item-meta").textContent = formatMeta(review, {
          showDate: isAdmin,
        });
      }

      listEl.appendChild(li);
    });

    renderPager(usePager ? totalPages : 1);
  };

  if (sortEl) {
    sortEl.addEventListener("change", () => void render({ resetPage: true }));
  }
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => void render({ resetPage: true }), 150);
    });
  }
  void render({ force: true });
});
