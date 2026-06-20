# Zhihao Meng · 个人主页

这是 Zhihao Meng 的个人网站，展示工作经历、项目、技能栈与教育背景。
纯静态（HTML + CSS + JS，无构建步骤），托管在 GitHub Pages。
网站保留着 neko 猫咪吉祥物（眼睛会眨、点击会"喵"），并支持中英双语切换。

## 特性

- 中英双语切换：导航栏右侧的语言按钮一键切换，选择会保存在 localStorage
- 真实简历内容：工作经历（比特大陆）、项目经历、技能栈、教育经历
- neko 吉祥物 SVG：眨眼、浮动动画，点击"喵"一声的小彩蛋
- 响应式布局：桌面 / 平板 / 手机自适应
- 纯原生三件套，无依赖、无打包工具

## 本地预览

在项目根目录启动一个简单的本地服务器：

```bash
python3 -m http.server 8000
```

然后浏览器打开 http://localhost:8000。

## 自定义内容

所有可翻译文案通过 data-i18n / data-i18n-html 标注，译文集中在 script.js 的 I18N 字典（zh 与 en 两个对象）里，修改即可。HTML 中默认写的是中文，作为无 JS 时的兜底显示。

- 工作 / 项目 / 技能 / 教育：对应 index.html 里的各个 section，增删自由。
- 联系方式：GitHub、邮箱、电话在联系区域。
- 自我介绍 / 数据：hero 区的文字与统计数据。

吉祥物是一只二次元风格的程序员猫咪，以 SVG 内联在首页，独立副本存放在 assets/neko.svg。想换成自己的图片，把图片放进 assets/，再把 hero 区的内联 SVG 替换成 img 即可。

## 通过 GitHub Pages 部署

仓库已关联 https://github.com/amengnew/person_website.git，并在 GitHub Pages 中配置从 main 分支根目录部署。之后每次 git push 到 main，网站都会自动更新：

```
https://amengnew.github.io/person_website/
```

## 技术构成

纯原生三件套，无依赖、无打包工具：

- index.html：页面结构，内联 neko 吉祥物 SVG，data-i18n 双语标注
- styles.css：样式、响应式布局与动画（眨眼、浮动、滚动入场）
- script.js：导航交互、滚动高亮、返回顶部、中英双语切换

MIT License
