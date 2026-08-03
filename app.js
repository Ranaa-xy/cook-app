/**
 * 拍照识菜 App - 主逻辑 v3
 * 改进：更强的 JSON 解析、食材编辑、原始回复查看、修复视频链接
 */

// ==================== 全局状态 ====================
const state = {
    images: [],
    currentResult: null,
    currentRawText: '',    // AI 原始回复（调试用）
    history: [],
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ==================== 初始化 ====================
function init() {
    loadSettings();
    loadHistory();
    bindEvents();
    registerServiceWorker();

    if (!localStorage.getItem('apikey')) {
        setTimeout(() => showSettings(), 800);
    }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('✅ SW 注册成功'))
            .catch(() => {});
    }
}

// ==================== 事件绑定 ====================
function bindEvents() {
    $('#btnAddPhoto').addEventListener('click', () => $('#fileInput').click());
    $('#fileInput').addEventListener('change', handleFilesSelected);

    // 图片网格：删除 / 预览
    $('#imageGrid').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove')) {
            removeImage(e.target.dataset.id);
            return;
        }
        const slot = e.target.closest('.image-slot.filled');
        if (slot) {
            const img = slot.querySelector('img');
            if (img) previewImage(img.src);
        }
    });

    $('#btnRecognize').addEventListener('click', startRecognition);
    $('#btnClear').addEventListener('click', clearAllImages);
    $('#btnQuickConflict').addEventListener('click', () => switchPage('pageConflict'));
    $('#btnQuickHistory').addEventListener('click', () => { renderHistory(); switchPage('pageHistory'); });
    $('#btnQuickSearch').addEventListener('click', () => switchPage('pageSearch'));
    $('#btnQuickNoodles').addEventListener('click', () => { renderNoodlePage(); switchPage('pageNoodles'); });
    $('#btnQuickDessert').addEventListener('click', () => { renderDessertPage(); switchPage('pageDessert'); });
    $('#btnQuickAirfryer').addEventListener('click', () => { renderAirfryerPage(); switchPage('pageAirfryer'); });
    $('#btnQuickPicker').addEventListener('click', () => { renderPickerPage(); switchPage('pagePicker'); });
    $('#btnBackHome').addEventListener('click', () => switchPage('pageHome'));
    $('#btnRetake').addEventListener('click', () => { clearAllImages(); switchPage('pageHome'); });
    $('#btnCheckConflict').addEventListener('click', doConflictCheck);
    $('#btnBackFromConflict').addEventListener('click', () => switchPage('pageHome'));
    $('#btnBackFromHistory').addEventListener('click', () => switchPage('pageHome'));
    $('#btnBackFromSearch').addEventListener('click', () => switchPage('pageHome'));
    $('#btnBackFromNoodles').addEventListener('click', () => switchPage('pageHome'));
    $('#btnBackFromDessert').addEventListener('click', () => switchPage('pageHome'));
    $('#btnBackFromAirfryer').addEventListener('click', () => switchPage('pageHome'));
    $('#btnBackFromPicker').addEventListener('click', () => switchPage('pageHome'));
    $('#btnSearchDish').addEventListener('click', searchDishByName);
    $('#btnTextSearch').addEventListener('click', searchByTextInput);
    $('#btnPickerSearch').addEventListener('click', searchByPickedIngredients);
    $('#btnPickerClear').addEventListener('click', clearPickedIngredients);
    $('#btnQuickKitchen').addEventListener('click', () => { renderKitchenPage(); switchPage('pageKitchen'); });
    $('#btnQuickOrder').addEventListener('click', () => { renderOrderPage(); switchPage('pageOrder'); });
    $('#btnBackFromKitchen').addEventListener('click', () => switchPage('pageHome'));
    $('#btnBackFromOrder').addEventListener('click', () => switchPage('pageHome'));
    // 厨神厨房弹窗
    $('#btnAddDish').addEventListener('click', () => showAddDishModal());
    $('#btnSaveDish').addEventListener('click', saveKitchenDish);
    $('#btnCancelDish').addEventListener('click', hideAddDishModal);
    $('#dishImageInput').addEventListener('change', previewDishImage);
    // 点菜
    $('#btnJoinRoom').addEventListener('click', joinOrderRoom);
    $('#btnAddOrder').addEventListener('click', addOrderItem);
    $('#btnSettings').addEventListener('click', showSettings);
    $('#btnSaveSettings').addEventListener('click', saveSettings);
    $('#btnCancelSettings').addEventListener('click', hideSettings);
    $('#aiProvider').addEventListener('change', onProviderChange);
    $('#btnCloseConflictAlert').addEventListener('click', hideConflictAlert);
    $('#btnClosePreview').addEventListener('click', hideImagePreview);
    $('#modalImagePreview').addEventListener('click', (e) => {
        if (e.target === $('#modalImagePreview')) hideImagePreview();
    });
    $('#btnCloseImageSearch').addEventListener('click', hideImageSearch);
    $('#modalImageSearch').addEventListener('click', (e) => {
        if (e.target === $('#modalImageSearch')) hideImageSearch();
    });
    document.addEventListener('paste', handlePaste);
}

// ==================== 图片管理 ====================
function handleFilesSelected(e) {
    processFiles(Array.from(e.target.files));
    e.target.value = '';
}

function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
        if (item.type.startsWith('image/')) files.push(item.getAsFile());
    }
    if (files.length > 0) processFiles(files);
}

async function processFiles(files) {
    const MAX = 6, remaining = MAX - state.images.length;
    if (remaining <= 0) { showToast('最多 6 张图片~'); return; }

    const toAdd = files.slice(0, remaining);
    for (const file of toAdd) {
        const dataUrl = await compressImage(file, 512, 0.5);
        state.images.push({ id: Date.now() + Math.random(), dataUrl, file });
    }
    if (files.length > remaining) showToast(`最多 6 张，已选前 ${remaining} 张~`);
    renderImageGrid(); updateButtons();
}

function removeImage(id) {
    state.images = state.images.filter(i => i.id != id);
    renderImageGrid(); updateButtons();
}

function clearAllImages() {
    state.images = [];
    state.currentResult = null;
    state.currentRawText = '';
    renderImageGrid(); updateButtons();
}

function compressImage(file, maxSize, quality) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width, h = img.height;
                if (w > maxSize || h > maxSize) {
                    const r = Math.min(maxSize / w, maxSize / h);
                    w = Math.round(w * r); h = Math.round(h * r);
                }
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(c.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function renderImageGrid() {
    const grid = $('#imageGrid');
    grid.innerHTML = '';
    state.images.forEach(img => {
        const slot = document.createElement('div');
        slot.className = 'image-slot filled';
        slot.innerHTML = `<img src="${img.dataUrl}" alt="食材"><button class="btn-remove" data-id="${img.id}">✕</button>`;
        grid.appendChild(slot);
    });
    if (state.images.length < 6) {
        const add = document.createElement('div');
        add.className = 'image-slot add-slot'; add.id = 'btnAddPhoto';
        add.innerHTML = '<div class="add-icon">+</div><span class="add-text">拍照/选图</span>';
        add.addEventListener('click', () => $('#fileInput').click());
        grid.appendChild(add);
    }
    $('#hintText').textContent = state.images.length === 0
        ? '📷 点击上方按钮拍照或从相册选图，支持多张'
        : `已选 ${state.images.length} 张图片，点击"开始识别"让 AI 帮你看看~`;
}

function updateButtons() {
    const h = state.images.length > 0;
    $('#btnRecognize').disabled = !h;
    $('#btnClear').disabled = !h;
}

function previewImage(src) { $('#previewImage').src = src; $('#modalImagePreview').classList.add('show'); }
function hideImagePreview() { $('#modalImagePreview').classList.remove('show'); }

function openImageSearch(dishName) {
    const query = encodeURIComponent(dishName);
    // 用搜狗图片搜索（对 iframe 嵌入友好一些）
    const url = `https://pic.sogou.com/pics?query=${query}&mode=1`;
    $('#imageSearchFrame').src = url;
    $('#imageFallbackLink').href = `https://www.baidu.com/s?wd=${query}%20成品图&t=2`;
    $('#imageFallbackLink').textContent = '在百度打开';
    $('#modalImageSearch').classList.add('show');
}
function hideImageSearch() {
    $('#modalImageSearch').classList.remove('show');
    $('#imageSearchFrame').src = '';
}

// ==================== AI 调用 ====================

/** 加载更多菜谱（排除已显示的） */
async function loadMoreRecipes() {
    const apiKey = localStorage.getItem('apikey');
    if (!apiKey) { showToast('请先配置 API Key~'); return; }
    if (!state.currentResult) return;

    const shown = state.currentResult.dishes.map(d => d.name);
    const ingredients = state.currentResult.ingredients;
    const list = ingredients.join('、');

    const prompt = `用户有这些食材：${list}

已推荐过的菜（请勿重复）：${shown.join('、')}

请作为中餐大厨，再推荐 10 道用这些食材能做的其他经典菜。

返回纯 JSON：
{
  "dishes": [
    {
      "name": "菜名",
      "difficulty": "简单",
      "time": "20分钟",
      "materials": ["材料"],
      "steps": ["第1步", "第2步"],
      "tip": "小贴士"
    }
  ]
}
要求：dishes 列 10 道，必须是上面"已推荐过"列表里没有的菜。`;

    showLoading('搜索更多菜谱中...');

    try {
        const result = await callAITextOnly(apiKey, prompt);
        hideLoading();

        if (result.dishes && result.dishes.length > 0) {
            // 追加到当前结果
            state.currentResult.dishes = [
                ...state.currentResult.dishes,
                ...result.dishes,
            ];
            renderResult(state.currentResult);
            switchPage('pageResult');
            showToast(`✅ 新增 ${result.dishes.length} 道菜谱`);
        } else {
            showToast('没有找到更多菜谱了~');
        }
    } catch (err) {
        hideLoading();
        showToast('加载失败：' + err.message);
    }
}

/** 纯文字 AI 调用（加载更多用） */
async function callAITextOnly(apiKey, prompt) {
    const provider = localStorage.getItem('aiProvider') || 'qwen';
    const customModel = localStorage.getItem('modelName') || '';

    let endpoint, model;
    switch (provider) {
        case 'deepseek':
            endpoint = 'https://api.deepseek.com/v1/chat/completions';
            model = customModel || 'deepseek-chat';
            break;
        case 'qwen':
            endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
            model = customModel || 'qwen-plus';
            break;
        case 'custom':
            endpoint = localStorage.getItem('customEndpoint') || '';
            model = customModel || '';
            if (!endpoint || !model) throw new Error('请填写 API 地址和模型名称');
            break;
        default: throw new Error('未知 AI 服务商');
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4096,
            temperature: 0.5,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        let msg = '';
        try { msg = JSON.parse(errText).error?.message || `HTTP ${response.status}`; }
        catch { msg = errText.substring(0, 100); }
        throw new Error(msg);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    return parseAIResponse(text);
}

async function startRecognition(editedIngredients) {
    // 如果传了 editedIngredients，说明是用户手动纠正后重新查
    const apiKey = localStorage.getItem('apikey');
    if (!apiKey) { showToast('请先配置 API Key~'); showSettings(); return; }

    if (!editedIngredients && state.images.length === 0) {
        showToast('请先拍照或选择图片~'); return;
    }

    showLoading(editedIngredients ? '正在重新查询菜谱...' : 'AI 正在识别食材中...');

    try {
        const result = await callAI(apiKey, editedIngredients);
        state.currentResult = result;
        if (!editedIngredients) saveToHistory(result);
        hideLoading();
        renderResult(result);
        switchPage('pageResult');
        if (result.conflicts && result.conflicts.length > 0) {
            setTimeout(() => showConflictAlert(result.conflicts), 600);
        }
    } catch (err) {
        hideLoading();
        console.error('识别失败:', err);
        renderErrorPage(err.message || '未知错误');
        switchPage('pageResult');
    }
}

async function callAI(apiKey, editedIngredients) {
    const provider = localStorage.getItem('aiProvider') || 'qwen';
    const customModel = localStorage.getItem('modelName') || '';

    const prompt = editedIngredients
        ? buildRecipeOnlyPrompt(editedIngredients)
        : buildVisionPrompt();

    let endpoint, model, headers, body;

    if (editedIngredients) {
        // 纯文字查询（不需要图片）
        switch (provider) {
            case 'deepseek':
                endpoint = 'https://api.deepseek.com/v1/chat/completions';
                model = customModel || 'deepseek-chat';
                break;
            case 'qwen':
                endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
                model = customModel || 'qwen-plus';  // 文字查询不需要 VL 模型
                break;
            case 'custom':
                endpoint = localStorage.getItem('customEndpoint') || '';
                model = customModel || '';
                if (!endpoint || !model) throw new Error('请填写 API 地址和模型名称');
                break;
            default: throw new Error('未知 AI 服务商');
        }

        headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
        body = {
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4096,
            temperature: 0.3,
        };
    } else {
        // 图片识别
        const imageContents = state.images.map(img => ({
            type: "image_url",
            image_url: { url: img.dataUrl }
        }));

        switch (provider) {
            case 'deepseek':
                endpoint = 'https://api.deepseek.com/v1/chat/completions';
                model = customModel || 'deepseek-chat';
                break;
            case 'qwen':
                endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
                model = customModel || 'qwen-vl-plus';
                break;
            case 'custom':
                endpoint = localStorage.getItem('customEndpoint') || '';
                model = customModel || '';
                if (!endpoint || !model) throw new Error('请填写 API 地址和模型名称');
                break;
            default: throw new Error('未知 AI 服务商');
        }

        headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
        body = {
            model,
            messages: [{
                role: 'user',
                content: [{ type: 'text', text: prompt }, ...imageContents]
            }],
            max_tokens: 4096,
            temperature: 0.3,
        };
    }

    // 发送请求
    let response;
    try {
        response = await fetch(endpoint, {
            method: 'POST', headers, body: JSON.stringify(body),
        });
    } catch (fetchErr) {
        throw new Error(
            `🌐 网络请求失败\n` +
            `1. 检查网络连接\n` +
            `2. 如果是从本地文件打开的，请部署到服务器（参考使用说明）\n` +
            `3. API 地址：${endpoint}\n\n原始错误：${fetchErr.message}`
        );
    }

    if (!response.ok) {
        const errorText = await response.text();
        let errMsg = '';
        try {
            const j = JSON.parse(errorText);
            errMsg = j.error?.message || j.message || `HTTP ${response.status}`;
            if (errMsg.includes('image') || errMsg.includes('vision') || errMsg.includes('multimodal')) {
                errMsg = `⚠️ 当前模型不支持图片！请在设置中切换到"通义千问"\n\n原始：${errMsg}`;
            } else if (errMsg.includes('auth') || errMsg.includes('key') || errMsg.includes('401') || errMsg.includes('403')) {
                errMsg = `🔑 API Key 无效，请重新设置\n\n原始：${errMsg}`;
            } else if (errMsg.includes('rate') || errMsg.includes('quota') || errMsg.includes('429')) {
                errMsg = `⏳ 额度用完/限流，请稍后或换 Key\n\n原始：${errMsg}`;
            }
        } catch { errMsg = `HTTP ${response.status}: ${errorText.substring(0, 200)}`; }
        throw new Error(errMsg);
    }

    const data = await response.json();
    const aiText = data.choices[0].message.content;
    state.currentRawText = aiText;  // 保存原始回复

    return parseAIResponse(aiText, editedIngredients);
}

function buildVisionPrompt() {
    return `你是中餐大厨。看图片，识别所有食材，然后告诉我能做什么菜。

请返回纯 JSON（不要加解释，不要加 markdown）：

{
  "ingredients": ["食材1", "食材2"],
  "canCookTogether": true,
  "dishes": [
    {
      "name": "菜名",
      "difficulty": "简单",
      "time": "20分钟",
      "materials": ["主料", "辅料"],
      "steps": ["第1步：...", "第2步：..."],
      "tip": "小贴士"
    }
  ],
  "alternatives": [
    { "ingredient": "食材A", "canMake": ["菜1", "菜2"] }
  ],
  "conflicts": [
    { "food1": "食物A", "food2": "食物B", "reason": "原因" }
  ],
  "nutrition": "营养说明一句话"
}

重要：
- ingredients 必须列出所有识别到的食材
- dishes 务必列出该食材 10 道最经典的做法（不要少于10道），每道都要有完整步骤
- 比如里脊肉：糖醋里脊、鱼香肉丝、锅包肉、青椒肉丝、干炸里脊、葱爆肉、水煮肉片、宫保肉丁、回锅肉、木须肉
- 如果食材不能一起做，canCookTogether 填 false，在 alternatives 里分别说每种能做什么
- conflicts 注意海鲜+维C、柿子+螃蟹等相克组合
- 步骤要具体可操作，每道菜至少 3 步`;
}

function buildRecipeOnlyPrompt(ingredients) {
    const arr = ensureArray(ingredients);
    const list = arr.join('、');
    return `用户有这些食材：${list}

请作为中餐大厨，告诉我能用这些食材做什么菜，尽量列满 10 道经典做法。

请返回纯 JSON（不要加解释）：

{
  "ingredients": ${JSON.stringify(arr)},
  "canCookTogether": true,
  "dishes": [
    {
      "name": "菜名",
      "difficulty": "简单",
      "time": "20分钟",
      "materials": ["材料1", "材料2"],
      "steps": ["第1步：...", "第2步：..."],
      "tip": "小贴士"
    }
  ],
  "alternatives": [],
  "conflicts": [],
  "nutrition": "营养说明"
}

要求：dishes 务必列满 10 道经典家常做法（不要少），每道至少 3 个步骤。`;
}

// ==================== 工具函数 ====================
/** 确保食材一定是数组 */
function ensureArray(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(/[,，、\s]+/).map(s => s.trim()).filter(Boolean);
    return [];
}

// ==================== JSON 解析（核心修复） ====================
function parseAIResponse(text, editedIngredients) {
    const cleanText = text.trim();

    // 策略1：直接解析
    try { return normalizeResult(JSON.parse(cleanText), editedIngredients); } catch (e) {}

    // 策略2：去除 markdown 代码块后解析
    const noMd = cleanText
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
    try { return normalizeResult(JSON.parse(noMd), editedIngredients); } catch (e) {}

    // 策略3：正则提取 JSON 块
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try { return normalizeResult(JSON.parse(jsonMatch[0]), editedIngredients); } catch (e) {}
    }

    // 策略4：部分提取（就算 JSON 不完全对，也尽量提取有用信息）
    console.warn('所有 JSON 解析策略均失败，原始回复：', text);
    const partial = extractPartialResult(cleanText, editedIngredients);
    partial._parseFailed = true;
    partial._rawText = text;
    return partial;
}

function normalizeResult(result, editedIngredients) {
    const ingredients = ensureArray(editedIngredients || result.ingredients || []);
    return {
        ingredients,
        canCookTogether: result.canCookTogether !== false,
        dishes: ensureArray(result.dishes || result.suggestedDishes || []).map(d => {
            if (typeof d === 'string') return { name: d, difficulty: '中等', time: '约30分钟', materials: ingredients, steps: [], tip: '' };
            return {
                name: d.name || '未命名菜品',
                difficulty: d.difficulty || '中等',
                time: d.time || d.cookingTime || '约30分钟',
                materials: ensureArray(d.materials || d.ingredients_needed || []),
                steps: ensureArray(d.steps || []),
                tip: d.tip || d.tips || '',
            };
        }),
        alternatives: ensureArray(result.alternatives || result.alternativeDishes || []).map(a => ({
            ingredient: typeof a === 'string' ? a : (a.ingredient || ''),
            canMake: ensureArray(typeof a === 'string' ? [] : (a.canMake || a.dishes || [])),
        })),
        conflicts: ensureArray(result.conflicts || []).filter(c =>
            typeof c === 'object' && c !== null && (c.food1 || c.food2)
        ),
        nutrition: result.nutrition || result.nutritionalNotes || '',
    };
}

function extractPartialResult(text, editedIngredients) {
    const result = {
        ingredients: ensureArray(editedIngredients || []),
        canCookTogether: true,
        dishes: [],
        alternatives: [],
        conflicts: [],
        nutrition: '',
    };

    // 尝试提取食材
    const ingMatch = text.match(/食材[：:]\s*(.+?)(?:[。，\n]|$)/);
    if (ingMatch && !editedIngredients) {
        result.ingredients = ensureArray(ingMatch[1]);
    }

    // 尝试提取菜名
    const dishNames = [];
    const nameRegex = /(?:菜名|推荐|可以做的菜)[：:]*\s*(.+?)(?:[。，\n]|$)/g;
    let m;
    while ((m = nameRegex.exec(text)) !== null) {
        dishNames.push(m[1].trim());
    }
    // 也尝试找 "name" JSON 字段
    const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/g);
    if (nameMatch) {
        nameMatch.forEach(n => {
            const v = n.match(/"([^"]+)"$/);
            if (v) dishNames.push(v[1]);
        });
    }

    if (dishNames.length > 0) {
        result.dishes = dishNames.map(n => ({
            name: n,
            difficulty: '中等',
            time: '约30分钟',
            materials: result.ingredients,
            steps: [text],
            tip: '',
        }));
    } else {
        // 最后兜底：把整个回复当作一个"结果"
        const label = result.ingredients.length > 0 ? result.ingredients.join('') : '食材';
        result.dishes = [{
            name: label + '做法',
            difficulty: '中等',
            time: '约30分钟',
            materials: result.ingredients,
            steps: [text],
            tip: 'AI 返回格式异常，上方为原始回复内容',
        }];
    }

    // 合并本地冲突数据
    if (result.ingredients.length > 0) {
        const localConflicts = findAllConflicts(result.ingredients);
        result.conflicts = localConflicts;
    }

    return result;
}

// ==================== 结果渲染 ====================
function renderErrorPage(errorMsg) {
    const container = $('#resultContent');
    container.innerHTML = `
        <div class="result-card" style="border:2px solid #EF4444;">
            <h3>❌ 出错了</h3>
            <div style="background:#FEF2F2;padding:14px;border-radius:8px;margin:10px 0;white-space:pre-wrap;font-size:14px;line-height:1.8;">
                ${escapeHtml(errorMsg)}
            </div>
            <div style="margin-top:12px;font-size:13px;color:#757575;line-height:2;">
                <p>💡 <strong>试试：</strong></p>
                <p>• 右上角 ⚙️ → 切换到 <strong>通义千问</strong></p>
                <p>• 确认 API Key 正确粘贴</p>
                <p>• 确认图片清晰、不太大</p>
                <p>• 按 F12 查看控制台详细错误</p>
            </div>
        </div>
    `;
}

function renderResult(result) {
    const container = $('#resultContent');
    let html = '';

    // === 1. 食材标签（可编辑） ===
    html += `
        <div class="result-card" id="ingredientCard">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <h3 style="margin:0;">🥬 识别到的食材</h3>
                <button class="btn btn-ghost" id="btnEditIngredients" style="font-size:13px;padding:6px 12px;">
                    ✏️ 纠正食材
                </button>
            </div>
            <div class="ingredient-tags" id="ingredientTags">
                ${ensureArray(result.ingredients).length > 0
                    ? ensureArray(result.ingredients).map(i => `<span class="ingredient-tag">${escapeHtml(i)}</span>`).join('')
                    : '<span style="color:#9E9E9E;">（未识别到食材，点击"纠正食材"手动输入）</span>'}
            </div>
            <!-- 编辑区域（默认隐藏） -->
            <div id="editIngredientsArea" style="display:none;margin-top:10px;">
                <input type="text" id="editIngredientsInput" class="input"
                    placeholder="输入食材，用逗号分隔，如：里脊肉,青椒,鸡蛋"
                    value="${escapeHtml(ensureArray(result.ingredients).join('，'))}">
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button class="btn btn-primary" id="btnUpdateIngredients" style="flex:1;font-size:14px;">
                        🔄 用这些食材重新查菜谱
                    </button>
                    <button class="btn btn-ghost" id="btnCancelEdit" style="flex:1;font-size:14px;">
                        取消
                    </button>
                </div>
            </div>
        </div>
    `;

    // === 2. 组合判断 ===
    const canText = result.canCookTogether ? '✅ 这些食材可以一起做菜！' : '❌ 这些食材不太适合一起做';
    const canBadge = result.canCookTogether ? 'ok' : 'no';
    html += `
        <div class="result-card">
            <h3>🍳 组合判断</h3>
            <span class="compatibility-badge ${canBadge}">${canText}</span>
        </div>
    `;

    // === 3. 冲突警告 ===
    const validConflicts = (result.conflicts || []).filter(c =>
        typeof c === 'object' && c !== null && (c.food1 || c.food2)
    );
    if (validConflicts.length > 0) {
        html += `
            <div class="result-card">
                <h3>⚠️ 食物相克提醒</h3>
                ${validConflicts.map(c => `
                    <div class="conflict-warning">
                        <strong>${escapeHtml(c.food1 || '?')} + ${escapeHtml(c.food2 || '?')}</strong>：${escapeHtml(c.reason || '')}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // === 4. 推荐菜谱 ===
    if (result.dishes && result.dishes.length > 0) {
        html += `<div class="result-card"><h3>📖 推荐菜谱（共 ${result.dishes.length} 道）</h3>`;

        // 时间筛选按钮
        html += `<div class="time-filter">
            <button class="time-filter-btn active" data-filter="all">全部</button>
            <button class="time-filter-btn" data-filter="fast">⚡ 15分钟内</button>
            <button class="time-filter-btn" data-filter="mid">⏱ 15-30分钟</button>
            <button class="time-filter-btn" data-filter="slow">🕐 30分钟以上</button>
        </div>`;

        html += `<div id="dishesContainer">`;
        result.dishes.forEach((dish, idx) => {
            const dishName = dish.name || '菜品';
            const mins = parseCookingMinutes(dish.time);
            const timeClass = mins <= 15 ? 'fast' : (mins <= 30 ? 'mid' : 'slow');
            html += `
                <div class="recipe-section dish-item" data-time="${timeClass}" data-idx="${idx}">
                    <h4>🍽 ${escapeHtml(dishName)}
                        <span style="font-weight:400;font-size:13px;color:#9E9E9E;">
                            · ${escapeHtml(dish.difficulty || '')} · ${escapeHtml(dish.time || '')}
                        </span>
                    </h4>
                    ${dish.materials && dish.materials.length > 0 ? `
                        <p style="font-size:13px;color:#757575;margin:6px 0;">
                            🛒 材料：${dish.materials.map(i => escapeHtml(i)).join('、')}
                        </p>
                    ` : ''}
                    ${dish.steps && dish.steps.length > 0 ? `
                        <div class="recipe-text">${dish.steps.map((s, i) => `${i + 1}. ${escapeHtml(s)}`).join('\n')}</div>
                    ` : ''}
                    ${dish.tip ? `<p style="margin-top:8px;font-size:13px;color:#F59E0B;">💡 ${escapeHtml(dish.tip)}</p>` : ''}
                    <button class="dish-image-btn" onclick="openImageSearch('${jsEscape(dishName)}')">🖼 查看成品图</button>
                    <div class="video-links">
                        ${buildVideoLinks(dishName)}
                    </div>
                    ${(ensureArray(result.ingredients).length > 0) ? `
                        <div class="video-links" style="margin-top:4px;">
                            <span style="font-size:11px;color:#9E9E9E;margin-right:4px;">搜食材：</span>
                            ${ensureArray(result.ingredients).slice(0, 3).map(ing => `
                                <a class="video-link browser" href="https://www.baidu.com/s?wd=${encodeURIComponent(ing + ' 做法')}" target="_blank" rel="noopener" style="font-size:11px;padding:5px 10px;">
                                    🔍 ${escapeHtml(ing)}做法
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        html += `</div>`;  // 关闭 dishesContainer
        html += `</div>`;  // 关闭 result-card

        // 加载更多按钮
        html += `
            <div style="text-align:center;margin:10px 0 16px;">
                <button class="btn btn-outline" id="btnLoadMore" style="font-size:15px;padding:14px 28px;">
                    🍳 查看更多菜谱（再搜 10 道）
                </button>
            </div>
        `;
    }

    // === 5. 备选做法 ===
    if (result.alternatives && result.alternatives.length > 0) {
        html += `<div class="result-card"><h3>🔄 单独来看</h3>`;
        result.alternatives.forEach(alt => {
            html += `
                <div style="margin:8px 0;">
                    <strong>${escapeHtml(alt.ingredient)}：</strong>
                    ${(alt.canMake || []).map(d => escapeHtml(d)).join('、') || '暂无'}
                </div>
            `;
        });
        html += `</div>`;
    }

    // === 6. 营养说明 ===
    if (result.nutrition) {
        html += `
            <div class="result-card">
                <h3>💪 营养小贴士</h3>
                <p style="font-size:14px;line-height:1.8;">${escapeHtml(result.nutrition)}</p>
            </div>
        `;
    }

    // === 7. 如果 JSON 解析失败，显示 AI 原始回复 ===
    if (result._parseFailed && result._rawText) {
        html += `
            <div class="result-card" style="border:1px dashed #F59E0B;">
                <h3>⚠️ AI 原始回复（解析失败，仅供参考）</h3>
                <div class="recipe-text" style="max-height:300px;overflow-y:auto;">${escapeHtml(result._rawText)}</div>
            </div>
        `;
    }

    container.innerHTML = html;

    // === 绑定事件：食材编辑、加载更多、时间筛选 ===
    setTimeout(() => {
        const btnEdit = $('#btnEditIngredients');
        const btnUpdate = $('#btnUpdateIngredients');
        const btnCancel = $('#btnCancelEdit');
        const btnLoadMore = $('#btnLoadMore');
        if (btnEdit) btnEdit.addEventListener('click', showEditIngredients);
        if (btnUpdate) btnUpdate.addEventListener('click', updateIngredientsAndRetry);
        if (btnCancel) btnCancel.addEventListener('click', hideEditIngredients);
        if (btnLoadMore) btnLoadMore.addEventListener('click', loadMoreRecipes);

        // 时间筛选按钮
        document.querySelectorAll('.time-filter-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.time-filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filter = this.dataset.filter;
                document.querySelectorAll('.dish-item').forEach(dish => {
                    if (filter === 'all' || dish.dataset.time === filter) {
                        dish.style.display = '';
                    } else {
                        dish.style.display = 'none';
                    }
                });
            });
        });
    }, 100);
}

function buildVideoLinks(dishName) {
    // 确保搜索词有效
    const searchTerm = dishName && dishName !== 'AI 识别结果' && dishName !== '未命名菜品'
        ? dishName + ' 做法'
        : '';
    if (!searchTerm) return '';
    const encoded = encodeURIComponent(searchTerm);

    return `
        <a class="video-link douyin" href="https://www.douyin.com/search/${encoded}" target="_blank" rel="noopener">
            🎵 抖音搜索
        </a>
        <a class="video-link kuaishou" href="https://www.kuaishou.com/search/video?searchKey=${encoded}" target="_blank" rel="noopener">
            ⚡ 快手搜索
        </a>
        <a class="video-link bilibili" href="https://search.bilibili.com/all?keyword=${encoded}" target="_blank" rel="noopener">
            📺 B站搜索
        </a>
        <a class="video-link browser" href="https://www.baidu.com/s?wd=${encoded}" target="_blank" rel="noopener">
            🌐 百度搜索
        </a>
    `;
}

// === 食材编辑功能 ===
function showEditIngredients() {
    $('#editIngredientsArea').style.display = 'block';
    $('#btnEditIngredients').style.display = 'none';
    $('#editIngredientsInput').focus();
}

function hideEditIngredients() {
    $('#editIngredientsArea').style.display = 'none';
    $('#btnEditIngredients').style.display = '';
}

function updateIngredientsAndRetry() {
    const raw = $('#editIngredientsInput').value.trim();
    if (!raw) { showToast('请输入食材名称~'); return; }

    // 解析用户输入的食材
    const ingredients = raw
        .split(/[,，、\s]+/)
        .map(s => s.trim())
        .filter(Boolean);

    if (ingredients.length === 0) { showToast('请输入至少一个食材~'); return; }

    hideEditIngredients();
    // 用新食材重新查询（纯文字模式，不传图片）
    startRecognition(ingredients);
}

// ==================== 食物相克 ====================
function doConflictCheck() {
    const f1 = $('#conflictInput1').value.trim();
    const f2 = $('#conflictInput2').value.trim();
    if (!f1 || !f2) { showToast('请输入两种食物~'); return; }
    const r = checkConflict(f1, f2);
    const div = $('#conflictResult');
    if (r) {
        div.className = 'conflict-result show danger';
        div.innerHTML = `⚠️ <strong>${escapeHtml(f1)} + ${escapeHtml(f2)}</strong> 不能一起吃！<br>
            <span style="font-weight:400;font-size:14px;">${escapeHtml(r.reason)}</span>`;
    } else {
        div.className = 'conflict-result show safe';
        div.innerHTML = `✅ <strong>${escapeHtml(f1)} + ${escapeHtml(f2)}</strong> 没有已知冲突~`;
    }
}

function showConflictAlert(conflicts) {
    // 过滤无效冲突
    const valid = (conflicts || []).filter(c =>
        typeof c === 'object' && c !== null && (c.food1 || c.food2)
    );
    if (valid.length === 0) return;

    const content = $('#conflictAlertContent');
    content.innerHTML = valid.map(c => `
        <div class="conflict-warning" style="margin:8px 0;text-align:left;">
            <strong>${escapeHtml(c.food1 || '?')} + ${escapeHtml(c.food2 || '?')}</strong><br>${escapeHtml(c.reason || '')}
        </div>
    `).join('');
    $('#modalConflictAlert').classList.add('show');
}
function hideConflictAlert() { $('#modalConflictAlert').classList.remove('show'); }

// ==================== 历史记录 ====================
function saveToHistory(result) {
    const record = {
        time: new Date().toISOString(),
        ingredients: result.ingredients || [],
        dishes: (result.dishes || []).map(d => d.name),
        conflicts: result.conflicts || [],
        canCookTogether: result.canCookTogether,
    };
    state.history.unshift(record);
    if (state.history.length > 50) state.history = state.history.slice(0, 50);
    persistHistory();
}

function renderHistory() {
    const container = $('#historyList');
    if (state.history.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:40px;color:#9E9E9E;">
            <p style="font-size:48px;">📋</p><p>还没有历史记录~</p></div>`;
        return;
    }
    container.innerHTML = state.history.map((h, i) => `
        <div class="history-item" data-index="${i}">
            <div class="history-time">🕐 ${formatTime(h.time)}</div>
            <div class="history-ingredients">
                ${ensureArray(h.ingredients).map(ing => `<span class="ingredient-tag" style="font-size:11px;">${escapeHtml(ing)}</span>`).join(' ')}
            </div>
            ${h.canCookTogether
                ? `<div class="history-dish">✅ 可做：${h.dishes.join('、') || '查看详情'}</div>`
                : `<div class="history-dish" style="color:#EF4444;">❌ 不适合一起做</div>`}
            ${h.conflicts.length > 0 ? `<div style="font-size:11px;color:#EF4444;">⚠️ ${h.conflicts.length} 个相克提醒</div>` : ''}
        </div>
    `).join('');

    $$('.history-item').forEach(item => {
        item.addEventListener('click', function () {
            const h = state.history[parseInt(this.dataset.index)];
            const parts = [h.canCookTogether ? `✅ ${h.dishes.join('、')}` : '❌ 不适合一起做'];
            if (h.conflicts.length > 0) parts.push(`⚠️ ${h.conflicts.map(c => c.food1 + '+' + c.food2).join(', ')}`);
            showToast(parts.join(' | '), 3000);
        });
    });
}

function formatTime(iso) {
    const d = new Date(iso), now = new Date(), diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function persistHistory() {
    try { localStorage.setItem('history', JSON.stringify(state.history)); }
    catch { state.history = state.history.slice(0, 20); localStorage.setItem('history', JSON.stringify(state.history)); }
}
function loadHistory() {
    try { const r = localStorage.getItem('history'); if (r) state.history = JSON.parse(r); } catch { state.history = []; }
}

// ==================== 设置 ====================
function showSettings() {
    $('#aiProvider').value = localStorage.getItem('aiProvider') || 'qwen';
    $('#apiKey').value = localStorage.getItem('apikey') || '';
    $('#customEndpoint').value = localStorage.getItem('customEndpoint') || '';
    $('#modelName').value = localStorage.getItem('modelName') || '';
    onProviderChange();
    $('#modalSettings').classList.add('show');
}
function hideSettings() { $('#modalSettings').classList.remove('show'); }

function onProviderChange() {
    const p = $('#aiProvider').value;
    const hint = $('#apiKeyHint');
    const model = $('#modelName');
    if (p === 'custom') {
        $('#customApiFields').style.display = 'block';
        hint.innerHTML = '输入自定义 API 地址和 Key';
        model.placeholder = '如 gpt-4o, claude-3-5-sonnet';
    } else if (p === 'deepseek') {
        $('#customApiFields').style.display = 'none';
        hint.innerHTML = '去 <a href="https://platform.deepseek.com" target="_blank">platform.deepseek.com</a> 获取 Key ⚠️ 可能不支持图片';
        model.placeholder = '留空用 deepseek-chat，或填支持图片的模型名';
    } else {
        $('#customApiFields').style.display = 'none';
        hint.innerHTML = '去 <a href="https://dashscope.aliyun.com" target="_blank">dashscope.aliyun.com</a> 获取 Key ✅ 推荐';
        model.placeholder = '留空用 qwen-vl-plus，或填 qwen-vl-max';
    }
}

function saveSettings() {
    const apiKey = $('#apiKey').value.trim();
    if (!apiKey) { showToast('请输入 API Key~'); return; }
    localStorage.setItem('aiProvider', $('#aiProvider').value);
    localStorage.setItem('apikey', apiKey);
    localStorage.setItem('customEndpoint', $('#customEndpoint').value.trim());
    localStorage.setItem('modelName', $('#modelName').value.trim());
    hideSettings();
    showToast('✅ 设置已保存');
}

function loadSettings() {}

// ==================== UI 工具 ====================
function switchPage(pageId) {
    $$('.page').forEach(p => p.classList.remove('active'));
    const target = $(`#${pageId}`);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'pageConflict') renderConflictList();
    if (pageId === 'pageNoodles') renderNoodlePage();
    if (pageId === 'pagePicker') renderPickerPage();

    // 更新标题
    const titles = {
        pageHome: '📸 拍照识菜', pageResult: '📖 识别结果', pageConflict: '⚠️ 食物相克',
        pageHistory: '📋 历史记录', pageSearch: '🔎 搜菜谱', pageNoodles: '🍜 面食大全',
        pageDessert: '🍰 甜品大全', pageAirfryer: '🔥 空气炸锅', pagePicker: '🥬 选食材',
        pageKitchen: '👩‍🍳 厨神厨房', pageOrder: '📋 点菜',
    };
    $('#headerTitle').textContent = titles[pageId] || '📸 拍照识菜';
}

function renderConflictList() {
    $('#conflictList').innerHTML = `
        <h3>⚠️ 常见食物相克（高严重度）</h3>
        ${FOOD_CONFLICTS.filter(c => c.severity === 'high').map(c => `
            <div class="conflict-item">
                <span class="foods">${c.foods.join(' + ')}</span>
                <span class="reason">${c.reason}</span>
            </div>
        `).join('')}
    `;
}

function showLoading(t) { $('#loadingText').textContent = t || 'AI 正在识别中...'; $('#loadingOverlay').classList.add('show'); }
function hideLoading() { $('#loadingOverlay').classList.remove('show'); }

function showToast(msg, dur = 2500) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => t.classList.remove('show'), dur);
}

function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/** JS 字符串转义（用于 onclick 等属性中） */
function jsEscape(str) {
    if (typeof str !== 'string') return String(str || '');
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// ==================== 时间解析 ====================
function parseCookingMinutes(timeStr) {
    if (!timeStr) return 30; // 默认30分钟
    const s = String(timeStr);
    const match = s.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30;
}

// ==================== 知道吃什么（直接搜菜名） ====================
async function searchDishByName() {
    const dishName = $('#searchDishInput').value.trim();
    if (!dishName) { showToast('请输入菜名~'); return; }

    const apiKey = localStorage.getItem('apikey');
    if (!apiKey) { showToast('请先配置 API Key~'); showSettings(); return; }

    showLoading(`搜索 ${dishName} 的做法...`);

    try {
        const prompt = `请作为中餐大厨，告诉我"${dishName}"的详细做法。

返回纯 JSON：
{
  "ingredients": ["${dishName}"],
  "canCookTogether": true,
  "dishes": [
    {
      "name": "${dishName}",
      "difficulty": "简单/中等/困难",
      "time": "约XX分钟",
      "materials": ["材料1", "材料2"],
      "steps": ["第1步：...", "第2步：..."],
      "tip": "小贴士"
    }
  ],
  "alternatives": [],
  "conflicts": [],
  "nutrition": ""
}
要求：至少列 3 种不同做法（如不同口味、不同烹饪方式），每种都详细。`;

        const result = await callAITextOnly(apiKey, prompt);
        hideLoading();
        state.currentResult = result;
        renderResult(result);
        switchPage('pageResult');
    } catch (err) {
        hideLoading();
        renderErrorPage(err.message);
        switchPage('pageResult');
    }
}

// ==================== 快速选食材 ====================
let _pickedIngredients = [];

function renderPickerPage() {
    _pickedIngredients = [];
    const catContainer = $('#pickerCategories');
    catContainer.innerHTML = INGREDIENT_CATEGORIES.map(cat => `
        <div class="picker-category">
            <h4>${cat.name}</h4>
            <div class="picker-items">
                ${cat.items.map(item => `
                    <span class="picker-item" data-ing="${escapeHtml(item)}">${escapeHtml(item)}</span>
                `).join('')}
            </div>
        </div>
    `).join('');

    // 绑定点击事件
    catContainer.querySelectorAll('.picker-item').forEach(el => {
        el.addEventListener('click', () => togglePickItem(el));
    });

    updatePickedDisplay();
    updatePickerButton();
}

function togglePickItem(el) {
    const ing = el.dataset.ing;
    if (_pickedIngredients.includes(ing)) {
        _pickedIngredients = _pickedIngredients.filter(i => i !== ing);
        el.classList.remove('selected');
    } else {
        if (_pickedIngredients.length >= 10) { showToast('最多选 10 种食材~'); return; }
        _pickedIngredients.push(ing);
        el.classList.add('selected');
    }
    updatePickedDisplay();
    updatePickerButton();
}

function updatePickedDisplay() {
    const container = $('#pickedIngredients');
    if (_pickedIngredients.length === 0) {
        container.innerHTML = '<span style="color:#9E9E9E;">👆 点击上方食材添加到列表</span>';
    } else {
        container.innerHTML = _pickedIngredients.map(i =>
            `<span class="ingredient-tag" style="cursor:pointer;" data-ing="${escapeHtml(i)}">${escapeHtml(i)} ✕</span>`
        ).join('');
        // 点击标签移除
        container.querySelectorAll('.ingredient-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                _pickedIngredients = _pickedIngredients.filter(i => i !== tag.dataset.ing);
                // 取消选中状态
                $('#pickerCategories').querySelectorAll('.picker-item').forEach(el => {
                    if (el.dataset.ing === tag.dataset.ing) el.classList.remove('selected');
                });
                updatePickedDisplay();
                updatePickerButton();
            });
        });
    }
}

function updatePickerButton() {
    $('#btnPickerSearch').disabled = _pickedIngredients.length === 0;
}

function clearPickedIngredients() {
    _pickedIngredients = [];
    $('#pickerCategories').querySelectorAll('.picker-item').forEach(el => el.classList.remove('selected'));
    updatePickedDisplay();
    updatePickerButton();
}

async function searchByPickedIngredients() {
    if (_pickedIngredients.length === 0) { showToast('请先选择食材~'); return; }
    startRecognition(_pickedIngredients);
}

// ==================== 面食大全 ====================
function renderNoodlePage() {
    const grid = $('#noodleGrid');
    const detail = $('#noodleDetail');

    grid.style.display = 'grid';
    detail.style.display = 'none';

    grid.innerHTML = NOODLE_RECIPES.map((r, i) => `
        <div class="noodle-card" data-idx="${i}">
            <div>${r.name}</div>
            <div class="noodle-time">${r.time}</div>
            <div class="noodle-diff">${r.difficulty}</div>
        </div>
    `).join('');

    grid.querySelectorAll('.noodle-card').forEach(card => {
        card.addEventListener('click', () => {
            const idx = parseInt(card.dataset.idx);
            showNoodleDetail(idx);
        });
    });
}

function showNoodleDetail(idx) {
    const r = NOODLE_RECIPES[idx];
    if (!r) return;

    const grid = $('#noodleGrid');
    const detail = $('#noodleDetail');

    grid.style.display = 'none';
    detail.style.display = 'block';

    const searchTerm = encodeURIComponent(r.name + ' 做法');
    detail.innerHTML = `
        <div class="noodle-detail-card">
            <h3>🍜 ${escapeHtml(r.name)}</h3>
            <p style="color:#9E9E9E;font-size:13px;">⏱ ${escapeHtml(r.time)} · ${escapeHtml(r.difficulty)}</p>
            <p style="margin-top:10px;font-size:14px;">🛒 <strong>材料：</strong>${r.materials.map(m => escapeHtml(m)).join('、')}</p>
            <div class="recipe-text" style="margin-top:10px;">${r.steps.map((s, i) => `${i + 1}. ${escapeHtml(s)}`).join('\n')}</div>
            <p style="margin-top:10px;color:#F59E0B;font-size:13px;">💡 ${escapeHtml(r.tip)}</p>
            <button class="dish-image-btn" onclick="openImageSearch('${jsEscape(r.name)}')">🖼 查看成品图</button>
            <div class="video-links" style="margin-top:8px;">
                <a class="video-link douyin" href="https://www.douyin.com/search/${searchTerm}" target="_blank">🎵 抖音</a>
                <a class="video-link kuaishou" href="https://www.kuaishou.com/search/video?searchKey=${searchTerm}" target="_blank">⚡ 快手</a>
                <a class="video-link bilibili" href="https://search.bilibili.com/all?keyword=${searchTerm}" target="_blank">📺 B站</a>
                <a class="video-link browser" href="https://www.baidu.com/s?wd=${searchTerm}" target="_blank">🌐 百度</a>
            </div>
            <button class="btn btn-outline" onclick="renderNoodlePage()" style="margin-top:12px;">◀ 返回列表</button>
        </div>
    `;
}

// ==================== 文字输入搜索 ====================
async function searchByTextInput() {
    const raw = $('#textIngredientsInput').value.trim();
    if (!raw) { showToast('请输入食材名称~'); return; }
    const ingredients = raw.split(/[,，、\s]+/).map(s => s.trim()).filter(Boolean);
    if (ingredients.length === 0) { showToast('请输入至少一个食材~'); return; }
    startRecognition(ingredients);
}

// ==================== 甜品大全 ====================
function renderDessertPage() {
    const grid = $('#dessertGrid');
    const detail = $('#dessertDetail');
    grid.style.display = 'grid';
    detail.style.display = 'none';

    grid.innerHTML = DESSERT_RECIPES.map((r, i) => `
        <div class="noodle-card dessert-card" data-idx="${i}">
            <div>${r.name}</div>
            <div class="noodle-time">${r.time}</div>
            <div class="noodle-diff">${r.difficulty}</div>
        </div>
    `).join('');

    grid.querySelectorAll('.dessert-card').forEach(card => {
        card.addEventListener('click', () => showDessertDetail(parseInt(card.dataset.idx)));
    });
}

function showDessertDetail(idx) {
    const r = DESSERT_RECIPES[idx];
    if (!r) return;
    const grid = $('#dessertGrid');
    const detail = $('#dessertDetail');
    grid.style.display = 'none';
    detail.style.display = 'block';

    const st = encodeURIComponent(r.name + ' 做法');
    detail.innerHTML = `
        <div class="noodle-detail-card">
            <h3>🍰 ${escapeHtml(r.name)}</h3>
            <p style="color:#9E9E9E;font-size:13px;">⏱ ${escapeHtml(r.time)} · ${escapeHtml(r.difficulty)}</p>
            <p style="margin-top:10px;font-size:14px;">🛒 <strong>材料：</strong>${r.materials.map(m => escapeHtml(m)).join('、')}</p>
            <div class="recipe-text" style="margin-top:10px;">${r.steps.map((s, i) => `${i + 1}. ${escapeHtml(s)}`).join('\n')}</div>
            <p style="margin-top:10px;color:#F59E0B;font-size:13px;">💡 ${escapeHtml(r.tip)}</p>
            <button class="dish-image-btn" onclick="openImageSearch('${jsEscape(r.name)}')">🖼 查看成品图</button>
            <div class="video-links" style="margin-top:8px;">
                <a class="video-link douyin" href="https://www.douyin.com/search/${st}" target="_blank">🎵 抖音</a>
                <a class="video-link kuaishou" href="https://www.kuaishou.com/search/video?searchKey=${st}" target="_blank">⚡ 快手</a>
                <a class="video-link bilibili" href="https://search.bilibili.com/all?keyword=${st}" target="_blank">📺 B站</a>
                <a class="video-link browser" href="https://www.baidu.com/s?wd=${st}" target="_blank">🌐 百度</a>
            </div>
            <button class="btn btn-outline" onclick="renderDessertPage()" style="margin-top:12px;">◀ 返回列表</button>
        </div>
    `;
}

// ==================== 空气炸锅大全 ====================
let _airfryerFilter = 'all';
let _airfryerTab = 'all';

function renderAirfryerPage() {
    _airfryerFilter = 'all';
    _airfryerTab = 'all';
    document.querySelectorAll('#airfryerTimeFilter .time-filter-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    document.querySelectorAll('.airfryer-tab').forEach((b, i) => b.classList.toggle('active', i === 0));
    renderAirfryerList();

    // 时间筛选
    document.querySelectorAll('#airfryerTimeFilter .time-filter-btn').forEach(btn => {
        btn.onclick = function () {
            document.querySelectorAll('#airfryerTimeFilter .time-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            _airfryerFilter = this.dataset.filter;
            renderAirfryerList();
        };
    });

    // 分类切换
    document.querySelectorAll('.airfryer-tab').forEach(btn => {
        btn.onclick = function () {
            document.querySelectorAll('.airfryer-tab').forEach(b => { b.classList.remove('active'); b.classList.add('btn-outline'); b.classList.remove('btn-primary'); });
            this.classList.add('active'); this.classList.add('btn-primary'); this.classList.remove('btn-outline');
            _airfryerTab = this.dataset.tab;
            renderAirfryerList();
        };
    });
}

function renderAirfryerList() {
    let items = AIRFRYER_RECIPES;
    if (_airfryerTab !== 'all') items = items.filter(r => r.category === _airfryerTab);
    if (_airfryerFilter === 'fast') items = items.filter(r => r.time <= 10);
    else if (_airfryerFilter === 'mid') items = items.filter(r => r.time > 10 && r.time <= 20);
    else if (_airfryerFilter === 'slow') items = items.filter(r => r.time > 20);

    const container = $('#airfryerList');
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#9E9E9E;padding:20px;">没有匹配项</p>';
        return;
    }

    // 按时间排序
    items.sort((a, b) => a.time - b.time);

    container.innerHTML = items.map(r => `
        <div class="airfryer-item">
            <div class="af-header">
                <strong>${escapeHtml(r.name)}</strong>
                ${r.brand ? `<span class="af-brand">${escapeHtml(r.brand)}</span>` : ''}
            </div>
            <div style="display:flex;gap:20px;margin:8px 0;font-size:14px;">
                <span>🌡 <span class="af-temp">${r.temp}°C</span></span>
                <span>⏱ <span class="af-time">${r.time}分钟</span></span>
            </div>
            <p style="font-size:13px;color:#757575;">🛒 ${r.materials.map(m => escapeHtml(m)).join('、')}</p>
            <div class="recipe-text" style="margin-top:8px;font-size:13px;">${r.steps.map((s, i) => `${i+1}. ${escapeHtml(s)}`).join('\n')}</div>
            <p style="margin-top:6px;font-size:12px;color:#F59E0B;">💡 ${escapeHtml(r.tip)}</p>
            <button class="dish-image-btn" onclick="openImageSearch('${jsEscape('空气炸锅 ' + r.name)}')">🖼 查看成品图</button>
            <div class="video-links" style="margin-top:6px;">
                <a class="video-link douyin" href="https://www.douyin.com/search/${encodeURIComponent('空气炸锅 ' + r.name)}" target="_blank" style="font-size:11px;padding:5px 10px;">🎵 抖音</a>
                <a class="video-link bilibili" href="https://search.bilibili.com/all?keyword=${encodeURIComponent('空气炸锅 ' + r.name)}" target="_blank" style="font-size:11px;padding:5px 10px;">📺 B站</a>
            </div>
        </div>
    `).join('');
}

// ==================== 流式 AI 调用 ====================
async function callAIStream(apiKey, ingredients) {
    const provider = localStorage.getItem('aiProvider') || 'qwen';
    const customModel = localStorage.getItem('modelName') || '';

    const prompt = ingredients
        ? buildRecipeOnlyPrompt(ingredients)
        : buildVisionPrompt();

    let endpoint, model;
    switch (provider) {
        case 'deepseek':
            endpoint = 'https://api.deepseek.com/v1/chat/completions';
            model = customModel || 'deepseek-chat';
            break;
        case 'qwen':
            endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
            model = customModel || (ingredients ? 'qwen-plus' : 'qwen-vl-plus');
            break;
        default:
            endpoint = localStorage.getItem('customEndpoint') || 'https://api.deepseek.com/v1/chat/completions';
            model = customModel || 'deepseek-chat';
    }

    const messages = [{ role: 'user', content: ingredients
        ? prompt
        : [{ type: 'text', text: prompt }, ...(state.images || []).map(img => ({ type: 'image_url', image_url: { url: img.dataUrl } }))]
    }];

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, messages, max_tokens: 4096, temperature: 0.3, stream: true }),
    });

    if (!res.ok) {
        const err = await res.text();
        let msg = '';
        try { msg = JSON.parse(err).error?.message || `HTTP ${res.status}`; } catch { msg = err.substring(0, 100); }
        throw new Error(msg);
    }

    // 解析 SSE 流
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    // 切换到结果页显示流式输出
    switchPage('pageResult');
    $('#resultContent').innerHTML = `
        <div class="result-card">
            <h3>🔍 AI 正在思考...</h3>
            <div id="streamOutput" class="recipe-text" style="min-height:100px;max-height:60vh;overflow-y:auto;"></div>
        </div>
        <div class="action-bar">
            <button class="btn btn-primary" id="btnBackHome">🏠 返回首页</button>
        </div>
    `;
    document.getElementById('btnBackHome').addEventListener('click', () => switchPage('pageHome'));

    const streamDiv = document.getElementById('streamOutput');

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta?.content || '';
                fullText += delta;
                streamDiv.textContent = fullText;
                streamDiv.scrollTop = streamDiv.scrollHeight;
            } catch (e) { /* skip bad lines */ }
        }
    }

    // 流结束，解析并渲染结果
    hideLoading();
    const result = parseAIResponse(fullText, ingredients);
    state.currentResult = result;
    if (!ingredients) saveToHistory(result);
    renderResult(result);
    if (result.conflicts && result.conflicts.length > 0) {
        setTimeout(() => showConflictAlert(result.conflicts), 600);
    }
}

// 修改 startRecognition 使用流式
const _origStartRecognition = startRecognition;
startRecognition = async function(editedIngredients) {
    const apiKey = localStorage.getItem('apikey');
    if (!apiKey) { showToast('请先配置 API Key~'); showSettings(); return; }
    if (!editedIngredients && state.images.length === 0) { showToast('请先拍照或选择图片~'); return; }

    showLoading(editedIngredients ? '正在重新查询...' : 'AI 正在识别...');
    try {
        hideLoading();
        await callAIStream(apiKey, editedIngredients || undefined);
    } catch (err) {
        hideLoading();
        console.error(err);
        // 流式失败，回退到非流式
        try {
            showLoading('流式失败，切换普通模式...');
            const result = await callAI(apiKey, editedIngredients || undefined);
            hideLoading();
            state.currentResult = result;
            renderResult(result);
            switchPage('pageResult');
        } catch (err2) {
            hideLoading();
            renderErrorPage(err2.message);
            switchPage('pageResult');
        }
    }
};

// 知道吃什么也用流式
const _origSearchDish = searchDishByName;
searchDishByName = async function() {
    const dishName = $('#searchDishInput').value.trim();
    if (!dishName) { showToast('请输入菜名~'); return; }
    const apiKey = localStorage.getItem('apikey');
    if (!apiKey) { showToast('请先配置 API Key~'); showSettings(); return; }

    showLoading(`搜索 ${dishName} 的做法...`);
    try {
        hideLoading();
        // 用文字模式流式调用
        const ingredients = [dishName];
        await callAIStream(apiKey, ingredients);
    } catch (err) {
        hideLoading();
        try {
            const prompt = `请告诉我"${dishName}"的做法。返回 JSON：{"ingredients":["${dishName}"],"dishes":[{"name":"${dishName}","difficulty":"中等","time":"30分钟","materials":[],"steps":["步骤"],"tip":""}],"conflicts":[],"nutrition":""}`;
            const result = await callAITextOnly(apiKey, prompt);
            state.currentResult = result;
            renderResult(result);
            switchPage('pageResult');
        } catch (err2) {
            renderErrorPage(err2.message);
            switchPage('pageResult');
        }
    }
};

// ==================== 厨神小雨的厨房 ====================
const KITCHEN_KEY = 'kitchen_dishes_v1';

function getKitchenDishes() {
    try { return JSON.parse(localStorage.getItem(KITCHEN_KEY) || '[]'); }
    catch { return []; }
}

function saveKitchenDishes(dishes) {
    localStorage.setItem(KITCHEN_KEY, JSON.stringify(dishes));
}

function renderKitchenPage() {
    const dishes = getKitchenDishes();
    const container = $('#kitchenDishes');

    if (dishes.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:30px;color:#9E9E9E;">
            <p style="font-size:40px;">🍽️</p><p>还没有私房菜～</p><p style="font-size:13px;">点上方按钮添加你的第一道菜吧！</p></div>`;
        return;
    }

    container.innerHTML = dishes.map((d, i) => `
        <div class="kitchen-dish-card">
            ${d.image ? `<img src="${d.image}" alt="${escapeHtml(d.name)}" onclick="previewImage('${d.image.replace(/'/g, "\\'")}')">`
                : `<div style="width:72px;height:72px;border-radius:8px;background:var(--pink-50);display:flex;align-items:center;justify-content:center;font-size:28px;">🍽️</div>`}
            <div class="kd-info">
                <div class="kd-name">${escapeHtml(d.name)}</div>
                <div class="kd-recipe">${escapeHtml(d.recipe || '暂无做法')}</div>
            </div>
            <div class="kd-actions">
                <button onclick="editKitchenDish(${i})">✏️</button>
                <button onclick="deleteKitchenDish(${i})" style="color:#EF4444;">🗑</button>
            </div>
        </div>
    `).join('');
}

function showAddDishModal(editIndex) {
    $('#dishEditId').value = editIndex !== undefined ? editIndex : '';
    if (editIndex !== undefined) {
        const d = getKitchenDishes()[editIndex];
        $('#dishNameInput').value = d.name;
        $('#dishRecipeInput').value = d.recipe || '';
        $('#dishImagePreview').innerHTML = d.image ? `<img src="${d.image}" style="max-width:100%;max-height:150px;border-radius:8px;">` : '';
    } else {
        $('#dishNameInput').value = '';
        $('#dishRecipeInput').value = '';
        $('#dishImagePreview').innerHTML = '';
    }
    $('#modalAddDish').classList.add('show');
}

function hideAddDishModal() {
    $('#modalAddDish').classList.remove('show');
}

function previewDishImage() {
    const file = $('#dishImageInput').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        compressImage(file, 400, 0.6).then(dataUrl => {
            $('#dishImagePreview').innerHTML = `<img src="${dataUrl}" style="max-width:100%;max-height:150px;border-radius:8px;">`;
        });
    };
    reader.readAsDataURL(file);
}

function saveKitchenDish() {
    const name = $('#dishNameInput').value.trim();
    if (!name) { showToast('请输入菜名~'); return; }
    const recipe = $('#dishRecipeInput').value.trim();
    const imgEl = $('#dishImagePreview').querySelector('img');
    const image = imgEl ? imgEl.src : '';

    const dishes = getKitchenDishes();
    const editId = $('#dishEditId').value;

    const dish = { name, recipe, image, time: new Date().toISOString() };

    if (editId !== '') {
        dishes[parseInt(editId)] = dish;
    } else {
        dishes.push(dish);
    }

    saveKitchenDishes(dishes);
    hideAddDishModal();
    renderKitchenPage();
    showToast('✅ 已保存！');
}

function editKitchenDish(index) {
    showAddDishModal(index);
}

function deleteKitchenDish(index) {
    if (!confirm('确定删除这道菜？')) return;
    const dishes = getKitchenDishes();
    dishes.splice(index, 1);
    saveKitchenDishes(dishes);
    renderKitchenPage();
    showToast('已删除');
}

// ==================== 点菜系统 ====================
const ORDER_PREFIX = 'order_room_';

function getOrderRoom() {
    return localStorage.getItem('order_room') || '';
}

function getOrders(room) {
    try { return JSON.parse(localStorage.getItem(ORDER_PREFIX + room) || '[]'); }
    catch { return []; }
}

function saveOrders(room, orders) {
    localStorage.setItem(ORDER_PREFIX + room, JSON.stringify(orders));
}

function joinOrderRoom() {
    const room = $('#orderRoomInput').value.trim();
    if (!room) { showToast('请输入房间号~'); return; }
    localStorage.setItem('order_room', room);
    $('#orderRoomStatus').textContent = `🏠 当前房间：${room}`;
    renderOrderList();
    showToast('✅ 已加入房间');
}

function addOrderItem() {
    const room = getOrderRoom();
    if (!room) { showToast('请先加入房间~'); return; }
    const dish = $('#orderDishInput').value.trim();
    if (!dish) { showToast('请输入菜名~'); return; }

    const orders = getOrders(room);
    orders.push({
        dish,
        status: 'pending',
        from: '我',
        time: new Date().toISOString(),
    });
    saveOrders(room, orders);
    $('#orderDishInput').value = '';
    renderOrderList();
    showToast('✅ 已点菜！刷新页面通知朋友来看');
}

function renderOrderPage() {
    const room = getOrderRoom();
    $('#orderRoomInput').value = room;
    $('#orderRoomStatus').textContent = room ? `🏠 当前房间：${room}` : '输入同一个房间号即可和朋友同步';
    renderOrderList();
}

function renderOrderList() {
    const room = getOrderRoom();
    const orders = room ? getOrders(room) : [];
    const container = $('#orderList');

    if (!room) {
        container.innerHTML = '<p style="text-align:center;color:#9E9E9E;padding:20px;">👆 先输入房间号加入</p>';
        return;
    }
    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#9E9E9E;padding:20px;">还没有人点菜～</p>';
        return;
    }

    const statusMap = { pending: '待做', cooking: '制作中', done: '已完成' };
    container.innerHTML = orders.map((o, i) => `
        <div class="order-item">
            <div>
                <strong>${escapeHtml(o.dish)}</strong>
                <span style="font-size:11px;color:#9E9E9E;margin-left:6px;">by ${escapeHtml(o.from)}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span class="order-status ${o.status}">${statusMap[o.status]}</span>
                <select onchange="updateOrderStatus(${i}, this.value)" style="font-size:11px;padding:2px 4px;border-radius:4px;border:1px solid #E0E0E0;">
                    <option value="pending" ${o.status==='pending'?'selected':''}>待做</option>
                    <option value="cooking" ${o.status==='cooking'?'selected':''}>制作中</option>
                    <option value="done" ${o.status==='done'?'selected':''}>已完成</option>
                </select>
                <button onclick="deleteOrder(${i})" style="font-size:11px;padding:2px 6px;border:none;background:none;color:#EF4444;cursor:pointer;">✕</button>
            </div>
        </div>
    `).join('');

    // 自动刷新：每5秒检查一次
    clearInterval(window._orderRefresh);
    window._orderRefresh = setInterval(() => {
        const currentRoom = getOrderRoom();
        if (currentRoom === room) {
            const fresh = getOrders(room);
            if (JSON.stringify(fresh) !== JSON.stringify(orders)) {
                renderOrderList();
            }
        } else {
            clearInterval(window._orderRefresh);
        }
    }, 5000);
}

function updateOrderStatus(index, status) {
    const room = getOrderRoom();
    const orders = getOrders(room);
    orders[index].status = status;
    saveOrders(room, orders);
    renderOrderList();
}

function deleteOrder(index) {
    const room = getOrderRoom();
    const orders = getOrders(room);
    orders.splice(index, 1);
    saveOrders(room, orders);
    renderOrderList();
}

// ==================== 启动 ====================
document.addEventListener('DOMContentLoaded', init);

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => showToast('💡 菜单 → "添加到主屏幕" 可安装为 App', 4000), 3000);
});
