(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Footer year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile menu
  const menuBtn = $(".menuBtn");
  const menu = $("#menu");
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
      const open = menu.classList.toggle("active");
      menuBtn.setAttribute("aria-expanded", String(open));
    });

    // close on clicking any link inside menu
    $$("a", menu).forEach((a) => {
      a.addEventListener("click", () => {
        menu.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });

    // close on outside click (mobile)
    document.addEventListener("click", (e) => {
      const isMobile = window.matchMedia("(max-width: 760px)").matches;
      if (!isMobile) return;
      if (!menu.classList.contains("active")) return;
      const t = e.target;
      if (!t) return;
      if (menu.contains(t) || menuBtn.contains(t)) return;
      menu.classList.remove("active");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  }

  // Smooth scroll with sticky header offset
  const topbar = $(".topbar");
  const headerH = () => (topbar ? topbar.getBoundingClientRect().height : 0);

  const smoothToHash = (hash) => {
    const el = document.querySelector(hash);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - headerH() - 10;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  document.addEventListener("click", (e) => {
    const a = e.target?.closest?.('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute("href");
    if (!hash || hash === "#") return;
    if (!document.querySelector(hash)) return;
    e.preventDefault();
    history.pushState(null, "", hash);
    smoothToHash(hash);
  });

  // Scroll reveal
  const reveals = $$(".reveal");
  if (reveals.length) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      reveals.forEach((el) => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-in");
              io.unobserve(en.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      reveals.forEach((el) => io.observe(el));
    }
  }

  // Scrollspy (active .lnk)
  const sectionIds = ["about", "experience", "tracks", "highlights", "sponsors", "faq"];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const navLinks = $$(".lnk").map((a) => ({ a, hash: a.getAttribute("href") }));

  const setActive = (id) => {
    navLinks.forEach(({ a, hash }) => a.classList.toggle("is-active", hash === `#${id}`));
  };

  if (sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((x) => x.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0.05, 0.1, 0.2, 0.35] }
    );
    sections.forEach((s) => spy.observe(s));
  }

  // Back to top
  const toTop = $(".toTop");
  if (toTop) {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      toTop.classList.toggle("show", y > 650);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // FAQ accordion (matches .q + next .a)
  const faqList = $("#faqList");
  if (faqList) {
    const qs = $$(".q", faqList);
    qs.forEach((q) => {
      q.addEventListener("click", () => {
        const expanded = q.getAttribute("aria-expanded") === "true";
        // close others
        qs.forEach((x) => {
          x.setAttribute("aria-expanded", "false");
          const a = x.nextElementSibling;
          if (a) a.hidden = true;
          const icon = x.querySelector("span");
          if (icon) icon.textContent = "+";
        });

        // toggle current
        q.setAttribute("aria-expanded", String(!expanded));
        const a = q.nextElementSibling;
        if (a) a.hidden = expanded;

        const icon = q.querySelector("span");
        if (icon) icon.textContent = expanded ? "+" : "−";
      });
    });
  }

  // Gallery modal (your HTML: #modal, .modal__bg, .modal__box, .icon, .nav, .frame, #modalImg, #modalCap)
  const modal = $("#modal");
  const modalImg = $("#modalImg");
  const modalCap = $("#modalCap");
  const shots = $$("#gallery .shot");

  let currentIndex = 0;
  let lastFocusEl = null;

  const getFocusable = (container) =>
    Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    );

  const trapFocus = (e) => {
    if (!modal || !modal.classList.contains("show")) return;
    if (e.key !== "Tab") return;

    const box = $(".modal__box", modal);
    if (!box) return;

    const focusables = getFocusable(box);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const showIndex = (idx) => {
    if (!shots.length) return;
    currentIndex = (idx + shots.length) % shots.length;

    const full = shots[currentIndex].getAttribute("data-full") || "";
    const alt = shots[currentIndex].getAttribute("data-alt") || "Highlight";

    if (modalImg) {
      modalImg.src = full;
      modalImg.alt = alt;
    }
    if (modalCap) modalCap.textContent = alt;
  };

  const openModal = (idx) => {
    if (!modal || !shots.length) return;
    lastFocusEl = document.activeElement;
    showIndex(idx);

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const box = $(".modal__box", modal);
    if (box) {
      box.setAttribute("tabindex", "-1");
      box.focus();
    }

    window.addEventListener("keydown", onModalKey);
    window.addEventListener("keydown", trapFocus);
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    window.removeEventListener("keydown", onModalKey);
    window.removeEventListener("keydown", trapFocus);

    if (lastFocusEl && typeof lastFocusEl.focus === "function") lastFocusEl.focus();
  };

  const onModalKey = (e) => {
    if (!modal || !modal.classList.contains("show")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") showIndex(currentIndex + 1);
    if (e.key === "ArrowLeft") showIndex(currentIndex - 1);
  };

  if (modal && shots.length) {
    shots.forEach((btn, i) => btn.addEventListener("click", () => openModal(i)));

    modal.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;
      if (t.matches("[data-close]")) closeModal();
    });

    const prev = $("[data-prev]", modal);
    const next = $("[data-next]", modal);
    if (prev) prev.addEventListener("click", () => showIndex(currentIndex - 1));
    if (next) next.addEventListener("click", () => showIndex(currentIndex + 1));
  }
})();
