/* =========================================================
   Birthday Surprise Website (Vanilla JS)
   Features:
   - Typewriter effect (no library)
   - Custom cursor + trailing dots
   - Canvas particle background
   - Scroll reveal animations (IntersectionObserver)
   - Gallery slider with autoplay
   - Secret modal + confetti animation
   - Fireworks animation on canvas (finale)
========================================================= */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // -------- Personalization (optional) ----------
  // You can change this name directly (or later wire a prompt).
  const FRIEND_NAME = "Shreya";
  const STORAGE = {
    musicOn: "bday_music_on",
    musicTime: "bday_music_time",
  };

  // ------------------------------------------------
  // Page transitions + navigation (multi-page)
  // ------------------------------------------------
  /**
   * Navigation logic:
   * - All buttons/links with [data-nav="file.html"] trigger fade-out then navigate
   * - Page fades in automatically on load
   */
  function setupPageTransitions() {
    // Create a dedicated fade overlay (works reliably across pages/bfcache).
    let fade = document.querySelector(".pageFade");
    if (!fade) {
      fade = document.createElement("div");
      fade.className = "pageFade";
      document.body.appendChild(fade);
    }

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // fade-in on load
    const reveal = () => {
      if (prefersReduced) {
        fade.classList.add("isHidden");
        return;
      }
      requestAnimationFrame(() => fade.classList.add("isHidden"));
    };
    reveal();

    const go = (url) => {
      if (!url) return;
      if (prefersReduced) {
        window.location.href = url;
        return;
      }

      // fade-out then navigate (wait for transitionend; fallback timeout)
      fade.classList.remove("isHidden");
      fade.classList.add("isShowing");

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        fade.removeEventListener("transitionend", onEnd);
        window.location.href = url;
      };
      const onEnd = (e) => {
        if (e.target === fade && e.propertyName === "opacity") finish();
      };
      fade.addEventListener("transitionend", onEnd);
      window.setTimeout(finish, 520);
    };

    // click-to-navigate
    document.addEventListener("click", (e) => {
      const el = e.target?.closest?.("[data-nav]");
      if (!el) return;
      const url = el.getAttribute("data-nav");
      if (!url) return;
      e.preventDefault();
      go(url);
    });

    // allow programmatic navigation for page-specific flows
    window.__bdayGo = go;

    // Handle back/forward cache: re-hide overlay when page is restored
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        fade.classList.remove("isShowing");
        fade.classList.add("isHidden");
      }
    });
  }

  // ------------------------------------------------
  // Typewriter effect
  // ------------------------------------------------
  /**
   * Typewriter logic:
   * - Cycles through an array of sentences
   * - Types letter-by-letter, then pauses, then deletes, then moves to next
   * - Cursor blink is done in CSS; JS only updates the text content
   */
  function setupTypewriter() {
    const target = $("#typeText");
    const nameEl = $("#friendName");
    if (!target || !nameEl) return;

    nameEl.textContent = FRIEND_NAME;

    const lines = ["Another year older... still not wiser 😜"];

    let lineIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    const typeSpeed = 36;
    const deleteSpeed = 22;
    const pauseAfterType = 1100;
    const pauseAfterDelete = 260;

    function tick() {
      const current = lines[lineIdx];
      const nextText = current.slice(0, charIdx);
      target.textContent = nextText;

      if (!isDeleting) {
        charIdx += 1;
        if (charIdx > current.length) {
          isDeleting = true;
          setTimeout(tick, pauseAfterType);
          return;
        }
        setTimeout(tick, typeSpeed);
      } else {
        charIdx -= 1;
        if (charIdx < 0) {
          isDeleting = false;
          lineIdx = (lineIdx + 1) % lines.length;
          setTimeout(tick, pauseAfterDelete);
          return;
        }
        setTimeout(tick, deleteSpeed);
      }
    }

    tick();
  }

  // ------------------------------------------------
  // Custom cursor + trailing effect
  // ------------------------------------------------
  /**
   * Cursor effect:
   * - Hides default cursor (CSS) and moves a glowing circle to pointer position
   * - Creates a short trail by positioning small fading dots
   * - On hover over interactive elements, cursor expands (CSS class toggle)
   */
  function setupCursor() {
    // On touch devices, a fake cursor feels awkward—skip it.
    if (window.matchMedia?.("(pointer: coarse)")?.matches) return;

    const cursor = $("#cursor");
    const trailRoot = $("#cursorTrail");
    if (!cursor || !trailRoot) return;

    const dots = [];
    const DOTS = 14;
    for (let i = 0; i < DOTS; i++) {
      const d = document.createElement("div");
      d.className = "trailDot";
      d.style.opacity = "0";
      trailRoot.appendChild(d);
      dots.push({ el: d, x: 0, y: 0, a: 0 });
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let last = { x, y };

    const move = (clientX, clientY) => {
      x = clientX;
      y = clientY;
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    };

    const onPointerMove = (e) => move(e.clientX, e.clientY);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // Trail animation loop
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (!prefersReduced) {
      const animate = () => {
        // shift dots toward previous dot positions for a smooth trailing look
        const dx = x - last.x;
        const dy = y - last.y;
        last.x += dx * 0.35;
        last.y += dy * 0.35;

        let px = x, py = y;
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i];
          dot.x += (px - dot.x) * (0.24 + i * 0.01);
          dot.y += (py - dot.y) * (0.24 + i * 0.01);
          px = dot.x;
          py = dot.y;
          const opacity = Math.max(0, 0.42 - i * 0.03);
          dot.el.style.left = `${dot.x}px`;
          dot.el.style.top = `${dot.y}px`;
          dot.el.style.opacity = `${opacity}`;
          dot.el.style.transform = `translate3d(-50%,-50%,0) scale(${1 - i * 0.02})`;
        }
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }

    const hoverTargets = [
      "button",
      "a",
      ".hoverExpand",
      ".dotBtn",
      ".sliderBtn",
      ".linkBtn",
      ".musicBtn",
    ];
    const hoverSel = hoverTargets.join(",");

    const setHover = (on) => cursor.classList.toggle("isHover", on);
    document.addEventListener("pointerover", (e) => {
      if (e.target && e.target.closest?.(hoverSel)) setHover(true);
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target && e.target.closest?.(hoverSel)) setHover(false);
    });

    // Hide cursor on touch-only devices / when pointer leaves window
    window.addEventListener("pointerleave", () => (cursor.style.opacity = "0"));
    window.addEventListener("pointerenter", () => (cursor.style.opacity = "1"));
  }

  // ------------------------------------------------
  // Background music toggle + equalizer
  // ------------------------------------------------
  function setupMusic() {
    const audio = $("#bgMusic");
    const btn = $("#musicBtn");
    const label = $("#musicLabel");
    if (!audio || !btn || !label) return;

    // iOS/Safari policy: playback requires a user gesture; button click is enough.
    const setUi = (playing) => {
      btn.classList.toggle("isPlaying", playing);
      label.textContent = playing ? "Pause" : "Play";
    };
    setUi(false);

    // restore state
    const wasOn = localStorage.getItem(STORAGE.musicOn) === "1";
    const savedTime = Number(localStorage.getItem(STORAGE.musicTime) || "0");
    if (Number.isFinite(savedTime) && savedTime > 0) {
      audio.currentTime = Math.min(savedTime, Math.max(0, audio.duration || savedTime));
    }
    if (wasOn) {
      // try to continue; may be blocked until a gesture
      audio.play().catch(() => {
        // keep UI showing "Play" until user taps
        setUi(false);
      });
    }

    btn.addEventListener("click", async () => {
      try {
        if (audio.paused) {
          await audio.play();
          setUi(true);
          localStorage.setItem(STORAGE.musicOn, "1");
        } else {
          audio.pause();
          setUi(false);
          localStorage.setItem(STORAGE.musicOn, "0");
        }
      } catch {
        // If autoplay/play fails due to policy, keep UI consistent.
        setUi(!audio.paused);
      }
    });

    audio.addEventListener("play", () => setUi(true));
    audio.addEventListener("pause", () => setUi(false));

    window.addEventListener("beforeunload", () => {
      try {
        localStorage.setItem(STORAGE.musicOn, audio.paused ? "0" : "1");
        localStorage.setItem(STORAGE.musicTime, String(audio.currentTime || 0));
      } catch {
        // ignore storage errors
      }
    });
  }

  // ------------------------------------------------
  // Floating emojis background
  // ------------------------------------------------
  function setupFloatingEmojis() {
    const layer = $("#emojiLayer");
    if (!layer) return;

    const emojis = ["🎉", "🎂", "✨", "🥳", "🎈", "⭐"];
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const spawn = () => {
      const el = document.createElement("div");
      el.className = "floatEmoji";
      el.textContent = emojis[(Math.random() * emojis.length) | 0];
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${70 + Math.random() * 40}%`;
      const dur = 8 + Math.random() * 10;
      el.style.animationDuration = `${dur}s`;
      el.style.opacity = `${0.18 + Math.random() * 0.18}`;
      layer.appendChild(el);
      window.setTimeout(() => el.remove(), (dur + 0.5) * 1000);
    };

    // drip-feed emojis
    for (let i = 0; i < 8; i++) setTimeout(spawn, i * 450);
    setInterval(spawn, 900);
  }

  // ------------------------------------------------
  // Particle background canvas
  // ------------------------------------------------
  function setupParticles() {
    const canvas = $("#bgCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const rand = (a, b) => a + Math.random() * (b - a);
    const colors = [
      "rgba(46,231,255,0.55)",
      "rgba(138,92,255,0.50)",
      "rgba(255,106,213,0.42)",
      "rgba(255,211,106,0.35)",
    ];

    const count = Math.floor(Math.min(110, (w * h) / 18000));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(1.2, 3.2),
      vx: rand(-0.25, 0.25),
      vy: rand(-0.18, 0.18),
      c: colors[(Math.random() * colors.length) | 0],
    }));

    let t = 0;
    function frame() {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      // soft gradient wash
      const g = ctx.createRadialGradient(
        w * (0.25 + 0.05 * Math.sin(t * 0.01)),
        h * (0.25 + 0.05 * Math.cos(t * 0.012)),
        20,
        w * 0.55,
        h * 0.55,
        Math.max(w, h) * 0.9
      );
      g.addColorStop(0, "rgba(138,92,255,0.13)");
      g.addColorStop(0.5, "rgba(46,231,255,0.06)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // particles + connections
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.fillStyle = p.c;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.18;
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (!prefersReduced) requestAnimationFrame(frame);
    }

    if (!prefersReduced) requestAnimationFrame(frame);
  }

  // ------------------------------------------------
  // Scroll reveal (timeline cards)
  // ------------------------------------------------
  function setupScrollReveal() {
    const els = $$(".reveal");
    if (!els.length) return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) {
      els.forEach((el) => el.classList.add("isIn"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("isIn");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18 }
    );
    els.forEach((el) => io.observe(el));
  }

  // ------------------------------------------------
  // Slider / Carousel
  // ------------------------------------------------
  /**
   * Rebuilt gallery slider logic (infinite loop):
   * - Uses required structure: .slider > .slides > img
   * - Clones first/last image for seamless looping
   * - Moves via transform: translateX(-index * 100%)
   * - Auto-slide every 3s, pause on hover, resume on leave
   */
  function setupSlider() {
    const slider = $("#gallerySlider");
    const slidesEl = $("#gallerySlides");
    const prevBtn = $("#galleryPrev");
    const nextBtn = $("#galleryNext");
    if (!slider || !slidesEl || !prevBtn || !nextBtn) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    let imgs = $$("img", slidesEl);
    if (imgs.length < 2) return;

    // Clone edges for infinite effect
    const firstClone = imgs[0].cloneNode(true);
    const lastClone = imgs[imgs.length - 1].cloneNode(true);
    firstClone.setAttribute("data-clone", "1");
    lastClone.setAttribute("data-clone", "1");
    slidesEl.insertBefore(lastClone, imgs[0]);
    slidesEl.appendChild(firstClone);
    imgs = $$("img", slidesEl);

    // index points to the "current slide" within the cloned array
    let index = 1; // first real image
    let isAnimating = false;
    let timer = null;
    const intervalMs = 3000;

    const setTransition = (on) => {
      slidesEl.style.transition = on && !prefersReduced ? "transform 500ms ease-in-out" : "none";
    };

    const updateActive = () => {
      imgs.forEach((img) => img.classList.remove("isActive"));
      // active should be the current visual slide; clones can still get class harmlessly
      imgs[index]?.classList.add("isActive");
    };

    const render = () => {
      slidesEl.style.transform = `translateX(${-index * 100}%)`;
      updateActive();
    };

    const goTo = (nextIndex, user = false) => {
      if (isAnimating) return;
      isAnimating = true;
      setTransition(true);
      index = nextIndex;
      render();
      if (user) restartAuto();
    };

    const next = (user = true) => goTo(index + 1, user);
    const prev = (user = true) => goTo(index - 1, user);

    function startAuto() {
      if (prefersReduced) return;
      stopAuto();
      timer = window.setInterval(() => next(false), intervalMs);
    }

    function stopAuto() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function restartAuto() {
      startAuto();
    }

    // Seamless snap after reaching clones
    slidesEl.addEventListener("transitionend", () => {
      const current = imgs[index];
      if (!current) {
        isAnimating = false;
        return;
      }

      if (current.getAttribute("data-clone") === "1") {
        setTransition(false);
        if (index === 0) index = imgs.length - 2; // snap to last real
        else if (index === imgs.length - 1) index = 1; // snap to first real
        render();
        // re-enable transition on next tick
        requestAnimationFrame(() => setTransition(true));
      }
      isAnimating = false;
    });

    nextBtn.addEventListener("click", () => next(true));
    prevBtn.addEventListener("click", () => prev(true));

    // Pause on hover
    slider.addEventListener("pointerenter", stopAuto);
    slider.addEventListener("pointerleave", startAuto);

    // Initial position (no jump)
    setTransition(false);
    render();
    requestAnimationFrame(() => setTransition(true));
    startAuto();
  }

  // ------------------------------------------------
  // Modal + confetti
  // ------------------------------------------------
  function setupSecretModal() {
    const openBtn = $("#secretBtn");
    const overlay = $("#modalOverlay");
    const closeBtn = $("#closeModal");
    const againBtn = $("#confettiAgain");
    const continueBtn = $("#continueBtn");
    const confettiCanvas = $("#confettiCanvas");
    if (!openBtn || !overlay || !closeBtn || !againBtn || !continueBtn || !confettiCanvas) return;

    const ctx = confettiCanvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      const rect = overlay.getBoundingClientRect();
      w = Math.floor(rect.width);
      h = Math.floor(rect.height);
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      confettiCanvas.width = Math.floor(w * dpr);
      confettiCanvas.height = Math.floor(h * dpr);
      confettiCanvas.style.width = `${w}px`;
      confettiCanvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    let confetti = [];
    let animId = 0;
    let running = false;

    const rand = (a, b) => a + Math.random() * (b - a);
    const colors = ["#2ee7ff", "#8a5cff", "#ff6ad5", "#ffd36a", "#ffffff"];

    /**
     * Confetti animation:
     * - Spawns many small rectangles with random velocity and spin
     * - Gravity pulls down; slight wind moves sideways
     * - Runs for ~2.6 seconds then naturally stops
     */
    function burstConfetti() {
      resize();
      const count = 170;
      confetti = Array.from({ length: count }, () => ({
        x: w * 0.5 + rand(-80, 80),
        y: h * 0.28 + rand(-40, 40),
        vx: rand(-4.2, 4.2),
        vy: rand(-7.8, -3.2),
        g: rand(0.12, 0.22),
        s: rand(6, 12),
        r: rand(0, Math.PI),
        vr: rand(-0.18, 0.18),
        c: colors[(Math.random() * colors.length) | 0],
        life: rand(1300, 2600),
        born: performance.now(),
      }));
      running = true;
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(drawConfetti);
    }

    function drawConfetti(now) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      let alive = 0;

      for (const p of confetti) {
        const age = now - p.born;
        if (age > p.life) continue;
        alive++;
        p.vy += p.g;
        p.vx += Math.sin(now * 0.001) * 0.01; // tiny wind
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;

        const fade = Math.max(0, 1 - age / p.life);
        ctx.save();
        ctx.globalAlpha = 0.9 * fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.65);
        ctx.restore();
      }

      if (alive > 0) {
        animId = requestAnimationFrame(drawConfetti);
      } else {
        running = false;
        ctx.clearRect(0, 0, w, h);
      }
    }

    function open() {
      overlay.classList.add("isOpen");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      burstConfetti();
      // UX: "Next" button appears after popup appears
      continueBtn.classList.remove("isHidden");
    }

    function close() {
      overlay.classList.remove("isOpen");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      running = false;
      cancelAnimationFrame(animId);
      ctx.clearRect(0, 0, w, h);
      continueBtn.classList.add("isHidden");
    }

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      // click outside modal closes
      if (e.target === overlay || e.target === confettiCanvas) close();
    });
    againBtn.addEventListener("click", burstConfetti);
    continueBtn.addEventListener("click", () => {
      close();
      // in multi-page flow, this button routes to finale.html
      window.__bdayGo?.("finale.html");
    });
    window.addEventListener("resize", () => overlay.classList.contains("isOpen") && resize(), { passive: true });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("isOpen")) close();
    });
  }

  // ------------------------------------------------
  // Fireworks canvas (finale)
  // ------------------------------------------------
  function setupFireworks() {
    const canvas = $("#fwCanvas");
    const btn = $("#fireBtn");
    const dim = $("#finaleDim");
    const modalWrap = $("#finaleModalWrap");
    const modalTitle = $("#finaleTitle");
    const modalSub = $("#finaleSub");
    const modalNextBtn = $("#finaleNextBtn");
    const section = canvas?.closest?.(".finaleSection");
    if (!canvas || !btn || !dim || !modalWrap || !modalTitle || !modalSub || !modalNextBtn) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      w = Math.floor(canvas.parentElement?.clientWidth || window.innerWidth);
      h = Math.floor(canvas.parentElement?.clientHeight || window.innerHeight);
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const rand = (a, b) => a + Math.random() * (b - a);
    const palette = ["#2ee7ff", "#8a5cff", "#ff6ad5", "#ffd36a", "#ffffff", "#62ffb8"];

    let particles = [];
    let running = false;
    let animId = 0;
    let startAt = 0;
    let burstAcc = 0;

    // Optional sound (synth boom). Works only after user gesture.
    let audioCtx = null;
    function boomSound(power = 1) {
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(44, t + 0.18);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.14 * Math.min(1, power), t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    }

    // --- REQUIRED FUNCTIONS (organized as requested) ---
    function createParticle(x, y, vx, vy, color, size, fade, gravity) {
      return {
        x,
        y,
        vx,
        vy,
        c: color,
        r: size,
        fade,
        g: gravity,
        a: 1,
      };
    }

    function startFireworks() {
      if (prefersReduced) {
        dim.classList.add("isOn");
        modalWrap.classList.add("isOpen");
        modalWrap.setAttribute("aria-hidden", "false");
        return;
      }

      // enable sound after gesture
      if (!audioCtx) {
        try {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
          audioCtx = null;
        }
      }

      running = true;
      startAt = performance.now();
      burstAcc = 0;
      particles = [];

      // cinematic background effect + shake
      dim.classList.add("isOn");
      if (section) {
        section.classList.remove("shake");
        // force reflow so animation can replay
        void section.offsetWidth;
        section.classList.add("shake");
        window.setTimeout(() => section.classList.remove("shake"), 560);
      }

      // show modal after 1 second (fireworks keep running)
      window.setTimeout(() => {
        modalWrap.classList.add("isOpen");
        modalWrap.setAttribute("aria-hidden", "false");
      }, 1000);

      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(animateFireworks);
    }

    function burst(x, y, intensity01) {
      const sizeFactor = rand(0.9, 1.4) + intensity01 * 0.6; // different sizes
      const count = Math.floor(rand(70, 110) * sizeFactor);
      const base = palette[(Math.random() * palette.length) | 0];
      const ring = Math.random() < 0.35; // sometimes a neat ring burst
      for (let i = 0; i < count; i++) {
        const angle = ring
          ? (Math.PI * 2 * i) / count + rand(-0.02, 0.02)
          : rand(0, Math.PI * 2);
        const speed = rand(2.0, 6.2) * (0.9 + intensity01 * 0.7);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const size = rand(1.2, 2.9) * sizeFactor;
        const fade = rand(0.009, 0.016) * (0.9 + intensity01 * 0.35);
        const g = rand(0.04, 0.075);
        particles.push(createParticle(x, y, vx, vy, base, size, fade, g));
      }
      boomSound(0.55 + intensity01 * 0.45);
    }

    function animateFireworks(now) {
      if (!running) return;

      const elapsed = now - startAt;
      const intensity01 = Math.min(1, Math.max(0, elapsed / 9000)); // ramps up over ~9s

      // Smooth fading trails
      const trailAlpha = 0.22 - intensity01 * 0.08; // slightly longer trails later
      ctx.fillStyle = `rgba(3, 4, 14, ${trailAlpha})`;
      ctx.fillRect(0, 0, w, h);

      // Continuous fireworks: spawn bursts based on "bursts per second"
      const burstsPerSecond = 0.9 + intensity01 * 3.0; // intensity increases over time
      burstAcc += burstsPerSecond / 60; // approx. frame-based accumulator
      while (burstAcc >= 1) {
        burstAcc -= 1;
        burst(rand(w * 0.10, w * 0.90), rand(h * 0.10, h * 0.62), intensity01);
      }

      // Update + draw particles
      const next = [];
      for (const p of particles) {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.a -= p.fade;
        if (p.a <= 0) continue;
        // keep particles on-screen-ish
        if (p.x < -80 || p.x > w + 80 || p.y < -80 || p.y > h + 120) continue;
        next.push(p);

        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, p.a);
        ctx.fillStyle = p.c;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      particles = next;

      // Cap particles to avoid runaway on low-end devices
      const cap = Math.floor(1400 + intensity01 * 2200);
      if (particles.length > cap) particles.splice(0, particles.length - cap);

      animId = requestAnimationFrame(animateFireworks);
    }

    // --- UI / Modal behavior ---
    function showFinalMessage() {
      modalTitle.textContent = "No matter what… I’ve got your back. Always. ❤️";
      modalSub.textContent = "Now stop acting tough and accept the love. (Friend edition.)";
      modalTitle.classList.add("pulseText");
      modalSub.classList.add("pulseText");
      modalNextBtn.classList.add("isHidden");
    }

    modalNextBtn.addEventListener("click", showFinalMessage);
    btn.addEventListener("click", startFireworks);

    // Click/tap anywhere on the canvas to add extra bursts while running
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (!running) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const intensity01 = Math.min(1, Math.max(0, (performance.now() - startAt) / 9000));
        burst(x, y, intensity01);
      },
      { passive: true }
    );

    // initial clear
    ctx.fillStyle = "rgba(3, 4, 14, 1)";
    ctx.fillRect(0, 0, w, h);
  }

  // ------------------------------------------------
  // Boot
  // ------------------------------------------------
  function boot() {
    setupPageTransitions();
    setupTypewriter();
    setupCursor();
    setupMusic();
    setupFloatingEmojis();
    setupParticles();
    setupScrollReveal();
    setupSlider();
    setupSecretModal();
    setupFireworks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
