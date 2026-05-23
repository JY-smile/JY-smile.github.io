/**
 * 老虎机动画逻辑
 * 12个卡片环绕中央按钮的跑马灯效果
 */

class SlotMachine {
    constructor() {
        this.isSpinning = false;
        this.spinTimeouts = [];
        this.destinations = [];
        this.gridCards = [];
        this.currentIndex = 0;
        this.totalCards = 9;
        // 9个卡片的环绕顺序（顺时针）：上排3个 → 右列2个 → 下排3个 → 左列1个
        // 实际布局：0 1 2 / 7 8 3 / 6 5 4，但8是隐藏的，所以只显示外围8个
        this.traverseOrder = [0, 1, 2, 3, 4, 5, 6, 7];
    }

    /**
     * 初始化环绕布局
     * @param {Array} destinations - 目的地列表（9个）
     */
    init(destinations) {
        this.destinations = destinations.slice(0, this.totalCards);
        this.gridCards = [];
        
        const grid = document.getElementById('destinations-grid');
        grid.innerHTML = '';

            // 生成9个卡片 - 只显示地点名称
        for (let i = 0; i < this.totalCards; i++) {
            const dest = this.destinations[i] || { name: '未知地点' };
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.dataset.index = i;
            
            // 卡片内容：只显示地点名称
            card.innerHTML = `
                <span class="card-name-simple">${dest.name}</span>
            `;
            
            grid.appendChild(card);
            this.gridCards.push(card);
        }

        // 重置状态
        this.reset();
        return this.gridCards;
    }

    /**
     * 高亮指定索引的卡片
     */
    highlightCard(index) {
        // 移除所有高亮
        this.gridCards.forEach(card => card.classList.remove('active'));
        
        // 高亮当前卡片
        if (this.gridCards[index]) {
            this.gridCards[index].classList.add('active');
        }
    }

    /**
     * 开始老虎机动画 - 优化版：快→慢→停
     * @returns {Promise<number>} 返回中奖索引
     */
    async start() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.clearTimeouts();

        const btn = document.getElementById('spin-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>选择中...</span>';

        // 移除之前的中奖样式
        this.gridCards.forEach(card => card.classList.remove('winner', 'active'));

        // 随机选择目标
        const targetIndex = Math.floor(Math.random() * this.totalCards);

        // 执行动画序列
        await this.animateSequence(targetIndex);

        // 恢复按钮状态
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-redo"></i><span>再选一次</span>';
        this.isSpinning = false;

        return targetIndex;
    }

    /**
     * 动画序列：快→慢→停
     */
    async animateSequence(targetIndex) {
        // 阶段1：超快速旋转（建立动感）
        await this.phaseUltraFast();
        
        // 阶段2：快速旋转（多圈）
        await this.phaseFast();
        
        // 阶段3：中速旋转
        await this.phaseMedium();
        
        // 阶段4：慢速接近目标
        await this.phaseSlow(targetIndex);
        
        // 阶段5：最终停止（闪烁效果）
        await this.phaseFinal(targetIndex);
    }

    /**
     * 阶段1：超快速旋转 - 建立动感（带模糊效果）
     */
    phaseUltraFast() {
        return new Promise(resolve => {
            let currentPos = 0;
            const steps = 18; // 快速跳18步
            const interval = 25; // 25ms一步，更快
            
            // 添加运动模糊效果
            this.gridCards.forEach(card => card.classList.add('motion-blur'));
            
            const step = () => {
                const gridIndex = this.traverseOrder[currentPos % this.totalCards];
                this.highlightCard(gridIndex);
                currentPos++;
                
                if (currentPos < steps) {
                    const timeout = setTimeout(step, interval);
                    this.spinTimeouts.push(timeout);
                } else {
                    // 移除模糊效果
                    this.gridCards.forEach(card => card.classList.remove('motion-blur'));
                    resolve();
                }
            };
            
            step();
        });
    }

    /**
     * 阶段2：快速旋转 - 持续多圈（带弹性加速）
     */
    phaseFast() {
        return new Promise(resolve => {
            let currentPos = 0;
            const duration = 1800; // 1.8秒
            const baseInterval = 55; // 基础间隔
            const steps = Math.floor(duration / baseInterval);
            
            const step = () => {
                const gridIndex = this.traverseOrder[currentPos % this.totalCards];
                this.highlightCard(gridIndex);
                currentPos++;
                
                // 轻微加速效果
                const progress = currentPos / steps;
                const interval = baseInterval - Math.sin(progress * Math.PI) * 15;
                
                if (currentPos < steps) {
                    const timeout = setTimeout(step, interval);
                    this.spinTimeouts.push(timeout);
                } else {
                    resolve();
                }
            };
            
            step();
        });
    }

    /**
     * 阶段3：中速旋转（带声音节奏感）
     */
    phaseMedium() {
        return new Promise(resolve => {
            let currentPos = this.traverseOrder.indexOf(
                this.gridCards.findIndex(card => card.classList.contains('active'))
            );
            if (currentPos === -1) currentPos = 0;
            
            const steps = 9; // 中速转9步（一圈）
            const baseInterval = 100; // 100ms一步
            let count = 0;
            
            const step = () => {
                currentPos = (currentPos + 1) % this.totalCards;
                const gridIndex = this.traverseOrder[currentPos];
                this.highlightCard(gridIndex);
                count++;
                
                // 轻微减速
                const interval = baseInterval + count * 5;
                
                if (count < steps) {
                    const timeout = setTimeout(step, interval);
                    this.spinTimeouts.push(timeout);
                } else {
                    resolve();
                }
            };
            
            step();
        });
    }

    /**
     * 阶段4：慢速接近目标（带弹性缓动）
     */
    phaseSlow(targetIndex) {
        return new Promise(resolve => {
            let currentPos = this.traverseOrder.indexOf(
                this.gridCards.findIndex(card => card.classList.contains('active'))
            );
            if (currentPos === -1) currentPos = 0;
            
            let targetPos = this.traverseOrder.indexOf(targetIndex);
            
            // 计算需要走的步数（至少再走一圈+到目标）
            let stepsNeeded = this.totalCards + ((targetPos - currentPos + this.totalCards) % this.totalCards);
            let stepCount = 0;
            
            const runStep = () => {
                currentPos = (currentPos + 1) % this.totalCards;
                const gridIndex = this.traverseOrder[currentPos];
                this.highlightCard(gridIndex);
                stepCount++;
                
                // 弹性缓动减速
                const progress = stepCount / stepsNeeded;
                const easeOut = 1 - Math.pow(1 - progress, 3); // 三次缓出
                const interval = 150 + easeOut * 300; // 150ms 到 450ms
                
                if (stepCount < stepsNeeded) {
                    const timeout = setTimeout(runStep, interval);
                    this.spinTimeouts.push(timeout);
                } else {
                    resolve();
                }
            };
            
            runStep();
        });
    }

    /**
     * 阶段5：最终停止 - 弹性闪烁效果
     */
    phaseFinal(targetIndex) {
        return new Promise(resolve => {
            const card = this.gridCards[targetIndex];
            let blinkCount = 0;
            const maxBlinks = 5;
            
            // 先显示一次选中状态
            card.classList.add('active');
            
            const blink = () => {
                if (blinkCount % 2 === 0) {
                    card.classList.add('winner');
                    card.classList.remove('active');
                } else {
                    card.classList.remove('winner');
                    card.classList.add('active');
                }
                
                blinkCount++;
                
                if (blinkCount < maxBlinks * 2) {
                    // 闪烁间隔逐渐变长，增加期待感
                    const interval = 120 + blinkCount * 30;
                    const timeout = setTimeout(blink, interval);
                    this.spinTimeouts.push(timeout);
                } else {
                    // 最终保持 winner 状态，添加庆祝效果
                    card.classList.remove('active');
                    card.classList.add('winner');
                    
                    // 触发庆祝动画
                    this.celebrateWin(targetIndex);
                    
                    resolve(targetIndex);
                }
            };
            
            // 延迟后开始闪烁
            setTimeout(blink, 200);
        });
    }

    /**
     * 庆祝中奖效果
     */
    celebrateWin(targetIndex) {
        // 给其他卡片添加暗淡效果
        this.gridCards.forEach((card, index) => {
            if (index !== targetIndex) {
                card.classList.add('dimmed');
            }
        });
        
        // 3秒后恢复
        setTimeout(() => {
            this.gridCards.forEach(card => card.classList.remove('dimmed'));
        }, 3000);
    }

    /**
     * 清除所有定时器
     */
    clearTimeouts() {
        this.spinTimeouts.forEach(timeout => clearTimeout(timeout));
        this.spinTimeouts = [];
    }

    /**
     * 重置状态
     */
    reset() {
        this.isSpinning = false;
        this.clearTimeouts();
        
        this.gridCards.forEach(card => {
            card.classList.remove('active', 'winner');
        });
        
        const btn = document.getElementById('spin-btn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-play"></i><span>开始选择</span>';
        }
    }

    /**
     * 销毁实例
     */
    destroy() {
        this.clearTimeouts();
        this.gridCards = [];
        this.destinations = [];
    }
}

// 创建老虎机实例
const slotMachine = new SlotMachine();
