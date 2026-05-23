/**
 * 主逻辑文件
 * 处理页面切换、事件绑定和数据管理
 */

class TravelApp {
    constructor() {
        this.currentPage = 'home-page';
        this.pageHistory = [];
        this.userData = {
            province: '',
            city: '',
            budget: { min: 100, max: 999999 },
            days: 3
        };
        this.destinations = [];
        this.selectedDestination = null;
        
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.initProvinceSelect();
        this.initBudgetSlider();
        this.bindEvents();
    }

    /**
     * 初始化省份选择器
     */
    initProvinceSelect() {
        const provinceSelect = document.getElementById('province-select');
        const citySelect = document.getElementById('city-select');

        // 填充省份选项
        Object.keys(cityData).forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            option.textContent = province;
            provinceSelect.appendChild(option);
        });

        // 默认选中北京市
        provinceSelect.value = '北京市';
        this.updateCitySelect('北京市');
        this.userData.province = '北京市';
        this.userData.city = '北京市';

        // 省份变化时更新城市
        provinceSelect.addEventListener('change', (e) => {
            const province = e.target.value;
            this.userData.province = province;
            this.updateCitySelect(province);
        });

        // 城市变化时更新数据
        citySelect.addEventListener('change', (e) => {
            this.userData.city = e.target.value;
        });
    }

    /**
     * 更新城市选择器
     */
    updateCitySelect(province) {
        const citySelect = document.getElementById('city-select');
        citySelect.innerHTML = '<option value="">选择城市</option>';

        if (province && cityData[province]) {
            cityData[province].forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
            
            // 默认选中第一个城市
            if (cityData[province].length > 0) {
                citySelect.value = cityData[province][0];
                this.userData.city = cityData[province][0];
            }
        }
    }

    /**
     * 初始化预算滑块
     */
    initBudgetSlider() {
        const slider = document.getElementById('budget-slider');
        const budgetValue = document.getElementById('budget-value');
        const budgetMaxLabel = document.getElementById('budget-max-label');
        const quickTags = document.querySelectorAll('.tag-btn');

        // 预算映射表 - 滑块值 0-100 对应实际预算
        const budgetMap = [
            { min: 0, max: 500, label: '500' },
            { min: 500, max: 1000, label: '1k' },
            { min: 1000, max: 2000, label: '2k' },
            { min: 2000, max: 3000, label: '3k' },
            { min: 3000, max: 5000, label: '5k' },
            { min: 5000, max: 8000, label: '8k' },
            { min: 8000, max: 10000, label: '1w' },
            { min: 10000, max: 15000, label: '1.5w' },
            { min: 15000, max: 20000, label: '2w' },
            { min: 20000, max: 999999, label: '无上限' }
        ];

        // 滑块值映射到实际预算范围
        const getBudgetFromSlider = (sliderValue) => {
            if (sliderValue >= 90) {
                return { min: 20000, max: 999999, label: '无上限' };
            }
            // 将 0-90 映射到 0-9 的索引
            const index = Math.floor(sliderValue / 10);
            return budgetMap[Math.min(index, budgetMap.length - 1)];
        };

        // 更新预算显示
        const updateBudget = (sliderValue) => {
            const budget = getBudgetFromSlider(sliderValue);
            
            if (budget.label === '无上限') {
                budgetValue.textContent = '无上限';
                budgetMaxLabel.textContent = '🔥';
                this.userData.budget = { min: 20000, max: 999999 };
            } else {
                budgetValue.textContent = budget.label;
                budgetMaxLabel.textContent = '';
                this.userData.budget = { min: budget.min, max: budget.max };
            }

            // 更新快捷标签状态
            quickTags.forEach(tag => {
                const tagValue = parseInt(tag.dataset.value);
                if (Math.abs(tagValue - sliderValue) < 8) {
                    tag.classList.add('active');
                } else {
                    tag.classList.remove('active');
                }
            });
        };

        // 滑块事件
        slider.addEventListener('input', (e) => {
            updateBudget(parseInt(e.target.value));
        });

        // 快捷标签点击事件
        quickTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const value = parseInt(tag.dataset.value);
                slider.value = value;
                updateBudget(value);
            });
        });

        // 初始化显示
        updateBudget(0);
    }

    /**
     * 调整天数
     */
    adjustDays(delta) {
        const newDays = this.userData.days + delta;
        if (newDays >= 1 && newDays <= 10) {
            this.userData.days = newDays;
            document.getElementById('days-value').textContent = newDays;
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 键盘事件（用于测试）
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    /**
     * 页面导航
     */
    navigateTo(pageId) {
        // 隐藏当前页面
        document.getElementById(this.currentPage).classList.remove('active');
        
        // 记录历史
        if (this.currentPage !== pageId) {
            this.pageHistory.push(this.currentPage);
        }
        
        // 显示新页面
        this.currentPage = pageId;
        document.getElementById(pageId).classList.add('active');

        // 页面特定初始化
        if (pageId === 'result-page') {
            this.initResultPage();
        }
    }

    /**
     * 返回上一页
     */
    goBack() {
        if (this.pageHistory.length > 0) {
            const prevPage = this.pageHistory.pop();
            document.getElementById(this.currentPage).classList.remove('active');
            this.currentPage = prevPage;
            document.getElementById(prevPage).classList.add('active');
            
            // 重置老虎机
            if (prevPage === 'survey-page') {
                slotMachine.reset();
            }
        }
    }

    /**
     * 跳转到问卷页
     */
    goToSurvey() {
        this.navigateTo('survey-page');
    }

    /**
     * 生成目的地
     */
    async generateDestinations() {
        console.log('generateDestinations 被调用');
        
        // 验证数据
        if (!this.userData.city) {
            alert('请选择出发城市');
            return;
        }

        console.log('用户数据:', this.userData);

        // 显示加载页
        this.navigateTo('loading-page');
        console.log('已切换到 loading-page');

        // 模拟加载进度
        this.animateLoading();
        console.log('加载动画已启动');

        try {
            console.log('开始调用 AI API...');
            // 获取景点数据 - 调用 AI API
            const destinations = await travelAPI.getDestinations(
                this.userData.city, 
                CONFIG.RESULT_COUNT,
                this.userData
            );
            console.log('AI API 返回数据:', destinations);

            // 根据条件筛选
            this.destinations = travelAPI.filterByConditions(
                destinations,
                this.userData.budget,
                this.userData.days
            );

            // 确保至少有9个结果
            while (this.destinations.length < 9) {
                const more = await travelAPI.getDestinations(
                    this.userData.city,
                    9 - this.destinations.length,
                    this.userData
                );
                this.destinations.push(...more);
            }

            this.destinations = this.destinations.slice(0, 9);

            // 快速完成加载动画
            this.completeLoadingFast();

            // 快速跳转到结果页
            setTimeout(() => {
                this.navigateTo('result-page');
            }, 400);

        } catch (error) {
            console.error('获取数据失败:', error);
            console.error('错误详情:', error.message, error.stack);
            alert('获取数据失败: ' + error.message);
            this.goBack();
        }
    }

    /**
     * 加载动画 - 优化版
     */
    animateLoading() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const tipElement = document.getElementById('loading-tip');
        let progress = 0;
        
        // 动态提示语
        const tips = [
            '正在搜索热门目的地...',
            '分析最佳出行路线...',
            '计算预算方案...',
            '匹配当地美食...',
            '规划每日行程...',
            '整理景点信息...',
            '即将完成...'
        ];
        let tipIndex = 0;

        // 更新提示语
        const updateTip = () => {
            if (tipElement && tipIndex < tips.length) {
                tipElement.style.animation = 'none';
                setTimeout(() => {
                    tipElement.textContent = tips[tipIndex];
                    tipElement.style.animation = 'tip-fade 0.5s ease';
                    tipIndex++;
                }, 10);
            }
        };

        // 模拟进度动画 - 更快更流畅
        const interval = setInterval(() => {
            // 非线性增长，先快后慢
            const remaining = 90 - progress;
            const increment = remaining * 0.08 + Math.random() * 3;
            progress += increment;
            
            // 根据进度更新提示
            const tipProgress = Math.floor(progress / 13);
            if (tipProgress > tipIndex && tipIndex < tips.length) {
                updateTip();
            }
            
            if (progress >= 88) {
                progress = 88;
                clearInterval(interval);
            }
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
        }, 200);

        // 保存 interval ID 以便后续清除
        this.loadingInterval = interval;
    }

    /**
     * 完成加载动画
     */
    completeLoading() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        // 清除之前的 interval
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
        
        // 进度到 100%
        progressFill.style.width = '100%';
        progressText.textContent = '100%';
    }

    /**
     * 快速完成加载动画
     */
    completeLoadingFast() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        const tipElement = document.getElementById('loading-tip');
        
        // 清除之前的 interval
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
        
        // 更新提示
        if (tipElement) {
            tipElement.textContent = '准备就绪！';
        }
        
        // 快速动画到100%
        let current = 88;
        const fillInterval = setInterval(() => {
            current += 4;
            if (current >= 100) {
                current = 100;
                clearInterval(fillInterval);
            }
            progressFill.style.width = `${current}%`;
            progressText.textContent = `${Math.round(current)}%`;
        }, 30);
    }

    /**
     * 初始化结果页
     */
    initResultPage() {
        // 初始化老虎机
        slotMachine.init(this.destinations);
    }

    /**
     * 开始抽奖
     */
    async startSpin() {
        if (slotMachine.isSpinning) return;

        const winnerIndex = await slotMachine.start();
        this.selectedDestination = this.destinations[winnerIndex];

        // 延迟显示详情
        setTimeout(() => {
            this.showDetailModal(this.selectedDestination);
        }, 500);
    }

    /**
     * 显示详情弹窗
     */
    showDetailModal(destination) {
        const modal = document.getElementById('detail-modal');
        const plan = destination.travelPlan;

        // 填充数据
        document.getElementById('modal-title').textContent = destination.name;
        document.getElementById('modal-city').textContent = `${this.userData.city} → ${destination.name}`;
        document.getElementById('modal-desc').textContent = destination.desc;

        // 设置地标图标
        const modalImg = document.getElementById('modal-img');
        const modalImageContainer = document.querySelector('.modal-image');
        
        // 使用CSS绘制地标符号
        modalImg.style.display = 'none';
        modalImageContainer.innerHTML = `
            <div class="landmark-icon ${destination.isFun ? 'fun-landmark' : ''}">
                <span class="landmark-emoji">${destination.icon || '📍'}</span>
                <div class="landmark-bg"></div>
            </div>
            <div class="modal-image-overlay"></div>
        `;

        // 设置标签
        const tagsContainer = document.getElementById('modal-tags');
        const tags = destination.tags || [destination.tag];
        tagsContainer.innerHTML = tags.map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');

        // 更新出行计划详情
        this.updateTravelPlanDetails(plan);

        // 显示弹窗
        modal.classList.add('active');
    }

    /**
     * 更新出行计划详情
     */
    updateTravelPlanDetails(plan) {
        // 检查是否已存在出行计划区域
        let planSection = document.getElementById('plan-section');
        if (!planSection) {
            planSection = document.createElement('div');
            planSection.id = 'plan-section';
            planSection.className = 'plan-section';
            
            const modalBody = document.querySelector('.modal-body');
            modalBody.appendChild(planSection);
        }

        // 构建详细的费用明细
        const costBreakdown = `
            <div class="cost-breakdown">
                <h5><i class="fas fa-calculator"></i> 费用明细</h5>
                <div class="cost-item">
                    <span class="cost-label">🚗 交通费用</span>
                    <span class="cost-value">¥${plan.transportCost}</span>
                    <span class="cost-detail">${plan.transport} · ${plan.transportTime}</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">🏨 住宿费用</span>
                    <span class="cost-value">¥${plan.hotelCost}</span>
                    <span class="cost-detail">${plan.hotelLevel} · ${plan.hotelNights}晚 · ¥${plan.hotelCostPerDay}/晚</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">🍽️ 餐饮费用</span>
                    <span class="cost-value">¥${plan.foodCost}</span>
                    <span class="cost-detail">${plan.foodLevel} · ${plan.days}天 · ¥${plan.foodCostPerDay}/天</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">🎫 门票费用</span>
                    <span class="cost-value">¥${plan.ticketCost}</span>
                    <span class="cost-detail">景点门票及娱乐项目</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">🛍️ 其他费用</span>
                    <span class="cost-value">¥${plan.otherCost}</span>
                    <span class="cost-detail">购物、纪念品等</span>
                </div>
            </div>
        `;

        // 构建详细的日程安排
        const scheduleHtml = plan.dayPlans.map(dayPlan => `
            <div class="day-schedule">
                <h6><i class="fas fa-calendar"></i> 第${dayPlan.day}天</h6>
                ${dayPlan.schedule.map(item => `
                    <div class="schedule-item">
                        <span class="schedule-time">${item.split(' ')[0]}</span>
                        <span class="schedule-activity">${item.split(' ').slice(1).join(' ')}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');

        planSection.innerHTML = `
            <h4><i class="fas fa-route"></i> 出行计划</h4>
            <div class="plan-route">${plan.route}</div>
            
            ${costBreakdown}
            
            <div class="plan-total">
                <div class="total-info">
                    <span>预计总花费</span>
                    <small>日均 ¥${Math.round(plan.totalBudget / plan.days)}</small>
                </div>
                <strong>¥${plan.totalBudget}</strong>
            </div>
            
            <div class="plan-schedule-detailed">
                <h5><i class="fas fa-calendar-alt"></i> 详细行程安排</h5>
                ${scheduleHtml}
            </div>
        `;
    }

    /**
     * 关闭弹窗
     */
    closeModal() {
        const modal = document.getElementById('detail-modal');
        modal.classList.remove('active');
        
        // 重置图片显示
        const modalImg = document.getElementById('modal-img');
        modalImg.style.display = 'block';
        document.querySelector('.modal-image').style.background = '';
    }
}

// 创建应用实例
const app = new TravelApp();

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('五一去哪玩 · 旅行老虎机 已加载');
});
