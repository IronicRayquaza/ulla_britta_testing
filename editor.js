const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
let originalImage = null;
let offscreenCanvas = document.createElement('canvas');
let offscreenCtx = offscreenCanvas.getContext('2d');

let drawHistory = [];
let currentTool = 'pan';
let isDrawing = false;
let startX = 0, startY = 0;

let viewport = { zoom: 1, offsetX: 0, offsetY: 0, isPanning: false, lastX: 0, lastY: 0, initialized: false };

let state = {
  platform: 'default',
  transform: 'flat', // 'flat', 'left', 'right'
  bgCategory: 'gradients',
  bgIndex: 0,
  bgType: 'gradient',
  bgValue: { style: 'linear', colors: ['#f6d365', '#fda085'], angle: 135 },
  bgImageObj: null,
  frame: 'none',
  padding: 60,
  offsetX: 0,
  offsetY: 0,
  scaleImage: 100,
  radius: 16,
  shadow: 40,
  color: '#000000',
  size: 4,
  textLayers: [],
  selectedTextIndex: -1,
  annotations: []
};

const shadowPresets = {
  'none': { blur: 0, x: 0, y: 0 },
  'subtle': { blur: 4, x: 2, y: 2 },
  'soft': { blur: 10, x: 0, y: 0 },
  'sharp': { blur: 0, x: 4, y: 4 },
  'floating': { blur: 15, x: 5, y: 10 },
  'hard': { blur: 1, x: 2, y: 2 },
  'deep': { blur: 20, x: 10, y: 15 },
  'retro': { blur: 0, x: -6, y: 6 },
  'double': { blur: 2, x: 4, y: -4 },
  'neon': { blur: 15, x: 0, y: 0 }
};

const patternCache = {};

const platforms = {
  'default': null,
  'linkedin': { width: 1200, height: 627 },
  'dribbble': { width: 1600, height: 1200 },
  'behance': { width: 1920, height: 1080 },
  'x': { width: 1200, height: 675 },
  'ig-square': { width: 1080, height: 1080 },
  'ig-portrait': { width: 1080, height: 1350 },
  'facebook': { width: 1200, height: 630 }
};

const bgCollections = {
  gradients: [
    { type: 'gradient', name: 'Dawn', value: { style: 'linear', colors: ['#f6d365', '#fda085'], angle: 135 } },
    { type: 'gradient', name: 'Aurora', value: { style: 'mesh', colors: ['#0f2027', '#ff0055', '#0055ff', '#00ff55'] } },
    { type: 'gradient', name: 'Cosmic', value: { style: 'radial', colors: ['#1a0b2e', '#4b1d52', '#e53935'] } },
    { type: 'gradient', name: 'Retro', value: { style: 'conic', colors: ['#f83600', '#f9d423', '#f83600'] } },
    { type: 'gradient', name: 'Ocean', value: { style: 'linear', colors: ['#4facfe', '#00f2fe'], angle: 135 } },
    { type: 'gradient', name: 'Pearl', value: { style: 'radial', colors: ['#fdfbfb', '#ebedee'] } },
    { type: 'gradient', name: 'Angular', value: { style: 'conic', colors: ['#30CFD0', '#330867', '#30CFD0'] } },
    { type: 'gradient', name: 'Candy', value: { style: 'mesh', colors: ['#ff9a9e', '#fecfef', '#a1c4fd', '#c2e9fb'] } },
    { type: 'gradient', name: 'Midnight', value: { style: 'radial', colors: ['#0f2027', '#2c5364'] } },
    { type: 'gradient', name: 'Inferno', value: { style: 'mesh', colors: ['#120A0A', '#FF4500', '#FF8C00', '#FFD700'] } },
    { type: 'gradient', name: 'Steel', value: { style: 'conic', colors: ['#8e9eab', '#eef2f3', '#8e9eab'] } },
    { type: 'gradient', name: 'Vapor', value: { style: 'linear', colors: ['#a18cd1', '#fbc2eb'], angle: 45 } },
    { type: 'gradient', name: 'Frost', value: { style: 'mesh', colors: ['#E0EAFC', '#CFDEF3', '#A1C4FD', '#C2E9FB'] } },
    { type: 'gradient', name: 'Sunrise', value: { style: 'radial', colors: ['#ff512f', '#f09819'] } },
    { type: 'gradient', name: 'Emerald', value: { style: 'linear', colors: ['#0ba360', '#3cba92'], angle: 135 } },
    { type: 'gradient', name: 'Neon', value: { style: 'linear', colors: ['#00F260', '#0575E6'], angle: 90 } },
    { type: 'gradient', name: 'Cherry', value: { style: 'radial', colors: ['#eb3349', '#f45c43'] } },
    { type: 'gradient', name: 'Lush', value: { style: 'mesh', colors: ['#56ab2f', '#a8e063', '#2b580c', '#fce205'] } },
    { type: 'gradient', name: 'Golden', value: { style: 'conic', colors: ['#ffd700', '#ff8c00', '#ffd700'] } },
    { type: 'gradient', name: 'Abyss', value: { style: 'linear', colors: ['#000000', '#434343'], angle: 180 } },
    { type: 'gradient', name: 'Flare', value: { style: 'mesh', colors: ['#f12711', '#f5af19', '#ffffff', '#ff4b1f'] } },
    { type: 'gradient', name: 'Muted', value: { style: 'radial', colors: ['#ECE9E6', '#FFFFFF'] } },
    { type: 'gradient', name: 'Tropical', value: { style: 'linear', colors: ['#11998e', '#38ef7d'], angle: 45 } },
    { type: 'gradient', name: 'Purple Rain', value: { style: 'conic', colors: ['#cc2b5e', '#753a88', '#cc2b5e'] } },
    { type: 'gradient', name: 'Peachy', value: { style: 'mesh', colors: ['#ed4264', '#ffedbc', '#ff9a9e', '#fecfef'] } },
    { type: 'gradient', name: 'Matrix', value: { style: 'linear', colors: ['#000000', '#0f9b0f'], angle: 135 } },
    { type: 'gradient', name: 'Silver', value: { style: 'radial', colors: ['#bdc3c7', '#2c3e50'] } },
    { type: 'gradient', name: 'Electric', value: { style: 'conic', colors: ['#4facfe', '#f093fb', '#4facfe'] } },
    { type: 'gradient', name: 'Sunset', value: { style: 'linear', colors: ['#fe8c00', '#f83600'], angle: 180 } },
    { type: 'gradient', name: 'Galaxy', value: { style: 'mesh', colors: ['#3A1C71', '#D76D77', '#FFAF7B', '#8E2DE2'] } },
    { type: 'gradient', name: 'Holographic', value: { style: 'mesh', colors: ['#fdfbfb', '#a1c4fd', '#fbc2eb', '#ffffff'] } },
    { type: 'gradient', name: 'Cyberpunk', value: { style: 'mesh', colors: ['#000000', '#ff0055', '#3300ff', '#00ffd5'] } },
    { type: 'gradient', name: 'Synthwave', value: { style: 'linear', colors: ['#2e026d', '#bc13fe', '#ff4545'], angle: 180 } },
    { type: 'gradient', name: 'Deep Sea', value: { style: 'radial', colors: ['#014f86', '#012a4a', '#89c2d9'] } },
    { type: 'gradient', name: 'Aurora', value: { style: 'mesh', colors: ['#000000', '#00ff55', '#0055ff', '#ff0055'] } },
    { type: 'gradient', name: 'Golden Hour', value: { style: 'conic', colors: ['#ff9966', '#ff5e62', '#ffd700'] } },
    { type: 'gradient', name: 'Magma', value: { style: 'mesh', colors: ['#121212', '#8b0000', '#ff4500', '#2d2d2d'] } },
    { type: 'gradient', name: 'Pastel Dream', value: { style: 'mesh', colors: ['#ff9a9e', '#fecfef', '#a1c4fd', '#e0f0ff'] } },
    { type: 'gradient', name: 'Midnight City', value: { style: 'linear', colors: ['#232526', '#414345', '#00d2ff'], angle: 45 } },
    { type: 'gradient', name: 'Black Hole', value: { style: 'radial', colors: ['#000000', '#1a1a1a', '#ff0000'] } }
  ],
  solid: [
    { type: 'transparent', name: 'Trans', value: [] },
    { type: 'solid', name: 'White', value: ['#ffffff'] },
    { type: 'solid', name: 'Alabaster', value: ['#fafafa'] },
    { type: 'solid', name: 'Space Gray', value: ['#1E1E1E'] },
    { type: 'solid', name: 'Obsidian', value: ['#0a0a0a'] },
    { type: 'solid', name: 'Slate Night', value: ['#0F172A'] },
    { type: 'solid', name: 'Midnight', value: ['#0A2540'] },
    { type: 'solid', name: 'Indigo', value: ['#3F0071'] },
    { type: 'solid', name: 'Plum Noir', value: ['#4A0E4E'] },
    { type: 'solid', name: 'Wine', value: ['#720026'] },
    { type: 'solid', name: 'Forest', value: ['#2D6A4F'] },
    { type: 'solid', name: 'Teal', value: ['#008080'] },
    { type: 'solid', name: 'Electric', value: ['#007BFF'] },
    { type: 'solid', name: 'Neon Pink', value: ['#FF007F'] },
    { type: 'solid', name: 'Terracotta', value: ['#E07A5F'] },
    { type: 'solid', name: 'Mustard', value: ['#F4A261'] },
    { type: 'solid', name: 'Pistachio', value: ['#81B29A'] },
    { type: 'solid', name: 'Mint Flow', value: ['#84DCC6'] },
    { type: 'solid', name: 'Pastel Blue', value: ['#BDE0FE'] },
    { type: 'solid', name: 'Lavender', value: ['#CDB4DB'] },
    { type: 'solid', name: 'Rose Gold', value: ['#FFC8DD'] },
    { type: 'solid', name: 'Soft Peach', value: ['#FFD6A5'] }
  ],
  patterns: [
    { type: 'pattern', name: 'Abstract Circles', value: 'assets/abstract-circles.png' },
    { type: 'pattern', name: 'Abstract Fluid', value: 'assets/abstract-fluid.jpg' },
    { type: 'pattern', name: 'Abstract Lines', value: 'assets/abstract-lines.jpg' },
    { type: 'pattern', name: 'Abstract Shapes', value: 'assets/abstract-shapes.jpg' },
    { type: 'pattern', name: 'Abstract', value: 'assets/abstract.png' },
    { type: 'pattern', name: 'Abstract 2', value: 'assets/abstract2.jpg' },
    { type: 'pattern', name: 'Black Abstract', value: 'assets/black-abstract.jpg' },
    { type: 'pattern', name: 'Black Abstract 2', value: 'assets/black-abstract2.jpg' },
    { type: 'pattern', name: 'Black Abstract 3', value: 'assets/black-abstract3.jpg' },
    { type: 'pattern', name: 'Black Rectangles', value: 'assets/black-rectangles.jpg' },
    { type: 'pattern', name: 'Black White 1', value: 'assets/black-white-1.png' },
    { type: 'pattern', name: 'Black White 2', value: 'assets/black-white-2.png' },
    { type: 'pattern', name: 'Blue Wave', value: 'assets/blue-wave.jpg' },
    { type: 'pattern', name: 'Circles', value: 'assets/circles.jpg' },
    { type: 'pattern', name: 'Colored Fluid', value: 'assets/colored-fluid.png' },
    { type: 'pattern', name: 'Dark Waves', value: 'assets/dark-waves.png' },
    { type: 'pattern', name: 'Mesh Lines', value: 'assets/mesh-lines.png' },
    { type: 'pattern', name: 'Orange Sheets', value: 'assets/orange-sheets.jpg' },
    { type: 'pattern', name: 'Shiny Glass', value: 'assets/shiny-glass.jpg' },
    { type: 'pattern', name: 'Silk Waves', value: 'assets/silk-waves.png' },
    { type: 'pattern', name: 'Waves 1', value: 'assets/waves1.jpg' },
    { type: 'pattern', name: 'Waves 2', value: 'assets/waves2.jpg' }
  ]
};

function initUI() {
  renderBackgroundPresets();

  document.getElementById('platform-select').addEventListener('change', (e) => {
    state.platform = e.target.value;
    render();
  });

  document.getElementById('bg-category-select').value = state.bgCategory;
  document.getElementById('bg-category-select').addEventListener('change', (e) => {
    state.bgCategory = e.target.value;
    const isImage = state.bgCategory === 'image';
    const isSolid = state.bgCategory === 'solid';

    document.getElementById('bg-presets').style.display = isImage ? 'none' : 'grid';
    document.getElementById('bg-upload-container').style.display = isImage ? 'block' : 'none';
    document.getElementById('solid-color-container').style.display = isSolid ? 'block' : 'none';

    if (!isImage) {
      state.bgIndex = 0;
      applyBackgroundSelection();
      renderBackgroundPresets();
    }
    render();
  });

  document.getElementById('bg-custom-color').addEventListener('input', (e) => {
    state.bgType = 'solid';
    state.bgValue = [e.target.value];
    // Remove active state from presets
    document.querySelectorAll('.bg-preset').forEach(el => el.classList.remove('active'));
    render();
  });

  document.getElementById('btn-upload-bg').addEventListener('click', () => {
    document.getElementById('input-upload-bg').click();
  });

  document.getElementById('input-upload-bg').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          state.bgImageObj = img;
          state.bgType = 'image';
          render();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('transform-toggle').addEventListener('click', (e) => {
    if (e.target.classList.contains('segment-btn')) {
      document.querySelectorAll('#transform-toggle .segment-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.transform = e.target.dataset.value;
      render();
    }
  });

  document.getElementById('frame-toggle').addEventListener('click', (e) => {
    if (e.target.classList.contains('segment-btn')) {
      document.querySelectorAll('#frame-toggle .segment-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.frame = e.target.dataset.value;
      render();
    }
  });

  ['padding', 'radius', 'shadow', 'offsetX', 'offsetY', 'scaleImage', 'textSize'].forEach(param => {
    const input = document.getElementById(`param-${param}`);
    if (!input) return;
    input.addEventListener('input', (e) => {
      state[param] = parseInt(e.target.value);
      let suffix = 'px';
      if (param === 'shadow' || param === 'offsetX' || param === 'offsetY' || param === 'scaleImage') suffix = '%';
      if (param === 'textSize') suffix = 'px';

      const label = document.getElementById(`val-${param}`);
      if (label) label.textContent = state[param] + suffix;

      if (param === 'textSize') {
        const layer = state.textLayers[state.selectedTextIndex];
        if (layer) layer.size = state.textSize;
      }

      render();
    });
  });

  function syncTextUI() {
    const layer = state.textLayers[state.selectedTextIndex];
    if (!layer) return;

    document.getElementById('param-text-content').value = layer.text;
    document.getElementById('param-text-font').value = layer.font;
    document.getElementById('param-textSize').value = layer.size;
    document.getElementById('val-textSize').textContent = layer.size + 'px';
    document.getElementById('param-text-color').value = layer.color || '#000000';
    // Shadows
    document.getElementById('param-text-shadow-color').value = layer.shadowColor || '#000000';
    document.querySelectorAll('.shadow-item').forEach(b => {
      b.classList.toggle('active', b.dataset.value === layer.shadowType);
    });

    state.textSize = layer.size;

    // Presets
    document.querySelectorAll('#param-text-preset .segment-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.value === layer.preset);
    });

    // Depth
    document.querySelectorAll('#param-text-depth .segment-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.value === layer.depth);
    });
  }

  document.getElementById('param-text-color').addEventListener('input', (e) => {
    const layer = state.textLayers[state.selectedTextIndex];
    if (layer) { layer.color = e.target.value; render(); }
  });

  document.getElementById('param-text-shadow-grid').addEventListener('click', (e) => {
    if (e.target.classList.contains('shadow-item')) {
      const layer = state.textLayers[state.selectedTextIndex];
      if (layer) {
        layer.shadowType = e.target.dataset.value;
        syncTextUI();
        render();
      }
    }
  });

  document.getElementById('param-text-shadow-color').addEventListener('input', (e) => {
    const layer = state.textLayers[state.selectedTextIndex];
    if (layer) { layer.shadowColor = e.target.value; render(); }
  });

  document.getElementById('param-text-content').addEventListener('input', (e) => {
    const layer = state.textLayers[state.selectedTextIndex];
    if (layer) { layer.text = e.target.value; render(); }
  });

  document.getElementById('param-text-font').addEventListener('change', (e) => {
    const layer = state.textLayers[state.selectedTextIndex];
    if (layer) {
      layer.font = e.target.value;
      // Ensure font is loaded before rendering
      document.fonts.load(`1em ${layer.font}`).then(() => {
        render();
      });
    }
  });

  document.getElementById('param-text-preset').addEventListener('click', (e) => {
    if (e.target.classList.contains('segment-btn')) {
      const layer = state.textLayers[state.selectedTextIndex];
      if (layer) {
        layer.preset = e.target.dataset.value;
        if (layer.preset === 'header') layer.size = 80;
        else if (layer.preset === 'sub') layer.size = 40;
        else if (layer.preset === 'caption') layer.size = 20;
        syncTextUI();
        render();
      }
    }
  });

  document.getElementById('param-text-depth').addEventListener('click', (e) => {
    if (e.target.classList.contains('segment-btn')) {
      const layer = state.textLayers[state.selectedTextIndex];
      if (layer) {
        layer.depth = e.target.dataset.value;
        syncTextUI();
        render();
      }
    }
  });

  function setTool(tool) {
    document.querySelectorAll('.top-toolbar .tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`tool-${tool}`);
    if (btn) btn.classList.add('active');
    currentTool = tool;
    document.querySelector('.canvas-wrapper').style.pointerEvents = (tool === 'pan') ? 'none' : 'auto';
  }

  document.getElementById('btn-add-text').addEventListener('click', () => {
    const defaultFont = "'Geist', sans-serif";
    state.textLayers.push({
      text: 'New Text', 
      font: defaultFont, 
      preset: 'sub', 
      size: 40, 
      depth: 'off', 
      x: 50, 
      y: 50, 
      color: state.color || '#000000', 
      shadowType: 'subtle', 
      shadowColor: '#000000',
      rect: null
    });
    state.selectedTextIndex = state.textLayers.length - 1;
    setTool('text');
    syncTextUI();
    document.fonts.load(`1em ${defaultFont}`).then(() => {
      render();
    });
  });

  document.getElementById('btn-delete-text').addEventListener('click', () => {
    if (state.textLayers.length > 0) {
      state.textLayers.splice(state.selectedTextIndex, 1);
      state.selectedTextIndex = Math.max(-1, state.textLayers.length - 1);
      syncTextUI();
      render();
    }
  });

  document.getElementById('param-color').addEventListener('input', e => {
    state.color = e.target.value;
    render();
  });
  document.getElementById('param-size').addEventListener('input', e => state.size = parseInt(e.target.value));

  ['pan', 'draw', 'rect', 'arrow', 'text'].forEach(tool => {
    document.getElementById(`tool-${tool}`).addEventListener('click', () => setTool(tool));
  });

  syncTextUI();
  setTool('pan');

  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-export').addEventListener('click', exportImage);

  initViewport();
}

function initViewport() {
  const mainArea = document.querySelector('.main-area');

  document.getElementById('btn-zoom-in').addEventListener('click', () => { viewport.zoom = Math.min(5, viewport.zoom + 0.1); updateViewport(); });
  document.getElementById('btn-zoom-out').addEventListener('click', () => { viewport.zoom = Math.max(0.1, viewport.zoom - 0.1); updateViewport(); });
  document.getElementById('btn-zoom-fit').addEventListener('click', fitToScreen);

  let isSpaceDown = false;
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && !isSpaceDown && document.activeElement.tagName !== 'INPUT') {
      isSpaceDown = true;
      mainArea.classList.add('panning');
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'Space') {
      isSpaceDown = false;
      if (!viewport.isPanning) mainArea.classList.remove('panning');
    }
  });

  mainArea.addEventListener('mousedown', e => {
    if (isSpaceDown || e.button === 1 || e.target === mainArea || currentTool === 'pan') {
      viewport.isPanning = true;
      viewport.lastX = e.clientX;
      viewport.lastY = e.clientY;
      mainArea.classList.add('panning');
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', e => {
    if (viewport.isPanning) {
      viewport.offsetX += e.clientX - viewport.lastX;
      viewport.offsetY += e.clientY - viewport.lastY;
      viewport.lastX = e.clientX;
      viewport.lastY = e.clientY;
      updateViewport();
    }
  });

  window.addEventListener('mouseup', e => {
    if (viewport.isPanning) {
      viewport.isPanning = false;
      if (!isSpaceDown) mainArea.classList.remove('panning');
    }
  });

  mainArea.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = mainArea.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomIntensity = 0.005;
      const delta = -e.deltaY * zoomIntensity;
      const newZoom = Math.min(Math.max(0.05, viewport.zoom + delta), 5);

      const scaleRatio = newZoom / viewport.zoom;
      viewport.offsetX = mouseX - (mouseX - viewport.offsetX) * scaleRatio;
      viewport.offsetY = mouseY - (mouseY - viewport.offsetY) * scaleRatio;
      viewport.zoom = newZoom;

      updateViewport();
    } else {
      viewport.offsetX -= e.deltaX;
      viewport.offsetY -= e.deltaY;
      updateViewport();
    }
  }, { passive: false });
}

function fitToScreen() {
  const mainArea = document.querySelector('.main-area');
  const rect = mainArea.getBoundingClientRect();
  const padding = 60;
  const availW = rect.width - padding * 2;
  const availH = rect.height - padding * 2;

  const scaleW = availW / canvas.width;
  const scaleH = availH / canvas.height;

  viewport.zoom = Math.min(scaleW, scaleH, 1);
  if (viewport.zoom <= 0) viewport.zoom = 1;
  viewport.offsetX = (rect.width - canvas.width * viewport.zoom) / 2;
  viewport.offsetY = (rect.height - canvas.height * viewport.zoom) / 2;

  updateViewport();
}

function updateViewport() {
  const wrapper = document.querySelector('.canvas-wrapper');
  wrapper.style.transform = `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.zoom})`;
  document.getElementById('zoom-val').textContent = Math.round(viewport.zoom * 100) + '%';
}

function renderBackgroundPresets() {
  const container = document.getElementById('bg-presets');
  container.innerHTML = '';
  const items = bgCollections[state.bgCategory];
  if (!items) return;

  items.forEach((bg, index) => {
    const div = document.createElement('div');
    div.className = 'bg-preset' + (index === state.bgIndex ? ' active' : '');

    if (bg.type === 'gradient') {
      const cls = bg.value.colors;
      if (bg.value.style === 'linear') {
        div.style.background = `linear-gradient(${bg.value.angle || 135}deg, ${cls.join(', ')})`;
      } else if (bg.value.style === 'radial') {
        div.style.background = `radial-gradient(circle, ${cls.join(', ')})`;
      } else if (bg.value.style === 'conic') {
        div.style.background = `conic-gradient(${cls.join(', ')})`;
      } else if (bg.value.style === 'mesh') {
        div.style.background = `radial-gradient(at 0% 0%, ${cls[1]} 0px, transparent 70%),
                                radial-gradient(at 100% 100%, ${cls[2]} 0px, transparent 70%),
                                radial-gradient(at 0% 100%, ${cls[3] || cls[1]} 0px, transparent 70%),
                                ${cls[0]}`;
      }
    } else if (bg.type === 'solid') {
      if (bg.value.length === 0) {
        div.style.background = 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 50% / 10px 10px';
      } else {
        div.style.background = bg.value[0];
        if (bg.value[0] === '#ffffff') div.style.border = '1px solid #e5e5e5';
      }
    } else if (bg.type === 'pattern') {
      if (bg.value.includes('.')) {
        div.style.backgroundImage = `url("${bg.value}")`;
        div.style.backgroundSize = 'cover';
        div.style.backgroundPosition = 'center';
      }
    }

    div.addEventListener('click', () => {
      document.querySelectorAll('.bg-preset').forEach(el => el.classList.remove('active'));
      div.classList.add('active');
      state.bgIndex = index;
      applyBackgroundSelection();
      render();
    });
    container.appendChild(div);
  });
}

function applyBackgroundSelection() {
  const items = bgCollections[state.bgCategory];
  if (!items) return;
  const bg = items[state.bgIndex];
  state.bgType = bg.type;
  state.bgValue = bg.value;
}

// --- Image Loading ---
chrome.storage.local.get(['latestScreenshot'], (result) => {
  if (result.latestScreenshot) {
    originalImage = new Image();
    originalImage.onload = () => {
      offscreenCanvas.width = originalImage.width;
      offscreenCanvas.height = originalImage.height;
      offscreenCtx.drawImage(originalImage, 0, 0);
      saveDrawState();
      render();
    };
    originalImage.src = result.latestScreenshot;
  }
});

function saveDrawState() {
  drawHistory.push(offscreenCanvas.toDataURL());
  if (drawHistory.length > 15) {
    drawHistory.shift();
  }
}

function undo() {
  if (drawHistory.length > 1) {
    drawHistory.pop();
    const img = new Image();
    img.onload = () => {
      offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      offscreenCtx.drawImage(img, 0, 0);
      render();
    };
    img.src = drawHistory[drawHistory.length - 1];
  }
}

// --- Main Render Engine ---

function drawBackground() {
  if (state.bgCategory === 'image' && state.bgImageObj) {
    const imgRatio = state.bgImageObj.width / state.bgImageObj.height;
    const canvasRatio = canvas.width / canvas.height;
    let drawW, drawH, drawX, drawY;
    if (imgRatio > canvasRatio) {
      drawH = canvas.height;
      drawW = drawH * imgRatio;
      drawX = (canvas.width - drawW) / 2;
      drawY = 0;
    } else {
      drawW = canvas.width;
      drawH = drawW / imgRatio;
      drawX = 0;
      drawY = (canvas.height - drawH) / 2;
    }
    ctx.drawImage(state.bgImageObj, drawX, drawY, drawW, drawH);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  else if (state.bgType === 'gradient') {
    const w = canvas.width;
    const h = canvas.height;

    if (state.bgValue.style === 'linear') {
      const angle = (state.bgValue.angle || 135) * Math.PI / 180;
      const length = Math.sqrt(w * w + h * h) / 2;
      const cx = w / 2, cy = h / 2;
      const grad = ctx.createLinearGradient(
        cx - Math.cos(angle) * length, cy - Math.sin(angle) * length,
        cx + Math.cos(angle) * length, cy + Math.sin(angle) * length
      );
      state.bgValue.colors.forEach((c, i) => grad.addColorStop(i / (state.bgValue.colors.length - 1), c));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    else if (state.bgValue.style === 'radial') {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.2);
      state.bgValue.colors.forEach((c, i) => grad.addColorStop(i / (state.bgValue.colors.length - 1), c));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    else if (state.bgValue.style === 'conic') {
      if (ctx.createConicGradient) {
        const grad = ctx.createConicGradient(0, w / 2, h / 2);
        state.bgValue.colors.forEach((c, i) => grad.addColorStop(i / (state.bgValue.colors.length - 1), c));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = state.bgValue.colors[0]; // fallback
        ctx.fillRect(0, 0, w, h);
      }
    }
    else if (state.bgValue.style === 'mesh') {
      // Base layer
      ctx.fillStyle = state.bgValue.colors[0];
      ctx.fillRect(0, 0, w, h);

      const spots = [
        { x: 0, y: 0, c: state.bgValue.colors[1] },
        { x: w, y: h, c: state.bgValue.colors[2] },
        { x: 0, y: h, c: state.bgValue.colors[3] || state.bgValue.colors[1] },
        { x: w, y: 0, c: state.bgValue.colors[4] || state.bgValue.colors[2] }
      ];

      spots.forEach(s => {
        if (!s.c) return;
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, Math.max(w, h) * 0.9);
        grad.addColorStop(0, s.c);
        const cEnd = s.c.length === 7 ? s.c + '00' : 'rgba(255,255,255,0)'; // Simple hex alpha
        grad.addColorStop(1, cEnd);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });
    }
  }
  else if (state.bgType === 'solid') {
    if (state.bgValue.length > 0) {
      ctx.fillStyle = state.bgValue[0];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  else if (state.bgType === 'pattern') {
    if (state.bgValue.includes('.')) {
      if (!patternCache[state.bgValue]) {
        // Fallback color while loading
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        img.src = state.bgValue;
        img.onload = () => {
          patternCache[state.bgValue] = img;
          render(); // Re-render when image loaded
        };
        img.onerror = () => {
          console.warn('Failed to load pattern image:', state.bgValue);
        };
        return;
      }

      const img = patternCache[state.bgValue];

      // Calculate 'cover' geometry exactly like CSS background-size: cover
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;
      let drawW, drawH, drawX, drawY;

      if (imgRatio > canvasRatio) {
        drawH = canvas.height;
        drawW = drawH * imgRatio;
        drawX = (canvas.width - drawW) / 2;
        drawY = 0;
      } else {
        drawW = canvas.width;
        drawH = drawW / imgRatio;
        drawX = 0;
        drawY = (canvas.height - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
  }
}

function getTransformMatrix() {
  const pad = state.padding;
  let frameH = 0;
  if (state.frame === 'mac' || state.frame === 'windows') frameH = 44;
  else if (state.frame === 'browser') frameH = 72;
  else if (state.frame === 'minimal') frameH = 32;
  const innerW = offscreenCanvas.width;
  const innerH = offscreenCanvas.height;

  const is3D = state.transform !== 'flat';

  let m = new DOMMatrix();
  let finalCanvasW, finalCanvasH;
  let contentScale = 1;

  const baseContentW = innerW;
  const baseContentH = innerH + frameH;
  const rawW = baseContentW + pad * 2;
  const rawH = baseContentH + pad * 2;

  const plat = platforms[state.platform];

  if (!plat) {
    // Default size
    finalCanvasW = rawW;
    finalCanvasH = rawH;
  } else {
    // Maintain 4K high-res. Instead of shrinking the screenshot to fit the platform dimension,
    // we expand the Canvas to match the Platform's Aspect Ratio around the 4K screenshot.
    const targetRatio = plat.width / plat.height;

    let candidateW = rawW;
    let candidateH = candidateW / targetRatio;

    if (candidateH < rawH) {
      candidateH = rawH;
      candidateW = candidateH * targetRatio;
    }

    finalCanvasW = candidateW;
    finalCanvasH = candidateH;
    contentScale = 1;
  }

  const cx = finalCanvasW / 2;
  const cy = finalCanvasH / 2;

  // Apply Positioning Sliders
  const shiftX = (state.offsetX / 100) * finalCanvasW;
  const shiftY = (state.offsetY / 100) * finalCanvasH;
  const userScale = state.scaleImage ? (state.scaleImage / 100) : 1;

  m = m.translate(cx + shiftX, cy + shiftY);
  m = m.scale(userScale, userScale);

  if (state.platform !== 'default') {
    m = m.scale(contentScale, contentScale);
  }

  if (state.transform === 'elevate') {
    m = m.scale(0.92, 0.92);
    m = m.translate(0, -20);
  } else if (state.transform.includes('iso-left')) {
    m = m.scale(0.60, 0.60);
    m = m.multiply(new DOMMatrix([0.866, 0.5, -0.866, 0.5, 0, 0]));
  } else if (state.transform.includes('iso-right')) {
    m = m.scale(0.60, 0.60);
    m = m.multiply(new DOMMatrix([0.866, -0.5, 0.866, 0.5, 0, 0]));
  } else if (state.transform === 'iso-top') {
    m = m.scale(0.60, 0.60);
    m = m.multiply(new DOMMatrix([0.707, 0.424, -0.707, 0.424, 0, 0]));
  } else if (state.transform.includes('stand')) {
    m = m.scale(0.70, 0.70);
    const skew = state.transform.includes('right') ? 0.25 : -0.25;
    m = m.multiply(new DOMMatrix([0.866, skew, 0, 1, 0, 0]));
  } else if (state.transform === 'fan-3d') {
    m = m.scale(0.65, 0.65);
    m = m.translate(0, 0);
  } else if (state.transform === 'curve-wide') {
    m = m.scale(0.85, 0.85);
  } else if (state.transform === 'reflect-3d') {
    m = m.scale(0.80, 0.80);
    m = m.translate(0, -100);
  } else if (state.transform.startsWith('stack-flat-')) {
    m = m.scale(0.70, 0.70);
    // Center based on direction
    if (state.transform === 'stack-flat-br') m = m.translate(140, 140);
    else if (state.transform === 'stack-flat-bl') m = m.translate(-140, 140);
    else if (state.transform === 'stack-flat-tr') m = m.translate(140, -140);
    else if (state.transform === 'stack-flat-tl') m = m.translate(-140, -140);
  } else if (state.transform.startsWith('stack-')) {
    m = m.scale(0.70, 0.70);
  }

  const drawX = -(baseContentW / 2);
  const drawY = -(baseContentH / 2);

  m = m.translate(drawX, drawY + frameH);

  return { m, w: finalCanvasW, h: finalCanvasH, drawX, drawY, innerW: baseContentW, innerH: baseContentH - frameH, frameH, cx, cy, contentScale };
}

function drawText(filterDepth) {
  state.textLayers.forEach((layer, index) => {
    if (!layer.text || layer.depth !== filterDepth) return;

    ctx.save();
    
    ctx.font = `${layer.preset === 'header' ? '800' : (layer.preset === 'sub' ? '600' : '400')} ${layer.size}px ${layer.font}`;
    ctx.fillStyle = layer.color || state.color || '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Apply Shadows
    if (layer.shadowType && layer.shadowType !== 'none' && shadowPresets[layer.shadowType]) {
      const s = shadowPresets[layer.shadowType];
      ctx.shadowBlur = s.blur;
      ctx.shadowOffsetX = s.x;
      ctx.shadowOffsetY = s.y;
      ctx.shadowColor = layer.shadowColor || 'rgba(0,0,0,0.2)';
    }

    // Calculate position in pixels
    const x = (layer.x / 100) * canvas.width;
    const y = (layer.y / 100) * canvas.height;

    // Split text by lines
    const lines = layer.text.split('\n');
    const lineHeight = layer.size * 1.25;
    const totalHeight = lines.length * lineHeight;
    
    // Store bounding box for hit testing
    let maxW = 0;
    lines.forEach(line => {
      const w = ctx.measureText(line).width;
      if (w > maxW) maxW = w;
    });
    layer.rect = {
      x: x - maxW / 2 - 10,
      y: y - totalHeight / 2 - 10,
      w: maxW + 20,
      h: totalHeight + 20
    };

    // Draw each line
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y - (totalHeight / 2) + (i * lineHeight) + (lineHeight / 2));
    });

    // Draw Selection Highlight (WITHOUT SHADOW)
    if (state.selectedTextIndex === index && currentTool === 'text') {
      ctx.shadowColor = 'transparent'; // Disable shadow for the highlight
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(layer.rect.x, layer.rect.y, layer.rect.w, layer.rect.h);
      ctx.setLineDash([]);
    }

    ctx.restore();
  });
}

function drawAnnotations() {
  state.annotations.forEach(ann => {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = ann.size;

    if (ann.type === 'draw') {
      if (!ann.points || ann.points.length < 2) { ctx.restore(); return; }
      ctx.beginPath();
      ctx.moveTo((ann.points[0].x / 100) * canvas.width, (ann.points[0].y / 100) * canvas.height);
      for (let i = 1; i < ann.points.length; i++) {
        ctx.lineTo((ann.points[i].x / 100) * canvas.width, (ann.points[i].y / 100) * canvas.height);
      }
      ctx.stroke();
    } else if (ann.type === 'rect') {
      const x1 = (ann.x1 / 100) * canvas.width;
      const y1 = (ann.y1 / 100) * canvas.height;
      const x2 = (ann.x2 / 100) * canvas.width;
      const y2 = (ann.y2 / 100) * canvas.height;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else if (ann.type === 'arrow') {
      const x1 = (ann.x1 / 100) * canvas.width;
      const y1 = (ann.y1 / 100) * canvas.height;
      const x2 = (ann.x2 / 100) * canvas.width;
      const y2 = (ann.y2 / 100) * canvas.height;
      
      const headlen = 15 + ann.size;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const angle = Math.atan2(dy, dx);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }
    ctx.restore();
  });
}

function render() {
  if (!originalImage) return;

  const t = getTransformMatrix();
  canvas.width = t.w;
  canvas.height = t.h;

  if (!viewport.initialized && canvas.width > 0) {
    viewport.initialized = true;
    fitToScreen();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  // Draw "Behind" Layers
  drawText('on');

  // Apply Transform for Mockup
  ctx.save();
  ctx.setTransform(t.m.a, t.m.b, t.m.c, t.m.d, t.m.e, t.m.f);

  const curDrawY = 0 - t.frameH;
  const totalInnerH = t.innerH + t.frameH;

  const isIso = state.transform.includes('iso');
  const isStand = state.transform.includes('stand');
  const isStack = state.transform.startsWith('stack-');

  let baseDepth = 0;
  let dirX = 0, dirY = 0;

  if (state.transform.includes('iso-left')) { baseDepth = 35; dirX = 1; dirY = 1; }
  else if (state.transform.includes('iso-right')) { baseDepth = 35; dirX = -1; dirY = 1; }
  else if (state.transform === 'iso-top') { baseDepth = 40; dirX = 0; dirY = 1.18; }
  else if (state.transform.includes('stand-left')) { baseDepth = 30; dirX = 1; dirY = -0.28; }
  else if (state.transform.includes('stand-right')) { baseDepth = 30; dirX = -1; dirY = 0.28; }

  if (state.platform !== 'default') {
    baseDepth = Math.floor(baseDepth * 0.6);
  }

  const drawScreenshotLayer = (tX, tY, layerScale, tintOpacity, layerDepth) => {
    ctx.save();
    ctx.translate(tX, tY);
    ctx.scale(layerScale, layerScale);

    // Draw Shadow
    ctx.save();
    if (state.shadow > 0) {
      const shadowAlpha = state.shadow / 100;

      if (state.transform === 'elevate') {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha * 0.4})`;
        ctx.shadowBlur = 80;
        ctx.shadowOffsetY = 50;
      } else if (isIso || isStand) {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha * 0.8})`;
        ctx.shadowBlur = layerDepth > 0 ? 50 : 20;
        ctx.shadowOffsetY = 40;
        ctx.shadowOffsetX = dirX * 15;
        ctx.translate(layerDepth * dirX, layerDepth * dirY);
      } else if (isStack) {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha * 0.3})`;
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 20;
      } else {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;
      }

      ctx.fillStyle = '#000000';
      roundRect(ctx, 0, curDrawY, t.innerW, totalInnerH, state.radius);
      ctx.fill();
    }
    ctx.restore();

    // Draw 3D Thickness Slab
    if (layerDepth > 0) {
      ctx.fillStyle = state.frame === 'mac' ? '#d4d4d8' : '#262626';
      for (let i = 1; i <= layerDepth; i++) {
        ctx.save();
        ctx.translate(i * dirX, i * dirY);
        roundRect(ctx, 0, curDrawY, t.innerW, totalInnerH, state.radius);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = state.frame === 'mac' ? '#f4f4f5' : '#404040';
      ctx.lineWidth = 1;
      roundRect(ctx, 0, curDrawY, t.innerW, totalInnerH, state.radius);
      ctx.stroke();
    }

    // Clip area for screenshot
    ctx.save();
    roundRect(ctx, 0, curDrawY, t.innerW, totalInnerH, state.radius);
    ctx.clip();

    // Window Frame
    if (state.frame !== 'none') {
      const isMac = state.frame === 'mac';
      const isWin = state.frame === 'windows';
      const isBrowser = state.frame === 'browser';
      const isMinimal = state.frame === 'minimal';

      if (isMac || isWin || isBrowser || isMinimal) {
        ctx.fillStyle = (isMac || isBrowser || isMinimal) ? '#FAFAFA' : '#1A1A1A';
        ctx.fillRect(0, curDrawY, t.innerW, t.frameH);
      }

      if (isMac) {
        ctx.fillStyle = '#E5E5E5';
        ctx.fillRect(0, curDrawY + t.frameH - 1, t.innerW, 1);
        const dotY = curDrawY + 22;
        const spacing = 22;
        ctx.fillStyle = '#FF5F56'; ctx.beginPath(); ctx.arc(22, dotY, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFBD2E'; ctx.beginPath(); ctx.arc(22 + spacing, dotY, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#27C93F'; ctx.beginPath(); ctx.arc(22 + spacing * 2, dotY, 6, 0, Math.PI * 2); ctx.fill();
      } else if (isWin) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px sans-serif';
        ctx.fillText('—  ☐  ✕', t.innerW - 75, curDrawY + 28);
      } else if (isBrowser) {
        const barY = curDrawY + 36;
        ctx.fillStyle = '#E8EAED';
        ctx.beginPath();
        roundRect(ctx, 80, barY - 14, t.innerW - 160, 28, 14);
        ctx.fill();
        ctx.fillStyle = '#9AA0A6';
        ctx.font = '12px sans-serif';
        ctx.fillText('google.com', 100, barY + 4);
        ctx.fillStyle = '#BDC1C6';
        ctx.beginPath(); ctx.arc(25, barY, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(43, barY, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(61, barY, 4, 0, Math.PI * 2); ctx.fill();
      } else if (isMinimal) {
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        roundRect(ctx, t.innerW / 2 - 30, curDrawY + 12, 60, 8, 4);
        ctx.fill();
      }
    }

    // Render Image
    ctx.drawImage(offscreenCanvas, 0, 0);

    if (tintOpacity > 0) {
      ctx.fillStyle = `rgba(0,0,0,${tintOpacity})`;
      ctx.fillRect(0, curDrawY, t.innerW, totalInnerH);
    }

    if (state.bgType !== 'transparent') {
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      roundRect(ctx, 0, curDrawY, t.innerW, totalInnerH, state.radius);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  };

  if (isStack) {
    let spacingX = 0, spacingY = 0;
    if (state.transform === 'stack-flat-br') { spacingX = -200; spacingY = -200; }
    else if (state.transform === 'stack-flat-bl') { spacingX = 200; spacingY = -200; }
    else if (state.transform === 'stack-flat-tr') { spacingX = -200; spacingY = 200; }
    else if (state.transform === 'stack-flat-tl') { spacingX = 200; spacingY = 200; }
    else if (state.transform === 'stack-iso-left') { spacingX = -160; spacingY = -160; }
    else if (state.transform === 'stack-iso-right') { spacingX = 160; spacingY = -160; }
    else if (state.transform === 'stack-stand') { spacingX = -100; spacingY = -200; }
    drawScreenshotLayer(spacingX, spacingY, 1, 0.45, 0);
    drawScreenshotLayer(spacingX * 0.5, spacingY * 0.5, 1, 0.20, 0);
    drawScreenshotLayer(0, 0, 1, 0, 0);
  } else if (state.transform === 'fan-3d') {
    const sliceH = offscreenCanvas.height / 3;
    const drawSlice = (idx, shiftX, shiftY, angle) => {
      ctx.save();
      ctx.translate(shiftX, shiftY);
      ctx.scale(0.85, 0.85);
      ctx.transform(1, angle, 0, 1, 0, 0);
      ctx.save();
      roundRect(ctx, 0, curDrawY + (idx * sliceH), t.innerW, sliceH, idx === 0 ? state.radius : 0);
      ctx.clip();
      ctx.drawImage(offscreenCanvas, 0, 0);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 2;
      roundRect(ctx, 0, curDrawY + (idx * sliceH), t.innerW, sliceH, 0);
      ctx.stroke();
      ctx.restore();
    };
    drawSlice(2, 60, 20, -0.1);
    drawSlice(1, 30, 10, -0.05);
    drawSlice(0, 0, 0, 0);
  } else if (state.transform === 'curve-wide') {
    const slices = 40;
    const sliceW = t.innerW / slices;
    for (let i = 0; i < slices; i++) {
      const offset = Math.sin((i / slices) * Math.PI) * 40;
      const scale = 1 + (offset / 500);
      ctx.save();
      ctx.translate(i * sliceW, offset);
      ctx.scale(1, scale);
      ctx.beginPath();
      ctx.rect(0, curDrawY, sliceW + 1, totalInnerH);
      ctx.clip();
      ctx.drawImage(offscreenCanvas, -i * sliceW, 0);
      ctx.restore();
    }
  } else if (state.transform === 'reflect-3d') {
    drawScreenshotLayer(0, 0, 1, 0, 0);
    ctx.save();
    ctx.translate(0, (totalInnerH * 2.15) - t.frameH);
    ctx.scale(1, -1);
    const grad = ctx.createLinearGradient(0, curDrawY, 0, curDrawY + totalInnerH);
    grad.addColorStop(0, 'rgba(0,0,0,0.4)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0)');
    ctx.save();
    roundRect(ctx, 0, curDrawY, t.innerW, totalInnerH, state.radius);
    ctx.clip();
    ctx.drawImage(offscreenCanvas, 0, 0);
    ctx.fillStyle = grad;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(0, curDrawY, t.innerW, totalInnerH);
    ctx.restore();
    ctx.restore();
  } else {
    drawScreenshotLayer(0, 0, 1, 0, baseDepth);
  }

  ctx.restore();

  drawAnnotations();

  // Draw "Above" Layers (On Top)
  drawText('off');
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// --- Interaction / Drawing Math ---
let isDraggingText = false;
let dragOffset = { x: 0, y: 0 };

function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY
  };
}

canvas.addEventListener('mousedown', (e) => {
  if (!originalImage || currentTool === 'pan') return;
  e.stopPropagation();
  e.preventDefault();

  const rawPos = getMousePos(e);

  // Check Text Selection
  if (currentTool === 'text') {
    let hitIndex = -1;
    for (let i = state.textLayers.length - 1; i >= 0; i--) {
      const layer = state.textLayers[i];
      if (layer.rect && 
          rawPos.x >= layer.rect.x && rawPos.x <= layer.rect.x + layer.rect.w &&
          rawPos.y >= layer.rect.y && rawPos.y <= layer.rect.y + layer.rect.h) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex !== -1) {
      state.selectedTextIndex = hitIndex;
      isDraggingText = true;
      const layer = state.textLayers[hitIndex];
      const layerPX = (layer.x / 100) * canvas.width;
      const layerPY = (layer.y / 100) * canvas.height;
      dragOffset.x = rawPos.x - layerPX;
      dragOffset.y = rawPos.y - layerPY;
      syncTextUI();
      render();
      return;
    } else {
      state.selectedTextIndex = -1;
      syncTextUI();
      render();
    }
  }

  // Annotation Start
  if (['draw', 'rect', 'arrow'].includes(currentTool)) {
    isDrawing = true;
    const px = (rawPos.x / canvas.width) * 100;
    const py = (rawPos.y / canvas.height) * 100;
    
    currentAnnotation = {
      type: currentTool,
      color: state.color,
      size: state.size,
      x1: px, y1: py,
      x2: px, y2: py,
      points: [{ x: px, y: py }]
    };
    state.annotations.push(currentAnnotation);
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rawPos = getMousePos(e);

  if (isDraggingText) {
    const layer = state.textLayers[state.selectedTextIndex];
    if (layer) {
      const newPX = rawPos.x - dragOffset.x;
      const newPY = rawPos.y - dragOffset.y;
      layer.x = (newPX / canvas.width) * 100;
      layer.y = (newPY / canvas.height) * 100;
      render();
    }
    return;
  }

  if (!isDrawing || !currentAnnotation) return;

  const px = (rawPos.x / canvas.width) * 100;
  const py = (rawPos.y / canvas.height) * 100;

  if (currentAnnotation.type === 'draw') {
    currentAnnotation.points.push({ x: px, y: py });
  } else {
    currentAnnotation.x2 = px;
    currentAnnotation.y2 = py;
  }
  render();
});

canvas.addEventListener('mouseup', () => {
  if (isDrawing) saveDrawState();
  isDrawing = false;
  isDraggingText = false;
  currentAnnotation = null;
});

canvas.addEventListener('mouseout', () => {
  if (isDrawing) saveDrawState();
  isDrawing = false;
  isDraggingText = false;
  currentAnnotation = null;
});

function saveDrawState() {
  // Push state for undo if needed
  render();
}

function undo() {
  if (state.annotations.length > 0) {
    state.annotations.pop();
    render();
  } else if (state.textLayers.length > 0) {
    state.textLayers.pop();
    state.selectedTextIndex = state.textLayers.length - 1;
    syncTextUI();
    render();
  }
}

// --- Export Action ---
function exportImage() {
  const btn = document.getElementById('btn-export');
  const orgText = btn.textContent;
  btn.textContent = 'Processing HD Image...';

  setTimeout(() => {
    const mime = 'image/png';
    const extension = 'png';

    const a = document.createElement('a');
    a.href = canvas.toDataURL(mime, 1.0);
    const timestamp = new Date().getTime();
    a.download = `Studio_Showcase_${timestamp}.${extension}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    btn.textContent = orgText;
  }, 150);
}

document.addEventListener('DOMContentLoaded', initUI);
