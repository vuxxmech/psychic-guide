/* ===========================
   script.js — interactions
   =========================== */

(function () {
  "use strict";

  /* ---------- Custom Cursor ---------- */
  const cursor = document.getElementById("cursor");
  const ring   = document.getElementById("cursor-ring");

  if (cursor && ring) {
    let rx = window.innerWidth / 2, ry = window.innerHeight / 2;
    let cx = rx, cy = ry;

    document.addEventListener("mousemove", e => {
      cx = e.clientX;
      cy = e.clientY;
      cursor.style.left = cx + "px";
      cursor.style.top  = cy + "px";
    });

    (function animateRing() {
      rx += (cx - rx) * .14;
      ry += (cy - ry) * .14;
      ring.style.left = rx + "px";
      ring.style.top  = ry + "px";
      requestAnimationFrame(animateRing);
    })();
  }

  /* ---------- Scroll Progress ---------- */
  const bar = document.getElementById("progress");
  function updateProgress() {
    if (!bar) return;
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = pct + "%";
  }

  /* ---------- Nav Scroll State ---------- */
  const nav = document.querySelector("nav");
  function updateNav() {
    if (!nav) return;
    if (window.scrollY > 60) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }

  /* ---------- Reveal on Scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  reveals.forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 0.08 + "s";
    io.observe(el);
  });

  /* ---------- Hero Parallax ---------- */
  const heroBg = document.querySelector(".hero-bg");
  function updateParallax() {
    if (!heroBg) return;
    const y = window.scrollY;
    heroBg.style.transform = `translateY(${y * 0.35}px)`;
  }

  /* ---------- Unified Scroll Handler ---------- */
  function onScroll() {
    updateProgress();
    updateNav();
    updateParallax();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Stagger card entrances ---------- */
  document.querySelectorAll(".card").forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(18px)";
    card.style.transition = `opacity .6s ${i * 0.07}s ease, transform .6s ${i * 0.07}s ease, background .35s`;
  });

  const cardObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = "1";
        e.target.style.transform = "none";
        cardObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(".card").forEach(c => cardObserver.observe(c));

})();
