// neko 个人空间 - 交互脚本
(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  var toTop = document.getElementById("toTop");
  var yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // 导航栏滚动阴影
  function onScrollNav() {
    if (window.scrollY > 12) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
    if (window.scrollY > 480) toTop.classList.add("show");
    else toTop.classList.remove("show");
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  // 移动端菜单开关
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

  // 返回顶部
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // 当前栏目高亮 + 滚动入场，依赖原生平滑滚动
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

    // 入场动画
    var revealTargets = document.querySelectorAll(
      ".about-card,.project-card,.skill-group,.contact-card,.stat"
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

  // 点击 neko 让它“喵”一声的小彩蛋
  var mascot = document.querySelector(".hero-mascot");
  if (mascot) {
    var svg = mascot.querySelector(".neko-svg");
    svg.style.cursor = "pointer";
    var meows = ["喵～", "喵呜！", "呼噜噜…", "喵(=^･ω･^=)"];
    svg.addEventListener("click", function () {
      var bubble = document.createElement("div");
      bubble.textContent = meows[Math.floor(Math.random() * meows.length)];
      Object.assign(bubble.style, {
        position: "absolute",
        top: "8px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#fff",
        border: "1.5px solid #f0dcc4",
        color: "#e07b2c",
        fontWeight: "700",
        padding: "6px 14px",
        borderRadius: "999px",
        boxShadow: "0 6px 18px rgba(120,80,40,.15)",
        fontSize: ".9rem",
        zIndex: "5",
        opacity: "0",
        transition: "opacity .25s, transform .25s",
      });
      mascot.style.position = "relative";
      mascot.appendChild(bubble);
      requestAnimationFrame(function () {
        bubble.style.opacity = "1";
        bubble.style.transform = "translateX(-50%) translateY(-6px)";
      });
      setTimeout(function () {
        bubble.style.opacity = "0";
        setTimeout(function () {
          if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
        }, 260);
      }, 1100);
    });
  }
})();
