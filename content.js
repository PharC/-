console.log("🔬 科学期刊图片助手已激活 - 2026 修复版");

let currentScale = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

// --- 1. 基础 UI 构建 ---
function createSidePanel() {
    if (document.getElementById('journal-figure-panel')) return;
    const sidePanel = document.createElement('div');
    sidePanel.id = 'journal-figure-panel';
    sidePanel.innerHTML = `
        <div id="panel-resizer" style="position:absolute; left:0; top:0; width:10px; height:100%; cursor:ew-resize; z-index:1001;"></div>
        <div id="panel-resizer"></div>
        <div class="panel-header">
            <div class="header-left">
                <span class="panel-title">🔬 图片查看器</span>
                <span class="panel-subtitle">Ctrl+滚轮缩放 | 拖拽移动</span>
            </div>
            <button id="close-panel" class="close-btn">×</button>
        </div>
        <div id="panel-content">
            <div id="img-container">
                <div id="img-wrapper">
                    <img id="preview-img" src="" alt="Figure preview" />
                    <div id="loading-indicator"><div class="spinner"></div><span>加载中...</span></div>
                </div>
            </div>
            
            <div id="figure-info">
                <div id="figure-title"></div>
                <div id="figure-description"></div>
                <div id="figure-actions">
                    <button id="open-original" class="action-btn">在新标签页打开原图</button>
                    <button id="reset-zoom" class="action-btn">重置缩放</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(sidePanel);
    initializePanelEvents();
}

function initializePanelEvents() {
    const panel = document.getElementById('journal-figure-panel');
    const previewImg = document.getElementById('preview-img');
    const imgWrapper = document.getElementById('img-wrapper');
    const closeBtn = document.getElementById('close-panel');
    
    closeBtn.onclick = () => { panel.classList.remove('active'); resetImageState(); };
    document.getElementById('reset-zoom').onclick = resetImageState;
    document.getElementById('open-original').onclick = () => window.open(previewImg.src, '_blank');
    
    imgWrapper.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            currentScale = Math.min(Math.max(0.5, currentScale + (e.deltaY > 0 ? -0.1 : 0.1)), 5);
            updateImageTransform();
        }
    }, { passive: false });

    imgWrapper.onmousedown = (e) => {
        if (currentScale > 1) {
            isDragging = true;
            startX = e.clientX - translateX; startY = e.clientY - translateY;
            imgWrapper.style.cursor = 'grabbing';
        }
    };
    document.onmousemove = (e) => {
        if (isDragging) {
            translateX = e.clientX - startX; translateY = e.clientY - startY;
            updateImageTransform();
        }
    };
    document.onmouseup = () => { isDragging = false; imgWrapper.style.cursor = currentScale > 1 ? 'grab' : 'default'; };
    initializePanelResize();
}

function updateImageTransform() {
    const img = document.getElementById('preview-img');
    if (img) img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
}

function resetImageState() {
    currentScale = 1; translateX = 0; translateY = 0; updateImageTransform();
}

function initializePanelResize() {
    const panel = document.getElementById('journal-figure-panel');
    const resizer = document.getElementById('panel-resizer');
    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        // 增加一个遮罩层防止鼠标滑入 iframe 或图片导致卡顿
        document.body.style.cursor = 'ew-resize';
        panel.style.transition = 'none'; // 拉伸时关闭动画，保证丝滑
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        // 计算新宽度：屏幕总宽 - 鼠标当前位置
        // 这样当你向左拉时，宽度会变大
        const newWidth = window.innerWidth - e.clientX;

        // 设置最小宽度 300px，最大宽度 90% 屏幕
        if (newWidth > 300 && newWidth < window.innerWidth * 0.9) {
            panel.style.width = newWidth + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = 'default';
            panel.style.transition = 'transform 0.3s ease, width 0.1s ease'; // 恢复动画
        }
    });
}

// --- 2. 核心逻辑：图片提取 ---
function extractFigureInfo(figureElement, clickedText = "") {
    const info = { title: 'Figure', description: '', imageUrl: '', fallbackUrl: '' };
    
    // 🔍 严格限制：只在容器内找
    let imgs = Array.from(figureElement.querySelectorAll('img, [data-src], source'));
    
    // Nature 容器回溯
    if (imgs.length === 0) {
        const container = figureElement.closest('.c-article-section__figure');
        if (container) imgs = Array.from(container.querySelectorAll('img, [data-src]'));
    }

    // 子图精准匹配 (解决 Fig 2d 问题)
    if (imgs.length > 1 && clickedText) {
        const letterMatch = clickedText.match(/[a-z]$/i);
        if (letterMatch) {
            const letter = letterMatch[0].toLowerCase();
            const matched = imgs.find(el => {
                const alt = (el.getAttribute('alt') || "").toLowerCase();
                const src = (el.getAttribute('src') || el.getAttribute('data-src') || "").toLowerCase();
                return alt.includes(`(${letter})`) || src.includes(`_${letter}.`) || src.includes(`fig${letter}`);
            });
            if (matched) imgs = [matched];
        }
    }

    // 提取 URL
    let rawUrl = "";
    for (const el of imgs) {
        // 优先获取 Wiley 可能的高清属性
        const src = el.getAttribute('data-lg-src') || 
                    el.getAttribute('data-src') || 
                    el.getAttribute('src');
        if (src && !src.includes('data:image')) {
            rawUrl = src; break;
        }
    }
    if (rawUrl) {
        if (rawUrl.startsWith('//')) rawUrl = 'https:' + rawUrl;
        else if (rawUrl.startsWith('/')) rawUrl = window.location.origin + rawUrl;
        
        // Nature 高清化
        if (rawUrl.includes('media.springernature.com')) {
            info.imageUrl = rawUrl.replace(/\/lw\d+\//, '/lw1200/').replace(/_lw\d+/, '_lw1200');
            info.fallbackUrl = rawUrl;
        } else {
            info.imageUrl = rawUrl;
        }
    }

    // 标题与描述提取
    const titleEl = figureElement.querySelector('.c-article-section__figure-caption b, figcaption b, b');
    if (titleEl) info.title = titleEl.textContent.trim();
    
    const descEl = figureElement.querySelector('.c-article-section__figure-description, figcaption');
    if (descEl) info.description = descEl.textContent.trim().substring(0, 500) + '...';

    return info;
}

// --- 3. 交互控制 ---
function showFigure(figureElement, clickedText = "") {
    const panel = document.getElementById('journal-figure-panel');
    const previewImg = document.getElementById('preview-img');
    const loading = document.getElementById('loading-indicator');
    
    panel.classList.add('active');
    loading.style.display = 'flex';
    previewImg.style.display = 'none';
    
    const info = extractFigureInfo(figureElement, clickedText);
    
    document.getElementById('figure-title').textContent = info.title;
    document.getElementById('figure-description').textContent = info.description;
    
    if (info.imageUrl) {
        previewImg.src = info.imageUrl;
        previewImg.onload = () => { loading.style.display = 'none'; previewImg.style.display = 'block'; };
        previewImg.onerror = () => { if(info.fallbackUrl) previewImg.src = info.fallbackUrl; };
    } else {
        loading.innerHTML = "❌ 未找到正文图片";
    }
}

function findFigureElement(figureId, linkText = "") {
    // 1. 尝试直接匹配
    let el = document.getElementById(figureId);
    if (el) return el.closest('figure, .figure, [data-core-wrapper="content"]') || el;

    // 2. ✨ Wiley 特色：处理长 ID (例如 advs73807-fig-0001)
    // 提取 ID 末尾的数字，比如 0001 变成 1
    const wileyMatch = figureId.match(/fig-?(\d+)/i);
    const targetNum = wileyMatch ? parseInt(wileyMatch[1], 10) : null;

    // 3. 文本保底匹配 (Figure 1A 逻辑)
    const figNumMatch = linkText.match(/\d+/);
    const searchNum = targetNum || (figNumMatch ? figNumMatch[0] : null);

    if (searchNum) {
        const allCaptions = document.querySelectorAll('figcaption, .figure-caption, .article-section__caption');
        for (let cap of allCaptions) {
            const txt = cap.textContent || "";
            if (txt.includes(`Figure ${searchNum}`) || txt.includes(`Fig. ${searchNum}`)) {
                return cap.closest('figure, .figure') || cap;
            }
        }
    }

    // 4. 终极模糊匹配：匹配 ID 包含关系
    const norm = figureId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const figs = document.querySelectorAll('figure, [id*="fig" i]');
    for (let f of figs) {
        const sid = f.id.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (sid && (sid.includes(norm) || norm.includes(sid))) return f;
    }
    return null;
}

function handleFigureClick(e) {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href') || "";
    const dataTarget = link.getAttribute('data-target') || "";
    const linkText = link.textContent.trim();
    
    let figureId = "";

    if (dataTarget) {
        figureId = dataTarget;
    } else if (href.includes('#')) {
        figureId = href.split('#').pop();
    }

    // ✨ 增强验证：Wiley 的文本可能是 "Figure 1A,B"
    const isFigureLink = /fig|table|ext-fig/i.test(figureId) || 
                         /Figure\s*\d+/i.test(linkText) || 
                         /^\d+[A-Z](, [A-Z])?$/.test(linkText); // 匹配 "1A" 或 "1A,B"

    if (!figureId || !isFigureLink) return;

    const target = findFigureElement(figureId, linkText);
    if (target) {
        e.preventDefault();
        e.stopPropagation();
        showFigure(target, linkText);
    }
}

// --- 4. 初始化 ---
function init() {
    createSidePanel();
    document.addEventListener('click', handleFigureClick, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();