(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Year
  const yearEl = $("#yearNow");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const hamburger = $(".hamburger");
  const navMenu = $("#navMenu");
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("active");
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu on link click
    $$(".nav__link, .btn", navMenu).forEach((a) => {
      a.addEventListener("click", () => {
        navMenu.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });

    // Close on outside click (mobile)
    document.addEventListener("click", (e) => {
      const isMobile = window.matchMedia("(max-width: 760px)").matches;
      if (!isMobile) return;
      if (!navMenu.classList.contains("active")) return;
      const target = e.target;
      if (!target) return;
      if (navMenu.contains(target) || hamburger.contains(target)) return;
      navMenu.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
    });
  }

  // FAQ accordion
  const faqList = $("#faqList");
  if (faqList) {
    const qs = $$(".faq__q", faqList);
    qs.forEach((q) => {
      q.addEventListener("click", () => {
        const expanded = q.getAttribute("aria-expanded") === "true";
        // close others
        qs.forEach((x) => {
          x.setAttribute("aria-expanded", "false");
          const panel = x.nextElementSibling;
          if (panel) panel.hidden = true;
        });
        // open current
        q.setAttribute("aria-expanded", String(!expanded));
        const a = q.nextElementSibling;
        if (a) a.hidden = expanded;
      });
    });
  }

  // Scroll reveal
  const reveals = $$(".reveal");
  if (reveals.length) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      reveals.forEach((el) => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      reveals.forEach((el) => io.observe(el));
    }
  }

  // Scrollspy (active nav link)
  const sections = ["about", "tracks", "highlights", "sponsors", "faq"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const navLinks = $$(".nav__link").map((a) => ({
    a,
    hash: a.getAttribute("href"),
  }));

  const setActive = (id) => {
    navLinks.forEach(({ a, hash }) => {
      const isActive = hash === `#${id}`;
      a.classList.toggle("is-active", isActive);
    });
  };

  if (sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        // choose the most visible intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
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
    const toggleTop = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      toTop.classList.toggle("show", y > 650);
    };
    toggleTop();
    window.addEventListener("scroll", toggleTop, { passive: true });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // Highlights modal (A11y focus trap + arrows + escape)
  const modal = $("#galleryModal");
  const modalImg = $("#modalImg");
  const modalCaption = $("#modalCaption");
  const shots = $$("#galleryGrid .shot");

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

    const docEl = $(".modal__content", modal);
    if (!docEl) return;

    const focusables = getFocusable(docEl);
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

  const openModal = (idx) => {
    if (!modal || !modalImg || !shots.length) return;
    lastFocusEl = document.activeElement;

    currentIndex = idx;
    const full = shots[idx].getAttribute("data-full");
    const alt = shots[idx].getAttribute("data-alt") || "Gallery image";

    modalImg.src = full || "";
    modalImg.alt = alt;
    modalCaption.textContent = alt;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const docEl = $(".modal__content", modal);
    if (docEl) {
      docEl.setAttribute("tabindex", "-1");
      docEl.focus();
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

  const showIndex = (idx) => {
    if (!shots.length) return;
    currentIndex = (idx + shots.length) % shots.length;
    const full = shots[currentIndex].getAttribute("data-full");
    const alt = shots[currentIndex].getAttribute("data-alt") || "Gallery image";
    modalImg.src = full || "";
    modalImg.alt = alt;
    modalCaption.textContent = alt;
  };

  const onModalKey = (e) => {
    if (!modal || !modal.classList.contains("show")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") showIndex(currentIndex + 1);
    if (e.key === "ArrowLeft") showIndex(currentIndex - 1);
  };

  if (modal && modalImg && shots.length) {
    shots.forEach((b, i) => b.addEventListener("click", () => openModal(i)));

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

  // Prevent hash-jump offset under sticky header
  const header = $(".header");
  const headerH = () => (header ? header.getBoundingClientRect().height : 0);

  const smoothToHash = (hash) => {
    const el = document.querySelector(hash);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH() - 10;
    window.scrollTo({ top, behavior: "smooth" });
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

})();
