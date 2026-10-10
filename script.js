// Zhihao Meng — Interactive site (i18n + theme + effects)
(() => {
  "use strict";

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  const nav        = document.getElementById("nav");
  const navToggle  = document.getElementById("navToggle");
  const navLinks   = document.getElementById("navLinks");
  const toTop      = document.getElementById("toTop");
  const langToggle = document.getElementById("langToggle");
  const LANG_KEY   = "site-lang";
  const THEME_KEY  = "site-theme";
  let currentLang  = "zh";

  /* ==================== i18n ==================== */
  async function fetchI18N(lang) {
    try {
      const resp = await fetch(`i18n/${lang}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn(`i18n load failed for "${lang}", fallback zh`, e);
      return await (await fetch("i18n/zh.json")).json();
    }
  }

  async function applyLang(lang) {
    currentLang = lang;
    const dict = await fetchI18N(lang);
    $$("[data-i18n-html]").forEach(el => {
      if (dict[el.dataset.i18nHtml] != null) el.innerHTML = dict[el.dataset.i18nHtml];
    });
    $$("[data-i18n]").forEach(el => {
      if (dict[el.dataset.i18n] != null) el.textContent = dict[el.dataset.i18n];
    });
    if (langToggle) langToggle.textContent = lang === "en" ? "中" : "EN";
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    if (navLinks) navLinks.setAttribute("aria-label", lang === "en" ? "Main navigation" : "主导航");
  }

  function toggleLang() {
    const next = currentLang === "en" ? "zh" : "en";
    try { localStorage.setItem(LANG_KEY, next); } catch (_) {}
    applyLang(next);
  }

  (() => {
    let saved = "zh";
    try { saved = localStorage.getItem(LANG_KEY) || "zh"; } catch (_) {}
    applyLang(saved);
    if (langToggle) langToggle.addEventListener("click", toggleLang);
  })();

  /* ==================== Theme Toggle ==================== */
  const themeToggle = document.getElementById("themeToggle");
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeToggle) themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(cur === "dark" ? "light" : "dark");
  }
  (() => {
    let saved = "light";
    try { saved = localStorage.getItem(THEME_KEY) || "light"; } catch (_) {}
    // Respect system preference as default
    if (!localStorage.getItem(THEME_KEY) && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      saved = "dark";
    }
    setTheme(saved);
    if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  })();

  /* ==================== Project Modal ==================== */
  const projectData = {
    trade: {
      name: "TradingAgents 多智能体交易决策框架",
      period: "2026.06 – 至今",
      tags: ["Python", "LangGraph", "LangChain", "Pydantic", "yfinance", "SQLite"],
      bullets: [
        "基于 LangGraph 状态图构建「分析师→多空辩论→风控辩论→组合经理」决策流水线，条件边 + 计数器驱动辩论轮转，共享状态实现 Agent 间接通信，消息清理隔离上下文防叙事污染。",
        "append-only 两阶段决策日志：决策时 pending 入库，下次同标的运行拉取实际收益由 Reflector 反思回填，仅注入组合经理，在有限上下文窗口下沉淀经验。",
        "多供应商数据路由（yfinance/FRED/Polymarket/AlphaVantage）分级回退 + NO_DATA 哨兵杜绝模型编造；结构化输出在 JSON 损坏时降级自由文本，保证决策链路不阻塞。",
        "ProviderSpec 注册表适配十余家 OpenAI 兼容供应商，per-ticker SQLite 检查点恢复，角色与数据源解耦为可插拔模块。"
      ]
    },
    rag: {
      name: "企业级多模态 RAG 知识库问答系统",
      period: "2026.01 – 2026.05",
      tags: ["Java", "Spring AI", "PgVector", "Elasticsearch", "Neo4j", "Rerank"],
      bullets: [
        "策略+工厂模式 DocumentReaderFactory 路由多格式解析器；自研 PdfMultimodalProcessor 继承 PDFTextStripper 拦截 Do 算子还原图文阅读顺序，qwen3-vl 将图片转语义描述回写 image 标签。",
        "Markdown 标题层级切分器维护标题栈处理跨层级回退，父子分块经 parentChunkId 关联上下文；双路索引：ES ik 分词 BM25 + PgVector HNSW 稠密向量。",
        "四类查询改写（分解/富化/多样化/Step-Back）可组合编排，LLM 问题路由按数据源分流；ES+向量双路召回用 RRF 融合 + gte-rerank-v2 精排提升 Top-K 准确率。",
        "基于 RetrievalAugmentationAdvisor 组装可插拔管线，接入 Neo4j GraphRAG 实体关系检索，支持多数据源协同问答。"
      ]
    },
    doubao: {
      name: "企业级通用智能体平台（仿豆包）",
      period: "2026.02 – 2026.05",
      tags: ["Java", "Spring AI", "Reactor SSE", "MCP", "Redis", "MySQL"],
      bullets: [
        "BaseAgent 基类统一记忆/计时/推荐问题，派生 ReAct、Plan-Execute、State-Machine 多种智能体；ContextCompactor 两层压缩（占位符 + LLM 摘要）控制长对话上下文膨胀。",
        "深度研究引擎：Plan-Execute-Critique 多轮循环，order 分层依赖+并行执行，Semaphore 控并发、CountDownLatch 同步批次，批判驱动多轮迭代。",
        "状态机+策略模式 PPT 生成引擎（INIT→…→SUCCESS），MySQL 持久化实例状态支持任意阶段断点续传，AI 配图 + Python-pptx/PptxGenJS 双引擎渲染。",
        "统一 SSE 协议（thinking/text/reference/recommend），ThinkTagParser 拆分推理与回答；Redis+Redisson 分布式锁任务去重 + Pub/Sub 跨实例停止 + TTL 续期。"
      ]
    }
  };

  const projectModal = document.getElementById("projectModal");
  const projectModalBody = document.getElementById("projectModalBody");

  function openProjectModal(key) {
    const data = projectData[key];
    if (!data || !projectModal || !projectModalBody) return;
    projectModalBody.innerHTML = `
      <h3>${data.name}</h3>
      <span class="modal-period">${data.period}</span>
      <ul class="tag-list">${data.tags.map(t => `<li>${t}</li>`).join("")}</ul>
      <ul class="project-bullets">${data.bullets.map(b => `<li>${b}</li>`).join("")}</ul>
    `;
    projectModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  /* ==================== Infinite Canvas Ocean ==================== */
  const canvas = document.getElementById("heroCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = 0, height = 0;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

    const waveLayers = [
      { amp: 14, len: 0.012, speed: 0.4, yOff: 0.42, color: [140, 200, 190], alpha: 0.35 },
      { amp: 18, len: 0.010, speed: 0.6, yOff: 0.50, color: [100, 180, 170], alpha: 0.50 },
      { amp: 22, len: 0.008, speed: 0.8, yOff: 0.58, color: [70, 160, 155],  alpha: 0.65 },
      { amp: 16, len: 0.014, speed: 0.5, yOff: 0.68, color: [50, 140, 140],  alpha: 0.80 },
      { amp: 12, len: 0.016, speed: 0.7, yOff: 0.78, color: [35, 120, 125],  alpha: 0.90 },
      { amp: 10, len: 0.011, speed: 0.9, yOff: 0.88, color: [25, 100, 110],  alpha: 1.00 },
    ];

    function drawWaves(time) {
      const t = time * 0.001;
      waveLayers.forEach(w => {
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 3) {
          const y = height * w.yOff
            + Math.sin(x * w.len + t * w.speed * 2) * w.amp
            + Math.sin(x * w.len * 0.5 + t * w.speed * 1.3) * w.amp * 0.5;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const dark = isDark();
        const r = dark ? Math.round(w.color[0] * 0.3) : w.color[0];
        const g = dark ? Math.round(w.color[1] * 0.35) : w.color[1];
        const b = dark ? Math.round(w.color[2] * 0.4) : w.color[2];
        ctx.fillStyle = `rgba(${r},${g},${b},${w.alpha})`;
        ctx.fill();

        // Foam line on top of each wave
        ctx.strokeStyle = dark ? `rgba(180,220,210,${w.alpha * 0.25})` : `rgba(255,255,255,${w.alpha * 0.35})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    function drawSky() {
      const dark = isDark();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      if (dark) {
        grad.addColorStop(0, "#0a1a12");
        grad.addColorStop(0.4, "#123020");
        grad.addColorStop(0.7, "#1a4030");
        grad.addColorStop(1, "#245040");
      } else {
        grad.addColorStop(0, "#87ceeb");
        grad.addColorStop(0.35, "#a8d8c8");
        grad.addColorStop(0.65, "#c8e8d0");
        grad.addColorStop(1, "#e8f4d8");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Sun glow
      const cx = width * 0.75, cy = height * 0.2;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
      if (dark) {
        glow.addColorStop(0, "rgba(255,250,220,0.4)");
        glow.addColorStop(0.3, "rgba(200,220,180,0.15)");
      } else {
        glow.addColorStop(0, "rgba(255,245,200,0.7)");
        glow.addColorStop(0.3, "rgba(255,230,180,0.3)");
      }
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    function animate(time) {
      drawSky();
      drawWaves(time);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ==================== Cat Meow ==================== */
  const heroCat = document.getElementById("heroCat");
  const meowBubble = document.getElementById("meowBubble");
  if (heroCat && meowBubble) {
    const meows = ["喵～", "喵呜！", "呼噜噜…", "喵 =^ｪ^=)", "Meow~", "Purr..."];
    let meowTimer;
    heroCat.addEventListener("click", () => {
      meowBubble.textContent = meows[Math.floor(Math.random() * meows.length)];
      const rect = heroCat.getBoundingClientRect();
      meowBubble.style.left = (rect.left + rect.width / 2) + "px";
      meowBubble.style.top = (rect.top - 52) + "px";
      meowBubble.classList.add("show");
      clearTimeout(meowTimer);
      meowTimer = setTimeout(() => meowBubble.classList.remove("show"), 1400);
    });
  }


  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.hidden = true;
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".project-compact").forEach(btn => {
    btn.addEventListener("click", () => openProjectModal(btn.dataset.project));
  });
  if (projectModal) {
    projectModal.querySelector("[data-close]")?.addEventListener("click", closeProjectModal);
    projectModal.querySelector(".project-modal-close")?.addEventListener("click", closeProjectModal);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !projectModal.hidden) closeProjectModal();
    });
  }

  /* ==================== Scroll Nav + To-Top ==================== */
  const onScrollNav = () => {
    nav.classList.toggle("scrolled", window.scrollY > 12);
    toTop.classList.toggle("show", window.scrollY > 480);
  };
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ==================== Mobile Menu ==================== */
  const closeMenu = () => {
    navToggle.classList.remove("open");
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }
  $$(".nav-link").forEach(link => link.addEventListener("click", closeMenu));
  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ==================== Scroll Spy + Reveal ==================== */
  const sections = $$("section[id]");
  const navLinkEls = $$(".nav-link");
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          navLinkEls.forEach(l =>
            l.classList.toggle("active", l.getAttribute("href") === `#${e.target.id}`)
          );
        }
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(s => spy.observe(s));

    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);

      // Section titles: fade + blur + slide
      $$(".section-title, .section-sub").forEach(el => {
        gsap.from(el, {
          opacity: 0, y: 30, filter: "blur(6px)",
          duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        });
      });

      // Cards: batch reveal with stagger
      ScrollTrigger.batch(
        ".about-card, .exp-card, .project-compact, .skill-group, .edu-card, .contact-card, .stat",
        {
          start: "top 90%",
          once: true,
          onEnter: batch => gsap.from(batch, {
            opacity: 0, y: 40, filter: "blur(4px)",
            duration: 0.7, stagger: 0.08, ease: "power2.out", overwrite: true
          })
        }
      );

      // Blog list: stagger from left
      $$(".blog-item").forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, x: -30, filter: "blur(4px)",
          duration: 0.6, delay: i * 0.1, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true }
        });
      });
    }
  }

  /* ==================== 3D Card Tilt ==================== */
  $$(".exp-card, .project-card, .edu-card, .contact-card").forEach(card => {
    card.classList.add("tilt-card");
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale3d(1.02,1.02,1.02)`;
      card.style.boxShadow = `
        ${-x * 10}px ${-y * 10}px 20px rgba(61,52,40,0.15),
        ${x * 5}px ${y * 5}px 8px rgba(61,52,40,0.08)
      `;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(800px) rotateY(0) rotateX(0) scale3d(1,1,1)";
      card.style.boxShadow = "";
    });
    card.addEventListener("mouseenter", () => {
      card.style.transition = "transform 0.15s ease-out, box-shadow 0.15s ease-out";
    });
  });

  /* ==================== Floating Particles ==================== */
  const particlesContainer = document.createElement("div");
  particlesContainer.className = "floating-particles";
  particlesContainer.setAttribute("aria-hidden", "true");
  document.body.prepend(particlesContainer);

  const particleEmojis = ["🍃", "🌸", "🐾", "✨", "🍂", "🦋", "🌿", "💫"];
  function spawnParticle() {
    const p = document.createElement("span");
    p.className = "particle";
    p.textContent = particleEmojis[Math.floor(Math.random() * particleEmojis.length)];
    p.style.left = Math.random() * 96 + "%";
    p.style.animationDuration = (5 + Math.random() * 8) + "s";
    p.style.animationDelay = Math.random() * 3 + "s";
    p.style.fontSize = (0.8 + Math.random() * 1.4) + "rem";
    particlesContainer.appendChild(p);
    // Remove after animation
    const dur = parseFloat(p.style.animationDuration) + parseFloat(p.style.animationDelay);
    setTimeout(() => p.remove(), dur * 1000 + 500);
  }

  // Spawn particles periodically (but not too many)
  setInterval(spawnParticle, 1500);
  // Initial batch
  for (let i = 0; i < 5; i++) setTimeout(spawnParticle, i * 800);/* ==================== Parallax on Hero Mascot ==================== */
  if (mascot) {
    window.addEventListener("mousemove", e => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      mascot.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
  }
})();
