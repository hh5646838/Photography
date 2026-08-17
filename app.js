/**
 * JoJo摄影展示站 - 纯前端版本
 * 数据驱动架构：所有内容从 config.json 加载
 */

// 全局配置数据
let config = {};

// 泡泡配置（与原始设计保持一致）
const BUBBLES = [
  { id: 'macro', label: '微距', size: 80, color: 'teal' },
  { id: 'blackwhite', label: '黑白', size: 96, color: 'purple' },
  { id: 'stilllife', label: '静物', size: 72, color: 'pink' },
  { id: 'animal', label: '动物', size: 88, color: 'teal' },
  { id: 'landscape', label: '风景', size: 80, color: 'purple' },
];

// 移动端和桌面端位置配置
const BUBBLE_POSITIONS = {
  mobile: [
    { x: 15, y: 15 },   // 左上 - 微距
    { x: 55, y: 12 },   // 右上 - 黑白
    { x: 12, y: 72 },   // 左下 - 静物
    { x: 58, y: 75 },   // 右下 - 动物
    { x: 38, y: 42 },   // 中间 - 风景
  ],
  desktop: [
    { x: 12, y: 18 },   // 左上
    { x: 75, y: 22 },   // 右上
    { x: 18, y: 62 },   // 左下
    { x: 75, y: 68 },   // 右下
    { x: 65, y: 55 },   // 中间偏右
  ]
};

// 初始化
async function init() {
  try {
    // 加载配置
    const response = await fetch('config.json');
    config = await response.json();

    // 初始化各个模块
    initStarBackground();
    initHero();
    initCarousel();
    initModules();
    initScrollIndicator();
  } catch (error) {
    console.error('加载配置失败:', error);
    showError('加载失败，请检查 config.json 文件');
  }
}

// 显示错误信息
function showError(message) {
  const hero = document.getElementById('hero');
  if (hero) {
    hero.innerHTML = `<div style="text-align:center;padding:2rem;color:#ff6b6b">${message}</div>`;
  }
}

// 初始化星空背景
function initStarBackground() {
  const container = document.getElementById('starBackground');
  if (!container) return;

  // 创建星星
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement('div');
    star.className = Math.random() > 0.9 ? 'star bright' : 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    container.appendChild(star);
  }

  // 创建流星
  for (let i = 0; i < 3; i++) {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    meteor.style.top = `${Math.random() * 50}%`;
    meteor.style.left = '0';
    meteor.style.animationDelay = `${i * 2}s`;
    container.appendChild(meteor);
  }
}

// 初始化 Hero 区域
function initHero() {
  // 设置头像
  const avatarImg = document.getElementById('avatarImg');
  if (avatarImg && config.avatar?.url) {
    avatarImg.src = config.avatar.url;
  }

  // 设置社交链接
  const link500px = document.getElementById('link500px');
  const linkBilibili = document.getElementById('linkBilibili');

  if (link500px && config.avatar?.link500px) {
    link500px.href = config.avatar.link500px;
  }
  if (linkBilibili && config.avatar?.linkBilibili) {
    linkBilibili.href = config.avatar.linkBilibili;
  }

  // 初始化泡泡导航
  initBubbleNav();
}

// 初始化泡泡导航
function initBubbleNav() {
  const container = document.getElementById('bubbleNav');
  if (!container) return;

  const isMobile = window.innerWidth < 768;
  const positions = isMobile ? BUBBLE_POSITIONS.mobile : BUBBLE_POSITIONS.desktop;

  BUBBLES.forEach((bubble, index) => {
    const btn = document.createElement('button');
    btn.className = `bubble ${bubble.color}`;
    btn.textContent = bubble.label;
    btn.style.cssText = `
      left: ${positions[index].x}%;
      top: ${positions[index].y}%;
      width: ${bubble.size}px;
      height: ${bubble.size}px;
      animation-delay: ${index * 1}s;
    `;
    btn.addEventListener('click', () => openGallery(bubble.id));
    container.appendChild(btn);
  });
}

// 初始化轮播图
let currentSlide = 0;
let carouselInterval;

function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const indicators = document.getElementById('carouselIndicators');

  if (!track || !config.carousel?.images) return;

  // 创建轮播项
  config.carousel.images.forEach((image, index) => {
    const item = document.createElement('div');
    item.className = 'carousel-item';
    item.innerHTML = `
      <img src="${image.url}" alt="${image.title}" loading="lazy">
      <div class="carousel-info">
        <h3>${image.title}</h3>
        <p>${image.description}</p>
      </div>
    `;
    track.appendChild(item);

    // 创建指示器
    const indicator = document.createElement('button');
    indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
    indicator.addEventListener('click', () => goToSlide(index));
    indicators.appendChild(indicator);
  });

  // 自动播放
  const interval = config.carousel.autoPlayInterval || 5000;
  startCarousel(interval);

  // 触摸滑动支持
  let startX = 0;
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }, { passive: true });
}

function goToSlide(index) {
  const track = document.getElementById('carouselTrack');
  const indicators = document.querySelectorAll('.indicator');
  const items = track.querySelectorAll('.carousel-item');

  if (!items.length) return;

  currentSlide = index;
  if (currentSlide >= items.length) currentSlide = 0;
  if (currentSlide < 0) currentSlide = items.length - 1;

  items[currentSlide].scrollIntoView({ behavior: 'smooth', inline: 'center' });

  indicators.forEach((ind, i) => {
    ind.classList.toggle('active', i === currentSlide);
  });
}

function nextSlide() {
  goToSlide(currentSlide + 1);
}

function prevSlide() {
  goToSlide(currentSlide - 1);
}

function startCarousel(interval) {
  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = setInterval(nextSlide, interval);
}

// 初始化模块网格
let currentCategory = 'type';

function initModules() {
  // 分类切换按钮
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderModules();
    });
  });

  renderModules();
}

function renderModules() {
  const grid = document.getElementById('moduleGrid');
  if (!grid || !config.modules) return;

  const modules = currentCategory === 'type'
    ? config.modules.byType
    : config.modules.byDevice;

  grid.innerHTML = '';

  modules.forEach(module => {
    const card = document.createElement('div');
    card.className = 'module-card';
    card.addEventListener('click', () => openGallery(module.id));

    const coverHtml = module.coverUrl
      ? `<img src="${module.coverUrl}" alt="${module.name}" loading="lazy">`
      : `<span class="module-placeholder">${module.name[0]}</span>`;

    card.innerHTML = `
      <div class="module-cover">${coverHtml}</div>
      <div class="module-info">
        <h3>${module.name}</h3>
        <p>${module.description || ''}</p>
      </div>
    `;

    grid.appendChild(card);
  });
}

// 初始化滚动指示器
function initScrollIndicator() {
  const indicator = document.getElementById('scrollIndicator');
  if (!indicator) return;

  indicator.addEventListener('click', () => {
    document.getElementById('carousel').scrollIntoView({ behavior: 'smooth' });
  });

  // 滚动时隐藏指示器
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      indicator.style.opacity = '0';
    } else {
      indicator.style.opacity = '1';
    }
  }, { passive: true });
}

// 打开图库弹窗
function openGallery(moduleId) {
  const modal = document.getElementById('galleryModal');
  const grid = document.getElementById('galleryGrid');
  const title = document.getElementById('modalTitle');
  const subtitle = document.getElementById('modalSubtitle');

  if (!modal || !config.gallery?.items) return;

  // 过滤图片
  const photos = config.gallery.items.filter(item =>
    item.tags?.includes(moduleId)
  );

  // 获取模块名称
  let moduleName = moduleId;
  const allModules = [...(config.modules?.byType || []), ...(config.modules?.byDevice || [])];
  const module = allModules.find(m => m.id === moduleId);
  if (module) {
    moduleName = module.name;
  }

  title.textContent = `${moduleName}作品`;
  subtitle.textContent = `共 ${photos.length} 张作品`;

  grid.innerHTML = '';
  photos.forEach(photo => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `<img src="${photo.thumbnailUrl}" alt="${photo.title}" loading="lazy">`;
    item.addEventListener('click', () => openPhoto(photo));
    grid.appendChild(item);
  });

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 关闭图库弹窗
function closeGallery() {
  const modal = document.getElementById('galleryModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// 打开图片详情
function openPhoto(photo) {
  const modal = document.getElementById('photoModal');
  const img = document.getElementById('photoImage');
  const title = document.getElementById('photoTitle');
  const desc = document.getElementById('photoDescription');
  const exif = document.getElementById('photoExif');
  const tags = document.getElementById('photoTags');

  if (!modal) return;

  img.src = photo.originalUrl || photo.thumbnailUrl;
  title.textContent = photo.title || '';
  desc.textContent = photo.description || '';

  // EXIF 信息
  if (photo.exif) {
    const exifHtml = Object.entries(photo.exif).map(([key, value]) => `
      <div class="exif-item">
        <span class="exif-label">${getExifLabel(key)}</span>
        <span class="exif-value">${value}</span>
      </div>
    `).join('');
    exif.innerHTML = exifHtml;
  } else {
    exif.innerHTML = '';
  }

  // 标签
  if (photo.tags) {
    const tagsHtml = photo.tags.map(tag => {
      const module = [...(config.modules?.byType || []), ...(config.modules?.byDevice || [])]
        .find(m => m.id === tag);
      return `<span class="photo-tag">${module?.name || tag}</span>`;
    }).join('');
    tags.innerHTML = tagsHtml;
  } else {
    tags.innerHTML = '';
  }

  modal.classList.add('active');
}

// 关闭图片详情
function closePhoto() {
  const modal = document.getElementById('photoModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// EXIF 标签翻译
function getExifLabel(key) {
  const labels = {
    aperture: '光圈',
    shutterSpeed: '快门',
    iso: 'ISO',
    focalLength: '焦距',
    camera: '相机',
    lens: '镜头'
  };
  return labels[key] || key;
}

// 弹窗事件监听
document.addEventListener('DOMContentLoaded', () => {
  // 关闭按钮
  document.getElementById('modalClose')?.addEventListener('click', closeGallery);
  document.getElementById('modalOverlay')?.addEventListener('click', closeGallery);
  document.getElementById('photoClose')?.addEventListener('click', closePhoto);
  document.getElementById('photoOverlay')?.addEventListener('click', closePhoto);

  // ESC 键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePhoto();
      closeGallery();
    }
  });

  // 初始化
  init();
});

// 窗口大小改变时重新计算泡泡位置
window.addEventListener('resize', () => {
  const container = document.getElementById('bubbleNav');
  if (container) {
    container.innerHTML = '';
    initBubbleNav();
  }
});
