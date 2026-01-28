(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Year
  const yearEl = $("#yearNow");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav
  const hamburger = $(".hamburger");
  const navMenu = $("#navMenu");

  function closeMenu() {
    if (!navMenu || !hamburger) return;
    navMenu.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
  }

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("active");
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    $$(".nav-link", navMenu).forEach((a) => a.addEventListener("click", closeMenu));

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  // ScrollSpy (active nav)
  const navLinks = $$(".nav-link");
  const sections = navLinks
    .map((a) => {
      const id = a.getAttribute("href");
      if (!id || !id.startsWith("#")) return null;
      const el = $(id);
      return el ? { a, el } : null;
    })
    .filter(Boolean);

  if (sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

        if (!visible) return;

        sections.forEach(({ a, el }) => {
          const isActive = el === visible.target;
          a.classList.toggle("is-active", isActive);
          if (isActive) a.setAttribute("aria-current", "page");
          else a.removeAttribute("aria-current");
        });
      },
      { threshold: [0.2, 0.35, 0.5, 0.65] }
    );

    sections.forEach(({ el }) => spy.observe(el));
  }

  // Reveal on scroll
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = $$(".reveal");

  if (!reducedMotion && reveals.length) {
    const revObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            revObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => revObs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // FAQ accordion (accessible)
  const faqItems = $$(".faq-item");
  faqItems.forEach((item, idx) => {
    const btn = $(".faq-question", item);
    const ans = $(".faq-answer", item);
    if (!btn || !ans) return;

    const ansId = `faq-answer-${idx + 1}`;
    ans.id = ansId;
    btn.setAttribute("aria-controls", ansId);
    btn.setAttribute("aria-expanded", "false");
    ans.setAttribute("role", "region");
    ans.setAttribute("aria-hidden", "true");

    btn.addEventListener("click", () => {
      const isActive = item.classList.toggle("active");

      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove("active");
          const ob = $(".faq-question", other);
          const oa = $(".faq-answer", other);
          if (ob) ob.setAttribute("aria-expanded", "false");
          if (oa) {
            oa.style.maxHeight = "0px";
            oa.setAttribute("aria-hidden", "true");
          }
        }
      });

      btn.setAttribute("aria-expanded", String(isActive));
      ans.setAttribute("aria-hidden", String(!isActive));

      if (isActive) ans.style.maxHeight = ans.scrollHeight + "px";
      else ans.style.maxHeight = "0px";
    });
  });

  // Gallery modal
  const modal = $("#galleryModal");
  const modalImg = $("#modalImg");
  const prevBtn = $("#prevImg");
  const nextBtn = $("#nextImg");
  const closeEls = $$("#galleryModal [data-close]");
  const galleryItems = $$("[data-gallery] .gallery-item");

  let currentIndex = 0;
  let lastFocusEl = null;

  function openModal(idx) {
    if (!modal || !modalImg) return;
    lastFocusEl = document.activeElement;
    currentIndex = idx;

    const full = galleryItems[idx]?.getAttribute("data-full");
    if (!full) return;

    modalImg.src = full;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const closeBtn = $(".modal-close", modal);
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocusEl && typeof lastFocusEl.focus === "function") lastFocusEl.focus();
    lastFocusEl = null;
  }

  function showNext(delta) {
    if (!galleryItems.length) return;
    currentIndex = (currentIndex + delta + galleryItems.length) % galleryItems.length;
    openModal(currentIndex);
  }

  galleryItems.forEach((btn, idx) => btn.addEventListener("click", () => openModal(idx)));
  closeEls.forEach((el) => el.addEventListener("click", closeModal));
  if (prevBtn) prevBtn.addEventListener("click", () => showNext(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => showNext(1));

  window.addEventListener("keydown", (e) => {
    if (!modal || !modal.classList.contains("show")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") showNext(-1);
    if (e.key === "ArrowRight") showNext(1);
  });

  // Stars generator
  const starsHost = $("[data-stars]");
  if (starsHost) {
    const small = window.innerWidth < 700;
    const count = reducedMotion ? 34 : (small ? 58 : 82);

    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "star" + (Math.random() > 0.86 ? " big" : "");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = (Math.random() * 2.8).toFixed(2) + "s";
      s.style.opacity = (0.35 + Math.random() * 0.65).toFixed(2);
      starsHost.appendChild(s);
    }
  }

  // Parallax (ONLY elements with data-parallax — planets/rings)
  const parallaxEls = $$("[data-parallax]");
  let rafId = 0;
  let targetX = 0, targetY = 0;

  function applyParallax() {
    rafId = 0;
    parallaxEls.forEach((el) => {
      const strength = parseFloat(el.getAttribute("data-parallax") || "0.15");
      el.style.setProperty("--px", `${targetX * strength}px`);
      el.style.setProperty("--py", `${targetY * strength}px`);
    });
  }

  if (!reducedMotion && parallaxEls.length) {
    window.addEventListener(
      "mousemove",
      (e) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx; // -1..1
        const dy = (e.clientY - cy) / cy; // -1..1

        targetX = dx * 14;
        targetY = dy * 12;

        if (!rafId) rafId = requestAnimationFrame(applyParallax);
      },
      { passive: true }
    );
  }
})();
