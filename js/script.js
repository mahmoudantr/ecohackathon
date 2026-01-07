// js/script.js
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Year
  const yearEl = $("#yearNow");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav
  const hamburger = $(".hamburger");
  const navMenu = $("#navMenu");
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("active");
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    $$(".nav-link", navMenu).forEach((a) => {
      a.addEventListener("click", () => {
        navMenu.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // FAQ accordion
  $$(".faq-item").forEach((item) => {
    const btn = $(".faq-question", item);
    const ans = $(".faq-answer", item);
    if (!btn || !ans) return;

    btn.addEventListener("click", () => {
      const isActive = item.classList.toggle("active");
      // close others
      $$(".faq-item").forEach((other) => {
        if (other !== item) other.classList.remove("active");
      });

      // heights
      $$(".faq-item").forEach((it) => {
        const a = $(".faq-answer", it);
        if (!a) return;
        if (it.classList.contains("active")) {
          a.style.maxHeight = a.scrollHeight + "px";
        } else {
          a.style.maxHeight = "0px";
        }
      });

      // little safety
      if (isActive) ans.style.maxHeight = ans.scrollHeight + "px";
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

  function openModal(idx) {
    if (!modal || !modalImg) return;
    currentIndex = idx;
    const full = galleryItems[idx]?.getAttribute("data-full");
    if (!full) return;
    modalImg.src = full;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
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

  // Stars generator (lightweight)
  const starsHost = $("[data-stars]");
  if (starsHost) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = reduced ? 40 : 80;

    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "star" + (Math.random() > 0.85 ? " big" : "");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = (Math.random() * 2.8).toFixed(2) + "s";
      s.style.opacity = (0.35 + Math.random() * 0.65).toFixed(2);
      starsHost.appendChild(s);
    }
  }

  // Parallax (mouse)
  const parallaxEls = $$("[data-parallax]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setXY(x, y) {
    // normalized around center
    document.documentElement.style.setProperty("--mx", `${x}px`);
    document.documentElement.style.setProperty("--my", `${y}px`);

    // also move specific elements a bit (stronger + smoother)
    parallaxEls.forEach((el) => {
      const strength = parseFloat(el.getAttribute("data-parallax") || "0.15");
      el.style.transform = `translate(${x * strength}px, ${y * strength}px) ${el.classList.contains("planet-bottom") ? "translateX(-50%)" : ""}`;
    });
  }

  if (!reducedMotion) {
    window.addEventListener("mousemove", (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx; // -1..1
      const dy = (e.clientY - cy) / cy; // -1..1
      setXY(dx * 14, dy * 12);
    }, { passive: true });
  }
})();
