# Zhihao Meng · 个人主页

这是 Zhihao Meng 的个人网站，展示工作经历、项目、技能栈与教育背景，外加一个记录 AI 工程实践的小博客。
纯静态（HTML + CSS + JS，无构建步骤），托管在 GitHub Pages：<https://amengnew.github.io/person_website/>

## 特性

- 中英双语切换：导航栏右侧的语言按钮一键切换，选择保存在 localStorage
- 首屏猫咪双模式：默认是 CC0 授权的写实猫照片（Wikimedia Commons，已调色融入站点配色），圆角相框 + 指针视差；下方「3D / 照片」开关可切到 three.js 程序化 3D 猫头（可拖拽旋转、带惯性、眨眼/抖耳/喵叫，黑斑+橘斑+蓝眼按照片配色）。3D 不可用或未切换时回退照片，`prefers-reduced-motion` 下关闭动效
- GSAP / ScrollTrigger 滚动入场动画：依赖全部自托管（`assets/js/`），不依赖 CDN；`prefers-reduced-motion` 下自动跳过动画并直接显示内容
- 深色 / 浅色主题：写入 localStorage 的 `site-theme`，未设置时跟随系统偏好；各页面在 head 内联脚本里提前应用，避免深色模式闪白
- 博客：`blog.html` 列表页 + `blog/` 下三篇文章，文末带上一篇 / 下一篇导航
- SEO：每页 canonical、Open Graph、Twitter Card 与 JSON-LD（首页 Person、列表页 CollectionPage、文章页 BlogPosting），并附 `robots.txt` + `sitemap.xml`
- 响应式布局：桌面 / 平板 / 手机自适应，无框架、无打包工具

## 图片来源

首屏猫咪照片来自 Wikimedia Commons：**“Tabby cat with blue eyes”**（CC0 / 公有领域，作者见文件页），
已裁切调色用于首屏；OG 分享图亦使用同一张照片。CC0 不要求署名，此处仅作来源说明。

## 本地预览

i18n 文案是通过 `fetch()` 加载的，直接用 `file://` 打开会因跨域策略拿不到 JSON，请起一个本地静态服务器：

```bash
python3 -m http.server 8000
```

然后浏览器打开 <http://localhost:8000>。博客页在 <http://localhost:8000/blog.html>。

## 目录结构

```
.
├── index.html                     首页（Person JSON-LD、data-i18n 标注）
├── blog.html                      博客列表页（CollectionPage JSON-LD）
├── blog/
│   ├── agent-orchestration.html   Agent 编排引擎的设计思考（2026-10）
│   ├── rag-optimization.html      RAG 知识库的端到端优化（2026-09）
│   └── llm-tracing.html           LLM 全链路 Trace 实践（2026-08）
├── i18n/
│   ├── zh.json                    中文文案（UTF-8 with BOM）
│   └── en.json                    英文文案（UTF-8 with BOM）
├── assets/
│   ├── js/
│   │   ├── cat3d.js               首屏 3D 猫头（three.js 场景、拖拽旋转、眨眼/喵叫）
│   │   ├── three.min.js           three.js r128（3D 模式与 GLTF 备用）
│   │   ├── gsap.min.js            滚动入场动画
│   │   └── ScrollTrigger.min.js   GSAP 滚动触发器
│   ├── og-image.png               社交分享预览图（1200×630，供 og:image / twitter:image 使用）
│   └── neko.svg                   neko 吉祥物矢量图（备用素材）
├── favicon.svg                    站点图标
├── styles.css                     样式、主题变量、响应式与动画
├── script.js                      导航 / 主题 / 语言切换 / 项目弹窗 / 喵叫气泡
├── robots.txt                     允许全站抓取并指向 sitemap
├── sitemap.xml                    5 条 URL（首页、博客列表、3 篇文章）
├── .gitignore                     系统文件与本地临时产物
└── README.md
```

## 文案与 i18n

所有可翻译文案通过 `data-i18n` / `data-i18n-html` 标注，译文集中在 `i18n/zh.json` 与 `i18n/en.json`（脚本里不再有 I18N 字典）。`script.js` 的 `applyLang()` 拉到 JSON 后用 `textContent` / `innerHTML` 覆盖 HTML 里的中文兜底文本，所以：

- HTML 里先写中文，作为无 JS（或 JSON 加载失败）时的兜底显示；
- 增删文案时，`index.html`、`i18n/zh.json`、`i18n/en.json` 三处要一起改，key 一一对应；
- 两份 JSON 的 key 顺序保持一致，数字口径也必须与 HTML 兜底一致（例如 48 模型、3000 QPS、完成率 55%→86%、首字 <800ms、60 万 TPM / 120 RPM）；
- JSON 文件是 `utf-8-sig`（带 BOM）+ 2 空格缩进，编辑时别把 BOM 或缩进弄丢；
- 首屏的 `hero.stat*` / `hero.cta*` / `hero.catHint` 等 key 被首屏直接使用，不要删除。

## 内容维护

- 工作经历 / 项目卡片 / 技能栈 / 教育：对应 `index.html` 里的各个 `<section>`，增删后记得同步 i18n。
- 项目详情弹窗的文案（标题、周期、标签、要点）硬编码在 `script.js` 的 `projectData` 里，是中文的；改项目内容时两处都要看。
- 联系方式（GitHub、邮箱）在 `index.html` 的联系区域。
- 新增博客文章需要同步四处：`blog/*.html` 正文与元数据、`blog.html` 列表、文章间的上一篇 / 下一篇导航、`sitemap.xml`。

## SEO 说明

- `robots.txt` 允许全站抓取，并用绝对 URL 指向 sitemap（GitHub Pages 是子路径部署，必须写全 `https://amengnew.github.io/person_website/…`）。
- `sitemap.xml` 收录首页、`blog.html` 与三篇文章，带 `lastmod`。新增或更新博客时记得同步更新。
- 每个页面的 `<head>` 都有 `description`、`canonical`、Open Graph、Twitter Card；首页是 `Person`，博客列表是 `CollectionPage`，文章页是 `BlogPosting`（含 `datePublished` / `dateModified` / `author`）。
- 社交分享图统一用 `assets/og-image.png`（1200×630，绝对 URL），配合 `og:image:width/height` 与 `summary_large_image` 的 Twitter Card；站点图标是根目录的 `favicon.svg`。换图时同步替换这两处即可。
- 修改页面正文日期时，同时更新 `<time datetime="YYYY-MM-DD">`、JSON-LD 日期和 `sitemap.xml` 的 `lastmod`。

## 通过 GitHub Pages 部署

仓库已关联 <https://github.com/amengnew/person_website.git>，并在 GitHub Pages 中配置从 `main` 分支根目录部署。之后每次 `git push` 到 `main`，网站都会自动更新：

```
https://amengnew.github.io/person_website/
```

不需要构建步骤，也不用提交 `node_modules`——本站没有任何 npm 依赖。

## 技术构成

纯原生三件套 + 少量自托管库，无构建工具：

- `index.html`：页面结构、首屏猫咪肖像、`data-i18n` 双语标注、Person JSON-LD
- `blog.html` / `blog/*.html`：博客列表与文章页，各自带主题初始化脚本和结构化数据
- `styles.css`：设计变量（含深色主题）、响应式布局与动画
- `script.js`：语言切换、主题切换、导航与滚动高亮、项目弹窗、喵叫气泡、无障碍焦点管理
- `assets/`：`cat-hero.jpg/.webp`（首屏猫照片）、`og-image.png`、`neko.svg`、`js/cat-hero.js`
- `assets/js/`：GSAP 与 ScrollTrigger（本地托管，不依赖 CDN）

## .gitignore

只忽略不该进仓库的东西，保证 GitHub Pages 上永远是最新的静态文件：

- `.DS_Store`（macOS 系统文件）
- `outputs/`、`test_gen.png`（本地生成 / 临时产物）
- `node_modules/`、`*.log`（依赖与日志）

MIT License
