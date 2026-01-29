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
                <span class="panel-subtitle">Ctrl+滚轮缩放 | 滚轮上下移动 | 滚动条精确控制</span>
            </div>
            <button id="close-panel" class="close-btn">×</button>
        </div>
        <div id="panel-content">
            <div id="img-container">
                <div id="img-wrapper">
                    <img id="preview-img" src="" alt="Figure preview" />
                    <div id="loading-indicator"><div class="spinner"></div><span>加载中...</span></div>
                </div>
                <!-- 滚动条控制 -->
                <div id="scroll-controls" style="display: none;">
                    <div id="horizontal-scroll">
                        <input type="range" id="h-scroll" min="0" max="100" value="50" />
                    </div>
                    <div id="vertical-scroll">
                        <input type="range" id="v-scroll" min="0" max="100" value="50" />
                    </div>
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
    const scrollControls = document.getElementById('scroll-controls');
    const hScroll = document.getElementById('h-scroll');
    const vScroll = document.getElementById('v-scroll');
    
    closeBtn.onclick = () => { panel.classList.remove('active'); resetImageState(); };
    document.getElementById('reset-zoom').onclick = resetImageState;
    document.getElementById('open-original').onclick = () => window.open(previewImg.src, '_blank');
    
    // 缩放和移动功能
    imgWrapper.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            // Ctrl+滚轮：缩放功能
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            currentScale = Math.min(Math.max(0.5, currentScale + delta), 5);
            updateImageTransform();
            
            // 显示或隐藏滚动条
            if (currentScale > 1) {
                scrollControls.style.display = 'block';
                updateScrollBars();
            } else {
                scrollControls.style.display = 'none';
            }
        } else if (currentScale > 1) {
            // 普通滚轮：在放大状态下控制上下移动
            e.preventDefault();
            const moveSpeed = 30; // 移动速度
            const maxMoveY = (currentScale - 1) * previewImg.offsetHeight / 2;
            
            // 根据滚轮方向移动图片
            if (e.deltaY > 0) {
                // 向下滚动，图片向上移动
                translateY = Math.max(-maxMoveY, translateY - moveSpeed);
            } else {
                // 向上滚动，图片向下移动
                translateY = Math.min(maxMoveY, translateY + moveSpeed);
            }
            
            updateImageTransform();
            updateScrollBars(); // 同步更新滚动条位置
        }
    }, { passive: false });
    
    // 滚动条事件
    hScroll.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        // 将0-100的值转换为图片移动范围
        const maxMove = (currentScale - 1) * previewImg.offsetWidth / 2;
        translateX = (value - 50) * maxMove / 50;
        updateImageTransform();
    });
    
    vScroll.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        // 将0-100的值转换为图片移动范围
        const maxMove = (currentScale - 1) * previewImg.offsetHeight / 2;
        translateY = (value - 50) * maxMove / 50;
        updateImageTransform();
    });
    
    initializePanelResize();
}

function updateImageTransform() {
    const img = document.getElementById('preview-img');
    if (img) img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
}

// 更新滚动条位置
function updateScrollBars() {
    const hScroll = document.getElementById('h-scroll');
    const vScroll = document.getElementById('v-scroll');
    const previewImg = document.getElementById('preview-img');
    
    if (currentScale > 1 && previewImg.offsetWidth > 0) {
        const maxMoveX = (currentScale - 1) * previewImg.offsetWidth / 2;
        const maxMoveY = (currentScale - 1) * previewImg.offsetHeight / 2;
        
        // 将当前位置转换为滚动条值(0-100)
        const hValue = maxMoveX > 0 ? (translateX / maxMoveX * 50) + 50 : 50;
        const vValue = maxMoveY > 0 ? (translateY / maxMoveY * 50) + 50 : 50;
        
        hScroll.value = Math.max(0, Math.min(100, hValue));
        vScroll.value = Math.max(0, Math.min(100, vValue));
    }
}

function resetImageState() {
    currentScale = 1; 
    translateX = 0; 
    translateY = 0; 
    updateImageTransform();
    
    // 隐藏滚动条并重置位置
    const scrollControls = document.getElementById('scroll-controls');
    const hScroll = document.getElementById('h-scroll');
    const vScroll = document.getElementById('v-scroll');
    
    if (scrollControls) scrollControls.style.display = 'none';
    if (hScroll) hScroll.value = 50;
    if (vScroll) vScroll.value = 50;
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
    console.log('🔍 提取图片信息 (Cell/Nature):', figureElement);
    
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

    // 提取 URL - 增强版高清处理
    let rawUrl = "";
    for (const el of imgs) {
        console.log(`  检查图片元素:`, el);
        
        // 尝试多种属性获取图片URL - Cell网站特殊处理
        const urlSources = [
            el.getAttribute('data-viewer-src'),  // Cell高清图片！
            el.getAttribute('data-lg-src'),      // Wiley高清
            el.getAttribute('data-src'),         // 懒加载
            el.getAttribute('src'),              // 标准
            el.getAttribute('data-original'),    // 原始图片
            el.getAttribute('data-full-src'),    // 全尺寸
            el.currentSrc                        // 当前显示的
        ];
        
        // 处理srcset获取最高分辨率
        const srcset = el.getAttribute('srcset');
        if (srcset) {
            console.log(`  找到srcset: ${srcset}`);
            const sources = srcset.split(',').map(s => s.trim());
            const highRes = sources[sources.length - 1]; // 最后一个通常是最高分辨率
            urlSources.unshift(highRes.split(' ')[0]);
        }
        
        // 找到第一个有效URL
        for (const url of urlSources) {
            if (url && url.trim() && !url.includes('data:image') && url !== 'undefined' && url !== 'null') {
                rawUrl = url.trim();
                console.log(`  ✅ 找到图片URL: ${rawUrl}`);
                break;
            }
        }
        
        if (rawUrl) break;
    }
    
    if (rawUrl) {
        // 补全协议和域名
        if (rawUrl.startsWith('//')) {
            rawUrl = 'https:' + rawUrl;
        } else if (rawUrl.startsWith('/')) {
            rawUrl = window.location.origin + rawUrl;
        }
        
        console.log(`🔧 处理图片URL: ${rawUrl}`);
        
        // 高清化处理 - 增强版
        if (rawUrl.includes('media.springernature.com')) {
            // Nature/Springer 高清化
            console.log('🔧 Nature/Springer 高清化处理');
            console.log(`  原始URL: ${rawUrl}`);
            
            // 先解码URL，避免编码字符影响匹配
            let decodedUrl = decodeURIComponent(rawUrl);
            console.log(`  解码后URL: ${decodedUrl}`);
            
            const highResPatterns = [
                // Nature最高清版本：直接使用 /full/ 路径
                ['/lw200/', '/full/'],
                ['/lw300/', '/full/'],
                ['/lw400/', '/full/'],
                ['/lw500/', '/full/'],
                ['/lw685/', '/full/'],  // 你的情况：lw685 -> full
                ['/lw800/', '/full/'],
                ['/lw1200/', '/full/'], // 即使是1200也升级到full
                ['_lw200_', '_full_'],
                ['_lw300_', '_full_'],
                ['_lw400_', '_full_'],
                ['_lw500_', '_full_'],
                ['_lw685_', '_full_'],
                ['_lw800_', '_full_'],
                ['_lw1200_', '_full_'],
                ['/w200/', '/full/'],
                ['/w300/', '/full/'],
                ['/w400/', '/full/'],
                ['/w500/', '/full/'],
                ['/w685/', '/full/'],
                ['/w800/', '/full/'],
                ['/w1200/', '/full/'],
                ['_w200_', '_full_'],
                ['_w300_', '_full_'],
                ['_w400_', '_full_'],
                ['_w500_', '_full_'],
                ['_w685_', '_full_'],
                ['_w800_', '_full_'],
                ['_w1200_', '_full_']
            ];
            
            info.fallbackUrl = rawUrl; // 保存原始URL作为备用
            
            // 尝试升级为高清版本 - 在解码后的URL上进行匹配
            let upgraded = false;
            for (const [lowRes, highRes] of highResPatterns) {
                if (decodedUrl.includes(lowRes)) {
                    // 在原始URL上进行替换（保持编码）
                    info.imageUrl = rawUrl.replace(lowRes, highRes);
                    console.log(`  ✅ 升级为高清: ${lowRes} -> ${highRes}`);
                    console.log(`  ✅ 升级后URL: ${info.imageUrl}`);
                    upgraded = true;
                    break;
                }
            }
            
            // 如果没有匹配到模式，尝试通用高清化
            if (!upgraded) {
                console.log('  🔄 尝试通用高清化模式');
                
                // 尝试将medium替换为large
                if (decodedUrl.includes('/medium/')) {
                    info.imageUrl = rawUrl.replace('/medium/', '/large/');
                    console.log(`  ✅ medium -> large 升级`);
                } else if (decodedUrl.includes('_medium_')) {
                    info.imageUrl = rawUrl.replace('_medium_', '_large_');
                    console.log(`  ✅ _medium_ -> _large_ 升级`);
                } else {
                    // Nature特殊处理：尝试构建高清URL
                    if (decodedUrl.includes('.jpg') || decodedUrl.includes('.png')) {
                        // 尝试添加高清参数
                        const highResUrl = rawUrl.replace(/\.(jpg|png)/, '_lrg.$1');
                        info.imageUrl = highResUrl;
                        info.fallbackUrl = rawUrl; // 保留原始URL作为备用
                        console.log(`  🔄 尝试Nature高清格式: ${highResUrl}`);
                    } else {
                        info.imageUrl = rawUrl;
                        console.log(`  ℹ️ 未找到升级模式，使用原始URL`);
                    }
                }
            }
            
        } else if (rawUrl.includes('ars.els-cdn.com')) {
            // Cell/Elsevier 高清化
            console.log('🔧 Cell/Elsevier 高清化处理');
            
            info.fallbackUrl = rawUrl;
            
            // Cell的图片URL通常包含尺寸参数
            if (rawUrl.includes('_lrg.jpg')) {
                info.imageUrl = rawUrl; // 已经是大图
                console.log(`  ✅ 已经是大图格式`);
            } else if (rawUrl.includes('_mmc.jpg')) {
                info.imageUrl = rawUrl.replace('_mmc.jpg', '_lrg.jpg');
                console.log(`  ✅ mmc -> lrg 升级`);
            } else if (rawUrl.includes('_gr')) {
                // 尝试获取更大版本，如 gr1_lrg.jpg
                info.imageUrl = rawUrl.replace(/(_gr\d+)\.jpg/, '$1_lrg.jpg');
                console.log(`  ✅ 添加 _lrg 后缀`);
            } else {
                info.imageUrl = rawUrl;
                console.log(`  ℹ️ Cell图片格式未识别，使用原始URL`);
            }
            
        } else if (rawUrl.includes('/cms/10.1016/')) {
            // Cell/Elsevier 新格式高清化 (基于你提供的URL格式)
            console.log('🔧 Cell/Elsevier 新格式高清化处理');
            
            info.fallbackUrl = rawUrl;
            
            if (rawUrl.includes('_lrg.jpg')) {
                info.imageUrl = rawUrl; // 已经是大图
                console.log(`  ✅ 已经是大图格式`);
            } else if (rawUrl.includes('/gr') && rawUrl.endsWith('.jpg')) {
                // 将 gr1.jpg 转换为 gr1_lrg.jpg
                info.imageUrl = rawUrl.replace(/\/gr(\d+)\.jpg$/, '/gr$1_lrg.jpg');
                console.log(`  ✅ gr格式升级: gr$1.jpg -> gr$1_lrg.jpg`);
            } else {
                info.imageUrl = rawUrl;
                console.log(`  ℹ️ Cell新格式未识别，使用原始URL`);
            }
            
        } else {
            // 其他网站
            info.imageUrl = rawUrl;
            console.log(`  ℹ️ 其他网站，使用原始URL`);
        }
        
        console.log(`🖼️ 最终图片URL: ${info.imageUrl}`);
        if (info.fallbackUrl) {
            console.log(`🔄 备用图片URL: ${info.fallbackUrl}`);
        }
    } else {
        console.log('❌ 未找到任何图片URL');
    }

    // 标题与描述提取
    const titleEl = figureElement.querySelector('.c-article-section__figure-caption b, figcaption b, b');
    if (titleEl) {
        info.title = titleEl.textContent.trim();
        console.log(`📝 提取标题: ${info.title}`);
    }
    
    const descEl = figureElement.querySelector('.c-article-section__figure-description, figcaption');
    if (descEl) {
        info.description = descEl.textContent.trim().substring(0, 500) + '...';
        console.log(`📄 提取描述: ${info.description.substring(0, 100)}...`);
    }

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
    
    // 根据网站类型选择不同的信息提取方法
    let info;
    if (window.location.hostname.includes('science.org')) {
        info = extractScienceImageInfo(figureElement);
    } else {
        info = extractFigureInfo(figureElement, clickedText);
    }
    
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
    
    const href = link.getAttribute('href');
    const dataTarget = link.getAttribute('data-target');
    const ariaLabel = link.getAttribute('aria-label');
    const linkText = link.textContent?.trim();
    
    console.log(`🎯 点击链接: href="${href}", data-target="${dataTarget}", aria-label="${ariaLabel}", text="${linkText}"`);
    
    let figureId = '';
    let isScience = window.location.hostname.includes('science.org');
    
    // Science网站特殊处理
    if (isScience) {
        if (dataTarget && dataTarget.includes('fv-')) {
            // 从data-target提取figure ID，如 "core-fv-F1" -> "F1"
            figureId = dataTarget.split('fv-')[1];
            console.log(`📍 Science网站：从data-target提取ID: ${figureId}`);
        } else if (ariaLabel && ariaLabel.includes('Fig')) {
            // 从aria-label提取，如 "OPEN Fig. 1 IN VIEWER" -> "F1"
            const figMatch = ariaLabel.match(/Fig\.?\s*(\d+[a-zA-Z]*)/i);
            if (figMatch) {
                figureId = 'F' + figMatch[1]; // Science使用F1格式
                console.log(`📍 Science网站：从aria-label提取ID: ${figureId}`);
            }
        }
        
        // Science网站的图片链接检查
        const isScienceFigureLink = 
            dataTarget?.includes('fv-') ||
            ariaLabel?.includes('Fig') ||
            /Fig\.?\s*\d+/i.test(linkText);
            
        if (!isScienceFigureLink) {
            console.log(`❌ Science网站：不是图片链接`);
            return;
        }
        
        console.log(`✅ Science网站：确认是图片链接: ${figureId}`);
        
        // 阻止Science的默认viewer行为
        e.preventDefault();
        e.stopPropagation();
        
    } else {
        // Nature等其他网站的处理
        if (href && href.includes('#')) {
            figureId = href.split('#')[1];
            console.log(`📍 其他网站：从URL提取锚点: ${figureId}`);
        } else {
            console.log(`❌ 其他网站：链接不包含锚点: ${href}`);
            return;
        }
        
        // 检查是否是图片链接
        const figurePatterns = [
            /[Ff]ig/,           // Fig, fig
            /figure/i,          // Figure, figure
            /[Ff]\d+/,          // F1, f1, Fig1, fig1
            /table/i,           // Table
            /scheme/i           // Scheme
        ];
        
        // 排除非图片链接的模式
        const excludePatterns = [
            /auth/i,            // 作者链接 (auth-Itay-Koren-Aff1)
            /author/i,          // 作者链接
            /affiliation/i,     // 机构链接
            /aff\d+/i,          // 机构编号 (Aff1, Aff2等)
            /correspondence/i,  // 通讯作者
            /email/i,           // 邮箱链接
            /orcid/i,           // ORCID链接
            /reference/i,       // 参考文献
            /citation/i,        // 引用链接
            /supplement/i,      // 补充材料
            /abstract/i,        // 摘要
            /method/i,          // 方法
            /discussion/i,      // 讨论
            /conclusion/i,      // 结论
            /section/i,         // 章节链接
            /appendix/i,        // 附录
            /acknowledgment/i,  // 致谢
            /contrib/i,         // 贡献者
            /popup/i            // 弹出窗口链接
        ];
        
        const isFigureLink = figurePatterns.some(pattern => pattern.test(figureId));
        const isExcludedLink = excludePatterns.some(pattern => pattern.test(figureId)) ||
                              excludePatterns.some(pattern => pattern.test(linkText)) ||
                              excludePatterns.some(pattern => pattern.test(ariaLabel || '')) ||
                              // 检查作者相关的data属性
                              link.getAttribute('data-test') === 'author-name' ||
                              link.getAttribute('data-track-action') === 'open author' ||
                              link.hasAttribute('data-author-popup') ||
                              link.hasAttribute('data-author-search');
        
        if (!isFigureLink || isExcludedLink) {
            console.log(`❌ 其他网站：不是图片链接或被排除: ${figureId}, 链接文本: "${linkText}", aria-label: "${ariaLabel}"`);
            return;
        }
        
        console.log(`✅ 其他网站：确认是图片链接: ${figureId}`);
        
        // 阻止默认跳转
        e.preventDefault();
        e.stopPropagation();
    }
    
    if (!figureId) {
        console.log(`❌ 无法提取图片ID`);
        return;
    }
    
    console.log(`🔍 开始查找图片元素: ${figureId}`);
    
    const figureElement = findFigureElement(figureId);
    if (figureElement) {
        console.log(`✅ 找到图片元素，显示侧边栏`);
        showFigure(figureElement);
    } else {
        console.log(`❌ 未找到图片元素: ${figureId}`);
        
        // 详细调试信息
        console.log('🔍 详细调试信息:');
        console.log(`  - 网站类型: ${isScience ? 'Science' : '其他'}`);
        console.log(`  - 提取的ID: ${figureId}`);
        
        // 检查页面中是否存在这个ID
        const directElement = document.getElementById(figureId);
        if (directElement) {
            console.log(`✅ document.getElementById找到元素，直接使用`);
            showFigure(directElement);
        } else {
            console.log(`❌ document.getElementById也未找到: ${figureId}`);
            
            // 列出页面中所有可能的图片元素供调试
            const allElements = document.querySelectorAll('[id*="F"], [id*="fig"], [id*="Fig"], figure');
            console.log(`📊 页面中所有可能的figure元素 (${allElements.length}个):`);
            allElements.forEach((el, i) => {
                if (i < 10) { // 只显示前10个
                    console.log(`  ${i+1}. ID: "${el.id}", 标签: ${el.tagName}, 类: "${el.className}"`);
                }
            });
        }
    }
}

// Science网站图片提取 - 增强版
function extractScienceImageInfo(figureElement) {
    console.log('🔬 Science网站图片提取:', figureElement);
    
    const info = {
        title: 'Figure',
        description: '',
        imageUrl: '',
        fallbackUrl: ''
    };
    
    // Science网站图片查找
    const img = figureElement.querySelector('img');
    if (img) {
        let imgUrl = img.getAttribute('src') || img.getAttribute('data-src');
        
        if (imgUrl) {
            // Science图片URL处理
            if (imgUrl.startsWith('/')) {
                imgUrl = window.location.origin + imgUrl;
            }
            
            info.imageUrl = imgUrl;
            console.log('🖼️ Science图片URL:', imgUrl);
        }
    }
    
    // 提取标题
    const titleElement = figureElement.querySelector('figcaption, .caption, .figure-caption');
    if (titleElement) {
        info.title = titleElement.textContent.trim().substring(0, 100);
    }
    
    return info;
}


function showScienceFigure(link) {
  createSidePanel();
  const panel = document.getElementById('journal-figure-panel');
  panel.classList.add('active');

  const previewImg = document.getElementById('preview-img');
  const loading = document.getElementById('loading-indicator');
  loading.style.display = 'flex';
  previewImg.style.display = 'none';

  // Science 常见高清图属性
  const imgUrl =
    link.dataset.figureUrl ||
    link.dataset.srcLarge ||
    link.getAttribute('data-figure-url');

  if (imgUrl) {
    const url = imgUrl.startsWith('//') ? 'https:' + imgUrl : imgUrl;
    previewImg.src = url;
    previewImg.onload = () => {
      loading.style.display = 'none';
      previewImg.style.display = 'block';
    };
  } else {
    loading.innerText = '❌ Science 图像需要通过 Viewer 抓取（下一步可加）';
  }
}

// --- 4. 初始化 ---
function init() {
    createSidePanel();
    document.addEventListener('click', handleFigureClick, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
