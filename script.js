// Zhihao Meng 个人主页 - 交互脚本（含中英双语切换）
(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  var toTop = document.getElementById("toTop");
  var yearEl = document.getElementById("year");
  var langToggle = document.getElementById("langToggle");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- 中英双语字典 ----------
  // 默认文本以中文写死在 HTML 中，zh 字典与之保持一致以便切回；
  // 切换到 en 时用 data-i18n / data-i18n-html 覆盖。
  var I18N = {
    zh: {
      "nav.about": "关于我",
      "nav.experience": "工作经历",
      "nav.projects": "项目经历",
      "nav.skills": "技能栈",
      "nav.education": "教育经历",
      "nav.contact": "联系我",
      "hero.speech": "喵～欢迎光临 Zhihao 的个人空间！",
      "hero.title": '你好，我是 <span class="hl">Zhihao Meng</span> 👋',
      "hero.sub": "软件开发工程师，专注于分布式系统与 LLM Agent 平台。<br />白天写后端，夜里陪猫咪 Debug。",
      "hero.ctaPrimary": "看看我的项目",
      "hero.ctaGhost": "联系我",
      "hero.stat1.label": "工作经验",
      "hero.stat1.unit": "年",
      "hero.stat2.label": "交付项目",
      "hero.stat3.label": "学历",
      "hero.stat3.value": "硕士",
      "about.title": "关于我",
      "about.p1": "我是 Zhihao Meng，一名软件开发工程师，现就职于北京比特大陆。喜欢把复杂的需求拆解成跑得起来的系统，从分布式后端到 LLM Agent 平台都有动手实践。",
      "about.p2": "工作之外，我关注开源与新技术，喜欢折腾 AI 工程化与可观测性。如果你也对这些方向感兴趣，欢迎来交流！",
      "about.tag1": "🐱 后端工程师",
      "about.tag2": "🚀 LLM Agent 平台",
      "about.tag3": "☕ 咖啡驱动",
      "about.tag4": "🌙 夜猫子",
      "exp.title": "工作经历",
      "exp.sub": "在比特大陆，我从 OA 分布式系统一路做到 Agent SaaS 平台。",
      "exp.bitmain.company": "北京比特大陆科技有限公司",
      "exp.bitmain.role": "软件开发工程师 · 北京",
      "exp.bitmain.period": "2025.05 – 至今",
      "exp.bitmain.b1": "参与 OA 领域分布式系统研发（Spring 生态、Redis、Kafka/RabbitMQ、MySQL、容器化、Kubernetes），覆盖工作流中心、人事及相关业务模块；参与多租户 Agent SaaS 平台，负责 Agent 运行时与平台能力扩展。",
      "exp.bitmain.b2": "负责 10+ 个项目的需求分析、方案设计与交付，跟进线上问题排查并持续迭代优化。",
      "exp.bitmain.b3": "落地低代码工作流脚手架与出站 API 能力，实现工作流、数据与接口的端到端可配置。",
      "exp.bitmain.b4": "为 Agent 集成多模态工具，实现上下文记忆，并通过技能平台扩展能力。",
      "exp.bitmain.b5": "搭建平台网关，并基于阿里云实现网关容量的弹性伸缩。",
      "exp.bitmain.b6": "实现计费模块：接入 Token 用量计量，结合用量数据自动扣费。",
      "proj.title": "项目经历",
      "proj.sub": "这些是我亲手设计、敲过、跑起来的系统。",
      "proj.agent.name": "多租户 Agent SaaS 平台",
      "proj.agent.period": "2026.03 – 2026.05",
      "proj.agent.b1": "平台 + Agent 双服务多租户架构：平台负责鉴权、网关与计费，Agent 运行在隔离的用户环境中；Agent 侧基于 LangGraph 实现状态机编排，支持工具调用与 RAG。",
      "proj.agent.b2": "PostgreSQL 存储账户与交易流水，Redis 用于缓存与接口限流，Kafka 承载异步用量事件，将计费与对话链路解耦。",
      "proj.agent.b3": "平台服务（FastAPI）：用户鉴权、网关代理、沙箱生命周期管理与计费模块；计费支持按模型与 Token 维度扩展定价。",
      "proj.agent.b4": "Agent 运行时（LangGraph）：编排、工具调用与多模态交互。",
      "proj.nft.name": "联盟链 NFT 交易平台",
      "proj.nft.period": "2025.10 – 2026.03",
      "proj.nft.b1": "覆盖铸造/上架、订单与支付、链上铸造/转账异步确认、盲盒与合成的端到端平台；微服务 + 网关分离读写与链适配。",
      "proj.nft.b2": "服务发现配合熔断限流应对峰值流量，形成从订单、支付到链上操作再到订单/NFT 状态更新的闭环。",
      "proj.nft.b3": "负责核心模块从 0 到生产上线；公共库含分布式锁、统一异常处理与责任链模式；分片任务与缓存调优用于关单与热点查询。",
      "skill.title": "技能栈",
      "skill.sub": "逛完项目，看看我背包里都装了哪些工具。",
      "skill.lang": "编程语言",
      "skill.framework": "框架与中间件",
      "skill.llm": "LLM / 智能体",
      "skill.tools": "工具",
      "edu.title": "教育经历",
      "edu.sub": "从土木工程到计算机科学，一路跨学科探索。",
      "edu.bristol.school": "University of Bristol",
      "edu.bristol.degree": "计算机科学 硕士",
      "edu.bristol.period": "2024.11 毕业",
      "edu.csu.school": "中南大学",
      "edu.csu.degree": "土木工程 学士",
      "edu.csu.period": "2022.06 毕业",
      "contact.title": "来打个招呼吧",
      "contact.sub": "neko 很友善，不会挠人的（大概）。",
      "contact.email": "邮箱",
      "contact.phone": "电话",
      "footer.text": "© <span id=\"year\"></span> Zhihao Meng · 用 ❤️ 与代码搭建"
    },
    en: {
      "nav.about": "About",
      "nav.experience": "Experience",
      "nav.projects": "Projects",
      "nav.skills": "Skills",
      "nav.education": "Education",
      "nav.contact": "Contact",
      "hero.speech": "Meow~ Welcome to Zhihao's space!",
      "hero.title": 'Hi, I\'m <span class="hl">Zhihao Meng</span> 👋',
      "hero.sub": "Software development engineer focused on distributed systems & LLM Agent platforms.<br />Backend by day, debugging with the cat by night.",
      "hero.ctaPrimary": "View my projects",
      "hero.ctaGhost": "Contact me",
      "hero.stat1.label": "Experience",
      "hero.stat1.unit": "yr",
      "hero.stat2.label": "Projects delivered",
      "hero.stat3.label": "Degree",
      "hero.stat3.value": "M.S.",
      "about.title": "About Me",
      "about.p1": "I'm Zhihao Meng, a software development engineer at Beijing Bitmain. I enjoy breaking complex requirements into systems that actually run — from distributed backends to LLM Agent platforms.",
      "about.p2": "Outside of work, I follow open source and emerging tech, and love tinkering with AI engineering and observability. If you're into these areas too, let's talk!",
      "about.tag1": "🐱 Backend engineer",
      "about.tag2": "🚀 LLM Agent platforms",
      "about.tag3": "☕ Coffee-driven",
      "about.tag4": "🌙 Night owl",
      "exp.title": "Experience",
      "exp.sub": "At Bitmain, I built everything from OA distributed systems to an Agent SaaS platform.",
      "exp.bitmain.company": "Beijing Bitmain Technologies Ltd.",
      "exp.bitmain.role": "Software Development Engineer · Beijing",
      "exp.bitmain.period": "May 2025 – Present",
      "exp.bitmain.b1": "Contributed to OA-domain distributed systems (Spring ecosystem, Redis, Kafka/RabbitMQ, MySQL, containerization, Kubernetes) spanning workflow center, HR, and related business modules; participated in a multi-tenant Agent SaaS platform, focusing on Agent runtime and platform capability expansion.",
      "exp.bitmain.b2": "Owned requirements analysis, solution design, and delivery for 10+ projects; triaged production issues and shipped iterative improvements.",
      "exp.bitmain.b3": "Delivered low-code workflow scaffolding and outbound API capabilities, enabling end-to-end configurability for workflows, data, and interfaces.",
      "exp.bitmain.b4": "Integrated multimodal tools for Agents, implemented context memory, and extended capabilities via a skill platform.",
      "exp.bitmain.b5": "Built the platform gateway and integrated elastic scaling on Alibaba Cloud for gateway capacity.",
      "exp.bitmain.b6": "Implemented billing: integrated token usage metering with automated deduction against usage data.",
      "proj.title": "Projects",
      "proj.sub": "Systems I designed, built, and shipped myself.",
      "proj.agent.name": "Multi-Tenant Agent SaaS Platform",
      "proj.agent.period": "Mar 2026 – May 2026",
      "proj.agent.b1": "Platform + Agent dual-service, multi-tenant architecture: Platform handles auth, gateway, and billing; Agents run in isolated user environments. The Agent side uses LangGraph for state-machine orchestration with tool calls and RAG.",
      "proj.agent.b2": "PostgreSQL for accounts and transaction ledgers; Redis for cache and API rate limiting; Kafka for asynchronous usage events, decoupling billing from the chat path.",
      "proj.agent.b3": "Platform services (FastAPI): user authentication, gateway proxying, sandbox lifecycle management, and billing modules; pricing extensible by model and token dimensions.",
      "proj.agent.b4": "Agent runtime on LangGraph: orchestration, tool invocation, and multimodal interfaces.",
      "proj.nft.name": "Consortium NFT Marketplace",
      "proj.nft.period": "Oct 2025 – Mar 2026",
      "proj.nft.b1": "End-to-end platform for mint/listing, orders and payments, on-chain mint/transfer with async confirmation, blind boxes and synthesis; microservices + gateway split read/write and chain adapters.",
      "proj.nft.b2": "Service discovery with circuit breaking and rate limiting for peak traffic; a closed loop from order and payment through chain operations to order/NFT status updates.",
      "proj.nft.b3": "Owned core modules from zero to production; shared libraries for distributed locks, unified exception handling, and chain-of-responsibility; sharded jobs and cache tuning for order closing and hot-path queries.",
      "skill.title": "Skills",
      "skill.sub": "After the projects, here's what's in my toolbox.",
      "skill.lang": "Languages",
      "skill.framework": "Frameworks & Middleware",
      "skill.llm": "LLM / Agents",
      "skill.tools": "Tools",
      "edu.title": "Education",
      "edu.sub": "From civil engineering to computer science — an interdisciplinary journey.",
      "edu.bristol.school": "University of Bristol",
      "edu.bristol.degree": "M.S. in Computer Science",
      "edu.bristol.period": "Graduated Nov 2024",
      "edu.csu.school": "Central South University",
      "edu.csu.degree": "B.S. in Civil Engineering",
      "edu.csu.period": "Graduated Jun 2022",
      "contact.title": "Say hello",
      "contact.sub": "neko is friendly and won't scratch (probably).",
      "contact.email": "Email",
      "contact.phone": "Phone",
      "footer.text": "© <span id=\"year\"></span> Zhihao Meng · Built with ❤️ & code"
    }
  };

  var LANG_KEY = "neko-lang";
  var currentLang = "zh";

  function applyLang(lang) {
    var dict = I18N[lang] || I18N.zh;
    currentLang = lang;
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-i18n]"),
      function (el) {
        var key = el.getAttribute("data-i18n");
        if (dict[key] != null) el.textContent = dict[key];
      }
    );
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-i18n-html]"),
      function (el) {
        var key = el.getAttribute("data-i18n-html");
        if (dict[key] != null) el.innerHTML = dict[key];
      }
    );
    // 切换按钮显示目标语言
    if (langToggle) langToggle.textContent = lang === "en" ? "中" : "EN";
    // 重新写入年份（innerHTML 切换会清掉 #year 节点）
    if (yearEl) yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    // 同步 nav 栏的 aria-label
    if (navLinks) {
      navLinks.setAttribute(
        "aria-label",
        lang === "en" ? "Main navigation" : "主导航"
      );
    }
  }

  function toggleLang() {
    var next = currentLang === "en" ? "zh" : "en";
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch (e) {}
    applyLang(next);
  }

  // 读取保存的语言，默认中文
  var saved = "zh";
  try {
    saved = localStorage.getItem(LANG_KEY) || "zh";
  } catch (e) {}
  applyLang(saved);

  if (langToggle) langToggle.addEventListener("click", toggleLang);

  // ---------- 导航栏滚动阴影 ----------
  function onScrollNav() {
    if (window.scrollY > 12) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
    if (window.scrollY > 480) toTop.classList.add("show");
    else toTop.classList.remove("show");
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  // ---------- 移动端菜单开关 ----------
  function closeMenu() {
    navToggle.classList.remove("open");
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  Array.prototype.forEach.call(
    document.querySelectorAll(".nav-link"),
    function (link) {
      link.addEventListener("click", closeMenu);
    }
  );

  // ---------- 返回顶部 ----------
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---------- 当前栏目高亮 + 滚动入场 ----------
  var sections = Array.prototype.slice.call(
    document.querySelectorAll("section[id]")
  );
  var links = Array.prototype.slice.call(
    document.querySelectorAll(".nav-link")
  );

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            links.forEach(function (l) {
              var match = l.getAttribute("href") === "#" + e.target.id;
              l.classList.toggle("active", match);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
 sections.forEach(function (s) {
      spy.observe(s);
    });

    var revealTargets = document.querySelectorAll(
      ".about-card,.exp-card,.project-card,.skill-group,.edu-card,.contact-card,.stat"
    );
    var rev = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in", "reveal");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    Array.prototype.forEach.call(revealTargets, function (el) {
      el.classList.add("reveal");
      rev.observe(el);
    });
  }

  // ---------- 点击猫咪 emoji 让它"喵"一声的小彩蛋 ----------
  var catEmoji = document.querySelector(".hero-cat-emoji");
  var mascot = document.querySelector(".hero-mascot");
  if (catEmoji && mascot) {
    var meows = ["喵～", "喵呜！", "呼噜噜…", "喵(=^･ω･^=)", "Meow~", "Purr..."];
    catEmoji.addEventListener("click", function () {
      var bubble = document.createElement("div");
      bubble.className = "meow-bubble";
      bubble.textContent = meows[Math.floor(Math.random() * meows.length)];
      mascot.appendChild(bubble);
      requestAnimationFrame(function () {
        bubble.classList.add("show");
      });
      setTimeout(function () {
        bubble.classList.remove("show");
        setTimeout(function () {
          if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
        }, 260);
      }, 1100);
    });
  }
})();
