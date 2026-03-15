// 二次元背景管理器
class AnimeBackgroundManager {
  constructor() {
    this.backgrounds = [
      "/images/hero-images/t1.svg",
      "/images/hero-images/t2.svg",
      "/images/hero-images/t3.svg",
      "/images/hero-images/t4.svg",
      "/images/hero-images/t5.svg",
    ];

    this.currentIndex = 0;
    this.fallbackColor = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    this.init();
  }

  init() {
    this.preloadImages();
    this.setupErrorHandling();
    this.loadSavedSettings();
  }

  // 预加载图片
  preloadImages() {
    this.backgrounds.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  // 设置错误处理
  setupErrorHandling() {
    const bgLayer = document.querySelector(".anime-bg-layer");
    if (bgLayer) {
      bgLayer.addEventListener("error", () => {
        console.warn("背景图片加载失败，使用备用渐变背景");
        bgLayer.style.background = this.fallbackColor;
      });
    }
  }

  // 切换背景
  changeBackground(type) {
    const bgLayer = document.querySelector(".anime-bg-layer");
    if (!bgLayer) return;

    if (type === "random") {
      this.currentIndex = Math.floor(Math.random() * this.backgrounds.length);
    } else {
      const typeMap = {
        sakura: 0,
        city: 1,
        sunset: 2,
        ocean: 3,
        sky: 4,
      };
      this.currentIndex = typeMap[type] || 0;
    }

    const newBg = this.backgrounds[this.currentIndex];
    this.loadBackgroundWithFallback(bgLayer, newBg);
  }

  // 带错误处理的背景加载
  loadBackgroundWithFallback(element, imageSrc) {
    const img = new Image();

    img.onload = () => {
      element.style.backgroundImage = `url('${imageSrc}')`;
    };

    img.onerror = () => {
      console.warn(`背景图片 ${imageSrc} 加载失败`);
      element.style.background = this.fallbackColor;
    };

    img.src = imageSrc;
  }

  // 加载保存的设置
  loadSavedSettings() {
    const savedBgType = localStorage.getItem("anime-bg-type") || "random";
    const savedOpacity = localStorage.getItem("anime-bg-opacity") || "10";
    const savedParticles =
      localStorage.getItem("anime-particles-enabled") !== "false";

    // 应用背景
    this.changeBackground(savedBgType);

    // 应用透明度
    const bgLayer = document.querySelector(".anime-bg-layer");
    if (bgLayer) {
      bgLayer.style.opacity = parseInt(savedOpacity) / 100;
    }

    // 应用粒子设置
    const particlesContainer = document.querySelector(
      ".anime-particles-container",
    );
    if (particlesContainer) {
      particlesContainer.style.display = savedParticles ? "block" : "none";
    }
  }

  // 自动切换背景（可选功能）
  startAutoSwitch(interval = 30000) {
    setInterval(() => {
      this.changeBackground("random");
    }, interval);
  }
}

// 初始化背景管理器
document.addEventListener("DOMContentLoaded", () => {
  window.animeBackgroundManager = new AnimeBackgroundManager();

  // 可选：启用自动切换（每30秒）
  // window.animeBackgroundManager.startAutoSwitch();
});
