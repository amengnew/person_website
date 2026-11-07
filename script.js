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
  const i18nCache = new Map();
  async function fetchI18N(lang) {
    if (i18nCache.has(lang)) return i18nCache.get(lang);
    try {
      const resp = await fetch(`i18n/${lang}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const dict = await resp.json();
      i18nCache.set(lang, dict);
      return dict;
    } catch (e) {
      console.warn(`i18n load failed for "${lang}", fallback zh`, e);
      const fb = await (await fetch("i18n/zh.json")).json();
      i18nCache.set("zh", fb);
      return fb;
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
    // Keep <html lang> in sync so screen readers pick the right voice / search engines the right language
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    // The footer string carries a "YEAR" placeholder; the dict replaces the <span id="year"> node,
    // so interpolate the real year back after the text swap.
    const footerEl = document.querySelector(".footer-text");
    if (footerEl) footerEl.textContent = footerEl.textContent.replace("YEAR", new Date().getFullYear());
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
    // Stored choice wins; otherwise follow the system preference.
    // Everything reading localStorage is wrapped: privacy modes can throw.
    let stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (_) {}
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(stored || (prefersDark ? "dark" : "light"));
    if (themeToggle) themeToggle.addEventListener("click", toggleTheme);
  })();

  /* ==================== Skip Link ==================== */
  const mainContent = document.getElementById("main-content");
  const skipLink = $(".skip-link");
  // index.html already ships tabindex="-1" on <main>; this is only a fallback so the in-page
  // link can actually move keyboard focus, not merely scroll.
  if (mainContent && !mainContent.hasAttribute("tabindex")) mainContent.setAttribute("tabindex", "-1");
  if (skipLink && mainContent) {
    skipLink.addEventListener("click", () => {
      // Keep the native #main-content jump (URL hash + scroll), then move focus there so the
      // next Tab starts inside the content instead of falling back to the header.
      try { mainContent.focus({ preventScroll: true }); }
      catch (_) { mainContent.focus(); }
    });
  }

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
  const projectModalContent = projectModal ? projectModal.querySelector(".project-modal-content") : null;
  const projectModalTitleId = "projectModalTitle";

  // The dialog markup lives *inside* <main>, so <main> itself cannot be inerted — instead every
  // body-level sibling (header, footer, skip-link, to-top, …) and every non-modal child of <main>
  // is made inert while the dialog is open. `inert` removes both focus and AT access; browsers
  // without it fall back to aria-hidden.
  const FOCUSABLE_SEL = "a[href], area[href], button:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex='-1']), [contenteditable='true']";
  const NON_RENDERED_TAGS = { SCRIPT: 1, STYLE: 1, LINK: 1, META: 1, TEMPLATE: 1, NOSCRIPT: 1 };
  const supportsInert = typeof HTMLElement !== "undefined" && "inert" in HTMLElement.prototype;
  let modalBackground = [];   // [{ el, hadInert, ariaHidden }] — restored on close
  let modalTrigger = null;    // element that opened the dialog; focus goes back to it

  function focusableIn(root) {
    if (!root) return [];
    return $$(FOCUSABLE_SEL, root).filter(el => !el.hasAttribute("disabled") && el.getClientRects().length > 0);
  }

  function hideModalBackground() {
    modalBackground = [];
    if (!projectModal) return;
    const els = [];
    let node = projectModal;
    while (node && node !== document.body && node.parentElement) {
      const parent = node.parentElement;
      Array.prototype.forEach.call(parent.children, el => {
        if (el === node || el.contains(projectModal) || NON_RENDERED_TAGS[el.tagName]) return;
        els.push(el);
      });
      node = parent;
    }
    els.forEach(el => {
      modalBackground.push({
        el: el,
        hadInert: el.hasAttribute("inert"),
        ariaHidden: el.getAttribute("aria-hidden")
      });
      if (supportsInert) el.setAttribute("inert", "");
      else el.setAttribute("aria-hidden", "true");
    });
  }

  function restoreModalBackground() {
    modalBackground.forEach(rec => {
      if (!rec.hadInert) rec.el.removeAttribute("inert");
      if (rec.ariaHidden === null) rec.el.removeAttribute("aria-hidden");
      else rec.el.setAttribute("aria-hidden", rec.ariaHidden);
    });
    modalBackground = [];
  }

  function openProjectModal(key, trigger) {
    const data = projectData[key];
    if (!data || !projectModal || !projectModalBody) return;
    modalTrigger = trigger || document.activeElement;
    projectModalBody.innerHTML = `
      <h3 id="${projectModalTitleId}">${data.name}</h3>
      <span class="modal-period">${data.period}</span>
      <ul class="tag-list">${data.tags.map(t => `<li>${t}</li>`).join("")}</ul>
      <ul class="project-bullets">${data.bullets.map(b => `<li>${b}</li>`).join("")}</ul>
    `;
    projectModal.setAttribute("role", "dialog");
    projectModal.setAttribute("aria-modal", "true");
    projectModal.setAttribute("aria-labelledby", projectModalTitleId);
    projectModal.hidden = false;
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    hideModalBackground();
    // Park focus on the panel itself (title gets announced first); Tab then reaches the close
    // button and any links inside the body copy.
    const focusTarget = projectModalContent || projectModal;
    if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
    focusTarget.focus({ preventScroll: true });
  }

  /* ==================== Cat Meow (driven by the 3D hero) ==================== */
  const meowBubble = document.getElementById("meowBubble");
  const catStage = document.getElementById("cat3d");
  if (meowBubble) {
    const meows = ["喵～", "喵呜！", "呼噜噜…", "喵 =^ｪ^=)", "Meow~", "Purr..."];
    let meowTimer;
    window.addEventListener("catmeow", () => {
      const rect = (catStage || document.body).getBoundingClientRect();
      meowBubble.textContent = meows[Math.floor(Math.random() * meows.length)];
      meowBubble.style.left = Math.min(window.innerWidth - 48, Math.max(48, rect.left + rect.width / 2)) + "px";
      meowBubble.style.top = Math.max(88, rect.top + rect.height * 0.16) + "px";
      meowBubble.classList.add("show");
      clearTimeout(meowTimer);
      meowTimer = setTimeout(() => meowBubble.classList.remove("show"), 1400);
    });
  }


  function closeProjectModal() {
    if (!projectModal || projectModal.hidden) return;
    projectModal.hidden = true;
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    restoreModalBackground();
    const back = modalTrigger;
    modalTrigger = null;
    // Focus must return to the element that opened the dialog, otherwise keyboard/SR users
    // are dropped back at the top of the document.
    if (back && typeof back.focus === "function" && document.contains(back)) {
      try { back.focus({ preventScroll: true }); }
      catch (_) { back.focus(); }
    }
  }

  function trapModalFocus(e) {
    if (!projectModal || projectModal.hidden) return;
    const focusables = focusableIn(projectModal);
    const active = document.activeElement;
    if (!focusables.length) {
      e.preventDefault();
      (projectModalContent || projectModal).focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const atEdge = active === projectModalContent || !projectModal.contains(active);
    if (e.shiftKey) {
      if (atEdge || active === first) { e.preventDefault(); last.focus(); }
    } else if (atEdge || active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document.querySelectorAll(".project-compact").forEach(btn => {
    btn.addEventListener("click", () => openProjectModal(btn.dataset.project, btn));
  });
  if (projectModal) {
    projectModal.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeProjectModal));
    projectModal.querySelectorAll(".project-modal-close").forEach(el => el.addEventListener("click", closeProjectModal));

    // Single handler: Esc closes the dialog, Tab/Shift+Tab cycle inside it.
    document.addEventListener("keydown", e => {
      if (projectModal.hidden) return;
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        closeProjectModal();
      } else if (e.key === "Tab") {
        trapModalFocus(e);
      }
    });

    // Safety net: if focus somehow lands outside the open dialog (mouse click in a browser
    // without inert), pull it back inside instead of leaving it in the hidden background.
    document.addEventListener("focusin", e => {
      if (!projectModal.hidden && !projectModal.contains(e.target)) {
        const focusables = focusableIn(projectModal);
        (focusables[0] || projectModalContent || projectModal).focus();
      }
    });
  }

  /* ==================== Scroll Nav + To-Top ==================== */
  const onScrollNav = () => {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 12);
    if (toTop) toTop.classList.toggle("show", window.scrollY > 480);
  };
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ==================== Mobile Menu ==================== */
  // Wire the toggle to the panel it controls, so AT announces the relationship.
  if (navToggle && navLinks) navToggle.setAttribute("aria-controls", "navLinks");

  const menuIsOpen = () => !!(navToggle && navLinks && navLinks.classList.contains("open"));

  // The panel fades in through a CSS `visibility` transition, so its links are not focusable
  // during the first frame after opening. Retry across a few frames so focus really lands in
  // the menu — but stop if the user has already moved focus somewhere else.
  const nextFrame = typeof requestAnimationFrame === "function"
    ? cb => requestAnimationFrame(cb)
    : cb => setTimeout(cb, 16);

  function focusFirstNavLink(attemptsLeft) {
    if (!menuIsOpen() || !navLinks) return;
    const firstLink = navLinks.querySelector(".nav-link");
    if (!firstLink) return;
    const active = document.activeElement;
    const stillYours = active === navToggle || active === document.body || navLinks.contains(active);
    if (!stillYours) return;
    firstLink.focus();
    if (document.activeElement === firstLink || attemptsLeft <= 0) return;
    nextFrame(() => focusFirstNavLink(attemptsLeft - 1));
  }

  const setMenu = open => {
    if (!navToggle || !navLinks) return;
    navLinks.classList.toggle("open", open);
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
  };

  const closeMenu = () => setMenu(false);

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = !menuIsOpen();
      setMenu(open);
      // Opening moves focus into the panel so keyboard/SR users land on the first link.
      if (open) focusFirstNavLink(30);
    });
  }
  $$(".nav-link").forEach(link => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", e => {
    if (!menuIsOpen()) return;
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      closeMenu();
      // Esc returns focus to the button that opened the panel.
      if (navToggle) navToggle.focus();
      return;
    }
    if (e.key === "Tab") {
      // Tab leaving the panel closes it, so no focus is left on now-hidden links.
      setTimeout(() => {
        if (!menuIsOpen()) return;
        const active = document.activeElement;
        if (active && active !== navToggle && !navLinks.contains(active)) closeMenu();
      }, 0);
    }
  });

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

    // GSAP's from() animations are motion effects: honour prefers-reduced-motion by skipping
    // them and showing the content immediately. The nav highlight below is unaffected.
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealTargets = ".section-title, .section-sub, .about-card, .exp-card, .project-compact, .skill-group, .edu-card, .contact-card, .blog-item, .stat";

    if (!prefersReducedMotion && typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
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
      // Fonts / the 3D hero can shift trigger positions after first paint; refresh once the page
      // has fully loaded so deep-linked anchors still reveal their section.
      const refreshTriggers = () => {
        try { ScrollTrigger.refresh(); } catch (_) {}
      };
      if (document.readyState === "complete") refreshTriggers();
      else window.addEventListener("load", refreshTriggers, { once: true });
    }
    // Fallback: GSAP missing, or reduced motion → show everything instead of leaving it at
    // opacity: 0 (nav highlight still comes from the IntersectionObserver spy above).
    else {
      $$(revealTargets).forEach(el => {
        el.style.opacity = "1";
        el.style.transform = "none";
        el.style.filter = "none";
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

  // Spawn particles periodically (but not too many, and not at all for reduced motion)
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!prefersReduced.matches) {
    setInterval(spawnParticle, 1500);
    for (let i = 0; i < 5; i++) setTimeout(spawnParticle, i * 800);
  }

  /* ==================== Parallax on Hero Mascot ==================== */
  const mascot = document.getElementById("mascot");
  if (mascot) {
    window.addEventListener("mousemove", e => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 8;
      mascot.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
  }
})();
