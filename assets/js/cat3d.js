/* ============================================================
   Neko 3D — calico cat head rebuilt with measured proportions
   (img2threejs pipeline: measured landmarks from assets/cat-hero.jpg)

   Reference measurements (1100x1100 crop, 1 px = 0.00253 model units):
     skull width 790px = 2.00   skull height 750px = 1.90
     eye line 0.47 from crown  interocular 335px = 0.85  iris d 130px = 0.33
     nose line 0.79 from crown  nose width 90px = 0.23
     ear tip +0.47 above crown  ear base width 170px = 0.43
     white muzzle pad 310px = 0.78

   - drag to rotate (inertia), idle auto-rotate, click to meow
   - blink / ear twitch / breathing, pauses off-screen
   - falls back to the photo when WebGL is unavailable
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

  const C = {
    fur: "#f6efe2",
    furLight: "#fdfaf3",
    tabby: "#5f5346",
    tabbyDark: "#463b31",
    orange: "#cf8a4e",
    orangeDeep: "#b0703a",
    nose: "#d18f83",
    lip: "#9a6353",
    innerEar: "#d9a79a",
    sclera: "#f8f3e9",
    irisLight: "#9fd8ee",
    irisMid: "#4f9fc4",
    irisDark: "#245f80",
    pupil: "#100e0c",
  };

  const V = THREE.Vector3;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };

  /* ==================== renderer / camera ==================== */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "可以拖拽旋转的 3D 猫咪头，点击会喵一声");
  renderer.domElement.tabIndex = 0;
  renderer.domElement.style.touchAction = "none";
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.02, 4.4);
  camera.lookAt(0, 0, 0);

  /* ==================== studio environment ==================== */
  function envTexture() {
    const w = 1024, h = 512;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#fdf6e8"); sky.addColorStop(0.4, "#eef1ea");
    sky.addColorStop(0.62, "#ccd6cf"); sky.addColorStop(1, "#5c5348");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const k = ctx.createRadialGradient(w * 0.68, h * 0.3, 8, w * 0.68, h * 0.3, h * 0.46);
    k.addColorStop(0, "rgba(255,252,244,1)"); k.addColorStop(0.5, "rgba(255,245,226,0.4)"); k.addColorStop(1, "rgba(255,245,226,0)");
    ctx.fillStyle = k; ctx.fillRect(0, 0, w, h);
    const c2 = ctx.createRadialGradient(w * 0.14, h * 0.45, 6, w * 0.14, h * 0.45, h * 0.4);
    c2.addColorStop(0, "rgba(190,228,238,0.75)"); c2.addColorStop(1, "rgba(190,228,238,0)");
    ctx.fillStyle = c2; ctx.fillRect(0, 0, w, h);
    const tex = new THREE.CanvasTexture(cv);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromEquirectangular(envTexture());
  scene.environment = envRT.texture;
  pmrem.dispose();

  /* ==================== fur micro normal ==================== */
  function furNormalTexture(size) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < size * 18; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const len = 4 + Math.random() * 16, lean = (Math.random() - 0.5) * 3;
      ctx.strokeStyle = Math.random() > 0.5 ? "rgba(214,214,214,0.55)" : "rgba(66,66,66,0.5)";
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + lean * 0.5, y + len * 0.6, x + lean, y + len); ctx.stroke();
    }
    const src = ctx.getImageData(0, 0, size, size).data;
    const out = document.createElement("canvas");
    out.width = out.height = size;
    const octx = out.getContext("2d");
    const img = octx.createImageData(size, size);
    const at = (x, y) => src[(((y + size) % size) * size + ((x + size) % size)) * 4];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (at(x + 1, y) - at(x - 1, y)) / 255;
        const dy = (at(x, y + 1) - at(x, y - 1)) / 255;
        const nx = -dx * 2.4, ny = dy * 2.4, nz = 1;
        const l = Math.hypot(nx, ny, nz) || 1;
        const i = (y * size + x) * 4;
        img.data[i] = ((nx / l) * 0.5 + 0.5) * 255;
        img.data[i + 1] = ((ny / l) * 0.5 + 0.5) * 255;
        img.data[i + 2] = ((nz / l) * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(out);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 5);
    return tex;
  }
  const furNormal = furNormalTexture(256);

  /* ==================== eye texture (big blue calico eye) ==================== */
  function eyeTexture() {
    const w = 384, h = 288;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    const cx = w / 2, cy = h / 2;

    const almond = new Path2D();
    almond.moveTo(cx - 168, cy + 8);
    almond.bezierCurveTo(cx - 128, cy - 96, cx - 40, cy - 118, cx + 6, cy - 112);
    almond.bezierCurveTo(cx + 92, cy - 104, cx + 156, cy - 46, cx + 168, cy + 8);
    almond.bezierCurveTo(cx + 130, cy + 84, cx + 48, cy + 112, cx - 6, cy + 110);
    almond.bezierCurveTo(cx - 92, cy + 106, cx - 150, cy + 64, cx - 168, cy + 8);
    almond.closePath();

    ctx.save(); ctx.clip(almond);
    ctx.fillStyle = C.sclera; ctx.fillRect(0, 0, w, h);

    const irisR = 104;
    const iris = ctx.createRadialGradient(cx - 12, cy - 16, 10, cx, cy, irisR);
    iris.addColorStop(0, C.irisLight); iris.addColorStop(0.5, C.irisMid); iris.addColorStop(1, C.irisDark);
    ctx.fillStyle = iris;
    ctx.beginPath(); ctx.arc(cx, cy, irisR, 0, Math.PI * 2); ctx.fill();

    for (let i = 0; i < 320; i++) {
      const a = Math.random() * Math.PI * 2;
      const r0 = irisR * (0.25 + Math.random() * 0.12), r1 = irisR * (0.6 + Math.random() * 0.38);
      ctx.strokeStyle = Math.random() > 0.5 ? "rgba(235,250,255,0.35)" : "rgba(14,56,80,0.35)";
      ctx.lineWidth = 1 + Math.random() * 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a + 0.03) * r1, cy + Math.sin(a + 0.03) * r1);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(10,40,58,0.8)"; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(cx, cy, irisR - 2, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = C.pupil;
    ctx.beginPath(); ctx.ellipse(cx, cy, 30, 48, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath(); ctx.ellipse(cx - 40, cy - 44, 20, 15, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(cx + 36, cy + 30, 8, 0, Math.PI * 2); ctx.fill();

    const lid = ctx.createLinearGradient(0, 0, 0, 140);
    lid.addColorStop(0, "rgba(56,44,34,0.6)"); lid.addColorStop(1, "rgba(56,44,34,0)");
    ctx.fillStyle = lid; ctx.fillRect(0, 0, w, 150);
    ctx.restore();

    ctx.strokeStyle = "rgba(34,26,20,0.95)"; ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 168, cy + 8);
    ctx.bezierCurveTo(cx - 128, cy - 96, cx - 40, cy - 118, cx + 6, cy - 112);
    ctx.bezierCurveTo(cx + 92, cy - 104, cx + 156, cy - 46, cx + 168, cy + 8);
    ctx.stroke();
    ctx.strokeStyle = "rgba(64,48,36,0.55)"; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 162, cy + 14);
    ctx.bezierCurveTo(cx - 124, cy + 80, cx - 44, cy + 106, cx - 6, cy + 104);
    ctx.bezierCurveTo(cx + 52, cy + 102, cx + 134, cy + 68, cx + 164, cy + 10);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }

  /* ==================== head sculpt (measured) ==================== */
  const EYE_Y = 0.06;            // eye line 0.47 from crown
  const EYE_X = 0.424;           // interocular 0.85 => ±0.424
  const NOSE_Y = -0.55;          // nose line 0.79 from crown
  const EYE_DIRS = [
    new V(-EYE_X, EYE_Y, 1.02).normalize(),
    new V(EYE_X, EYE_Y, 1.02).normalize(),
  ];
  const MUZZLE_DIR = new V(0, NOSE_Y + 0.1, 1.05).normalize();
  const EAR_DIRS = [
    new V(-0.46, 0.92, 0.02).normalize(),
    new V(0.46, 0.92, 0.02).normalize(),
  ];

  function headRadius(d) {
    let r = 1;
    const front = Math.max(0, d.z);
    // muzzle: forward and slightly down
    r += 0.17 * Math.pow(front, 3.0) * Math.pow(Math.max(0, 1 - Math.abs(d.y + 0.42) / 0.46), 1.5);
    // broad cheeks (skull wider than tall)
    r += 0.09 * Math.pow(Math.max(0, 1 - Math.abs(d.y + 0.22) / 0.52), 1.4) * Math.pow(Math.abs(d.x), 1.3);
    // brow ridge above the eyes
    r += 0.012 * Math.exp(-Math.pow((d.y - 0.4) / 0.16, 2)) * front;
    // shallow eye sockets
    for (let i = 0; i < 2; i++) {
      const ang = Math.acos(clamp(d.dot(EYE_DIRS[i]), -1, 1));
      r -= 0.022 * Math.exp(-Math.pow(ang / 0.3, 2));
    }
    // chin
    r += 0.02 * front * Math.max(0, 1 - Math.abs(d.y + 0.8) / 0.2);
    // slightly flatter crown
    r -= 0.045 * Math.pow(Math.max(0, d.y), 3);
    return r;
  }

  function headPoint(d) {
    const r = headRadius(d);
    return new V(d.x * r, d.y * r * 0.95, d.z * r);
  }

  /* ==================== calico vertex colours ==================== */
  const colBase = new THREE.Color(C.fur);
  const colLight = new THREE.Color(C.furLight);
  const colTabby = new THREE.Color(C.tabby);
  const colTabbyDark = new THREE.Color(C.tabbyDark);
  const colOrange = new THREE.Color(C.orange);
  const colOrangeDeep = new THREE.Color(C.orangeDeep);

  function furColorAt(d) {
    const c = new THREE.Color().copy(colBase);

    // white muzzle / chin / throat
    const m = Math.pow(Math.max(0, d.z), 1.6) * Math.max(0, 1 - Math.abs(d.y + 0.5) / 0.56);
    c.lerp(colLight, 0.92 * smooth(m * 1.5));

    // dark tabby cap: crown + temples, with stripes running front-to-back
    const cap = smooth((d.y - 0.02) / 0.44) * smooth((d.z + 0.35) / 0.85);
    if (cap > 0.01) {
      const ang = Math.atan2(d.x, Math.max(0.0001, d.z));
      const stripe = 0.5 + 0.5 * Math.pow(Math.max(0, Math.sin(ang * 10 + 0.5)), 3);
      c.lerp(colTabby, Math.min(1, cap * 1.25) * stripe);
      c.lerp(colTabbyDark, Math.min(1, cap * 1.1) * (1 - stripe));
    }

    // orange patches: left cheek + right brow (as in the photo)
    const p1 = new V(-0.72, -0.12, 0.68).normalize();
    c.lerp(colOrange, 0.9 * smooth((0.55 - Math.acos(clamp(d.dot(p1), -1, 1))) / 0.24));
    const p2 = new V(0.62, 0.42, 0.66).normalize();
    c.lerp(colOrangeDeep, 0.75 * smooth((0.36 - Math.acos(clamp(d.dot(p2), -1, 1))) / 0.2));

    return c;
  }

  const segW = window.innerWidth < 700 ? 100 : 176;
  const segH = window.innerWidth < 700 ? 80 : 132;

  const headGeo = (() => {
    const geo = new THREE.SphereGeometry(1, segW, segH);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const d = new V(); const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      d.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
      const p = headPoint(d);
      pos.setXYZ(i, p.x, p.y, p.z);
      c.copy(furColorAt(d));
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  })();

  const cat = new THREE.Group();
  cat.position.y = 0.03;
  scene.add(cat);
  const headGrp = new THREE.Group();
  cat.add(headGrp);

  const furMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true,
    normalMap: furNormal, normalScale: new THREE.Vector2(0.4, 0.4),
    roughness: 0.8, metalness: 0, envMapIntensity: 0.4,
  });
  const partMaterial = new THREE.MeshStandardMaterial({
    color: 0xe6d8c2, normalMap: furNormal, normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.84, metalness: 0, envMapIntensity: 0.35,
  });

  const head = new THREE.Mesh(headGeo, furMaterial);
  head.scale.set(0.97, 0.96, 0.97);
  headGrp.add(head);

  /* ==================== ears ==================== */
  function earOutline() {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.bezierCurveTo(0.13, 0.02, 0.26, 0.16, 0.28, 0.38);
    sh.quadraticCurveTo(0.29, 0.6, 0.16, 0.82);
    sh.quadraticCurveTo(0.07, 0.95, 0, 0.99);
    sh.quadraticCurveTo(-0.07, 0.95, -0.16, 0.82);
    sh.quadraticCurveTo(-0.29, 0.6, -0.28, 0.38);
    sh.bezierCurveTo(-0.26, 0.16, -0.13, 0.02, 0, 0);
    return sh;
  }
  const earGeo = new THREE.ExtrudeGeometry(earOutline(), {
    depth: 0.05, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.016,
    bevelSegments: 4, curveSegments: 22,
  });
  earGeo.center();
  const innerEarGeo = new THREE.ExtrudeGeometry(earOutline(), {
    depth: 0.012, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008,
    bevelSegments: 3, curveSegments: 18,
  });
  innerEarGeo.center();

  const earGroups = [];
  [-1, 1].forEach((side, idx) => {
    const group = new THREE.Group();
    const base = headPoint(EAR_DIRS[idx]);
    group.position.copy(base).multiplyScalar(1.0);
    group.position.y -= 0.01;

    const ear = new THREE.Mesh(earGeo, partMaterial);
    ear.scale.set(0.92, 0.88, 0.55);
    ear.position.y = -0.22;   // sink the base into the skull
    group.add(ear);

    const inner = new THREE.Mesh(innerEarGeo, new THREE.MeshStandardMaterial({
      color: C.innerEar, roughness: 0.72, envMapIntensity: 0.3,
    }));
    inner.scale.set(0.5, 0.66, 0.46);
    inner.position.set(side * -0.01, -0.2, 0.03);
    group.add(inner);

    group.rotation.set(-0.08, side * -0.16, side * 0.2);
    headGrp.add(group);
    earGroups.push(group);
  });

  /* ==================== photo face decal (projection-first) ==================== */
  // The reference photo's face is baked onto a feathered cap that hugs the head;
  // the rest of the head stays procedural fur so rotation degrades gracefully.
  const faceTex = new THREE.TextureLoader().load("assets/cat-face.webp");
  faceTex.encoding = THREE.sRGBEncoding;
  faceTex.anisotropy = 8;
  faceTex.minFilter = THREE.LinearMipMapLinearFilter;

  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    transparent: true,
    depthWrite: false,
    roughness: 0.7,
    metalness: 0,
    envMapIntensity: 0.3,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  function faceCapGeometry(dir, angularSize, segments) {
    const up = new V(0, 1, 0);
    const u = new V().crossVectors(up, dir).normalize();
    const v = new V().crossVectors(dir, u).normalize();
    const positions = [], uvs = [], indices = [];
    const d = new V(), p = new V();
    for (let iy = 0; iy <= segments; iy++) {
      const t = (iy / segments) * 2 - 1;
      for (let ix = 0; ix <= segments; ix++) {
        const s = (ix / segments) * 2 - 1;
        d.copy(dir).addScaledVector(u, s * angularSize).addScaledVector(v, t * angularSize).normalize();
        p.copy(headPoint(d)).addScaledVector(d, 0.012);
        positions.push(p.x, p.y, p.z);
        uvs.push((s + 1) / 2, (t + 1) / 2);
      }
    }
    for (let iy = 0; iy < segments; iy++) {
      for (let ix = 0; ix < segments; ix++) {
        const a = iy * (segments + 1) + ix, b = a + 1, c = a + segments + 1, e = c + 1;
        indices.push(a, c, b, b, c, e);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  const faceDir = new V(0, 0.03, 1).normalize();
  const faceMesh = new THREE.Mesh(faceCapGeometry(faceDir, 1.08, 48), faceMat);
  faceMesh.renderOrder = 2;
  headGrp.add(faceMesh);
  const eyes = []; // the decal carries the eyes; kept for the blink loop

  /* ==================== contact shadow ==================== */
  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 124);
    g.addColorStop(0, "rgba(48,40,30,0.42)"); g.addColorStop(0.42, "rgba(48,40,30,0.16)"); g.addColorStop(1, "rgba(48,40,30,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  })();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 1.2),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.08;
  cat.add(shadow);

  /* ==================== lights ==================== */
  const hemi = new THREE.HemisphereLight(0xfff4e4, 0x8f8678, 0.25);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff0d8, 0.9);
  key.position.set(2.6, 3.4, 3.8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc4e2e8, 0.42);
  fill.position.set(-3.2, 0.6, 2.2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffcf9e, 0.8);
  rim.position.set(-1.6, 2.4, -3.4);
  scene.add(rim);

  /* ==================== sizing / interaction ==================== */
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

  const state = {
    targetY: -0.3, targetX: 0.04, y: -0.3, x: 0.04,
    dragging: false, lastX: 0, lastY: 0, moved: 0, downAt: 0,
    lastInteract: performance.now(), running: false,
    blinkAt: performance.now() + 3000, blinkUntil: 0,
    twitchAt: performance.now() + 4600, twitch: 0,
  };
  const canvas = renderer.domElement;

  function meow() {
    window.dispatchEvent(new CustomEvent("catmeow"));
    state.twitch = 1;
    cat.userData.bounce = performance.now();
  }

  canvas.addEventListener("pointerdown", (e) => {
    state.dragging = true; state.lastX = e.clientX; state.lastY = e.clientY;
    state.moved = 0; state.downAt = performance.now(); state.lastInteract = performance.now();
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = "grabbing";
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    const dx = e.clientX - state.lastX, dy = e.clientY - state.lastY;
    state.lastX = e.clientX; state.lastY = e.clientY;
    state.moved += Math.abs(dx) + Math.abs(dy);
    state.targetY = clamp(state.targetY + dx * 0.0075, -1.5, 1.5);
    state.targetX = clamp(state.targetX + dy * 0.005, -0.4, 0.45);
    state.lastInteract = performance.now();
    if (isReduced()) renderer.render(scene, camera);
  });
  const endDrag = (e) => {
    if (!state.dragging) return;
    state.dragging = false;
    canvas.style.cursor = "grab";
    if (state.moved < 7 && performance.now() - state.downAt < 360) meow();
    if (e && canvas.releasePointerCapture) { try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => { state.dragging = false; });
  canvas.style.cursor = "grab";

  canvas.addEventListener("keydown", (e) => {
    const step = 0.16;
    if (e.key === "ArrowLeft") state.targetY = clamp(state.targetY + step, -1.5, 1.5);
    else if (e.key === "ArrowRight") state.targetY = clamp(state.targetY - step, -1.5, 1.5);
    else if (e.key === "ArrowUp") state.targetX = clamp(state.targetX - step * 0.6, -0.4, 0.45);
    else if (e.key === "ArrowDown") state.targetX = clamp(state.targetX + step * 0.6, -0.4, 0.45);
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); meow(); }
    else return;
    e.preventDefault();
    state.lastInteract = performance.now();
    if (isReduced()) renderer.render(scene, camera);
  });

  window.addEventListener("catreset", () => {
    state.targetY = -0.3; state.targetX = 0.04; state.lastInteract = performance.now();
  });

  function applyTheme() {
    const dark = isDark();
    hemi.intensity = dark ? 0.2 : 0.25;
    key.intensity = dark ? 0.75 : 0.9;
    fill.intensity = dark ? 0.34 : 0.42;
    rim.intensity = dark ? 0.95 : 0.8;
    renderer.toneMappingExposure = dark ? 0.78 : 0.86;
    if (isReduced()) renderer.render(scene, camera);
  }
  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true, attributeFilter: ["data-theme"],
  });
  applyTheme();

  const clock = new THREE.Clock();
  function frame() {
    if (!state.running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const now = performance.now();
    const reduced = isReduced();

    if (!reduced) {
      cat.position.y = 0.03 + Math.sin(t * 0.85) * 0.02;
      cat.scale.setScalar(1 + Math.sin(t * 1.4) * 0.005);
    }
    if (cat.userData.bounce) {
      const since = (now - cat.userData.bounce) / 1000;
      if (since < 0.45) headGrp.position.y = Math.sin(since * Math.PI * 4.4) * (1 - since * 2.2) * 0.045;
      else { headGrp.position.y = 0; cat.userData.bounce = 0; }
    }
    if (!reduced && !state.dragging && now - state.lastInteract > 2800) {
      state.targetY = clamp(state.targetY + dt * 0.2, -1.5, 1.5);
    }
    const damp = 1 - Math.exp(-dt * 9);
    state.y += (state.targetY - state.y) * damp;
    state.x += (state.targetX - state.x) * damp;
    headGrp.rotation.y = state.y;
    headGrp.rotation.x = state.x;
    headGrp.rotation.z = Math.sin(t * 0.5) * (reduced ? 0 : 0.008);

    let twitch = 0;
    if (!reduced && now > state.twitchAt) { state.twitch = 1; state.twitchAt = now + 4200 + Math.random() * 3600; }
    if (state.twitch > 0.001) {
      state.twitch *= Math.exp(-dt * 6);
      twitch = Math.sin(now / 38) * state.twitch * 0.14;
    }
    earGroups.forEach((g, i) => {
      const side = i === 0 ? -1 : 1;
      g.rotation.z = side * 0.2 + twitch * (i === 0 ? 1 : 0.6);
    });

    if (!reduced) {
      if (now > state.blinkAt) { state.blinkUntil = now + 110; state.blinkAt = now + 2800 + Math.random() * 3200; }
      const target = now < state.blinkUntil ? 0.08 : 1;
      eyes.forEach((g) => { g.scale.y += (target - g.scale.y) * (1 - Math.exp(-dt * 34)); });
    }
    renderer.render(scene, camera);
  }

  function start() {
    if (state.running) return;
    state.running = true; clock.getDelta();
    requestAnimationFrame(frame);
  }
  function stop() { state.running = false; }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting && !document.hidden ? start() : stop())),
      { threshold: 0.05 }
    ).observe(stage);
  } else start();
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  resize();
  start();
  window.catHero = { reset: () => window.dispatchEvent(new Event("catreset")), stage, scene };
})();
