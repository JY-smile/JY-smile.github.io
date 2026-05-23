/**
 * 配置文件
 * 
 * AI 旅行推荐应用配置
 */

const CONFIG = {
    // ==================== AI API 配置 ====================
    // 请填写你的 AI API Key
    // 支持的 AI 服务：'openai' | 'deepseek' | 'qwen' | 'gemini'
    AI_PROVIDER: 'deepseek',  // 默认使用 DeepSeek（性价比高）
    
    // API Key - 请在部署前替换
    AI_API_KEY: 'sk-0d692f826b0a42fea91560e537903257',  // DeepSeek API Key
    
    // API 地址
    AI_API_URL: {
        openai: 'https://api.openai.com/v1/chat/completions',
        deepseek: 'https://api.deepseek.com/chat/completions',
        qwen: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
    },
    
    // AI 模型
    AI_MODEL: {
        openai: 'gpt-4o-mini',
        deepseek: 'deepseek-chat',
        qwen: 'qwen-turbo',
        gemini: 'gemini-pro'
    },
    
    // ==================== 应用配置 ====================
    // 结果展示数量
    RESULT_COUNT: 9,
    
    // 老虎机动画配置
    SLOT_CONFIG: {
        // 快速旋转间隔 (ms)
        FAST_INTERVAL: 60,
        // 快速旋转持续时间 (ms)
        FAST_DURATION: 1800,
        // 减速阶段间隔
        SLOW_INTERVALS: [100, 150, 250, 400],
        // 减速阶段持续时间
        SLOW_DURATIONS: [300, 400, 500, 600],
        // 最终停止前的慢速展示
        FINAL_INTERVAL: 500
    },
    
    // ==================== 提示词配置 ====================
    // AI 系统提示词
    AI_SYSTEM_PROMPT: `你是一位专业的旅行规划师，擅长根据用户的预算、时间和出发地推荐合适的旅行目的地。

请根据用户提供的信息，推荐12个适合的五一旅行目的地，并为每个目的地生成详细的出行方案。

要求：
1. 推荐的目的地要符合用户的预算范围，总费用不能超过预算上限
2. 考虑出发地的距离，推荐合理的交通方式（高铁/飞机/大巴/自驾）
3. 每个目的地都要有详细的费用明细，费用要具体、合理、真实
4. 行程安排要详细，每天按时间段列出具体活动
5. 推荐多样化，包含不同类型（自然风光、历史文化、城市休闲、美食等）
6. 费用计算要准确：总预算 = 往返交通 + 住宿 + 餐饮 + 门票 + 其他

请严格按照指定的 JSON 格式返回结果。`
};
