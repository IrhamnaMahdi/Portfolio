/* =========================================================
   IRHAMNA MAHDI — Portfolio interactions
   ========================================================= */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  initScroll();
  initMobileMenu();
  initActiveSection();
  initReveal();
  initTypingEffect();
  initHeroCanvas();
  initCertModal();
  initCustomCursor();
  initTilt();
  initMagnetic();
  initClock();
  buildFooterMark();
  fitRingText();
  initPhoto();

  if (motionReady()) {
    initCounters(false);
    initMotion();
  } else {
    initCounters(false);
    startSite();
  }
});

const root = document.documentElement;
const motionReady = () => root.classList.contains("js") && window.gsap && window.ScrollTrigger;

/* Marks the site as ready (typing effect starts, failsafe is disarmed). If the
   animation layer is unavailable, everything is simply shown. */
function startSite() {
  root.classList.add("is-ready");
  if (!motionReady()) {
    if (root.classList.contains("js")) root.classList.add("force-show");
    const pre = document.getElementById("preloader");
    if (pre) pre.remove();
  }
  window.dispatchEvent(new Event("intro:start"));
}

/* ---------- Shared smoother -------------------------------------------
   Eases an element's transform toward a target every frame (time-based, so
   it feels the same on 60Hz and 120Hz). The loop only runs while something
   is actually moving — it sleeps when settled. */
function createSmoother(el, keys, build, tau = 90) {
  const cur = {}, tgt = {};
  keys.forEach((k) => { cur[k] = 0; tgt[k] = 0; });
  let raf = 0, last = 0;

  function frame(now) {
    const dt = Math.max(0, Math.min(now - last, 50));
    last = now;
    const k = 1 - Math.exp(-dt / tau);
    let moving = false;
    for (const key of keys) {
      cur[key] += (tgt[key] - cur[key]) * k;
      if (Math.abs(tgt[key] - cur[key]) > 0.01) moving = true;
      else cur[key] = tgt[key];
    }
    const atRest = keys.every((key) => cur[key] === 0 && tgt[key] === 0);
    el.style.transform = atRest ? "" : build(cur);
    if (moving) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
      if (atRest) el.classList.remove("is-animating");
    }
  }

  return {
    set(values) {
      Object.assign(tgt, values);
      if (!raf) {
        last = performance.now();
        el.classList.add("is-animating");
        raf = requestAnimationFrame(frame);
      }
    },
  };
}

/* ---------- Navbar shrink + scroll progress (one rAF-throttled handler) ---------- */
function initScroll() {
  const nav = document.getElementById("navbar");
  const bar = document.getElementById("scrollProgress");
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 24);
    if (bar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

/* ---------- Mobile hamburger menu ---------- */
function initMobileMenu() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const setOpen = (open) => {
    links.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setOpen(!links.classList.contains("is-open")));
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
}

/* ---------- Active section indicator ---------- */
function initActiveSection() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((sec) => observer.observe(sec));
}

/* ---------- Reveal on scroll (CSS keyframes do the animating) ---------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  items.forEach((item) => observer.observe(item));
}

/* ---------- Typing effect (line height is reserved in CSS, so no layout jump) ---------- */
function initTypingEffect() {
  const el = document.getElementById("typedRole");
  if (!el) return;
  if (prefersReducedMotion) return; // keeps the static "Data Analyst" text

  const roles = ["Data Analyst", "Data Science Graduate", "Python Developer", "Dashboard Builder"];
  let roleIndex = 0, charIndex = 0, deleting = false;

  function tick() {
    const current = roles[roleIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        return setTimeout(tick, 1600);
      }
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        return setTimeout(tick, 350);
      }
    }
    setTimeout(tick, deleting ? 40 : 65);
  }
  window.addEventListener("intro:start", () => setTimeout(tick, 700), { once: true });
}

/* ---------- Hero background: data nodes (grid is pure CSS now) ---------- */
function initHeroCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hero = canvas.parentElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  let width = 0, height = 0, nodes = [];
  let running = false, raf = 0, heroVisible = true;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0, a: 0, targetA: 0 };

  const makeNode = () => ({
    x: Math.random() * width, y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
    r: Math.random() * 1.6 + 0.6, ox: 0, oy: 0,
  });

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    if (!w || !h) return;
    // keep the same nodes on resize (scale them) so the background never "re-rolls"
    if (nodes.length && width && height) {
      const sx = w / width, sy = h / height;
      nodes.forEach((n) => { n.x *= sx; n.y *= sy; });
    }
    width = w; height = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(46, Math.floor((w * h) / 26000));
    while (nodes.length < count) nodes.push(makeNode());
    nodes.length = count;
    if (!running) draw();
  }

  function step() {
    mouse.sx += (mouse.x - mouse.sx) * 0.18;
    mouse.sy += (mouse.y - mouse.sy) * 0.18;
    mouse.a += (mouse.targetA - mouse.a) * 0.08;

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0) { n.x = 0; n.vx *= -1; } else if (n.x > width) { n.x = width; n.vx *= -1; }
      if (n.y < 0) { n.y = 0; n.vy *= -1; } else if (n.y > height) { n.y = height; n.vy *= -1; }

      if (mouse.targetA > 0) {
        const dx = n.x + n.ox - mouse.sx, dy = n.y + n.oy - mouse.sy;
        const dist = Math.hypot(dx, dy);
        if (dist < 150 && dist > 0.01) {
          const f = (150 - dist) / 150;
          n.ox += (dx / dist) * f * 2.2;
          n.oy += (dy / dist) * f * 2.2;
        }
      }
      n.ox *= 0.93; n.oy *= 0.93; // eases back smoothly
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const ax = a.x + a.ox, ay = a.y + a.oy;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = ax - (b.x + b.ox), dy = ay - (b.y + b.oy);
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          ctx.strokeStyle = `rgba(52, 214, 230, ${0.12 * (1 - dist / 130)})`;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(b.x + b.ox, b.y + b.oy);
          ctx.stroke();
        }
      }
    }
    ctx.fillStyle = "rgba(76, 142, 255, 0.55)";
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x + n.ox, n.y + n.oy, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (mouse.a > 0.01) {
      const g = ctx.createRadialGradient(mouse.sx, mouse.sy, 0, mouse.sx, mouse.sy, 160);
      g.addColorStop(0, `rgba(52, 214, 230, ${0.1 * mouse.a})`);
      g.addColorStop(1, "rgba(52, 214, 230, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mouse.sx, mouse.sy, 160, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame() { step(); draw(); raf = requestAnimationFrame(frame); }
  function start() { if (running || prefersReducedMotion) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  // Only animate while the hero is on screen and the tab is visible
  new IntersectionObserver((entries) => {
    heroVisible = entries[0].isIntersecting;
    heroVisible && !document.hidden ? start() : stop();
  }, { threshold: 0 }).observe(hero);
  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : heroVisible && start();
  });

  if (!prefersReducedMotion && !isTouchDevice) {
    hero.addEventListener("pointermove", (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      if (mouse.targetA === 0) { mouse.sx = mouse.x; mouse.sy = mouse.y; }
      mouse.targetA = 1;
    });
    hero.addEventListener("pointerleave", () => { mouse.targetA = 0; });
  }

  let resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }).observe(hero);

  resize();
}

/* ---------- Custom cursor (loop sleeps when the ring has caught up) ---------- */
function initCustomCursor() {
  if (isTouchDevice || prefersReducedMotion) return;
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;

  document.body.classList.add("has-cursor");
  let tx = -100, ty = -100, rx = -100, ry = -100, raf = 0, shown = false;

  function loop() {
    rx += (tx - rx) * 0.2;
    ry += (ty - ry) * 0.2;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    raf = Math.abs(tx - rx) > 0.1 || Math.abs(ty - ry) > 0.1 ? requestAnimationFrame(loop) : 0;
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
    if (!shown) {
      shown = true;
      rx = tx; ry = ty;
      dot.classList.add("is-active");
      ring.classList.add("is-active");
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });

  document.documentElement.addEventListener("mouseleave", () => {
    shown = false;
    dot.classList.remove("is-active");
    ring.classList.remove("is-active");
  });

  document.addEventListener("pointerover", (e) => {
    const hit = e.target.closest && e.target.closest("a, button, [data-tilt], input, textarea, label, .chip");
    ring.classList.toggle("is-hovering", !!hit);
  });
}

/* ---------- 3D tilt: smoothed, and immune to edge flicker ----------
   The element's rect is measured once on enter (not on every move), so the
   tilt itself can't shift the hit-area under the cursor and cause jitter. */
function initTilt() {
  if (isTouchDevice || prefersReducedMotion) return;
  let scrollTick = 0;
  window.addEventListener("scroll", () => { scrollTick++; }, { passive: true });

  document.querySelectorAll("[data-tilt]").forEach((el) => {
    const max = parseFloat(el.getAttribute("data-tilt-max")) || 5;
    const lift = parseFloat(el.getAttribute("data-tilt-lift") || "3");
    const smoother = createSmoother(
      el, ["rx", "ry", "ly"],
      (c) => `perspective(900px) rotateX(${c.rx.toFixed(3)}deg) rotateY(${c.ry.toFixed(3)}deg) translate3d(0, ${c.ly.toFixed(2)}px, 0)`,
      110
    );
    let box = null, boxTick = -1;

    const measure = () => {
      boxTick = scrollTick;
      const r = el.getBoundingClientRect();
      const w = el.offsetWidth, h = el.offsetHeight;
      box = {
        left: r.left + r.width / 2 - w / 2 + window.scrollX,
        top: r.top + r.height / 2 - h / 2 + window.scrollY,
        w, h,
      };
    };

    el.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      measure();
      smoother.set({ ly: -lift });
    });
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      if (!box || boxTick !== scrollTick) measure();
      el.style.setProperty("--mx", (e.pageX - box.left).toFixed(1) + "px");
      el.style.setProperty("--my", (e.pageY - box.top).toFixed(1) + "px");
      const px = Math.min(Math.max((e.pageX - box.left) / box.w, 0), 1);
      const py = Math.min(Math.max((e.pageY - box.top) / box.h, 0), 1);
      smoother.set({ rx: (0.5 - py) * max * 2, ry: (px - 0.5) * max * 2, ly: -lift });
    });
    el.addEventListener("pointerleave", () => {
      box = null;
      smoother.set({ rx: 0, ry: 0, ly: 0 });
    });
  });
}

/* ---------- Magnetic buttons (same smoother) ---------- */
function initMagnetic() {
  if (isTouchDevice || prefersReducedMotion) return;

  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const smoother = createSmoother(
      el, ["x", "y"],
      (c) => `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, 0)`,
      120
    );
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      smoother.set({ x: x * 0.22, y: y * 0.3 - 1 });
    });
    el.addEventListener("pointerleave", () => smoother.set({ x: 0, y: 0 }));
  });
}

/* ---------- Animated counters ---------- */
function runCounter(el) {
  const target = parseFloat(el.getAttribute("data-target"));
  const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
  const suffix = el.getAttribute("data-suffix") || "";
  const finalText = target.toFixed(decimals) + suffix;
  if (prefersReducedMotion) { el.textContent = finalText; return; }

  const duration = 1600, start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = finalText;
  })(start);
}

function initCounters(skipHero) {
  const items = [...document.querySelectorAll("[data-counter]")].filter((el) => !(skipHero && el.closest(".hero")));
  if (!items.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        runCounter(entry.target);
      });
    },
    { threshold: 0.5 }
  );
  items.forEach((el) => observer.observe(el));
}

/* ---------- Certificate preview modal ---------- */
function initCertModal() {
  const modal = document.getElementById("certModal");
  const modalBody = document.getElementById("modalBody");
  const cards = document.querySelectorAll(".cert-card");
  const closers = document.querySelectorAll("[data-close-modal]");

  const certData = {
    toefl: {
      title: "TOEFL Certificate",
      issuer: "Global Operation Indonesia",
      rows: [
        ["Total Score", "627"],
        ["Listening Comprehension", "60"],
        ["Structure & Written Expression", "65"],
        ["Reading Comprehension", "63"],
        ["Issued", "May 23, 2026"],
        ["Valid Until", "May 23, 2028"],
      ],
    },
    alibaba: {
      title: "Alibaba Cloud Big Data Training",
      issuer: "Alibaba Cloud",
      rows: [
        ["Description", "Successful completion of Alibaba Big Data training from Basic Level."],
        ["Location", "Jakarta"],
        ["Date", "29–31 July 2024"],
      ],
    },
    karirnex: {
      title: "Data Analyst Bootcamp",
      issuer: "KarirNex by PT Ebiz Karisma Internasional",
      rows: [
        ["Predicate", "Expert"],
        ["Topics", "Excel, SQL, Google BigQuery, Python, Google Colab, Data Visualization, Google Looker Studio"],
        ["Duration", "20 JP"],
        ["Date", "July 2026"],
      ],
    },
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const data = certData[card.getAttribute("data-cert")];
      if (!data) return;
      modalBody.innerHTML = `
        <h3 style="font-family:var(--font-display); font-size:20px; margin-bottom:6px;">${data.title}</h3>
        <p style="color:var(--text-mid); font-size:14px; margin-bottom:18px;">${data.issuer}</p>
        <div style="display:grid; gap:10px; margin-bottom:22px;">
          ${data.rows.map((r) => `
            <div style="display:flex; justify-content:space-between; gap:14px; font-size:13.5px; border-bottom:1px solid var(--border-soft); padding-bottom:8px;">
              <span style="color:var(--text-low);">${r[0]}</span>
              <span style="color:var(--text-hi); text-align:right;">${r[1]}</span>
            </div>`).join("")}
        </div>
      `;
      openModal();
    });
  });

  function openModal() {
    modal.classList.add("is-open");
    if (window.__lenis) window.__lenis.stop();
  }
  function closeModal() {
    modal.classList.remove("is-open");
    if (window.__lenis) window.__lenis.start();
  }
  closers.forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
}

/* ---------- Footer clock + back to top ---------- */
function initClock() {
  const el = document.getElementById("clock");
  if (el) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    const tick = () => { el.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }
  const btn = document.getElementById("toTop");
  if (btn) {
    btn.addEventListener("click", () => {
      if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.6 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

/* =========================================================
   MOTION LAYER — GSAP + ScrollTrigger + Lenis
   ========================================================= */
function initMotion() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true }); // mobile URL-bar resizes must never re-layout the page

  initSmoothScroll();
  splitHeadings();
  const intro = buildHeroIntro();
  initHeroParallax();
  initBubbles();
  initStatement();
  initMarquee();
  initGhosts();
  initTimeline();
  initHorizontalProjects();
  initSkillTags();
  initFooterMark();
  initTagScramble();

  runPreloader(() => {
    startSite();
    intro.play(0);
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/* ---------- Inertia scrolling (Lenis) driven by GSAP's ticker ---------- */
function initSmoothScroll() {
  if (!window.Lenis) return null;
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  window.__lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#") { e.preventDefault(); return; }
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = id === "#home" ? 0 : target.classList.contains("hmode") ? 0 : -60;
      lenis.scrollTo(target, { offset, duration: 1.5 });
    });
  });
  return lenis;
}

/* ---------- Preloader: counter, name reveal, curtain lift ---------- */
function runPreloader(onReveal) {
  const pre = document.getElementById("preloader");
  const finish = () => {
    root.classList.remove("is-loading");
    if (window.__lenis) window.__lenis.start();
  };
  if (!pre) { finish(); onReveal(); return; }

  const count = document.getElementById("plCount");
  const bar = document.getElementById("plBar");
  const lines = pre.querySelectorAll(".pl-line > span");
  root.classList.add("is-loading");
  if (window.__lenis) window.__lenis.stop();
  gsap.set(lines, { yPercent: 110 });

  const loaded = new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r, { once: true })));
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const assets = Promise.race([Promise.all([loaded, fonts]), new Promise((r) => setTimeout(r, 3500))]);

  const state = { v: 0 };
  const tl = gsap.timeline();
  tl.to(lines, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.1 }, 0)
    .to(state, {
      v: 100, duration: 1.5, ease: "power2.inOut",
      onUpdate() {
        count.textContent = String(Math.round(state.v)).padStart(3, "0");
        bar.style.transform = "scaleX(" + state.v / 100 + ")";
      },
    }, 0)
    .add(() => { tl.pause(); assets.then(() => tl.resume()); })
    .to(lines, { yPercent: -110, duration: 0.8, ease: "power3.in", stagger: 0.06 }, "+=0.15")
    .to(".pl-top, .pl-bottom", { opacity: 0, duration: 0.4 }, "<")
    .to(pre, { yPercent: -100, duration: 1, ease: "expo.inOut" }, "-=0.25")
    .add(onReveal, "-=0.6")
    .add(() => { pre.style.display = "none"; finish(); ScrollTrigger.refresh(); });
}

/* ---------- Word-mask text splitting ---------- */
function splitHeadings() {
  document.querySelectorAll('[data-split="words"]').forEach((el) => {
    const text = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", text);
    el.textContent = "";
    const inners = text.split(" ").map((word) => {
      const outer = document.createElement("span");
      outer.className = "sw";
      outer.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.className = "swi";
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      el.appendChild(document.createTextNode(" "));
      return inner;
    });
    gsap.set(inners, { yPercent: 115 });
    if (el.closest(".hero")) return; // hero headline is animated by the intro timeline
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: () => gsap.to(inners, { yPercent: 0, duration: 1.1, stagger: 0.06, ease: "expo.out" }),
    });
  });
}

/* ---------- Hero intro: headline, copy, then glow / portrait / bubbles ---------- */
function buildHeroIntro() {
  const words = gsap.utils.toArray(".hero h1 .swi");
  gsap.set(".hero-kicker, .hero-sub, .hero-actions, .hero-social", { opacity: 0, y: 28 });
  gsap.set(".chip", { opacity: 0, scale: 0.6 });
  gsap.set(".hero-scroll", { opacity: 0, y: 20 });

  const tl = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } });
  tl.to(".hero-kicker", { opacity: 1, y: 0, duration: 0.9 })
    .to(words, { yPercent: 0, duration: 1.2, stagger: 0.08 }, "-=0.6")
    .to(".hero-sub", { opacity: 1, y: 0, duration: 1 }, "-=0.8")
    .to(".hero-actions", { opacity: 1, y: 0, duration: 0.9 }, "-=0.75")
    .to(".hero-social", { opacity: 1, y: 0, duration: 0.9 }, "-=0.7")
    .add(() => { photo.started = true; revealVisual(); showPhoto(); }, 0.25)
    .to(".chip", { opacity: 1, scale: 1, duration: 0.9, stagger: 0.14, ease: "back.out(1.8)" }, 1.2)
    .to(".hero-scroll", { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.6");
  return tl;
}

/* ---------- Hero scroll parallax ---------- */
function initHeroParallax() {
  const trig = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
  gsap.to(".hero-copy", { yPercent: -12, opacity: 0.25, ease: "none", scrollTrigger: trig });
  gsap.to(".hero-visual", { yPercent: -8, ease: "none", scrollTrigger: trig });
  gsap.to("#hero-canvas", { opacity: 0.1, ease: "none", scrollTrigger: trig });
}

/* ---------- Statement: words light up as you scroll ---------- */
function initStatement() {
  const p = document.querySelector("[data-scrub]");
  if (!p) return;
  const text = p.textContent.trim().replace(/\s+/g, " ");
  const keywords = ["banking", "government", "analysis", "automation", "visualization", "data-driven"];
  p.setAttribute("aria-label", text);
  p.textContent = "";
  const spans = text.split(" ").map((word) => {
    const span = document.createElement("span");
    span.className = "sc" + (keywords.includes(word.toLowerCase().replace(/[^a-z-]/g, "")) ? " kw" : "");
    span.setAttribute("aria-hidden", "true");
    span.textContent = word;
    p.appendChild(span);
    p.appendChild(document.createTextNode(" "));
    return span;
  });
  gsap.fromTo(spans, { opacity: 0.13 }, {
    opacity: 1, ease: "none", stagger: 0.12,
    scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 46%", scrub: true },
  });
}

/* ---------- Marquee: base drift + scroll-velocity boost, reverses when scrolling up ---------- */
function initMarquee() {
  const wrap = document.querySelector(".marquee");
  const rows = [...document.querySelectorAll(".marquee-row")].map((row) => ({
    row, dir: row.dataset.dir === "right" ? 1 : -1, speed: parseFloat(row.dataset.speed) || 0.6, pos: 0, w: 1,
  }));
  if (!wrap || !rows.length) return;

  const measure = () => rows.forEach((r) => { r.w = r.row.firstElementChild.getBoundingClientRect().width || 1; });
  measure();
  window.addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  let visible = false, lastY = window.scrollY, vel = 0, flip = 1;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { rootMargin: "120px 0px" }).observe(wrap);

  gsap.ticker.add((time, delta) => {
    const y = window.scrollY;
    vel += ((y - lastY) - vel) * 0.12;
    lastY = y;
    if (!visible) return;
    flip += ((vel < -0.5 ? -1 : 1) - flip) * 0.06;
    const frames = Math.min(delta, 50) / 16.67;
    rows.forEach((r) => {
      r.pos += r.dir * -1 * flip * (r.speed + Math.min(Math.abs(vel), 60) * 0.14) * frames;
      r.pos = ((r.pos % r.w) + r.w) % r.w;
      r.row.style.transform = "translate3d(" + -r.pos + "px,0,0)";
    });
  });
}

/* ---------- Ghost section titles drift horizontally while their section scrolls ---------- */
function initGhosts() {
  document.querySelectorAll("section[data-ghost]").forEach((sec) => {
    const ghost = document.createElement("div");
    ghost.className = "ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.textContent = sec.dataset.ghost;
    sec.prepend(ghost);
    gsap.fromTo(ghost, { xPercent: 8 }, {
      xPercent: -24, ease: "none",
      scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}

/* ---------- Experience timeline: line draws itself, dots light up ---------- */
function initTimeline() {
  const tl = document.querySelector(".timeline");
  if (!tl) return;
  const fill = document.createElement("span");
  fill.className = "tl-fill";
  tl.prepend(fill);
  gsap.to(fill, { scaleY: 1, ease: "none", scrollTrigger: { trigger: tl, start: "top 65%", end: "bottom 65%", scrub: true } });
  tl.querySelectorAll(".tl-item").forEach((item) => {
    ScrollTrigger.create({
      trigger: item, start: "top 65%",
      onEnter: () => item.classList.add("is-passed"),
      onLeaveBack: () => item.classList.remove("is-passed"),
    });
  });
}

/* ---------- Projects: pinned horizontal scroll on large screens ---------- */
function initHorizontalProjects() {
  const section = document.getElementById("projects");
  const pin = section && section.querySelector(".hpin");
  const track = document.getElementById("projectTrack");
  if (!pin || !track) return;

  const bar = document.getElementById("hBar");
  const current = document.getElementById("hCurrent");
  const mm = gsap.matchMedia();

  mm.add("(min-width: 1024px) and (min-height: 680px)", () => {
    section.classList.add("hmode");
    const items = [...track.querySelectorAll(".hitem")];
    const cards = items.filter((i) => !i.classList.contains("hend"));
    items.forEach((i) => i.classList.remove("reveal"));
    const pad = parseFloat(getComputedStyle(pin.querySelector(".container")).paddingLeft) || 32;

    const distance = () => {
      const r = track.getBoundingClientRect();
      const base = r.right - gsap.getProperty(track, "x");
      return Math.max(0, base - window.innerWidth + pad);
    };

    const tween = gsap.to(track, {
      x: () => -distance(), ease: "none",
      scrollTrigger: {
        trigger: pin, start: "top top", end: () => "+=" + distance(),
        pin: true, scrub: true, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => {
          if (bar) bar.style.transform = "scaleX(" + self.progress + ")";
          if (current) current.textContent = String(Math.min(cards.length, Math.round(self.progress * (cards.length - 1)) + 1)).padStart(2, "0");
        },
      },
    });

    items.forEach((item) => {
      gsap.fromTo(item, { opacity: 0.3, scale: 0.94 }, {
        opacity: 1, scale: 1, ease: "none",
        scrollTrigger: { trigger: item, containerAnimation: tween, start: "left 96%", end: "left 62%", scrub: true },
      });
    });

    return () => {
      section.classList.remove("hmode");
      if (bar) bar.style.transform = "";
    };
  });
}

/* ---------- Skill tags pop in one by one ---------- */
function initSkillTags() {
  gsap.utils.toArray(".skill-card").forEach((card) => {
    const tags = card.querySelectorAll(".skill-tag");
    gsap.set(tags, { opacity: 0, y: 14, scale: 0.92 });
    ScrollTrigger.create({
      trigger: card, start: "top 86%", once: true,
      onEnter: () => gsap.to(tags, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.05, delay: 0.25, ease: "back.out(1.6)" }),
    });
  });
}

/* ---------- Footer wordmark: always fitted to the container width ---------- */
function buildFooterMark() {
  const el = document.getElementById("footerMark");
  if (!el) return;
  const text = el.textContent;
  el.textContent = "";
  const inner = document.createElement("span");
  inner.className = "fm-inner";
  el.appendChild(inner);
  [...text].forEach((ch) => {
    const span = document.createElement("span");
    span.className = "fm-c" + (motionReady() ? "" : " is-in");
    span.textContent = ch === " " ? "\u00A0" : ch;
    inner.appendChild(span);
  });
  const fit = () => {
    el.style.fontSize = "100px";
    const w = inner.getBoundingClientRect().width;
    const avail = el.clientWidth;
    if (w > 0 && avail > 0) el.style.fontSize = Math.floor((100 * avail * 0.985 / w) * 100) / 100 + "px";
  };
  fit();
  window.addEventListener("resize", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener("load", fit);
}

/* Spreads the rotating badge text evenly around its circle */
function fitRingText() {
  const tp = document.getElementById("ringText");
  if (!tp) return;
  const fit = () => {
    try {
      const circ = 2 * Math.PI * 38;
      tp.style.letterSpacing = "0px";
      const len = tp.getComputedTextLength();
      const count = tp.textContent.length;
      if (len > 0) tp.style.letterSpacing = Math.max(0, (circ - len) / count - 0.02).toFixed(2) + "px";
    } catch (e) { /* unsupported: keep CSS spacing */ }
  };
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
}

function initFooterMark() {
  const chars = gsap.utils.toArray("#footerMark .fm-c");
  const el = document.getElementById("footerMark");
  if (!el || !chars.length) return;
  gsap.set(chars, { yPercent: 105 });
  ScrollTrigger.create({
    trigger: el, start: "top 96%", once: true,
    onEnter: () => {
      gsap.to(chars, { yPercent: 0, duration: 1.2, stagger: 0.05, ease: "expo.out" });
      chars.forEach((c, i) => setTimeout(() => c.classList.add("is-in"), 600 + i * 55));
    },
  });
}

/* ---------- Section tags "decode" into place ---------- */
function initTagScramble() {
  const glyphs = "01<>/{}[]#$%&*";
  document.querySelectorAll(".section-tag").forEach((el) => {
    if (el.closest(".hero")) return;
    const final = el.textContent;
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => {
        const st = { p: 0 };
        gsap.to(st, {
          p: 1, duration: 0.9, delay: 0.15, ease: "none",
          onUpdate() {
            const n = Math.floor(st.p * final.length);
            el.textContent = final.slice(0, n) + [...final.slice(n)].map((c) => (c === " " ? " " : glyphs[Math.floor(Math.random() * glyphs.length)])).join("");
          },
          onComplete() { el.textContent = final; },
        });
      },
    });
  });
}


/* ---------- Hero portrait: optional transparent PNG (assets/images/profile.png) ----------
   If the file is missing the slot simply disappears; the orbit rings and bubbles remain. */
const photo = { ready: false, started: false, shown: false };

function initPhoto() {
  const vis = document.getElementById("heroVisual");
  const img = document.getElementById("heroPhoto");
  if (!vis || !img) return;
  const fig = vis.querySelector(".hero-photo");

  const ready = () => {
    vis.classList.add("has-photo");
    photo.ready = true;
    if (motionReady()) { showPhoto(); ScrollTrigger.refresh(); }
  };
  const fail = () => { if (fig) fig.remove(); };

  if (img.complete) (img.naturalWidth > 0 ? ready() : fail());
  else {
    img.addEventListener("load", ready, { once: true });
    img.addEventListener("error", fail, { once: true });
  }
  if (motionReady() && !isTouchDevice) setupPhotoParallax();
}

/* glow + orbit rings fade in with the intro (with or without a portrait) */
function revealVisual() {
  gsap.fromTo(".photo-glow", { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.4, ease: "power3.out" });
  gsap.fromTo(".photo-orbit", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.2, ease: "power3.out", delay: 0.2 });
}

function showPhoto() {
  if (!photo.ready || !photo.started || photo.shown) return;
  const fig = document.querySelector(".hero-photo");
  if (!fig) return;
  photo.shown = true;
  gsap.fromTo(fig, { opacity: 0, y: 80, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1.8, ease: "expo.out" });
}

/* Layers drift at different depths as the cursor moves (portrait, glow and orbit rings) */
function setupPhotoParallax() {
  const hero = document.querySelector(".hero");
  const layers = [
    [document.querySelector(".photo-frame img"), 16, 10, -1, 0.9],
    [document.querySelector(".photo-glow"), 30, 20, 1, 1.1],
    [document.querySelector(".photo-orbit"), 20, 14, 1, 1.3],
  ].filter((l) => l[0]).map(([el, ax, ay, dir, d]) => ({
    ax, ay, dir,
    x: gsap.quickTo(el, "x", { duration: d, ease: "power3.out" }),
    y: gsap.quickTo(el, "y", { duration: d, ease: "power3.out" }),
  }));
  if (!hero || !layers.length) return;

  hero.addEventListener("pointermove", (e) => {
    if (!photo.started) return;
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach((l) => { l.x(nx * l.ax * l.dir); l.y(ny * l.ay * l.dir); });
  });
  hero.addEventListener("pointerleave", () => layers.forEach((l) => { l.x(0); l.y(0); }));
}


/* ---------- Interactive bubbles: repel from the cursor, can be dragged & thrown, spring back ---------- */
function initBubbles() {
  const vis = document.getElementById("heroVisual");
  const hero = document.querySelector(".hero");
  if (!vis || !hero || isTouchDevice) return;

  const bubbles = [...vis.querySelectorAll(".chip")].map((el) => ({
    el, x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0, ox: 0, oy: 0, drag: false,
    setX: gsap.quickSetter(el, "x", "px"), setY: gsap.quickSetter(el, "y", "px"),
  }));
  if (!bubbles.length) return;

  const RADIUS = 150, SPRING = 0.055, DAMPING = 0.84;
  const mouse = { x: -9999, y: -9999, in: false };
  let running = false, heroVisible = true;

  const anchor = (b) => {
    const r = b.el.getBoundingClientRect(); // includes the current offset, so subtract it to get the rest position
    b.cx = r.left + r.width / 2 - b.x;
    b.cy = r.top + r.height / 2 - b.y;
  };

  function frame() {
    const k = gsap.ticker.deltaRatio(60);
    let moving = false;
    bubbles.forEach((b) => {
      anchor(b);
      if (b.drag) { moving = true; return; }
      let fx = -b.x * SPRING, fy = -b.y * SPRING;
      if (mouse.in) {
        const dx = b.cx + b.x - mouse.x, dy = b.cy + b.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < RADIUS && d > 0.01) {
          const f = Math.pow(1 - d / RADIUS, 2) * 3.4;
          fx += (dx / d) * f; fy += (dy / d) * f;
        }
      }
      const damp = Math.pow(DAMPING, k);
      b.vx = (b.vx + fx * k) * damp;
      b.vy = (b.vy + fy * k) * damp;
      b.x += b.vx * k; b.y += b.vy * k;
      if (Math.abs(b.x) < 0.05 && Math.abs(b.y) < 0.05 && Math.abs(b.vx) < 0.05 && Math.abs(b.vy) < 0.05) {
        b.x = b.y = b.vx = b.vy = 0;
      } else moving = true;
      b.setX(b.x); b.setY(b.y);
    });
    if (!moving && !mouse.in) stop();
  }
  const start = () => { if (!running) { running = true; gsap.ticker.add(frame); } };
  const stop = () => { if (running) { running = false; gsap.ticker.remove(frame); } };

  hero.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || !heroVisible) return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.in = true;
    start();
  });
  hero.addEventListener("pointerleave", () => { mouse.in = false; });
  new IntersectionObserver((entries) => {
    heroVisible = entries[0].isIntersecting;
    if (!heroVisible) { mouse.in = false; }
  }).observe(hero);

  bubbles.forEach((b) => {
    const el = b.el;
    el.addEventListener("pointerenter", () => { if (!b.drag) gsap.to(el, { scale: 1.12, duration: 0.45, ease: "back.out(2.2)", overwrite: "auto" }); });
    el.addEventListener("pointerleave", () => { if (!b.drag) gsap.to(el, { scale: 1, duration: 0.5, ease: "power3.out", overwrite: "auto" }); });

    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      anchor(b);
      b.drag = true; b.vx = b.vy = 0;
      b.ox = e.clientX - (b.cx + b.x);
      b.oy = e.clientY - (b.cy + b.y);
      el.classList.add("is-drag");
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
      gsap.to(el, { scale: 1.18, duration: 0.3, ease: "power3.out", overwrite: "auto" });
      start();
      e.preventDefault();
    });
    el.addEventListener("pointermove", (e) => {
      if (!b.drag) return;
      const nx = e.clientX - b.cx - b.ox, ny = e.clientY - b.cy - b.oy;
      b.vx = b.vx * 0.5 + (nx - b.x) * 0.5;
      b.vy = b.vy * 0.5 + (ny - b.y) * 0.5;
      b.x = nx; b.y = ny;
      b.setX(b.x); b.setY(b.y);
    });
    const release = () => {
      if (!b.drag) return;
      b.drag = false;
      el.classList.remove("is-drag");
      b.vx = Math.max(-35, Math.min(35, b.vx));
      b.vy = Math.max(-35, Math.min(35, b.vy));
      gsap.to(el, { scale: el.matches(":hover") ? 1.12 : 1, duration: 0.5, ease: "back.out(2)", overwrite: "auto" });
      start();
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
  });
}
