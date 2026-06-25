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
      "hero.sub": "开发工程师，专注 LLM Agent 平台、RAG 与多智能体工程化。<br />白天写 Agent，夜里陪猫咪 Debug。",
      "hero.ctaPrimary": "看看我的项目",
      "hero.ctaGhost": "联系我",
      "hero.stat1.label": "工作经验",
      "hero.stat1.unit": "年",
      "hero.stat2.label": "AI 项目",
      "hero.stat3.label": "学历",
      "hero.stat3.value": "硕士",
      "about.title": "关于我",
      "about.p1": "我是 Zhihao Meng，一名开发工程师，现就职于北京比特大陆，参与多租户 Agent SaaS 平台研发。喜欢把复杂需求拆解成跑得起来的系统，从 Agent 编排、RAG 知识库到 Token 计费与全链路可观测都有动手实践。",
      "about.p2": "工作之外，我持续折腾 AI 工程化——多智能体协作、上下文工程与可观测性，并把开源框架拆开来研究透了再扩展。如果你也对这些方向感兴趣，欢迎来交流！",
      "about.tag1": "🐱 开发工程师",
      "about.tag2": "🚀 LLM Agent 平台",
      "about.tag3": "📚 RAG / 多智能体",
      "about.tag4": "🌙 夜猫子",
      "exp.title": "工作经历",
      "exp.sub": "在比特大陆，我负责多租户 Agent SaaS 平台的核心引擎与全链路工程化。",
      "exp.bitmain.company": "北京比特大陆科技有限公司",
      "exp.bitmain.role": "开发工程师 · 北京",
      "exp.bitmain.period": "2025.05 – 至今",
      "exp.bitmain.b1": "参与多租户 Agent SaaS 平台（48 模型）研发，基于阿里云 ECS + ACK K8s + SLB，负责 Agent 编排引擎、RAG 知识库、Token 计量计费与全链路可观测，完成网关到推理容器的工程化落地。",
      "exp.bitmain.b2": "Agent 编排引擎：基于 LangGraph 构建 DAG 工作流与状态机可视化编排（分支/循环/并行/人工审批），集成 Function Calling + MCP（成功率 98%），ReAct + Plan-and-Execute 混合推理（完成率 55%→86%），分层记忆按需召回（单会话 Token -35%）。",
      "exp.bitmain.b3": "RAG 知识库：端到端管线（6 类格式、千万级块），bge-m3 稠密/稀疏/多向量混合检索 + Rerank 精排（召回率 72%→91%，首字<800ms），查询改写 + HyDE + 多路召回（命中率 +18%），RAGAS + 500 条标注集量化评估。",
      "exp.bitmain.b4": "Token 计量与计费：流式实时计量（误差<0.1%，含 Context Cache），Redis+Lua 幂等原子扣费（3000 QPS，账实一致 100%），48 模型差异化计价 + TPM/RPM 双重限流（60万TPM/120RPM），日终对账差错<0.01%。",
      "exp.bitmain.b5": "可观测体系：OpenTelemetry 构建 LLM 全链路 trace + 自研看板（MTTR -60%），内容安全双通道（敏感词+模型审核，注入拦截 99%、误拦<2%），SLO + 分级告警（可用性 99.9%）。",
      "proj.title": "项目经历",
      "proj.sub": "这些是我亲手设计、敲过、跑起来的 AI 系统。",
      "proj.trade.name": "TradingAgents 多智能体交易决策框架",
      "proj.trade.period": "2026.06 – 至今",
      "proj.trade.b1": "基于 LangGraph 状态图构建「分析师→多空辩论→风控辩论→组合经理」决策流水线，条件边 + 计数器驱动辩论轮转，共享状态实现 Agent 间接通信，消息清理隔离上下文防叙事污染。",
      "proj.trade.b2": "append-only 两阶段决策日志：决策时 pending 入库，下次同标的运行拉取实际收益由 Reflector 反思回填，仅注入组合经理，在有限上下文窗口下沉淀经验。",
      "proj.trade.b3": "多供应商数据路由（yfinance/FRED/Polymarket/AlphaVantage）分级回退 + NO_DATA 哨兵杜绝模型编造；结构化输出在 JSON 损坏时降级自由文本，保证决策链路不阻塞。",
      "proj.trade.b4": "ProviderSpec 注册表适配十余家 OpenAI 兼容供应商，per-ticker SQLite 检查点恢复，角色与数据源解耦为可插拔模块。",
      "proj.rag.name": "企业级多模态 RAG 知识库问答系统",
      "proj.rag.period": "2026.01 – 2026.05",
      "proj.rag.b1": "策略+工厂模式 DocumentReaderFactory 路由多格式解析器；自研 PdfMultimodalProcessor 继承 PDFTextStripper 拦截 Do 算子还原图文阅读顺序，qwen3-vl 将图片转语义描述回写 image 标签。",
      "proj.rag.b2": "Markdown 标题层级切分器维护标题栈处理跨层级回退，父子分块经 parentChunkId 关联上下文；双路索引：ES ik 分词 BM25 + PgVector HNSW 稠密向量。",
      "proj.rag.b3": "四类查询改写（分解/富化/多样化/Step-Back）可组合编排，LLM 问题路由按数据源分流；ES+向量双路召回用 RRF 融合 + gte-rerank-v2 精排提升 Top-K 准确率。",
      "proj.rag.b4": "基于 RetrievalAugmentationAdvisor 组装可插拔管线，接入 Neo4j GraphRAG 实体关系检索，支持多数据源协同问答。",
      "proj.doubao.name": "企业级通用智能体平台（仿豆包）",
      "proj.doubao.period": "2026.02 – 2026.05",
      "proj.doubao.b1": "BaseAgent 基类统一记忆/计时/推荐问题，派生 ReAct、Plan-Execute、State-Machine 多种智能体；ContextCompactor 两层压缩（占位符 + LLM 摘要）控制长对话上下文膨胀。",
      "proj.doubao.b2": "深度研究引擎：Plan-Execute-Critique 多轮循环，order 分层依赖+并行执行，Semaphore 控并发、CountDownLatch 同步批次，批判驱动多轮迭代。",
      "proj.doubao.b3": "状态机+策略模式 PPT 生成引擎（INIT→…→SUCCESS），MySQL 持久化实例状态支持任意阶段断点续传，AI 配图 + Python-pptx/PptxGenJS 双引擎渲染。",
      "proj.doubao.b4": "统一 SSE 协议（thinking/text/reference/recommend），ThinkTagParser 拆分推理与回答；Redis+Redisson 分布式锁任务去重 + Pub/Sub 跨实例停止 + TTL 续期。",
      "skill.title": "技能栈",
      "skill.sub": "逛完项目，看看我背包里都装了哪些 AI 工程工具。",
      "skill.lang": "编程语言",
      "skill.framework": "框架与中间件",
      "skill.llm": "LLM / 智能体",
      "skill.tools": "工具",
      "edu.title": "教育经历",
      "edu.sub": "从土木工程到计算机科学，一路跨学科探索。",
      "edu.bristol.school": "University of Bristol",
      "edu.bristol.degree": "计算机科学 硕士",
      "edu.bristol.period": "2023 – 2024",
      "edu.csu.school": "中南大学",
      "edu.csu.degree": "土木工程 学士",
      "edu.csu.period": "2018 – 2022",
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
      "hero.sub": "Development engineer focused on LLM Agent platforms, RAG & multi-agent systems.<br />Building agents by day, debugging with the cat by night.",
      "hero.ctaPrimary": "View my projects",
      "hero.ctaGhost": "Contact me",
      "hero.stat1.label": "Experience",
      "hero.stat1.unit": "yr",
      "hero.stat2.label": "AI projects",
      "hero.stat3.label": "Degree",
      "hero.stat3.value": "M.S.",
      "about.title": "About Me",
      "about.p1": "I'm Zhihao Meng, a development engineer at Beijing Bitmain, building a multi-tenant Agent SaaS platform. I enjoy turning complex requirements into systems that actually run — from Agent orchestration and RAG to token metering and full-stack observability.",
      "about.p2": "Outside of work, I keep tinkering with AI engineering — multi-agent collaboration, context engineering, and observability — and I love dissecting open-source frameworks before extending them. If you're into these areas too, let's talk!",
      "about.tag1": "🐱 Dev engineer",
      "about.tag2": "🚀 LLM Agent platforms",
      "about.tag3": "📚 RAG / Multi-agent",
      "about.tag4": "🌙 Night owl",
      "exp.title": "Experience",
      "exp.sub": "At Bitmain, I own the core engines and full-stack engineering of a multi-tenant Agent SaaS platform.",
      "exp.bitmain.company": "Beijing Bitmain Technologies Ltd.",
      "exp.bitmain.role": "Development Engineer · Beijing",
      "exp.bitmain.period": "May 2025 – Present",
      "exp.bitmain.b1": "Built a multi-tenant Agent SaaS platform (48 models) on Alibaba Cloud ECS + ACK K8s + SLB, owning the Agent orchestration engine, RAG knowledge base, token metering/billing, and full-stack observability — shipping end-to-end engineering from gateway to inference containers.",
      "exp.bitmain.b2": "Agent orchestration engine: LangGraph-based DAG workflows + state-machine visual orchestration (branch/loop/parallel/human approval), Function Calling + MCP (98% success), ReAct + Plan-and-Execute hybrid reasoning (55%→86% completion), tiered memory with on-demand recall (-35% per-session tokens).",
      "exp.bitmain.b3": "RAG knowledge base: end-to-end pipeline (6 formats, 10M+ chunks), bge-m3 dense/sparse/multi-vector hybrid retrieval + Rerank (recall 72%→91%, first-token <800ms), query rewriting + HyDE + multi-recall (+18% hit rate), RAGAS + 500-sample eval set.",
      "exp.bitmain.b4": "Token metering & billing: streaming real-time metering (<0.1% error, incl. Context Cache), Redis+Lua idempotent atomic deduction (3000 QPS, 100% ledger consistency), 48-model differential pricing + TPM/RPM dual rate limiting (600K TPM/120 RPM), <0.01% daily reconciliation error.",
      "exp.bitmain.b5": "Observability: OpenTelemetry LLM full-chain trace + custom dashboards (MTTR -60%), dual-channel content safety (keyword + model review, 99% injection blocking, <2% false positives), SLO + tiered alerting (99.9% availability).",
      "proj.title": "Projects",
      "proj.sub": "AI systems I designed, built, and shipped myself.",
      "proj.trade.name": "TradingAgents Multi-Agent Trading Framework",
      "proj.trade.period": "Jun 2026 – Present",
      "proj.trade.b1": "LangGraph state-graph pipeline: analysts → bull/bear debate → risk debate → portfolio manager, with conditional edges + counters driving debate rounds, shared-state indirect communication, and message cleanup to isolate context and prevent narrative contamination.",
      "proj.trade.b2": "Append-only two-phase decision log: decisions enter as pending, then the next run for the same ticker pulls realized returns and a Reflector backfills reflection — injected only into the portfolio manager, sedimenting experience within a bounded context window.",
      "proj.trade.b3": "Multi-provider data routing (yfinance/FRED/Polymarket/AlphaVantage) with tiered fallback + NO_DATA sentinels to block model fabrication; structured output degrades to free text on JSON corruption so the decision chain never blocks.",
      "proj.trade.b4": "ProviderSpec registry adapts 10+ OpenAI-compatible providers, per-ticker SQLite checkpoint recovery, and decouples roles/data sources into pluggable modules.",
      "proj.rag.name": "Enterprise Multimodal RAG Q&A System",
      "proj.rag.period": "Jan 2026 – May 2026",
      "proj.rag.b1": "Strategy + factory pattern DocumentReaderFactory routes multi-format parsers; custom PdfMultimodalProcessor extends PDFTextStripper to intercept Do operators and restore text/image reading order, with qwen3-vl converting images to semantic descriptions written back as image tags.",
      "proj.rag.b2": "Markdown heading-level splitter maintains a heading stack for cross-level fallback and links parent-child chunks via parentChunkId; dual-path index: ES ik-analyzer BM25 + PgVector HNSW dense vectors.",
      "proj.rag.b3": "Four query-rewrite strategies (decompose/enrich/diversify/step-back) with composable orchestration, LLM query routing by data source; ES + vector dual recall fused with RRF and re-ranked by gte-rerank-v2 to lift Top-K accuracy.",
      "proj.rag.b4": "Assembles a pluggable pipeline via RetrievalAugmentationAdvisor and integrates Neo4j GraphRAG for entity-relation retrieval, supporting multi-source collaborative Q&A.",
      "proj.doubao.name": "Enterprise General Agent Platform (Doubao-style)",
      "proj.doubao.period": "Feb 2026 – May 2026",
      "proj.doubao.b1": "BaseAgent base class unifies memory/timing/recommended questions and derives ReAct, Plan-Execute, and State-Machine agents; ContextCompactor two-layer compression (placeholders + LLM summary) controls long-conversation context bloat.",
      "proj.doubao.b2": "Deep research engine: Plan-Execute-Critique multi-round loop with order-tiered dependencies + parallel execution, Semaphore-controlled concurrency, CountDownLatch batch sync, and critique-driven iteration.",
      "proj.doubao.b3": "State-machine + strategy pattern PPT engine (INIT→…→SUCCESS), MySQL-persisted instance state for resume at any stage, AI image sourcing + Python-pptx/PptxGenJS dual-engine rendering.",
      "proj.doubao.b4": "Unified SSE protocol (thinking/text/reference/recommend), ThinkTagParser splits reasoning from answer; Redis + Redisson distributed lock for task de-dup + Pub/Sub cross-instance stop + TTL renewal.",
      "skill.title": "Skills",
      "skill.sub": "After the projects, here's what's in my AI-engineering toolbox.",
      "skill.lang": "Languages",
      "skill.framework": "Frameworks & Middleware",
      "skill.llm": "LLM / Agents",
      "skill.tools": "Tools",
      "edu.title": "Education",
      "edu.sub": "From civil engineering to computer science — an interdisciplinary journey.",
      "edu.bristol.school": "University of Bristol",
      "edu.bristol.degree": "M.S. in Computer Science",
      "edu.bristol.period": "2023 – 2024",
      "edu.csu.school": "Central South University",
      "edu.csu.degree": "B.S. in Civil Engineering",
      "edu.csu.period": "2018 – 2022",
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
