/* ============================================================
   Neko 3D — round, blue-eyed calico cat head (three.js r128)
   Modeled after the CC0 hero photo (white muzzle, dark tabby cap,
   orange patches, big blue eyes) so the 3D version matches the site.

   - drag to rotate (inertia), idle auto-rotate, click to meow
   - blinking, ear twitch, gentle breathing
   - pauses off-screen / hidden tab; prefers-reduced-motion aware
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
    fur: "#e7d8bd",
    furLight: "#fdf8ee",
    tabby: "#5d5145",
    tabbyDark: "#443a31",
    orange: "#d99a5e",
    orangeDeep: "#c07f42",
    nose: "#d98f80",
    lip: "#a87360",
    innerEar: "#d9a99c",
    sclera: "#f7f2e8",
    irisLight: "#9fd6ea",
    irisMid: "#4f9cbd",
    irisDark: "#2c6685",
    pupil: "#12100e",
  };

  const V = THREE.Vector3;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => {
    const x = clamp(t, 0, 1);
    return x * x * (3 - 2 * x);
  };

  /* ==================== renderer / camera ==================== */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.76;
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "可以拖拽旋转的 3D 猫咪头，点击会喵一声");
  renderer.domElement.tabIndex = 0;
  renderer.domElement.style.touchAction = "none";
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.02, 4.5);
  camera.lookAt(0, 0, 0);

  /* ==================== studio environment ==================== */
  function envTexture() {
    const w = 1024, h = 512;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#fdf6e8");
    sky.addColorStop(0.4, "#eef1ea");
    sky.addColorStop(0.62, "#ccd6cf");
    sky.addColorStop(1, "#5c5348");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const keyL = ctx.createRadialGradient(w * 0.68, h * 0.3, 8, w * 0.68, h * 0.3, h * 0.46);
    keyL.addColorStop(0, "rgba(255,252,244,1)");
    keyL.addColorStop(0.5, "rgba(255,245,226,0.4)");
    keyL.addColorStop(1, "rgba(255,245,226,0)");
    ctx.fillStyle = keyL;
    ctx.fillRect(0, 0, w, h);

    const cool = ctx.createRadialGradient(w * 0.14, h * 0.45, 6, w * 0.14, h * 0.45, h * 0.4);
    cool.addColorStop(0, "rgba(190,228,238,0.8)");
    cool.addColorStop(1, "rgba(190,228,238,0)");
    ctx.fillStyle = cool;
    ctx.fillRect(0, 0, w, h);

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

  /* ==================== fur micro-texture (normal only) ==================== */
  function furNormalTexture(size) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < size * 16; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 4 + Math.random() * 14;
      const lean = (Math.random() - 0.5) * 3;
      ctx.strokeStyle = Math.random() > 0.5 ? "rgba(210,210,210,0.55)" : "rgba(70,70,70,0.5)";
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + lean * 0.5, y + len * 0.6, x + lean, y + len);
      ctx.stroke();
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
        const nx = -dx * 2.2, ny = dy * 2.2, nz = 1;
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
    tex.repeat.set(5, 4);
    return tex;
  }
  const furNormal = furNormalTexture(256);

  /* ==================== eye texture (almond, blue iris) ==================== */
  function eyeTexture() {
    const w = 320, h = 256;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    const cx = w / 2, cy = h / 2;

    const almond = new Path2D();
    almond.moveTo(cx - 132, cy + 6);
    almond.bezierCurveTo(cx - 96, cy - 86, cx - 28, cy - 104, cx + 12, cy - 100);
    almond.bezierCurveTo(cx + 78, cy - 94, cx + 126, cy - 40, cx + 132, cy + 6);
    almond.bezierCurveTo(cx + 104, cy + 74, cx + 40, cy + 96, cx - 8, cy + 94);
    almond.bezierCurveTo(cx - 76, cy + 92, cx - 118, cy + 50, cx - 132, cy + 6);
    almond.closePath();

    ctx.save();
    ctx.clip(almond);
    ctx.fillStyle = C.sclera;
    ctx.fillRect(0, 0, w, h);

    const irisR = 99;
    const iris = ctx.createRadialGradient(cx - 10, cy - 14, 8, cx, cy, irisR);
    iris.addColorStop(0, C.irisLight);
    iris.addColorStop(0.55, C.irisMid);
    iris.addColorStop(1, C.irisDark);
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 260; i++) {
      const a = Math.random() * Math.PI * 2;
      const r0 = irisR * (0.28 + Math.random() * 0.1);
      const r1 = irisR * (0.62 + Math.random() * 0.36);
      ctx.strokeStyle = Math.random() > 0.5 ? "rgba(235,250,255,0.32)" : "rgba(18,60,84,0.32)";
      ctx.lineWidth = 1 + Math.random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a + 0.03) * r1, cy + Math.sin(a + 0.03) * r1);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(12,42,60,0.75)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy, irisR - 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = C.pupil;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.ellipse(cx - 34, cy - 38, 17, 13, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.arc(cx + 30, cy + 26, 7, 0, Math.PI * 2);
    ctx.fill();

    const lid = ctx.createLinearGradient(0, 0, 0, 120);
    lid.addColorStop(0, "rgba(48,38,30,0.55)");
    lid.addColorStop(1, "rgba(48,38,30,0)");
    ctx.fillStyle = lid;
    ctx.fillRect(0, 0, w, 130);
    ctx.restore();

    ctx.strokeStyle = "rgba(38,30,24,0.92)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 132, cy + 6);
    ctx.bezierCurveTo(cx - 96, cy - 86, cx - 28, cy - 104, cx + 12, cy - 100);
    ctx.bezierCurveTo(cx + 78, cy - 94, cx + 126, cy - 40, cx + 132, cy + 6);
    ctx.stroke();

    ctx.strokeStyle = "rgba(60,46,36,0.55)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 128, cy + 12);
    ctx.bezierCurveTo(cx - 104, cy + 72, cx - 44, cy + 94, cx - 8, cy + 92);
    ctx.bezierCurveTo(cx + 46, cy + 90, cx + 106, cy + 62, cx + 130, cy + 8);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    return tex;
  }

  /* ==================== head sculpt ==================== */
  const EYE_DIRS = [
    new V(-0.34, 0.18, 0.92).normalize(),
    new V(0.34, 0.18, 0.92).normalize(),
  ];
  const MUZZLE_DIR = new V(0, -0.32, 0.95).normalize();
  const EAR_DIRS = [
    new V(-0.56, 0.62, 0.06).normalize(),
    new V(0.56, 0.62, 0.06).normalize(),
  ];

  function headRadius(d) {
    let r = 1;
    const front = Math.max(0, d.z);

    r += 0.16 * Math.pow(front, 3.2) * Math.pow(Math.max(0, 1 - Math.abs(d.y + 0.34) / 0.5), 1.6);
    r += 0.07 * Math.pow(Math.max(0, 1 - Math.abs(d.y + 0.18) / 0.5), 1.4) * Math.pow(Math.abs(d.x), 1.4);
    r += 0.012 * Math.exp(-Math.pow((d.y - 0.46) / 0.16, 2)) * front;
    for (let i = 0; i < 2; i++) {
      const ang = Math.acos(clamp(d.dot(EYE_DIRS[i]), -1, 1));
      r -= 0.03 * Math.exp(-Math.pow(ang / 0.26, 3));
    }
    r += 0.026 * front * Math.max(0, 1 - Math.abs(d.y + 0.66) / 0.2);
    r -= 0.05 * Math.pow(Math.max(0, d.y), 3);
    return r;
  }

  function headPoint(d) {
    const r = headRadius(d);
    return new V(d.x * r, d.y * r * 0.95, d.z * r);
  }

  const colFur = new THREE.Color(C.fur);
  const colLight = new THREE.Color(C.furLight);
  const colTabby = new THREE.Color(C.tabby);
  const colTabbyDark = new THREE.Color(C.tabbyDark);
  const colOrange = new THREE.Color(C.orange);
  const colOrangeDeep = new THREE.Color(C.orangeDeep);

  function furColorAt(d) {
    const c = new THREE.Color().copy(colFur);

    const m = Math.pow(Math.max(0, d.z), 1.8) * Math.max(0, 1 - Math.abs(d.y + 0.42) / 0.62);
    c.lerp(colLight, 0.85 * smooth(m * 1.5));

    const cap = smooth((d.y + 0.02) / 0.5) * smooth((d.z + 0.65) / 1.0);
    if (cap > 0.01) {
      const ang = Math.atan2(d.x, d.z);
      const stripe = 0.55 + 0.45 * Math.pow(Math.max(0, Math.sin(ang * 9 + 0.7)), 4);
      c.lerp(colTabby, Math.min(1, cap * 1.5) * stripe);
      c.lerp(colTabbyDark, Math.min(1, cap * 1.2) * (1 - stripe));
    }

    const p1 = new V(0.78, 0.20, 0.46).normalize();
    const a1 = Math.acos(clamp(d.dot(p1), -1, 1));
    c.lerp(colOrange, smooth((0.58 - a1) / 0.26));
    const p2 = new V(-0.30, 0.48, 0.72).normalize();
    const a2 = Math.acos(clamp(d.dot(p2), -1, 1));
    c.lerp(colOrangeDeep, 0.85 * smooth((0.30 - a2) / 0.18));

    return c;
  }

  const segW = window.innerWidth < 700 ? 96 : 168;
  const segH = window.innerWidth < 700 ? 72 : 128;

  const headGeo = (() => {
    const geo = new THREE.SphereGeometry(1, segW, segH);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const d = new V();
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      d.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
      const p = headPoint(d);
      pos.setXYZ(i, p.x, p.y, p.z);
      c.copy(furColorAt(d));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  })();

  const cat = new THREE.Group();
  cat.position.y = 0.02;
  scene.add(cat);

  const headGrp = new THREE.Group();
  cat.add(headGrp);

  const furMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    normalMap: furNormal,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.82,
    metalness: 0,
    envMapIntensity: 0.35,
  });
  const partMaterial = new THREE.MeshStandardMaterial({
    color: 0xece2d0,
    normalMap: furNormal,
    normalScale: new THREE.Vector2(0.25, 0.25),
    roughness: 0.85,
    metalness: 0,
    envMapIntensity: 0.3,
  });

  const head = new THREE.Mesh(headGeo, furMaterial);
  head.scale.set(0.94, 1.0, 0.96);
  headGrp.add(head);

  /* ==================== ears ==================== */
  function earOutline() {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.bezierCurveTo(0.14, 0.02, 0.30, 0.18, 0.33, 0.42);
    sh.quadraticCurveTo(0.35, 0.62, 0.20, 0.80);
    sh.quadraticCurveTo(0.09, 0.93, 0.0, 0.97);
    sh.quadraticCurveTo(-0.09, 0.93, -0.20, 0.80);
    sh.quadraticCurveTo(-0.35, 0.62, -0.33, 0.42);
    sh.bezierCurveTo(-0.30, 0.18, -0.14, 0.02, 0, 0);
    return sh;
  }

  const earGeo = new THREE.ExtrudeGeometry(earOutline(), {
    depth: 0.05, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.018,
    bevelSegments: 4, curveSegments: 24,
  });
  earGeo.center();
  const innerEarGeo = new THREE.ExtrudeGeometry(earOutline(), {
    depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01,
    bevelSegments: 3, curveSegments: 18,
  });
  innerEarGeo.center();

  const earGroups = [];
  [-1, 1].forEach((side, idx) => {
    const group = new THREE.Group();
    group.position.copy(headPoint(EAR_DIRS[idx])).multiplyScalar(1.0);
    group.position.y += 0.2;
    group.position.x *= 0.86;

    const ear = new THREE.Mesh(earGeo, partMaterial);
    ear.scale.set(0.62, 1.35, 0.5);
    group.add(ear);

    const inner = new THREE.Mesh(innerEarGeo, new THREE.MeshPhysicalMaterial({
      color: C.innerEar, roughness: 0.7, clearcoat: 0.2, clearcoatRoughness: 0.8, envMapIntensity: 0.3,
    }));
    inner.scale.set(0.38, 0.9, 0.46);
    inner.position.set(side * -0.01, 0.015, 0.03);
    group.add(inner);

    group.rotation.set(-0.02, side * -0.12, side * 0.16);
    headGrp.add(group);
    earGroups.push(group);
  });

  /* ==================== eyes (textured almond discs) ==================== */
  const eyeMap = eyeTexture();
  const eyeMaterial = new THREE.MeshStandardMaterial({
    map: eyeMap,
    transparent: true,
    alphaTest: 0.45,
    roughness: 0.32,
    metalness: 0,
    envMapIntensity: 0.5,
    side: THREE.DoubleSide,
  });

  const eyes = [];

  // a patch of the head surface around `dir`, with planar UVs so the almond
  // texture is not cropped or distorted by the head curvature
  function eyePatchGeometry(dir, angularSize, segments) {
    const up = new V(0, 1, 0);
    const u = new V().crossVectors(up, dir).normalize();
    const v = new V().crossVectors(dir, u).normalize();
    const positions = [];
    const uvs = [];
    const indices = [];
    const d = new V();
    const p = new V();

    for (let iy = 0; iy <= segments; iy++) {
      const t = (iy / segments) * 2 - 1;
      for (let ix = 0; ix <= segments; ix++) {
        const s = (ix / segments) * 2 - 1;
        d.copy(dir).addScaledVector(u, s * angularSize).addScaledVector(v, t * angularSize).normalize();
        p.copy(headPoint(d)).addScaledVector(d, 0.03);
        positions.push(p.x, p.y, p.z);
        uvs.push((s + 1) / 2, 1 - (t + 1) / 2);
      }
    }
    for (let iy = 0; iy < segments; iy++) {
      for (let ix = 0; ix < segments; ix++) {
        const a = iy * (segments + 1) + ix;
        const b = a + 1;
        const c = a + segments + 1;
        const e = c + 1;
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

  EYE_DIRS.forEach((dir, idx) => {
    const side = idx === 0 ? -1 : 1;
    const eyeGrp = new THREE.Group();
    const patch = new THREE.Mesh(eyePatchGeometry(dir, 0.225, 24), eyeMaterial);
    patch.renderOrder = 3;
    eyeGrp.add(patch);
    // rotate the patch slightly so the outer corner lifts (friendlier expression)
    eyeGrp.rotateZ(side * 0.04);
    headGrp.add(eyeGrp);
    eyes.push(eyeGrp);
  });

  /* ==================== nose / mouth ==================== */
  const muzzlePoint = headPoint(MUZZLE_DIR);
  const faceGrp = new THREE.Group();
  headGrp.add(faceGrp);

  function noseShape() {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0.062);
    sh.bezierCurveTo(0.042, 0.062, 0.07, 0.032, 0.07, 0);
    sh.quadraticCurveTo(0.07, -0.04, 0, -0.062);
    sh.quadraticCurveTo(-0.07, -0.04, -0.07, 0);
    sh.bezierCurveTo(-0.07, 0.032, -0.042, 0.062, 0, 0.062);
    return sh;
  }
  const nose = new THREE.Mesh(
    new THREE.ExtrudeGeometry(noseShape(), {
      depth: 0.03, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.014,
      bevelSegments: 3, curveSegments: 16,
    }),
    new THREE.MeshPhysicalMaterial({ color: C.nose, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.35 })
  );
  nose.position.copy(muzzlePoint).addScaledVector(MUZZLE_DIR, 0.02);
  nose.position.y += 0.06;
  nose.quaternion.setFromUnitVectors(new V(0, 0, 1), MUZZLE_DIR);
  nose.scale.set(0.78, 0.78, 0.8);
  faceGrp.add(nose);

  const lipMaterial = new THREE.MeshStandardMaterial({ color: C.lip, roughness: 0.8 });
  const mouthY = nose.position.y - 0.12;
  const mouthZ = nose.position.z - 0.005;

  const ph = new THREE.CatmullRomCurve3([
    new V(0, nose.position.y - 0.05, mouthZ + 0.01),
    new V(0, mouthY + 0.02, mouthZ + 0.012),
  ]);
  faceGrp.add(new THREE.Mesh(new THREE.TubeGeometry(ph, 8, 0.005, 6, false), lipMaterial));

  [-1, 1].forEach((side) => {
    const curve = new THREE.CatmullRomCurve3([
      new V(0, mouthY, mouthZ + 0.012),
      new V(side * 0.03, mouthY - 0.024, mouthZ + 0.012),
      new V(side * 0.075, mouthY - 0.028, mouthZ + 0.004),
      new V(side * 0.115, mouthY - 0.014, mouthZ - 0.008),
    ]);
    faceGrp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.008, 6, false), lipMaterial));
  });

  /* ==================== whiskers ==================== */
  const whiskerMaterial = new THREE.MeshBasicMaterial({ color: 0xfffbf2, transparent: true, opacity: 0.85 });
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 3; i++) {
      const origin = new V(side * (0.10 + i * 0.012), mouthY + 0.03 + i * 0.042, mouthZ + 0.01);
      const dir = new V(side, -0.05 + i * 0.16, 0.28).normalize();
      const p0 = origin;
      const p1 = origin.clone().addScaledVector(dir, 0.2).add(new V(0, 0.02 * Math.sin(i), 0.01));
      const p2 = origin.clone().addScaledVector(dir, 0.42).add(new V(0, -0.02 + i * 0.015, 0.02));
      const curve = new THREE.CatmullRomCurve3([p0, p1, p2]);
      faceGrp.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.0035, 5, false), whiskerMaterial));
    }
  });

  /* ==================== contact shadow ==================== */
  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 124);
    g.addColorStop(0, "rgba(48, 40, 30, 0.46)");
    g.addColorStop(0.42, "rgba(48, 40, 30, 0.18)");
    g.addColorStop(1, "rgba(48, 40, 30, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  })();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.3),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.6 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.12;
  cat.add(shadow);

  /* ==================== lights ==================== */
  const hemi = new THREE.HemisphereLight(0xfff4e4, 0x8f8678, 0.22);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff0d8, 0.75);
  key.position.set(2.6, 3.4, 3.8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc4e2e8, 0.5);
  fill.position.set(-3.2, 0.6, 2.2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffcf9e, 0.75);
  rim.position.set(-1.6, 2.4, -3.4);
  scene.add(rim);

  /* ==================== sizing ==================== */
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

  /* ==================== interaction ==================== */
  const state = {
    targetY: -0.34, targetX: 0.05, y: -0.34, x: 0.05,
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
    state.dragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.moved = 0;
    state.downAt = performance.now();
    state.lastInteract = performance.now();
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = "grabbing";
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!state.dragging) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
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
    if (e && canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    }
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
    state.targetY = -0.34;
    state.targetX = 0.05;
    state.lastInteract = performance.now();
  });

  /* ==================== theme ==================== */
  function applyTheme() {
    const dark = isDark();
    hemi.intensity = dark ? 0.2 : 0.22;
    key.intensity = dark ? 0.72 : 0.75;
    fill.intensity = dark ? 0.38 : 0.5;
    rim.intensity = dark ? 0.95 : 0.75;
    renderer.toneMappingExposure = dark ? 0.72 : 0.76;
    if (isReduced()) renderer.render(scene, camera);
  }
  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true, attributeFilter: ["data-theme"],
  });
  applyTheme();

  /* ==================== loop ==================== */
  const clock = new THREE.Clock();
  function frame() {
    if (!state.running) return;
    requestAnimationFrame(frame);

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const now = performance.now();
    const reduced = isReduced();

    if (!reduced) {
      cat.position.y = 0.02 + Math.sin(t * 0.85) * 0.022;
      cat.scale.setScalar(1 + Math.sin(t * 1.4) * 0.005);
    }

    if (cat.userData.bounce) {
      const since = (now - cat.userData.bounce) / 1000;
      if (since < 0.45) {
        headGrp.position.y = Math.sin(since * Math.PI * 4.4) * (1 - since * 2.2) * 0.045;
      } else {
        headGrp.position.y = 0;
        cat.userData.bounce = 0;
      }
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
    if (!reduced && now > state.twitchAt) {
      state.twitch = 1;
      state.twitchAt = now + 4200 + Math.random() * 3600;
    }
    if (state.twitch > 0.001) {
      state.twitch *= Math.exp(-dt * 6);
      twitch = Math.sin(now / 38) * state.twitch * 0.14;
    }
    earGroups.forEach((g, i) => {
      const side = i === 0 ? -1 : 1;
      g.rotation.z = side * 0.24 + twitch * (i === 0 ? 1 : 0.6);
    });

    if (!reduced) {
      if (now > state.blinkAt) {
        state.blinkUntil = now + 110;
        state.blinkAt = now + 2800 + Math.random() * 3200;
      }
      const target = now < state.blinkUntil ? 0.08 : 1;
      eyes.forEach((g) => {
        g.scale.y += (target - g.scale.y) * (1 - Math.exp(-dt * 34));
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
  function stop() { state.running = false; }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting && !document.hidden ? start() : stop())),
      { threshold: 0.05 }
    ).observe(stage);
  } else {
    start();
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  resize();
  start();

  window.catHero = { reset: () => window.dispatchEvent(new Event("catreset")), stage, scene };
})();
