// EcoHack2025 - UI interactions

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

  // Mobile nav toggle
  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    // Close menu when clicking any nav link (mobile)
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          hamburger.classList.remove("active");
        }
      });
    });
  }

  // FAQ accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const q = item.querySelector(".faq-question");
    const a = item.querySelector(".faq-answer");

    if (!q || !a) return;

    q.setAttribute("tabindex", "0");

    const toggle = () => {
      const isOpen = item.classList.contains("active");

      // close others for cleaner UX
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

  // Active nav link on scroll (sections)
  const sections = document.querySelectorAll("section[id]");
  const setActiveLink = () => {
    const scrollY = window.scrollY + 120; // offset for header
    let currentId = "";

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentId = sec.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");
      if (href === `#${currentId}`) {
        link.classList.add("active");
      }
    });
  };

  window.addEventListener("scroll", setActiveLink);
  setActiveLink();
});
