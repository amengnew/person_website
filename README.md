# neko 的个人空间

一只会写代码的猫 **neko** 的个人网站，用来介绍自己、展示学过的项目与技术栈。
纯静态（HTML + CSS + JS，无构建步骤），可直接托管在 GitHub Pages。

## 本地预览

在项目根目录启动一个简单的本地服务器：

```bash
python3 -m http.server 8000
```

然后浏览器打开 <http://localhost:8000>。

## 自定义内容

所有可编辑的位置都在 `index.html` 里用 `<!-- 编辑入口 -->` 标注了，按需修改即可：

- **自我介绍 / 标题**：hero 区的文字与小数据（年限、项目数等）
- **关于我**：个人简介、身份标签
- **学过的项目**：每个 `.project-card` 对应一个项目，增删自由
- **技能栈**：按类别分组的技能徽章
- **联系方式**：GitHub 地址、邮箱等

吉祥物是一只二次元风格的程序员猫咪，以 SVG 内联在首页（眼睛会眨、点击会“喵”），
独立副本存放在 `assets/neko.svg`。想换成自己的图片，把图片放进 `assets/`，
再把 hero 区的内联 SVG 替换成 `<img>` 即可。

## 通过 GitHub Pages 部署

1. 在 GitHub 上新建一个仓库（例如 `person_website`），**不要**勾选自动生成 README。
2. 在本地仓库关联远程并推送：

   ```bash
   git remote add origin https://github.com/<你的用户名>/person_website.git
   git branch -M main
   git push -u origin main
   ```

3. 打开仓库的 **Settings → Pages**。
4. 在 **Source** 里选择 `Deploy from a branch`，分支选 **main**、目录选 **/ (root)**，保存。
5. 等待 1~2 分钟，页面顶部会显示你的网址：

   ```
   https://<你的用户名>.github.io/person_website/
   ```

之后每次 `git push` 到 `main`，网站都会自动更新。

> 如果想把仓库直接命名为 `<你的用户名>.github.io`，则访问地址会是
> `https://<你的用户名>.github.io/`（没有仓库路径后缀）。

## 技术构成

纯原生三件套，无依赖、无打包工具：

- `index.html`：页面结构，内联 neko 吉祥物 SVG
- `styles.css`：样式、响应式布局与动画（眨眼、浮动、滚动入场）
- `script.js`：导航交互、滚动高亮、返回顶部等

MIT License
