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

  /* ---------- Starfield Canvas ---------- */
  (function () {
    const canvas = document.createElement("canvas");
    canvas.id = "starfield";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext("2d");
    let W, H, stars = [];

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function init() {
      stars = [];
      const count = Math.min(Math.floor((W * H) / 10000), 200);
      for (let i = 0; i < count; i++) {
        stars.push({
          x:     Math.random() * W,
          y:     Math.random() * H,
          r:     Math.random() * 1.3 + 0.25,
          base:  Math.random() * 0.5 + 0.08,
          phase: Math.random() * Math.PI * 2,
          spd:   Math.random() * 0.005 + 0.002,
          vy:    -(Math.random() * 0.05 + 0.008),
          vx:    (Math.random() - 0.5) * 0.02,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.phase += s.spd;
        const a = s.base * (0.55 + 0.45 * Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(210,220,240," + a + ")";
        ctx.fill();
        s.y += s.vy;
        s.x += s.vx;
        if (s.y < -4)        { s.y = H + 4; s.x = Math.random() * W; }
        if (s.x < -4)        { s.x = W + 4; }
        if (s.x > W + 4)     { s.x = -4; }
      });
      requestAnimationFrame(draw);
    }

    resize(); init(); draw();
    window.addEventListener("resize", function () { resize(); init(); });
  })();

  /* ---------- Ambient Music Engine ---------- */
  var Ambient = (function () {
    var actx = null, master = null, current = null;

    function getCtx() {
      if (!actx) {
        actx   = new (window.AudioContext || window.webkitAudioContext)();
        master = actx.createGain();
        master.gain.value = 0.35;
        master.connect(actx.destination);
      }
      return actx;
    }

    function makeReverb(c, sec, dec) {
      var n   = Math.floor(c.sampleRate * sec);
      var buf = c.createBuffer(2, n, c.sampleRate);
      for (var ch = 0; ch < 2; ch++) {
        var d = buf.getChannelData(ch);
        for (var i = 0; i < n; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, dec);
        }
      }
      var cv = c.createConvolver(); cv.buffer = buf; return cv;
    }

    function makeNoise(c) {
      var n   = Math.floor(c.sampleRate * 3);
      var buf = c.createBuffer(1, n, c.sampleRate);
      var d   = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      var src = c.createBufferSource();
      src.buffer = buf; src.loop = true; return src;
    }

    var tracks = {
      /* Track 1 — The Void: ultra-low drone with harmonic beating */
      void: function (c, out) {
        var rev = makeReverb(c, 8, 3);
        var w = c.createGain(); w.gain.value = 0.65; w.connect(rev); rev.connect(out);
        var d = c.createGain(); d.gain.value = 0.35; d.connect(out);
        var nodes = [];
        [[55, 0.38], [57.3, 0.28], [82.5, 0.18], [110, 0.11], [165, 0.07]].forEach(function (pair) {
          var o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.frequency.value = pair[0]; g.gain.value = pair[1];
          o.connect(g); g.connect(w); g.connect(d); o.start(); nodes.push(o);
        });
        var lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = 0.06; lg.gain.value = 0.05;
        lfo.connect(lg); lg.connect(w.gain); lfo.start(); nodes.push(lfo);
        return { stop: function () { nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); } };
      },

      /* Track 2 — Distant Rain: filtered noise with gentle dynamics */
      rain: function (c, out) {
        var localCtx = c;
        var rev = makeReverb(c, 3, 1.2);
        var w = c.createGain(); w.gain.value = 0.55; w.connect(rev); rev.connect(out);
        var noise = makeNoise(c);
        var lp = c.createBiquadFilter(); lp.type = "lowpass";  lp.frequency.value = 3200; lp.Q.value = 0.4;
        var hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 180;  hp.Q.value = 0.3;
        var g  = c.createGain(); g.gain.value = 0.5;
        noise.connect(lp); lp.connect(hp); hp.connect(g); g.connect(w); noise.start();
        var alive = true;
        (function vary() {
          if (!alive || !localCtx || localCtx.state === "closed") return;
          g.gain.setTargetAtTime(0.38 + Math.random() * 0.28, localCtx.currentTime, 1.8);
          setTimeout(vary, 1800 + Math.random() * 2800);
        })();
        return { stop: function () { alive = false; try { noise.stop(); } catch (e) {} } };
      },

      /* Track 3 — Liminal Hours: slowly evolving 432 Hz pads */
      liminal: function (c, out) {
        var rev = makeReverb(c, 7, 2.5);
        var w = c.createGain(); w.gain.value = 0.7; w.connect(rev); rev.connect(out);
        var nodes = [];
        [[432, 0.22, "sine"], [540, 0.14, "sine"], [648, 0.1, "triangle"], [216, 0.18, "sine"]].forEach(function (t) {
          var o = c.createOscillator(), g = c.createGain();
          o.type = t[2]; o.frequency.value = t[0]; g.gain.value = t[1];
          o.frequency.linearRampToValueAtTime(t[0] * 1.003, c.currentTime + 28);
          o.frequency.linearRampToValueAtTime(t[0] * 0.998, c.currentTime + 56);
          o.connect(g); g.connect(w); o.start(); nodes.push(o);
        });
        var lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = 0.04; lg.gain.value = 0.04;
        lfo.connect(lg); lg.connect(w.gain); lfo.start(); nodes.push(lfo);
        return { stop: function () { nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); } };
      },

      /* Track 4 — Heat Death: slowly descending tones and thermal noise */
      entropy: function (c, out) {
        var rev = makeReverb(c, 10, 4);
        var w = c.createGain(); w.gain.value = 0.75; w.connect(rev); rev.connect(out);
        var nodes = [];
        [[80, 0.25], [160, 0.14], [240, 0.09]].forEach(function (pair) {
          var o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.frequency.value = pair[0];
          o.frequency.linearRampToValueAtTime(pair[0] * 0.88, c.currentTime + 90);
          g.gain.value = pair[1];
          g.gain.linearRampToValueAtTime(pair[1] * 0.25, c.currentTime + 90);
          o.connect(g); g.connect(w); o.start(); nodes.push(o);
        });
        var noise = makeNoise(c);
        var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 450;
        var ng = c.createGain(); ng.gain.value = 0.09;
        noise.connect(lp); lp.connect(ng); ng.connect(w); noise.start(); nodes.push(noise);
        return { stop: function () { nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); } };
      }
    };

    return {
      play: function (name) {
        var c = getCtx();
        if (c.state === "suspended") c.resume();
        if (current) { current.stop(); current = null; }
        if (tracks[name]) current = tracks[name](c, master);
      },
      stop: function () {
        if (current) { current.stop(); current = null; }
        if (actx) actx.suspend();
      },
      isPlaying: function () { return current !== null; },
      setVolume: function (v) {
        if (master && actx) master.gain.setTargetAtTime(v, actx.currentTime, 0.06);
      }
    };
  })();

  /* ---------- Music Player UI ---------- */
  (function () {
    var TRACK_KEY   = "abyss_track";
    var VOL_KEY     = "abyss_vol";
    var DEFAULT_VOL = 35;
    var MAX_VOLUME  = 0.7;

    var wrap = document.createElement("div");
    wrap.id = "ambient-player";
    wrap.setAttribute("aria-label", "Ambient music player");
    wrap.innerHTML = [
      '<div id="music-panel" hidden>',
        '<p class="music-label">Ambient Atmosphere</p>',
        '<div class="track-list">',
          '<button class="track-item" data-track="void"><span class="track-dot"></span>',
            '<span><strong>The Void</strong><small>Deep drone</small></span></button>',
          '<button class="track-item" data-track="rain"><span class="track-dot"></span>',
            '<span><strong>Distant Rain</strong><small>Filtered noise</small></span></button>',
          '<button class="track-item" data-track="liminal"><span class="track-dot"></span>',
            '<span><strong>Liminal Hours</strong><small>3 am resonance</small></span></button>',
          '<button class="track-item" data-track="entropy"><span class="track-dot"></span>',
            '<span><strong>Heat Death</strong><small>Descending drift</small></span></button>',
        '</div>',
        '<div class="volume-row">',
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"',
              ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>',
            '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
          '</svg>',
          '<input type="range" id="vol-slider" min="0" max="100" value="' + DEFAULT_VOL + '" aria-label="Volume">',        '</div>',
      '</div>',
      '<button id="music-btn" aria-label="Open ambient music player" aria-expanded="false" title="Ambient Atmosphere">',
        '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"',
            ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"',
            ' aria-hidden="true">',
          '<path d="M9 18V5l12-2v13"/>',
          '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
        '</svg>',
        '<span id="music-waves" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
      '</button>',
    ].join("");
    document.body.appendChild(wrap);

    var btn       = document.getElementById("music-btn");
    var panel     = document.getElementById("music-panel");
    var volSlider = document.getElementById("vol-slider");
    var panelOpen = false;
    var activeTrack = null;

    /* --- Restore saved state from previous page --- */
    var savedTrack = sessionStorage.getItem(TRACK_KEY);
    var savedVol   = parseInt(sessionStorage.getItem(VOL_KEY) || String(DEFAULT_VOL), 10);

    if (savedTrack) {
      activeTrack = savedTrack;
      volSlider.value = savedVol;
      var savedItem = document.querySelector('[data-track="' + savedTrack + '"]');
      if (savedItem) savedItem.classList.add("active");
      btn.classList.add("is-playing");

      /* Show resume hint */
      var resumeEl = document.createElement("div");
      resumeEl.id = "music-resume";
      resumeEl.textContent = "♪ Click anywhere to resume ambient audio";
      document.body.appendChild(resumeEl);
      setTimeout(function () { resumeEl.classList.add("visible"); }, 250);

      /* Auto-resume on first user interaction */
      var resumed = false;
      function tryResume() {
        if (resumed) return;
        resumed = true;
        document.removeEventListener("click", tryResume);
        document.removeEventListener("scroll", tryResume);
        Ambient.play(savedTrack);
        Ambient.setVolume((savedVol / 100) * MAX_VOLUME);
        resumeEl.classList.remove("visible");
        setTimeout(function () { if (resumeEl.parentNode) resumeEl.parentNode.removeChild(resumeEl); }, 600);
      }
      document.addEventListener("click", tryResume);
      document.addEventListener("scroll", tryResume, { passive: true });
    }

    btn.addEventListener("click", function () {
      panelOpen = !panelOpen;
      panel.hidden = !panelOpen;
      btn.setAttribute("aria-expanded", String(panelOpen));
    });

    document.addEventListener("click", function (e) {
      if (panelOpen && !wrap.contains(e.target)) {
        panelOpen = false;
        panel.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      }
    });

    document.querySelectorAll(".track-item").forEach(function (item) {
      item.addEventListener("click", function () {
        var track = item.getAttribute("data-track");
        if (activeTrack === track) {
          Ambient.stop();
          activeTrack = null;
          item.classList.remove("active");
          btn.classList.remove("is-playing");
          sessionStorage.removeItem(TRACK_KEY);
        } else {
          document.querySelectorAll(".track-item").forEach(function (t) { t.classList.remove("active"); });
          item.classList.add("active");
          Ambient.play(track);
          activeTrack = track;
          btn.classList.add("is-playing");
          sessionStorage.setItem(TRACK_KEY, track);
          sessionStorage.setItem(VOL_KEY, volSlider.value);
        }
      });
    });

    volSlider.addEventListener("input", function () {
      Ambient.setVolume((volSlider.value / 100) * MAX_VOLUME);
      sessionStorage.setItem(VOL_KEY, volSlider.value);
    });
  })();

  /* ---------- Fragment of the Night ---------- */
  (function () {
    var textEl = document.getElementById("fragment-text");
    var attrEl = document.getElementById("fragment-attr");
    if (!textEl || !attrEl) return;

    var fragments = [
      { text: "You will die, and within a hundred years no one who knew you will remain alive. The universe will not record the fact.", attr: "On Impermanence" },
      { text: "Every thought you have ever had was determined by the initial conditions of the Big Bang. This sentence included.", attr: "On Determinism" },
      { text: "At this moment, somewhere in the observable universe, a star is dying. Its planets have names no mind has ever spoken.", attr: "On Scale" },
      { text: "The you that fell asleep last night and the you that woke this morning have never actually met.", attr: "On Identity" },
      { text: "Time is not passing. You are.", attr: "On Impermanence" },
      { text: "The universe existed for 9.3 billion years before the first eye opened. Most of existence remains, and will remain, unseen.", attr: "On Consciousness" },
      { text: "We have a name for the act of staring into darkness long enough that it begins to feel like home.", attr: "On the Abyss" },
      { text: "Every memory you have is a reconstruction made now. The original moment is gone and cannot be retrieved.", attr: "On Memory" },
      { text: "There are more possible games of chess than atoms in the observable universe. The complexity of your next decision dwarfs both.", attr: "On Complexity" },
      { text: "Welsh has a word for the longing for a home you cannot return to, or perhaps never had: hiraeth. English does not.", attr: "On Language & Loss" },
      { text: "Physics tells us: to observe something precisely is to change it. You cannot look at anything without altering it.", attr: "On Uncertainty" },
      { text: "If you met a perfect copy of yourself — atom for atom, memory for memory — how would you decide which of you was real?", attr: "On Identity" },
      { text: "Sisyphus descends. The boulder waits. The hill is the same hill it always was. We must imagine him happy.", attr: "On the Absurd" },
      { text: "The silence of the cosmos is not neutral. Every proposed explanation for why we hear nothing implies something catastrophic.", attr: "On the Fermi Paradox" },
      { text: "Before you were born, thirteen billion years passed without you. After you die, the same will happen. You are a parenthesis.", attr: "On Mortality" },
      { text: "The electron has no definite position until you look. What it means for you to 'look' is a question physics cannot yet answer.", attr: "On Quantum Reality" },
    ];

    var idx = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000) % fragments.length;
    textEl.textContent = fragments[idx].text;
    attrEl.textContent = fragments[idx].attr;
  })();

  /* ---------- Returning Visitor Personalisation ---------- */
  (function () {
    var COUNT_KEY   = "abyss_visits";
    var SESSION_KEY = "abyss_session";

    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    var prev = parseInt(localStorage.getItem(COUNT_KEY) || "0", 10);
    localStorage.setItem(COUNT_KEY, prev + 1);

    if (prev < 1) return;

    var eyebrow = document.querySelector(".hero-eyebrow");
    if (eyebrow) {
      var msg = prev === 1
        ? "You Have Returned to the Abyss"
        : "You Return. The Questions Have Not Changed.";
      eyebrow.textContent = msg;
      eyebrow.setAttribute("data-text", msg);
      setTimeout(function () { eyebrow.classList.add("glitch"); }, 400);
    }

    var banner = document.createElement("div");
    banner.id = "return-banner";
    banner.setAttribute("aria-live", "polite");
    banner.textContent = "Visit " + (prev + 1) + " · The abyss remembers you";
    document.body.appendChild(banner);
    setTimeout(function () { banner.classList.add("visible"); }, 600);
    setTimeout(function () { banner.classList.remove("visible"); }, 3400);
  })();

})();
