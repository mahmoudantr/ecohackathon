(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#navMenu');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.navbar')) setMenu(false);
  });
  const desktop = window.matchMedia('(min-width: 901px)');
  desktop.addEventListener('change', () => setMenu(false));
  document.querySelector('#yearNow').textContent = new Date().getFullYear();
  const navLinks = [...menu.querySelectorAll('a[href^="#"]')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
    navLinks.forEach(link => { const section = document.querySelector(link.hash); if (section) observer.observe(section); });
  }
  const dialog = document.querySelector('#galleryModal');
  const image = document.querySelector('#modalImg');
  const caption = document.querySelector('#galleryCaption');
  const count = document.querySelector('#galleryCount');
  const allPhotos = [...document.querySelectorAll('.gallery-item')];
  let photos = allPhotos;
  let current = 0;
  let opener;
  function renderPhoto(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    const thumbnail = photo.querySelector('img');
    image.src = photo.dataset.full;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) image.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 250 });
    image.alt = thumbnail.alt;
    caption.textContent = photo.querySelector('span').textContent.replace('↗', '').trim();
    count.textContent = `${current + 1} / ${photos.length}`;
  }
  allPhotos.forEach(photo => photo.addEventListener('click', event => {
    event.preventDefault();
    opener = photo;
    renderPhoto(photos.indexOf(photo));
    dialog.showModal();
    document.body.classList.add('modal-open');
    document.querySelector('#closeGallery').focus();
  }));
  document.querySelector('#closeGallery').addEventListener('click', () => dialog.close());
  document.querySelector('#prevImg').addEventListener('click', () => renderPhoto(current - 1));
  document.querySelector('#nextImg').addEventListener('click', () => renderPhoto(current + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      renderPhoto(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (opener) opener.focus();
  });
  // Motion enhances visible content; essential content is never hidden by CSS.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animateIn = (element, delay = 0) => {
    if (reduced.matches || !element.animate) return;
    element.animate([
      { opacity: .15, transform: 'translateY(22px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 650, delay, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards' });
  };
  const revealGroups = document.querySelectorAll('.about-grid, .principles, .section-intro, .theme-grid, .journey, .edition-grid, .gallery-grid, .partner-layout, .faq-grid, .closing-row');
  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const children = [...entry.target.children];
        children.forEach((child, index) => animateIn(child, Math.min(index * 65, 260)));
        reveals.unobserve(entry.target);
      });
    }, { threshold: .08 });
    revealGroups.forEach(element => reveals.observe(element));
    const journeyObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('is-current', entry.isIntersecting);
    }), { rootMargin: '-25% 0px -35% 0px' });
    document.querySelectorAll('.journey li').forEach(step => journeyObserver.observe(step));
  }
  const header = document.querySelector('.header');
  const progress = document.querySelector('.reading-progress span');
  let scrollPending = false;
  const updateScroll = () => {
    const length = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${length > 0 ? Math.min(1, Math.max(0, window.scrollY / length)) : 0})`;
    header.classList.toggle('is-scrolled', window.scrollY > 30);
    scrollPending = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();
  reduced.addEventListener('change', () => {
    if (reduced.matches) document.getAnimations().forEach(animation => animation.finish());
  });

  // User-controlled hero photography: no autoplay or unexpected layout changes.
  const heroImage = document.querySelector('.hero-photo > img');
  const heroCount = document.querySelector('.hero-photo-count');
  const heroButtons = [...document.querySelectorAll('.hero-photo-controls button')];
  const heroSlides = ['audience', 'eco-community', 'community-portrait'].map(name => {
    const thumbnail = document.querySelector(`.gallery-item img[src="images/${name}.webp"]`);
    return { src: thumbnail.getAttribute('src'), alt: thumbnail.alt };
  });
  let heroIndex = 0;
  let heroLoading = false;
  async function changeHero(delta) {
    if (heroLoading) return;
    heroLoading = true;
    heroButtons.forEach(button => { button.disabled = true; });
    const next = (heroIndex + delta + heroSlides.length) % heroSlides.length;
    const slide = heroSlides[next];
    const preload = new Image();
    preload.src = slide.src;
    try {
      await preload.decode();
      heroImage.removeAttribute('srcset');
      heroImage.src = slide.src;
      heroImage.alt = slide.alt;
      heroIndex = next;
      heroCount.textContent = `${String(next + 1).padStart(2, '0')} / 03`;
      if (!reduced.matches) heroImage.animate([{ opacity: .35, transform: 'scale(1.025)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 550, easing: 'ease-out' });
    } catch {
      heroCount.textContent = 'Try again';
    } finally {
      heroLoading = false;
      heroButtons.forEach(button => { button.disabled = false; });
    }
  }
  document.querySelector('.hero-prev').addEventListener('click', () => changeHero(-1));
  document.querySelector('.hero-next').addEventListener('click', () => changeHero(1));

  const filters = [...document.querySelectorAll('[data-filter]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    allPhotos.forEach(photo => { photo.hidden = category !== 'all' && photo.dataset.category !== category; });
    photos = allPhotos.filter(photo => !photo.hidden);
    document.querySelector('.filter-count').textContent = `${photos.length} moments`;
    photos.forEach((photo, index) => animateIn(photo, index * 35));
    requestAnimationFrame(updateScroll);
  }));

})();
