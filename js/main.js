/* ============================================================
   GLOBAL FINTECH — Interactions & 3D
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- Preloader ---------- */
  var preloader = document.getElementById("preloader");
  window.addEventListener("load", function () {
    setTimeout(function () {
      if (preloader) preloader.classList.add("hide");
    }, 650);
  });
  /* safety: never trap the user on the loader */
  setTimeout(function () {
    if (preloader) preloader.classList.add("hide");
  }, 4200);

  /* ---------- Navbar ---------- */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("navBurger");
  var navLinks = document.getElementById("navLinks");

  function onScrollNav() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  if (burger && navLinks) {
    burger.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      burger.classList.toggle("open", open);
    });
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
        burger.classList.remove("open");
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-3d");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
    /* safety sweep: reveal anything already inside the viewport on load */
    function sweepReveals() {
      revealEls.forEach(function (el) {
        if (el.classList.contains("in-view")) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight - 60 && r.bottom > 0) {
          el.classList.add("in-view");
        }
      });
    }
    window.addEventListener("load", function () { setTimeout(sweepReveals, 300); });
    setTimeout(sweepReveals, 1600);
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll(".stat-num");
  function animateCounter(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";
    var duration = 1600;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(function (c) {
      c.textContent =
        (c.dataset.prefix || "") +
        (parseFloat(c.dataset.count).toFixed(parseInt(c.dataset.decimals || "0", 10))) +
        (c.dataset.suffix || "");
    });
  }

  /* ---------- Mouse glow on cards (feature/stat/step/plan/tst/sec) ---------- */
  document.querySelectorAll(".feature-card, .stat, .step, .plan, .tst, .sec-card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- 2D tilt effect (feature/stat/step/plan/testimonial cards) ---------- */
  function isMobile() { return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768; }

  document.querySelectorAll("[data-tilt]").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      if (isMobile()) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        "perspective(900px) rotateY(" + px * 7 + "deg) rotateX(" + py * -7 + "deg) translateY(-4px)";
    });
    card.addEventListener("pointerleave", function () {
      card.style.transform = "";
    });
  });

  /* ---------- 3D scene tilt (product showcases & CTA panel) ---------- */
  document.querySelectorAll("[data-3d]").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      if (isMobile()) return;
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform =
        "perspective(1100px) rotateY(" + px * 9 + "deg) rotateX(" + py * -9 + "deg)";
    });
    el.addEventListener("pointerleave", function () {
      el.style.transform = "";
    });
  });

  /* ============================================================
     THREE.JS — 3D Stock Trading scene
     Animated candlestick market + live trend line +
     rising gold arrow + spinning coins + price-tick particles
     ============================================================ */
  var canvas = document.getElementById("heroCanvas");
  var hasWebGL = false;
  try {
    var test = document.createElement("canvas");
    hasWebGL = !!(window.WebGLRenderingContext && (test.getContext("webgl") || test.getContext("experimental-webgl")));
  } catch (e) { hasWebGL = false; }

  if (canvas && hasWebGL && typeof THREE !== "undefined") {
    initMarket(canvas);
  }

  function initMarket(host) {
    var containerW = host.parentElement.offsetWidth;
    var containerH = host.parentElement.offsetHeight;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, containerW / containerH, 0.1, 1000);
    var baseZ = containerW < 768 ? 24 : 18;
    camera.position.set(13, 8.5, baseZ);
    camera.lookAt(0, 2.2, 0);

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerW, containerH);
    host.appendChild(renderer.domElement);

    var mouse = { x: 0, y: 0 };
    document.addEventListener("pointermove", function (e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    var market = new THREE.Group();
    scene.add(market);

    /* ---- Lighting ---- */
    scene.add(new THREE.AmbientLight(0x8fa3d8, 1.15));
    var dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(6, 12, 8);
    scene.add(dirLight);
    var goldLight = new THREE.PointLight(0xffd27a, 2.4, 36);
    goldLight.position.set(2, 7, 4);
    scene.add(goldLight);
    var goldFill = new THREE.PointLight(0xffc66b, 1.0, 30);
    goldFill.position.set(-5, 9, -3);
    scene.add(goldFill);
    var cyanLight = new THREE.PointLight(0x00d4ff, 0.7, 28);
    cyanLight.position.set(-6, 3, 6);
    scene.add(cyanLight);

    /* ---- Trading chart grid floor ---- */
    var grid = new THREE.GridHelper(38, 38, 0x3160d8, 0x1a2b52);
    var gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMats.forEach(function (m) { m.transparent = true; m.opacity = 0.32; });
    market.add(grid);

    /* ================= CANDLESTICKS ================= */
    var COLS = 10, ROWS = 4;
    var XS = 1.6, ZS = 1.7;
    var candleGroup = new THREE.Group();
    market.add(candleGroup);

    var upMat = new THREE.MeshStandardMaterial({
      color: 0x0e7a49, emissive: 0x0a5c34, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.18
    });
    var dnMat = new THREE.MeshStandardMaterial({
      color: 0x9e2738, emissive: 0x741a27, emissiveIntensity: 0.55, roughness: 0.4, metalness: 0.18
    });

    var candles = [];
    var phases = [];
    var growthDone = [];

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var isUp = Math.random() > 0.32;
        var bodyH = 0.7 + r * 1.05 + Math.random() * 0.9;      /* back rows taller */
        var wickTotal = bodyH * (1.45 + Math.random() * 0.5);  /* high-low range */
        var bodyTop = wickTotal * 0.62;                        /* body sits in the upper half */
        var bodyLow = bodyTop - bodyH;

        /* real OHLC candlestick: the wick runs straight through the body */
        var bodyGeo = new THREE.BoxGeometry(0.74, bodyH, 0.74);
        bodyGeo.translate(0, bodyLow + bodyH / 2, 0);
        var wickGeo = new THREE.BoxGeometry(0.09, wickTotal, 0.09);
        wickGeo.translate(0, wickTotal / 2, 0);

        var body = new THREE.Mesh(bodyGeo, isUp ? upMat : dnMat);
        var wick = new THREE.Mesh(wickGeo, isUp ? upMat : dnMat);

        var candle = new THREE.Group();
        candle.add(body);
        candle.add(wick);

        candle.position.set((c - (COLS - 1) / 2) * XS, 0, (r - (ROWS - 1) / 2) * ZS);
        candle.scale.y = 0.01;

        var idx = r * COLS + c;
        candleGroup.add(candle);
        candles.push(candle);
        phases.push(idx * 0.045);          /* stagger delay */
        growthDone.push(false);
      }
    }

    /* ================= TREND LINE (draws itself live) ================= */
    var trendGroup = new THREE.Group();
    market.add(trendGroup);
    var SEGS = 18;
    var trendSegs = [];
    var trendPts = [];
    for (var s = 0; s <= SEGS; s++) {
      var tx = -6.8 + (s / SEGS) * 13.6;
      var ty = 1.6 + Math.pow(s / SEGS, 1.15) * 4.1;
      ty += Math.sin(s * 1.7) * 0.28;
      trendPts.push(new THREE.Vector3(tx, ty, 2.7));
    }
    for (var sg = 0; sg < SEGS; sg++) {
      var segGeo = new THREE.BufferGeometry().setFromPoints([trendPts[sg], trendPts[sg + 1]]);
      var segMat = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      var seg = new THREE.Line(segGeo, segMat);
      trendGroup.add(seg);
      trendSegs.push(seg);
    }
    /* glow ribbon riding the trend line */
    var trendCurve = new THREE.CatmullRomCurve3(trendPts);
    var ribbonGeo = new THREE.TubeGeometry(trendCurve, 120, 0.05, 6, false);
    var ribbonMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    trendGroup.add(ribbon);

    /* ================= RISING GOLD ARROW ================= */
    var arrowBase = trendPts[trendPts.length - 1];
    var arrow = new THREE.Group();
    arrow.position.set(arrowBase.x, arrowBase.y + 0.9, arrowBase.z);

    var goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd27a,
      emissive: 0xb8860b,
      emissiveIntensity: 0.55,
      metalness: 0.55,
      roughness: 0.28
    });
    var coneGeo = new THREE.ConeGeometry(0.55, 1.2, 4);
    var cone = new THREE.Mesh(coneGeo, goldMat);
    cone.position.y = 0.6;
    var stemGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12);
    var stem = new THREE.Mesh(stemGeo, goldMat.clone());
    stem.position.y = -0.2;
    arrow.add(cone);
    arrow.add(stem);
    trendGroup.add(arrow);

    /* soft glow sprite behind arrow */
    var glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: 0xffd27a,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    glowSprite.scale.set(3.2, 3.2, 1);
    glowSprite.position.set(arrowBase.x + 0.4, arrowBase.y + 0.4, arrowBase.z - 0.2);
    trendGroup.add(glowSprite);

    function makeGlowTexture() {
      var size = 128;
      var cv = document.createElement("canvas");
      cv.width = cv.height = size;
      var ctx = cv.getContext("2d");
      var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,210,122,1)");
      g.addColorStop(0.4, "rgba(255,210,122,0.35)");
      g.addColorStop(1, "rgba(255,210,122,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      var tex = new THREE.CanvasTexture(cv);
      return tex;
    }

    /* ================= REAL GOLD COINS ================= */
    function makeCoinFaceTexture() {
      var S = 512;
      var cv = document.createElement("canvas");
      cv.width = cv.height = S;
      var ctx = cv.getContext("2d");

      /* burnished gold base */
      var base = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      base.addColorStop(0, "#f9dd7c");
      base.addColorStop(0.5, "#e7b63b");
      base.addColorStop(0.78, "#c9911c");
      base.addColorStop(1, "#9d6c0a");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, S, S);

      /* reeded (milled) edge around the perimeter */
      for (var i = 0; i < 100; i++) {
        var a = (i / 100) * Math.PI * 2;
        ctx.strokeStyle = i % 2 ? "rgba(105,60,0,0.9)" : "rgba(246,215,124,0.95)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(S / 2 + Math.cos(a) * (S / 2 - 8), S / 2 + Math.sin(a) * (S / 2 - 8));
        ctx.lineTo(S / 2 + Math.cos(a) * (S / 2 - 26), S / 2 + Math.sin(a) * (S / 2 - 26));
        ctx.stroke();
      }

      /* raised rim */
      ctx.strokeStyle = "#7d4f02"; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 40, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "#f2cf6b"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 64, 0, Math.PI * 2); ctx.stroke();

      /* inner beaded ring */
      for (var b = 0; b < 44; b++) {
        var ba = (b / 44) * Math.PI * 2 + Math.PI / 44;
        ctx.fillStyle = "rgba(110,70,5,0.6)";
        ctx.beginPath();
        ctx.arc(S / 2 + Math.cos(ba) * (S / 2 - 90), S / 2 + Math.sin(ba) * (S / 2 - 90), 7, 0, Math.PI * 2);
        ctx.fill();
      }

      /* engraved circular lettering following the coin rim */
      function drawArcText(text, radius, midAngle, span, orient, font, dark, light) {
        var startA = midAngle - span / 2;
        var endA = midAngle + span / 2;
        var step = (endA - startA) / text.length;
        var i;

        function paint(fill, dy, hasShadow) {
          ctx.save();
          ctx.font = font;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = fill;
          if (hasShadow) {
            ctx.shadowColor = "rgba(50,28,0,0.95)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 3;
          }
          for (i = 0; i < text.length; i++) {
            var a = startA + step * (i + 0.5);
            ctx.save();
            ctx.translate(S / 2 + Math.cos(a) * radius, S / 2 + Math.sin(a) * radius + dy);
            ctx.rotate(orient === 1 ? a + Math.PI / 2 : a - Math.PI / 2);
            ctx.fillText(text[i], 0, 0);
            ctx.restore();
          }
          ctx.restore();
        }

        paint(dark, 2, true);
        paint(light, 0, false);
      }

      /* top inscription — curves over the crown of the coin */
      drawArcText(
        "GLOBAL FINTECH", 150, -Math.PI / 2, 2.75, 1,
        "700 30px Georgia, 'Times New Roman', serif",
        "#5f3a02", "#e0b33c"
      );

      /* bottom inscription — curves along the lower rim */
      drawArcText(
        "EST. 2014 · PURITY .999 AU", 150, Math.PI / 2, 2.6, -1,
        "600 20px Georgia, 'Times New Roman', serif",
        "#5f3a02", "#d8ab37"
      );

      /* embossed dollar emblem */
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#5f3a02";
      ctx.font = "700 210px Georgia, 'Times New Roman', serif";
      ctx.fillText("$", S / 2 + 2, S / 2 + 3);
      ctx.fillStyle = "#ecc049";
      ctx.shadowOffsetY = 0;
      ctx.fillText("$", S / 2, S / 2);
      ctx.restore();

      return new THREE.CanvasTexture(cv);
    }

    var coinFaceTex = makeCoinFaceTexture();
    var coinFaceMat = new THREE.MeshStandardMaterial({
      map: coinFaceTex,
      color: 0xffffff,
      metalness: 0.55,
      roughness: 0.3,
      emissive: 0x1c1200,
      emissiveIntensity: 0.3
    });
    var coinEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xbf9332,
      metalness: 0.85,
      roughness: 0.4
    });

    var COINS = 14;
    var coins = [];
    var coinData = [];
    for (var ci = 0; ci < COINS; ci++) {
      /* side / top (face) / bottom (face) materials = realistic coin edges */
      var coinGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.13, 36);
      var coin = new THREE.Mesh(coinGeo, [coinEdgeMat, coinFaceMat, coinFaceMat]);
      coin.rotation.x = Math.PI / 2;          /* flat, spinning on its face axis */
      var angle = Math.random() * Math.PI * 2;
      var radius = 3.5 + Math.random() * 8;
      var y = 4.8 + Math.random() * 4.2;
      market.add(coin);
      coins.push(coin);
      coinData.push({
        angle: angle, radius: radius, baseY: y,
        bobSpeed: 0.8 + Math.random() * 1.1,
        spinSpeed: 0.5 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2
      });
    }

    /* ================= PRICE-TICK PARTICLES ================= */
    var TRAILS = 200;
    var trailPos = new Float32Array(TRAILS * 3);
    var trailSpeed = new Float32Array(TRAILS);
    var trailCol = new Float32Array(TRAILS * 3);
    var green = new THREE.Color(0x22d37a);
    var red = new THREE.Color(0xff5a6a);
    for (var tp = 0; tp < TRAILS; tp++) {
      trailPos[tp * 3]     = (Math.random() - 0.5) * 26;
      trailPos[tp * 3 + 1] = Math.random() * 12;
      trailPos[tp * 3 + 2] = -7 + Math.random() * 13;
      trailSpeed[tp] = 0.35 + Math.random() * 0.9;
      var col = Math.random() > 0.35 ? green : red;
      trailCol[tp * 3] = col.r; trailCol[tp * 3 + 1] = col.g; trailCol[tp * 3 + 2] = col.b;
    }
    var trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setAttribute("color", new THREE.BufferAttribute(trailCol, 3));
    var trailMat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var trails = new THREE.Points(trailGeo, trailMat);
    scene.add(trails);

    /* ---- Animation helpers ---- */
    function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }

    var clock = new THREE.Clock();
    var rafId = null;
    var t = 0;

    function animate() {
      rafId = requestAnimationFrame(animate);
      var dt = Math.min(clock.getDelta(), 0.05);
      t += dt;

      /* mouse parallax on the whole market */
      var ty = mouse.x * 0.4 + Math.sin(t * 0.12) * 0.06;
      var tx = -mouse.y * 0.16;
      market.rotation.y += (ty - market.rotation.y) * 0.045;
      market.rotation.x += (tx - market.rotation.x) * 0.045;

      /* candles rise into place with stagger, then gently pulse */
      for (var i = 0; i < candles.length; i++) {
        var g = (t - 0.6 - phases[i]) / 1.7;
        if (g >= 1) {
          growthDone[i] = true;
          candles[i].scale.y = 1 + 0.03 * Math.sin(t * 1.5 + phases[i] * 7);
        } else if (g > 0) {
          candles[i].scale.y = Math.max(0.01, easeOutCubic(g));
        }
      }

      /* trend line draws itself */
      for (var si = 0; si < trendSegs.length; si++) {
        var prog = (t - 1.1 - si * 0.14) * 2.1;
        if (prog >= 1) { trendSegs[si].material.opacity = 0.95; }
        else if (prog > 0) { trendSegs[si].material.opacity = easeOutCubic(prog) * 0.95; }
      }
      ribbon.material.opacity = 0.35 + 0.12 * Math.sin(t * 1.6);

      /* gold arrow bobs */
      arrow.position.y = arrowBase.y + 0.9 + Math.sin(t * 2.1) * 0.22;
      arrow.rotation.y = Math.sin(t * 0.8) * 0.12;
      cone.scale.y = 1 + Math.sin(t * 2.1) * 0.06;
      glowSprite.material.opacity = 0.4 + 0.25 * Math.sin(t * 2.6);

      /* coins tumble, spin & bob */
      for (var cix = 0; cix < coins.length; cix++) {
        var cd = coinData[cix];
        coins[cix].position.set(
          Math.cos(cd.angle) * cd.radius,
          cd.baseY + Math.sin(t * cd.bobSpeed + cd.phase) * 0.35,
          Math.sin(cd.angle) * cd.radius - 1.5
        );
        coins[cix].rotation.y += dt * cd.spinSpeed;
      }

      /* price ticks climb up, wrap around */
      var posAttr = trailGeo.attributes.position;
      for (var pi = 0; pi < TRAILS; pi++) {
        trailPos[pi * 3 + 1] += trailSpeed[pi] * dt;
        if (trailPos[pi * 3 + 1] > 12) {
          trailPos[pi * 3 + 1] = 0;
          trailPos[pi * 3] = (Math.random() - 0.5) * 26;
        }
      }
      posAttr.needsUpdate = true;

      /* camera breathing, always looking at the market */
      camera.position.z = baseZ + Math.sin(t * 0.4) * 0.5;
      camera.lookAt(0, 2.2, 0);

      renderer.render(scene, camera);
    }
    animate();

    /* ---- Resize handling ---- */
    function onResize() {
      var w = host.parentElement.offsetWidth;
      var h = host.parentElement.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    /* Pause when hero is off-screen for perf */
    if ("IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            cancelAnimationFrame(rafId); rafId = null;
          } else if (rafId === null) {
            animate();
          }
        });
      }, { threshold: 0 });
      vio.observe(host);
    }
  }

  /* ---------- Smooth anchor scrolling with fixed-nav offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });
})();