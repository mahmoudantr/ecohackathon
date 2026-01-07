// EcoHack2025 - Fajer UI interactions

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");
  const backToTop = document.querySelector(".back-to-top");
  const cursorGlow = document.querySelector(".cursor-glow");

  // =========================
  // Mobile nav toggle + a11y
  // =========================
  const closeMenu = () => {
    if (!navMenu) return;
    navMenu.classList.remove("active");
    hamburger?.classList.remove("active");
  };

  const toggleMenu = () => {
    if (!navMenu || !hamburger) return;
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  };

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", toggleMenu);

    hamburger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleMenu();
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      const t = e.target;
      const isInsideNav = navMenu.contains(t) || hamburger.contains(t);
      if (!isInsideNav && navMenu.classList.contains("active")) closeMenu();
    });

    // Close on ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  // =========================
  // FAQ accordion
  // =========================
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const q = item.querySelector(".faq-question");
    const a = item.querySelector(".faq-answer");
    if (!q || !a) return;

    q.setAttribute("tabindex", "0");

    const toggle = () => {
      const isOpen = item.classList.contains("active");

      faqItems.forEach((it) => {
        it.classList.remove("active");
        const ans = it.querySelector(".faq-answer");
        if (ans) ans.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add("active");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    };

    q.addEventListener("click", toggle);
    q.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });

  // =========================
  // Active nav link (IntersectionObserver)
  // =========================
  const sections = document.querySelectorAll("section[id]");
  const linkById = {};
  navLinks.forEach((l) => {
    const href = l.getAttribute("href") || "";
    if (href.startsWith("#")) linkById[href.slice(1)] = l;
  });

  const setActive = (id) => {
    navLinks.forEach((l) => l.classList.remove("active"));
    if (linkById[id]) linkById[id].classList.add("active");
  };

  if (sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        // pick the most visible intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

        if (visible) setActive(visible.target.id);
      },
      { root: null, threshold: [0.15, 0.25, 0.35, 0.5, 0.6] }
    );
    sections.forEach((s) => obs.observe(s));
  }

  // =========================
  // Scroll Reveal
  // =========================
  const revealTargets = document.querySelectorAll(
    ".section, .agenda-section, .hero-card, .track-card, .stat-card, .agenda-card, .faq-container, .sponsors-grid, .footer"
  );

  revealTargets.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.setProperty("--d", `${Math.min(i * 55, 420)}ms`);
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reducedMotion) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealTargets.forEach((el) => revealObs.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("in"));
  }

  // =========================
  // Back to top
  // =========================
  const onScroll = () => {
    if (!backToTop) return;
    if (window.scrollY > 700) backToTop.classList.add("show");
    else backToTop.classList.remove("show");
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });

  // =========================
  // Cursor glow (desktop only)
  // =========================
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (!reducedMotion && !isTouch && cursorGlow) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    cursorGlow.style.opacity = "1";

    window.addEventListener(
      "mousemove",
      (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
      },
      { passive: true }
    );

    const animate = () => {
      // smooth follow
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      cursorGlow.style.left = `${currentX}px`;
      cursorGlow.style.top = `${currentY}px`;
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  } else if (cursorGlow) {
    cursorGlow.style.opacity = "0";
  }
});
