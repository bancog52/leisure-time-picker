// 将纯文本活动重构为带标签的【心境维度分类系统】
const activities = [
    // 🍃 自然户外风 -> 触发现场光影/落叶纷飞动效
    { name: "去公园走走散步", category: "nature", label: "🍃 自然户外" },
    { name: "出门乱走走，试试随意摄影", category: "nature", label: "🍃 自然户外" },
    { name: "拉开窗帘，好好看看天空", category: "nature", label: "🍃 自然户外" },
    
    // 🌌 静心内观风 -> 触发深空星尘/呼吸萤火动效
    { name: "盘腿坐好，尝试进入冥想", category: "zen", label: "🌌 静心内观" },
    { name: "看着窗外，痛快发个呆", category: "zen", label: "🌌 静心内观" },
    { name: "什么也不做，安静地躺着", category: "zen", label: "🌌 静心内观" },
    { name: "关掉手机网络，远离屏幕", category: "zen", label: "🌌 静心内观" },
    
    // ☕ 日常疗愈风 -> 触发温暖水波光团晕开动效
    { name: "去烧水，慢慢给自己泡杯热饮", category: "cozy", label: "☕ 温暖日常" },
    { name: "放点热水，快乐地泡澡/泡脚", category: "cozy", label: "☕ 温暖日常" },
    { name: "顺手把桌面或房间收拾干净", category: "cozy", label: "☕ 温暖日常" },
    { name: "去把脏衣服洗掉", category: "cozy", label: "☕ 温暖日常" },
    { name: "找个安静的角落做会儿手工", category: "cozy", label: "☕ 温暖日常" },
    { name: "翻开笔记本写两行日记", category: "cozy", label: "☕ 温暖日常" },
    { name: "倒杯水，安静读几页纸质书", category: "cozy", label: "☕ 温暖日常" },
    
    // ✨ 灵感社交风 -> 触发鼠标跟随奇幻星辉动效
    { name: "发张生活照给好朋友，感受连接", category: "spark", label: "✨ 灵感社交" },
    { name: "戴上耳机，听几首喜欢的音乐", category: "spark", label: "✨ 灵感社交" },
    { name: "找一部口碑极高的电影/纪录片看", category: "spark", label: "✨ 灵感社交" },
    { name: "铺开瑜伽垫，做做轻度拉伸拉筋", category: "spark", label: "✨ 灵感社交" },
    { name: "在 B 站看一场高分话剧实况", category: "spark", label: "✨ 灵感社交" }
];

const drawBtn = document.getElementById('draw-btn');
const resultEl = document.getElementById('result');
const badgeEl = document.getElementById('category-badge');
const canvas = document.getElementById('effect-canvas');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let currentCategory = 'default';

// ======= Canvas 粒子动效引擎底层 ========
let width, height;
let particles = [];
let animationFrameId;

// 开启全局鼠标探测 - 用于“灵感”类别的星星特效
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});
// 移动端支持支持
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }
}, {passive: true});

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // 初始化画布尺寸

class Particle {
    constructor(category) {
        this.category = category;
        this.reset();
    }
    
    reset() {
        if (this.category === 'nature') {
            // 清新绿叶/碎阳光飘落
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.size = Math.random() * 6 + 4; // 增大
            this.speedY = Math.random() * 1.5 + 1; // 加快下落
            this.speedX = Math.random() * 1.5 - 0.75;
            this.color = `rgba(${Math.floor(180+Math.random()*40)}, ${Math.floor(230+Math.random()*25)}, ${Math.floor(180+Math.random()*40)}, ${Math.random()*0.5 + 0.4})`; // 提高可见度
        } else if (this.category === 'zen') {
            // 静谧海底/深空 缓慢发光上浮的星尘
            this.x = Math.random() * width;
            this.y = height + Math.random() * height;
            this.size = Math.random() * 4 + 3; // 增大星尘尺寸，避免太小像针尖
            this.speedY = -(Math.random() * 1 + 0.5); // 提高上浮速度
            this.speedX = Math.sin(Math.random() * Math.PI) * 0.4;
            this.life = Math.random() * 100; // 作为正弦波计算参数，处理呼吸明暗
            this.color = `rgba(255, 255, 255,`; 
        } else if (this.category === 'cozy') {
            // 治愈光球晕开
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 100 + 40; // 光球尺寸显著变大，增加包裹感
            this.speedY = Math.random() * 0.6 - 0.3; 
            this.speedX = Math.random() * 0.6 - 0.3;
            this.color = `rgba(255, ${Math.floor(200+Math.random()*50)}, ${Math.floor(150+Math.random()*50)}, 0.18)`; // 提高初始透明度，让光晕更明显
        } else if (this.category === 'spark') {
            // 跟随鼠标的奇缘星迹
            this.x = mouseX + (Math.random() * 60 - 30);
            this.y = mouseY + (Math.random() * 60 - 30);
            this.size = Math.random() * 5 + 2; // 星迹尺寸变大
            this.speedY = Math.random() * 3 - 1.5; // 让散开动画更灵动一些
            this.speedX = Math.random() * 3 - 1.5;
            this.life = 1; // 寿命控制（用于透明度衰减）
            this.color = `hsla(${Math.floor(Math.random()*60 + 260)}, 100%, 80%, `; // 梦幻粉紫
        }
    }
    
    update() {
        if (this.category === 'nature') {
            this.y += this.speedY; 
            // 产生随风左右慢慢飘摇的效果
            this.x += this.speedX + Math.sin(this.y * 0.01) * 0.8; 
            if (this.y > height) this.reset();
        } else if (this.category === 'zen') {
            this.y += this.speedY; 
            this.x += this.speedX;
            this.life += 0.02; // 时间流逝引起呼吸灯效
            if (this.y < 0) this.reset();
        } else if (this.category === 'cozy') {
            this.y += this.speedY;
            this.x += this.speedX;
            // 碰到边界温和回弹反转
            if (this.x < 0 || this.x > width) this.speedX *= -1;
            if (this.y < 0 || this.y > height) this.speedY *= -1;
        } else if (this.category === 'spark') {
            // 如果鼠标突然移走，用旧的xy散开后消散
            this.x += this.speedX;
            this.y += this.speedY;
            this.life -= 0.008; // 减缓生命消散速度，让星迹拖尾更长更明显
            if (this.life <= 0) this.reset(); // 重生到鼠标当前位置附近
        }
    }
    
    draw(ctx) {
        ctx.beginPath();
        // 特殊的透明度计算与涂色
        if (this.category === 'zen') {
            // 提高深空星尘的最低透明度，避免一开始完全看不见，最大透明度也提高
            const alpha = 0.3 + Math.abs(Math.sin(this.life)) * 0.7; // 实现明暗呼吸
            ctx.fillStyle = `${this.color}${alpha})`;
        } else if (this.category === 'spark') {
            ctx.fillStyle = `${this.color}${this.life})`;
        } else {
            ctx.fillStyle = this.color;
        }
        
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 渲染循环管理
function initScene() {
    particles = [];
    let particleCount = 0;
    
    // 决定各种类别的不同粒子渲染数量，提高总粒子数加强氛围感
    if (currentCategory === 'nature') particleCount = 70; 
    else if (currentCategory === 'zen') particleCount = 120;
    else if (currentCategory === 'cozy') particleCount = 35;
    else if (currentCategory === 'spark') particleCount = 160;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(currentCategory));
    }
}

function renderFrame() {
    // 清空上一帧
    ctx.clearRect(0, 0, width, height);
    // 更新绘制每一个粒子
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });
    // 继续请求下一帧
    animationFrameId = requestAnimationFrame(renderFrame);
}

// 供业务调用的最高层场景切换器
function triggerScene(category) {
    if (currentCategory === category) return; // 心境未变，不打断动画
    
    currentCategory = category;
    
    // 1. 改变 CSS 变量（使得大背景颜色平滑发生1.5秒的渐变！）
    document.body.className = `theme-${currentCategory}`;
    
    // 2. 终止旧 Canvas 画布重绘，清空原内存池，并切入属于该心境的特有粒子动效
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    initScene();
    renderFrame();
}

// ======== 核心抽签业务代码 ========

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

drawBtn.addEventListener('click', () => {
    if (isDrawing) return;
    
    isDrawing = true;
    drawBtn.disabled = true;
    drawBtn.innerText = "时光翻转中...";
    
    // UI 清除准备
    resultEl.classList.remove('reveal', 'result-placeholder');
    resultEl.classList.add('animating');
    badgeEl.classList.add('hidden'); // 把小分类标签隐藏
    
    let cycles = 0;
    const maxCycles = 15; 
    const intervalTime = 80; 
    
    // 老虎机快速显示动效
    const scrollInterval = setInterval(() => {
        resultEl.innerText = getRandomItem(activities).name;
        cycles++;
        
        if (cycles >= maxCycles) {
            clearInterval(scrollInterval);
            finishDraw();
        }
    }, intervalTime);
});

function finishDraw() {
    // 【主脑】此时命运落下定局，获取真实结果与它的分类结构
    const finalResultItem = getRandomItem(activities);
    
    // 中断模糊闪烁效果，做透明隐藏（为了后面优雅地爆出来）
    resultEl.classList.remove('animating');
    resultEl.style.opacity = '0';
    
    // **核心联动点：根据最终抽到的结果心境，触发全局的平滑换色与切换 Canvas 特效场！**
    triggerScene(finalResultItem.category);
    
    // 短暂延迟产生悬念，彻底替换卡片内容
    setTimeout(() => {
        // 展出结果
        resultEl.innerText = finalResultItem.name;
        resultEl.style.opacity = '1';
        resultEl.classList.add('reveal'); // 这里有极强阻尼的放大特效
        
        // 展出标签
        badgeEl.innerText = finalResultItem.label;
        badgeEl.classList.remove('hidden');
        
        isDrawing = false;
        drawBtn.disabled = false;
        drawBtn.innerText = "换个心境";
    }, 50);
}
