/**
 * AI API 请求封装
 * 调用 DeepSeek AI 获取旅行推荐
 */

// API 请求类
class TravelAPI {
    constructor() {
        this.cache = new Map();
    }

    /**
     * 从 AI 获取旅行推荐
     * @param {string} cityName - 出发城市
     * @param {number} count - 推荐数量
     * @param {Object} userData - 用户数据（预算、天数）
     * @returns {Promise<Array>} 目的地列表
     */
    async getDestinations(cityName, count = 9, userData = null) {
        // 检查缓存
        const cacheKey = `${cityName}_${userData?.budget?.max}_${userData?.days}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // 检查 API Key
        if (!CONFIG.AI_API_KEY) {
            console.warn('未配置 AI API Key，使用模拟数据');
            return this.getMockDestinations(cityName, count, userData);
        }

        try {
            const destinations = await this.fetchFromAI(cityName, count, userData);
            // 缓存结果
            this.cache.set(cacheKey, destinations);
            return destinations;
        } catch (error) {
            console.error('AI API 请求失败:', error);
            // 失败时回退到模拟数据
            return this.getMockDestinations(cityName, count, userData);
        }
    }

    /**
     * 调用 DeepSeek AI API - 分批获取
     */
    async fetchFromAI(cityName, count, userData) {
        const { budget, days } = userData;
        const budgetText = budget.max >= 999999 ? '无上限' : `${budget.max}元`;
        
        // 分批获取：先获取5个，再获取4个
        const batch1 = await this.fetchBatch(cityName, 5, budgetText, days, 1);
        const batch2 = await this.fetchBatch(cityName, 4, budgetText, days, 2);
        
        // 合并结果
        const allDestinations = [...batch1, ...batch2];
        
        // 确保返回9个
        while (allDestinations.length < 9) {
            allDestinations.push(this.getFallbackDestination(allDestinations.length, cityName, userData));
        }
        
        return allDestinations.slice(0, 9);
    }

    /**
     * 分批获取目的地
     */
    async fetchBatch(cityName, count, budgetText, days, batchNum) {
        const userPrompt = `推荐${count}个五一旅行目的地（第${batchNum}批），从${cityName}出发，预算${budgetText}，${days}天。

返回JSON：
{"destinations":[{"name":"景点","city":"城市","desc":"描述","icon":"🌟","tags":["标签"],"travelPlan":{"route":"${cityName}→目的地","transport":"高铁","transportCost":500,"transportTime":"2h","hotelLevel":"舒适型","hotelCostPerDay":300,"hotelNights":${Math.max(0, days - 1)},"hotelCost":600,"foodLevel":"特色","foodCostPerDay":150,"foodCost":${150 * days},"ticketCost":200,"otherCost":200,"totalBudget":${500 + 600 + 150 * days + 400},"days":${days},"dayPlans":[${Array.from({length: days}, (_, i) => `{"day":${i+1},"schedule":["08:00 景点","10:00 活动","12:00 午餐","14:00 游览","17:00 返程"]}`).join(',')}]}}]}

要求：
1. 只返回${count}个目的地
2. 总预算≤${budgetText}
3. 每天4-5个行程
4. 返回完整JSON`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        
        try {
            const response = await fetch(CONFIG.AI_API_URL.deepseek, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.AI_API_KEY}`
                },
                body: JSON.stringify({
                    model: CONFIG.AI_MODEL.deepseek,
                    messages: [
                        { role: 'system', content: CONFIG.AI_SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API 错误: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            console.log(`批次${batchNum}响应长度:`, content.length);
            
            // 解析 JSON
            const parsed = this.parseAIResponse(content, cityName, { budget: { max: 999999 }, days });
            return parsed.slice(0, count);
            
        } catch (error) {
            console.error(`批次${batchNum}失败:`, error);
            // 返回备用数据
            return Array.from({length: count}, (_, i) => 
                this.getFallbackDestination(i, cityName, { budget: { max: 999999 }, days })
            );
        }
    }

    /**
     * 解析 AI 返回的 JSON
     */
    parseAIResponse(content, cityName, userData) {
        try {
            // 清理内容，移除可能的 Markdown 代码块标记
            let cleanedContent = content
                .replace(/```json\s*/gi, '')
                .replace(/```\s*$/gi, '')
                .replace(/```/g, '')
                .trim();
            
            console.log('清理后内容长度:', cleanedContent.length);
            console.log('内容结尾:', cleanedContent.slice(-100));
            
            // 检查JSON是否被截断
            let isTruncated = false;
            const lastBrace = cleanedContent.lastIndexOf('}');
            const lastBracket = cleanedContent.lastIndexOf(']');
            
            // 如果最后一个字符不是}或]，说明被截断了
            const lastChar = cleanedContent.trim().slice(-1);
            if (lastChar !== '}' && lastChar !== ']') {
                console.log('检测到JSON被截断');
                isTruncated = true;
            }
            
            // 尝试直接解析
            let jsonData;
            try {
                jsonData = JSON.parse(cleanedContent);
                console.log('直接解析成功');
            } catch (e) {
                console.log('直接解析失败:', e.message);
                
                // 如果被截断，尝试修复
                if (isTruncated) {
                    console.log('尝试修复截断的JSON...');
                    cleanedContent = this.fixTruncatedJSON(cleanedContent);
                }
                
                // 尝试修复常见的 JSON 错误
                let fixedJson = cleanedContent
                    .replace(/,\s*]/g, ']')
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*,/g, ',');
                
                fixedJson = this.fixUnterminatedStrings(fixedJson);
                
                try {
                    jsonData = JSON.parse(fixedJson);
                    console.log('修复后解析成功');
                } catch (e2) {
                    console.log('修复后仍然失败:', e2.message);
                    // 尝试提取部分有效数据
                    return this.extractPartialData(cleanedContent, cityName, userData);
                }
            }

            const destinations = jsonData.destinations || [];
            console.log('成功解析目的地数量:', destinations.length);
            
            // 确保返回 9 个目的地
            while (destinations.length < 9) {
                destinations.push(this.getFallbackDestination(destinations.length, cityName, userData));
            }

            // 处理每个目的地
            return destinations.slice(0, 9).map((dest, index) => ({
                id: `dest_${index}`,
                name: dest.name || `目的地${index + 1}`,
                city: dest.city || dest.name,
                desc: dest.desc || '一个值得一去的旅行目的地',
                icon: dest.icon || '📍',
                tags: dest.tags || ['旅行', '休闲'],
                travelPlan: this.validateTravelPlan(dest.travelPlan, userData),
                isFun: false
            }));
        } catch (error) {
            console.error('解析 AI 响应失败:', error);
            throw error;
        }
    }

    /**
     * 修复截断的JSON
     */
    fixTruncatedJSON(content) {
        // 找到最后一个完整的对象
        let fixed = content;
        
        // 尝试找到最后一个完整的destination对象
        const lastCompleteObj = fixed.lastIndexOf('"totalBudget"');
        if (lastCompleteObj > 0) {
            // 找到这个对象结束的}
            const searchFrom = lastCompleteObj;
            let braceCount = 0;
            let endPos = -1;
            
            for (let i = searchFrom; i < fixed.length; i++) {
                if (fixed[i] === '{') braceCount++;
                if (fixed[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        endPos = i;
                        break;
                    }
                }
            }
            
            if (endPos > 0) {
                // 截断到最后一个完整对象
                fixed = fixed.substring(0, endPos + 1);
                // 补充数组和对象的闭合
                fixed = fixed.replace(/,\s*$/, '') + ']}';
                console.log('修复后长度:', fixed.length);
                return fixed;
            }
        }
        
        // 简单修复：直接补充闭合
        fixed = fixed.replace(/,\s*$/, '');
        if (fixed.match(/\[\s*{/)) {
            fixed += ']}';
        } else if (fixed.match(/{/)) {
            fixed += '}';
        }
        
        return fixed;
    }

    /**
     * 修复未终止的字符串
     */
    fixUnterminatedStrings(json) {
        // 匹配属性值中可能未终止的字符串
        // 这个正则匹配 "key": "... 但未闭合的情况
        const lines = json.split('\n');
        const fixedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            // 检查行尾是否有未闭合的字符串
            const quoteMatches = line.match(/"/g);
            if (quoteMatches && quoteMatches.length % 2 === 1) {
                // 奇数个引号，说明有未闭合的字符串
                // 在行尾添加引号
                line = line + '"';
            }
            fixedLines.push(line);
        }
        
        return fixedLines.join('\n');
    }

    /**
     * 从损坏的JSON中提取部分有效数据
     */
    extractPartialData(content, cityName, userData) {
        console.log('尝试提取部分有效数据...');
        const destinations = [];
        
        // 尝试匹配完整的目的地对象
        const destPattern = /"name"\s*:\s*"([^"]+)".*?"city"\s*:\s*"([^"]+)"/gs;
        let match;
        
        while ((match = destPattern.exec(content)) !== null && destinations.length < 9) {
            destinations.push({
                name: match[1],
                city: match[2],
                desc: '从AI响应中提取的目的地',
                icon: '📍',
                tags: ['旅行'],
                travelPlan: this.generateFallbackPlan(userData?.days || 3, userData?.budget || { max: 3000 }),
                isFun: false
            });
        }
        
        console.log('提取到部分目的地数量:', destinations.length);
        
        // 补充到9个
        while (destinations.length < 9) {
            destinations.push(this.getFallbackDestination(destinations.length, cityName, userData));
        }
        
        return destinations.map((dest, index) => ({
            id: `dest_${index}`,
            ...dest
        }));
    }

    /**
     * 验证并补充出行计划
     */
    validateTravelPlan(plan, userData) {
        const days = userData?.days || 3;
        const budget = userData?.budget || { max: 5000 };
        
        if (!plan) {
            return this.generateFallbackPlan(days, budget);
        }

        // 确保所有字段都存在
        return {
            route: plan.route || '出发地 → 目的地',
            transport: plan.transport || '高铁',
            transportCost: plan.transportCost || 500,
            transportTime: plan.transportTime || '3小时',
            hotelLevel: plan.hotelLevel || '舒适型酒店',
            hotelCostPerDay: plan.hotelCostPerDay || 300,
            hotelNights: plan.hotelNights ?? Math.max(0, days - 1),
            hotelCost: plan.hotelCost || 600,
            foodLevel: plan.foodLevel || '当地特色',
            foodCostPerDay: plan.foodCostPerDay || 150,
            foodCost: plan.foodCost || 450,
            ticketCost: plan.ticketCost || 200,
            otherCost: plan.otherCost || 200,
            totalBudget: plan.totalBudget || 2000,
            days: plan.days || days,
            dayPlans: plan.dayPlans || this.generateFallbackDayPlans(days)
        };
    }

    /**
     * 生成备用目的地
     */
    getFallbackDestination(index, cityName, userData) {
        const fallbackNames = [
            '西湖', '千岛湖', '乌镇', '西塘古镇', '普陀山',
            '黄山', '婺源', '景德镇', '庐山', '井冈山',
            '武夷山', '鼓浪屿'
        ];
        
        return {
            name: fallbackNames[index % fallbackNames.length],
            city: '周边城市',
            desc: '风景优美的旅游目的地',
            icon: '🏞️',
            tags: ['自然风光', '休闲'],
            travelPlan: this.generateFallbackPlan(userData?.days || 3, userData?.budget || { max: 3000 }),
            isFun: false
        };
    }

    /**
     * 生成备用出行计划
     */
    generateFallbackPlan(days, budget) {
        const dailyBudget = (budget?.max || 3000) / days;
        
        return {
            route: '出发地 → 目的地',
            transport: '高铁',
            transportCost: 400,
            transportTime: '2-3小时',
            hotelLevel: '舒适型酒店',
            hotelCostPerDay: Math.round(dailyBudget * 0.3),
            hotelNights: Math.max(0, days - 1),
            hotelCost: Math.round(dailyBudget * 0.3 * Math.max(0, days - 1)),
            foodLevel: '当地特色',
            foodCostPerDay: Math.round(dailyBudget * 0.25),
            foodCost: Math.round(dailyBudget * 0.25 * days),
            ticketCost: 200,
            otherCost: Math.round(dailyBudget * 0.15 * days),
            totalBudget: budget?.max || 3000,
            days: days,
            dayPlans: this.generateFallbackDayPlans(days)
        };
    }

    /**
     * 生成备用日程
     */
    generateFallbackDayPlans(days) {
        const plans = [];
        for (let i = 1; i <= days; i++) {
            plans.push({
                day: i,
                schedule: [
                    '09:00 出发游览',
                    '12:00 午餐',
                    '14:00 继续游览',
                    '18:00 晚餐',
                    '20:00 休息'
                ]
            });
        }
        return plans;
    }

    /**
     * 获取模拟数据（备用）
     */
    getMockDestinations(cityName, count, userData) {
        const mockNames = [
            { name: '杭州西湖', city: '杭州', icon: '🌊', tags: ['自然风光', '文化古迹'] },
            { name: '乌镇', city: '嘉兴', icon: '🏘️', tags: ['古镇', '水乡'] },
            { name: '千岛湖', city: '杭州', icon: '🏝️', tags: ['湖泊', '度假'] },
            { name: '黄山', city: '黄山', icon: '⛰️', tags: ['山岳', '摄影'] },
            { name: '西塘古镇', city: '嘉兴', icon: '🌉', tags: ['古镇', '夜景'] },
            { name: '普陀山', city: '舟山', icon: '🛕', tags: ['佛教', '海岛'] },
            { name: '婺源', city: '上饶', icon: '🌸', tags: ['乡村', '花海'] },
            { name: '武夷山', city: '南平', icon: '🍵', tags: ['山水', '茶文化'] },
            { name: '庐山', city: '九江', icon: '☁️', tags: ['避暑', '名山'] },
            { name: '景德镇', city: '景德镇', icon: '🏺', tags: ['陶瓷', '文化'] },
            { name: '鼓浪屿', city: '厦门', icon: '🎹', tags: ['海岛', '文艺'] },
            { name: '泰山', city: '泰安', icon: '🌅', tags: ['登山', '日出'] }
        ];

        return mockNames.slice(0, count).map((item, index) => ({
            id: `mock_${index}`,
            name: item.name,
            city: item.city,
            desc: `${item.name}是${item.city}的著名景点，${item.tags.join('、')}，非常适合五一出游。`,
            icon: item.icon,
            tags: item.tags,
            travelPlan: this.generateFallbackPlan(userData?.days || 3, userData?.budget || { max: 3000 }),
            isFun: false
        }));
    }

    /**
     * 根据预算和天数筛选
     */
    filterByConditions(destinations, budget, days) {
        return destinations.map(dest => ({
            ...dest,
            estimatedDays: days,
            dailyBudget: Math.round(budget.max / days)
        }));
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
    }
}

// 创建 API 实例
const travelAPI = new TravelAPI();
