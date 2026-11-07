/* ============================================================
   Neko 3D — clay-style cat head for the hero section
   - three.js r128 (self-hosted, global THREE)
   - procedural geometry, no external model files
   - drag to rotate (with inertia), click to meow, keyboard support
   - pauses when off-screen / tab hidden, respects prefers-reduced-motion
   ============================================================ */
(() => {
  "use strict";

  const stage = document.getElementById("cat3d");
  if (!stage) return;

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isReduced = () => reducedQuery.matches;
  const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

  const webglOK = (() => {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (_) {
      return false;
    }
  })();

  if (!webglOK || typeof THREE === "undefined") {
    stage.classList.add("is-fallback");
    return;
  }

  /* ---------------- palette ---------------- */
  const COLORS = {
    fur: 0xe8d9bf,
    furShade: 0xd8c4a3,
    muzzle: 0xf6ecd6,
    patch: 0xd0864a,
    innerEar: 0xe08b78,
    eye: 0x241f1a,
    nose: 0xc96f57,
    mouth: 0x8a5a43,
    blush: 0xf49a86,
    whisker: 0xfffdf4,
    shadow: 0x2b241c,
    sparkle: 0xffe9bf,
  };

  /* ---------------- renderer / scene / camera ---------------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "可以拖拽旋转的 3D 猫咪头，点击会喵一声");
  renderer.domElement.tabIndex = 0;
  renderer.domElement.style.touchAction = "none";
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.14, 5.05);
  camera.lookAt(0, 0.05, 0);

  /* ---------------- lights ---------------- */
  const hemi = new THREE.HemisphereLight(0xfff1dc, 0xa9bca4, 0.32);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffeed6, 1.18);
  key.position.set(3.1, 3.7, 3.4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xb9e4dc, 0.28);
  fill.position.set(-3.4, 0.6, 2.2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffd0a4, 0.68);
  rim.position.set(-1.4, 2.4, -3.8);
  scene.add(rim);

  /* ---------------- materials ---------------- */
  const matFur = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.74,
    metalness: 0.0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.86,
  });
  const matInnerEar = new THREE.MeshPhysicalMaterial({
    color: COLORS.innerEar,
    roughness: 0.55,
    clearcoat: 0.25,
    clearcoatRoughness: 0.8,
  });
  const matEye = new THREE.MeshPhysicalMaterial({
    color: COLORS.eye,
    roughness: 0.14,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  const matIris = new THREE.MeshPhysicalMaterial({ color: 0xc2864a, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const matPupil = new THREE.MeshPhysicalMaterial({ color: 0x1c1713, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const matGlint = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const matGlintSoft = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  const matNose = new THREE.MeshPhysicalMaterial({ color: COLORS.nose, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.4 });
  const matMouth = new THREE.MeshStandardMaterial({ color: COLORS.mouth, roughness: 0.85 });
  const matWhisker = new THREE.MeshStandardMaterial({ color: COLORS.whisker, roughness: 0.9 });
  const matBlush = new THREE.MeshStandardMaterial({
    color: COLORS.blush,
    roughness: 0.95,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });

  /* ---------------- helpers ---------------- */
  const smooth = (t) => {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /**
   * Paint per-vertex colours on a sphere so fur patches are part of the
   * surface itself (clay look) rather than floating decals.
   */
  function paintHeadGeometry(geometry) {
    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const base = new THREE.Color(COLORS.fur);
    const patch = new THREE.Color(COLORS.patch);
    const muzzle = new THREE.Color(COLORS.muzzle);
    const v = new THREE.Vector3();
    const c = new THREE.Color();

    const patches = [
      { dir: new THREE.Vector3(-0.62, 0.46, 0.64).normalize(), radius: 0.62, color: patch },
      { dir: new THREE.Vector3(0.84, 0.30, 0.28).normalize(), radius: 0.34, color: patch },
      { dir: new THREE.Vector3(0.0, -0.36, 0.93).normalize(), radius: 0.52, color: muzzle },
    ];

    const stripe = new THREE.Color(0xd2b184);

    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
      c.copy(base);
      for (const p of patches) {
        const dot = v.dot(p.dir);
        const outer = Math.cos(p.radius);
        const inner = Math.cos(p.radius * 0.55);
        const f = smooth((dot - outer) / (inner - outer));
        if (f > 0) c.lerp(p.color, f);
      }
      // three soft tabby stripes across the crown
      const band = Math.pow(Math.max(0, Math.sin(v.x * 9.5 + 0.35)), 5);
      const top = smooth((v.y - 0.22) / 0.26);
      if (band > 0.01 && top > 0.01) c.lerp(stripe, band * top * 0.55);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  function paintEarGeometry(geometry, tipColor) {
    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const base = new THREE.Color(COLORS.fur);
    const tip = new THREE.Color(tipColor);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const f = smooth((y - 0.34) / 0.26);
      c.copy(base).lerp(tip, f);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  /* ---------------- the cat ---------------- */
  const cat = new THREE.Group();
  cat.position.y = 0.05;
  scene.add(cat);

  const headGrp = new THREE.Group();
  cat.add(headGrp);

  // head: slightly squashed sphere with a whisper of organic noise
  const headGeo = new THREE.SphereGeometry(1, 96, 72);
  {
    const pos = headGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = 1 + 0.012 * Math.sin(x * 5.1) * Math.cos(y * 4.3) + 0.007 * Math.sin(z * 6.2);
      // crown a little narrower than the cheeks => cat-like heart silhouette
      const crown = 1 - Math.max(0, y) * 0.13;
      pos.setXYZ(i, x * n * crown, y * n, z * n);
    }
    headGeo.computeVertexNormals();
  }
  paintHeadGeometry(headGeo);
  const head = new THREE.Mesh(headGeo, matFur);
  head.scale.set(1.08, 0.96, 1.0);
  headGrp.add(head);

  // cheeks
  const cheekGeo = new THREE.SphereGeometry(0.5, 48, 36);
  paintHeadGeometry(cheekGeo);
  [-1, 1].forEach((s) => {
    const cheek = new THREE.Mesh(cheekGeo, matFur);
    cheek.position.set(s * 0.55, -0.42, 0.38);
    cheek.scale.set(1.04, 0.72, 0.62);
    headGrp.add(cheek);
  });

  // ears (lathe = rounded cone, flattened front-to-back)
  const earProfile = [
    [0.001, 0], [0.36, 0.02], [0.40, 0.11], [0.36, 0.30],
    [0.27, 0.50], [0.17, 0.68], [0.07, 0.82], [0.001, 0.88],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const earGeo = new THREE.LatheGeometry(earProfile, 44);
  const earGeoR = earGeo.clone();
  paintEarGeometry(earGeo, COLORS.patch);
  paintEarGeometry(earGeoR, COLORS.fur);

  const innerProfile = earProfile.map((p) => p.clone().multiplyScalar(0.6));
  const innerEarGeo = new THREE.LatheGeometry(innerProfile, 32);

  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(side < 0 ? earGeo : earGeoR, matFur);
    ear.position.set(side * 0.585, 0.585, -0.03);
    ear.rotation.set(-0.06, side * -0.24, side * 0.30);
    ear.scale.set(0.86, 0.8, 0.72);
    headGrp.add(ear);

    const inner = new THREE.Mesh(innerEarGeo, matInnerEar);
    inner.position.set(side * 0.582, 0.62, 0.09);
    inner.rotation.set(-0.06, side * -0.24, side * 0.30);
    inner.scale.set(0.74, 0.76, 0.4);
    headGrp.add(inner);
  });

  // eyes (grouped so we can blink by squashing)
  const eyes = [];
  [-1, 1].forEach((side) => {
    const eyeGrp = new THREE.Group();
    eyeGrp.position.set(side * 0.375, 0.09, 0.885);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.182, 48, 36), matEye);
    ball.scale.set(1, 0.98, 0.85);
    eyeGrp.add(ball);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.174, 40, 30), matIris);
    iris.position.z = 0.115;
    iris.scale.set(1, 0.97, 0.42);
    eyeGrp.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.082, 32, 24), matPupil);
    pupil.position.z = 0.182;
    pupil.scale.set(1, 1.02, 0.4);
    eyeGrp.add(pupil);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 14), matGlint);
    glint.position.set(side * -0.055, 0.085, 0.238);
    eyeGrp.add(glint);

    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 10), matGlintSoft);
    glint2.position.set(side * 0.06, -0.06, 0.232);
    eyeGrp.add(glint2);

    headGrp.add(eyeGrp);
    eyes.push(eyeGrp);
  });

  // nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.082, 32, 24), matNose);
  nose.scale.set(1.18, 0.82, 0.74);
  nose.position.set(0, -0.115, 0.995);
  headGrp.add(nose);

  // mouth: two soft curves under the nose
  [-1, 1].forEach((side) => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, -0.175, 0.988),
      new THREE.Vector3(side * 0.038, -0.315, 0.995),
      new THREE.Vector3(side * 0.205, -0.30, 0.94)
    );
    const mouth = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.013, 8, false), matMouth);
    headGrp.add(mouth);
  });

  // whiskers
  const whiskerGeo = new THREE.CylinderGeometry(0.007, 0.011, 0.62, 6);
  whiskerGeo.translate(0, 0.31, 0);
  [-1, 1].forEach((side) => {
    [
      { y: -0.10, tilt: 0.10, depth: 0.02 },
      { y: -0.04, tilt: -0.02, depth: 0.05 },
      { y: 0.02, tilt: -0.14, depth: 0.0 },
    ].forEach((cfg) => {
      const w = new THREE.Mesh(whiskerGeo, matWhisker);
      w.position.set(side * 0.625, cfg.y - 0.02, 0.60);
      w.rotation.set(0, side * (Math.PI / 2) + cfg.depth, side * (Math.PI / 2 - cfg.tilt));
      headGrp.add(w);
    });
  });

  // blush
  const blushGeo = new THREE.SphereGeometry(0.145, 32, 24);
  [-1, 1].forEach((side) => {
    const blush = new THREE.Mesh(blushGeo, matBlush);
    blush.position.set(side * 0.615, -0.20, 0.735);
    blush.scale.set(1, 0.62, 0.22);
    blush.rotation.z = side * 0.12;
    headGrp.add(blush);
  });

  /* ---------------- contact shadow ---------------- */
  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
    g.addColorStop(0, "rgba(43,36,28,0.42)");
    g.addColorStop(0.45, "rgba(43,36,28,0.18)");
    g.addColorStop(1, "rgba(43,36,28,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  })();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 1.5),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.62 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.22;
  cat.add(shadow);

  /* ---------------- sparkles ---------------- */
  const SPARK_COUNT = 34;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(SPARK_COUNT * 3);
  const sparkSeed = [];
  for (let i = 0; i < SPARK_COUNT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 1.5;
    sparkPos[i * 3] = Math.cos(a) * r;
    sparkPos[i * 3 + 1] = -1.2 + Math.random() * 2.9;
    sparkPos[i * 3 + 2] = Math.sin(a) * r * 0.6 - 0.6;
    sparkSeed.push({ speed: 0.06 + Math.random() * 0.12, phase: Math.random() * Math.PI * 2 });
  }
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      color: COLORS.sparkle,
      size: 0.055,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
  );
  scene.add(sparks);

  /* ---------------- sizing ---------------- */
  function resize() {
    const rect = stage.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    if (isReduced()) renderer.render(scene, camera);
  }
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener("resize", resize);

  /* ---------------- interaction ---------------- */
  const state = {
    targetRotY: -0.32,
    targetRotX: 0.06,
    rotY: -0.32,
    rotX: 0.06,
    dragging: false,
    lastX: 0,
    lastY: 0,
    moved: 0,
    downAt: 0,
    lastInteract: performance.now(),
    running: false,
    blinkAt: performance.now() + 2600,
    blinkUntil: 0,
    earTwitchAt: performance.now() + 4200,
    earTwitch: 0,
  };

  const canvas = renderer.domElement;

  function meow() {
    window.dispatchEvent(new CustomEvent("catmeow"));
    state.earTwitch = 1;
    // little bounce
    cat.userData.bounce = performance.now();
  }

  canvas.addEventListener("pointerdown", (e) => {
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.moved = 0;
    state.downAt = performance.now();
    state.lastInteract = performance.now();
    canvas.setPointerCapture?.(e.pointerId);
    renderer.domElement.style.cursor = "grabbing";
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.moved += Math.abs(dx) + Math.abs(dy);
    state.targetRotY = clamp(state.targetRotY + dx * 0.0072, -1.5, 1.5);
    state.targetRotX = clamp(state.targetRotX + dy * 0.0048, -0.42, 0.5);
    state.lastInteract = performance.now();
    if (isReduced()) renderer.render(scene, camera);
  });

  const endDrag = (e) => {
    if (!state.dragging) return;
    state.dragging = false;
    renderer.domElement.style.cursor = "grab";
    const quick = performance.now() - state.downAt < 360;
    if (state.moved < 7 && quick) meow();
    if (e && canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => { if (state.dragging) state.dragging = false; });
  canvas.style.cursor = "grab";

  canvas.addEventListener("keydown", (e) => {
    const step = 0.18;
    if (e.key === "ArrowLeft") { state.targetRotY = clamp(state.targetRotY + step, -1.5, 1.5); }
    else if (e.key === "ArrowRight") { state.targetRotY = clamp(state.targetRotY - step, -1.5, 1.5); }
    else if (e.key === "ArrowUp") { state.targetRotX = clamp(state.targetRotX - step * 0.6, -0.42, 0.5); }
    else if (e.key === "ArrowDown") { state.targetRotX = clamp(state.targetRotX + step * 0.6, -0.42, 0.5); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); meow(); }
    else return;
    e.preventDefault();
    state.lastInteract = performance.now();
    if (isReduced()) renderer.render(scene, camera);
  });

  window.addEventListener("catreset", () => {
    state.targetRotY = -0.32;
    state.targetRotX = 0.06;
    state.lastInteract = performance.now();
  });

  /* ---------------- theme ---------------- */
  function applyTheme() {
    const dark = isDark();
    hemi.intensity = dark ? 0.5 : 0.9;
    key.intensity = dark ? 0.75 : 1.15;
    fill.intensity = dark ? 0.34 : 0.5;
    rim.intensity = dark ? 0.72 : 0.55;
    renderer.toneMappingExposure = dark ? 0.82 : 0.88;
    sparks.material.opacity = dark ? 0.5 : 0.75;
    if (isReduced()) renderer.render(scene, camera);
  }
  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  applyTheme();

  /* ---------------- loop ---------------- */
  const clock = new THREE.Clock();

  function frame() {
    if (!state.running) return;
    requestAnimationFrame(frame);

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const now = performance.now();
    const reduced = isReduced();

    // idle drift + breathing (skipped for reduced motion)
    if (!reduced) {
      cat.position.y = 0.05 + Math.sin(t * 0.85) * 0.03;
      const breathe = 1 + Math.sin(t * 1.4) * 0.007;
      cat.scale.setScalar(breathe);
      sparks.rotation.y = t * 0.045;
      sparks.position.y = Math.sin(t * 0.4) * 0.06;
    }

    // bounce after a meow
    if (cat.userData.bounce) {
      const since = (now - cat.userData.bounce) / 1000;
      if (since < 0.5) {
        const k = Math.sin(since * Math.PI * 4) * (1 - since * 2);
        headGrp.position.y = k * 0.06;
      } else {
        headGrp.position.y = 0;
        cat.userData.bounce = 0;
      }
    }

    // auto-rotate when idle
    if (!reduced && !state.dragging && now - state.lastInteract > 2400) {
      state.targetRotY = clamp(state.targetRotY + dt * 0.22, -1.5, 1.5);
    }

    // damped follow
    const damp = 1 - Math.exp(-dt * 9);
    state.rotY += (state.targetRotY - state.rotY) * damp;
    state.rotX += (state.targetRotX - state.rotX) * damp;

    let earTwitch = 0;
    if (!reduced && now > state.earTwitchAt) {
      state.earTwitch = 1;
      state.earTwitchAt = now + 3800 + Math.random() * 4200;
    }
    if (state.earTwitch > 0.001) {
      state.earTwitch *= Math.exp(-dt * 6);
      earTwitch = Math.sin(now / 42) * state.earTwitch * 0.16;
    }

    headGrp.rotation.y = state.rotY;
    headGrp.rotation.x = state.rotX;
    headGrp.rotation.z = Math.sin(t * 0.6) * (reduced ? 0 : 0.012);
    if (headGrp.children[2]) headGrp.children[2].rotation.z = 0.26 + earTwitch; // left ear
    if (headGrp.children[3]) headGrp.children[3].rotation.z = -0.26 + earTwitch * 0.6; // right ear

    // blink
    if (!reduced) {
      if (now > state.blinkAt) {
        state.blinkUntil = now + 130;
        state.blinkAt = now + 2600 + Math.random() * 3200;
      }
      const blinking = now < state.blinkUntil;
      const target = blinking ? 0.08 : 1;
      eyes.forEach((eyeGrp) => {
        eyeGrp.scale.y += (target - eyeGrp.scale.y) * (1 - Math.exp(-dt * 34));
      });
    }

    renderer.render(scene, camera);
  }

  function start() {
    if (state.running) return;
    state.running = true;
    clock.getDelta();
    requestAnimationFrame(frame);
  }
  function stop() {
    state.running = false;
  }

  /* ---------------- pause when off-screen / hidden ---------------- */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => entries.forEach((entry) => (entry.isIntersecting && !document.hidden ? start() : stop())),
      { threshold: 0.05 }
    ).observe(stage);
  } else {
    start();
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // first paint
  resize();
  start();

  // expose a tiny API for the rest of the site / debugging
  window.catHero = {
    reset: () => window.dispatchEvent(new Event("catreset")),
    stage,
    scene,
  };
})();
