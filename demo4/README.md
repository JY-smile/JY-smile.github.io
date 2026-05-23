# 五一去哪玩 · 旅行老虎机（AI 版）

一款基于 AI 智能推荐的 H5 旅行灵感工具。用户通过回答三个问题（出发地、预算、天数），系统调用 DeepSeek AI 实时分析并推荐 12 个最适合的旅行目的地。

结果页以**老虎机式跑马灯卷轴**呈现。用户点击"开始选择"后触发老虎机抽奖动画，卡片快速轮转、逐步减速、最终停顿在随机中奖地点上，并弹出该地点的详情卡片（含详细出行方案 + 费用明细）。

## 在线预览

访问 [GitHub Pages](https://your-username.github.io/travel-slot-machine/) 体验（需替换为实际地址）

## 功能特性

- **AI 智能推荐**：调用 DeepSeek AI 根据用户预算、天数、出发地实时生成个性化推荐
- **纯静态应用**：无需后端服务器，可直接部署到 GitHub Pages
- **省市区联动**：纯静态省-市二级联动选择
- **预算滑块**：可视化预算选择，支持快捷标签快速设置
- **天数步进器**：1-10 天游玩天数选择
- **老虎机动画**：4x4 网格布局 + 自定义跑马灯动画
- **详细行程**：AI 生成的费用明细和每日行程安排
- **响应式设计**：完美适配各种移动设备

## 技术栈

| 类别 | 选型 |
| :--- | :--- |
| 核心框架 | 原生 JavaScript (ES6+) |
| AI 服务 | DeepSeek API |
| 图标库 | Font Awesome 6 |
| 字体 | Poppins (Google Fonts) |

## 文件结构

```
├── index.html          # 入口文件
├── css/
│   └── style.css       # 全局样式
├── js/
│   ├── main.js         # 主逻辑（页面切换、事件绑定）
│   ├── api.js          # AI API 请求封装
│   ├── slot.js         # 老虎机动画逻辑
│   ├── data.js         # 省市区静态数据
│   └── config.js       # API 配置常量
└── README.md
```

## 页面流程

```
[首页] → [问卷页] → [AI 分析中...] → [结果页（老虎机）] → [抽奖] → [详情卡片]
```

## 使用说明

### 1. 配置 AI API Key

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册并获取 API Key
2. 在 `js/config.js` 中配置：

```javascript
const CONFIG = {
    AI_API_KEY: '你的 DeepSeek API Key',
    // ...
};
```

### 2. 本地测试

直接在浏览器中打开 `index.html` 即可测试。

**注意**：由于浏览器安全限制（CORS），本地直接打开可能会遇到跨域问题。建议：

- 使用本地服务器（如 VS Code Live Server）
- 或先部署到 GitHub Pages 再测试

### 3. 部署到 GitHub Pages

1. Fork 或下载本项目
2. 在 `js/config.js` 中填入你的 API Key
3. 推送到你的 GitHub 仓库
4. 进入仓库 Settings → Pages
5. Source 选择 Deploy from a branch，Branch 选择 main / root
6. 访问 `https://你的用户名.github.io/仓库名/`

## API 安全说明

**重要**：纯前端项目无法隐藏 API 密钥，任何部署到 GitHub Pages 的代码中的密钥都是**公开可见的**。

**建议**：
1. 仅用于演示和个人使用
2. 在 DeepSeek 控制台监控 API 使用量
3. 如有需要，可设置使用限额防止滥用
4. 生产环境建议使用后端代理

## 自定义配置

### 修改 AI 模型

```javascript
// js/config.js
AI_PROVIDER: 'deepseek',  // 可选：'openai' | 'deepseek' | 'qwen' | 'gemini'
AI_API_KEY: '你的 API Key',
```

### 修改老虎机动画速度

```javascript
// js/config.js
SLOT_CONFIG: {
    FAST_INTERVAL: 60,      // 快速旋转间隔 (ms)
    FAST_DURATION: 1800,    // 快速旋转持续时间 (ms)
    SLOW_INTERVALS: [100, 150, 250, 400],  // 减速阶段间隔
    SLOW_DURATIONS: [300, 400, 500, 600]   // 减速阶段持续时间
}
```

## 浏览器兼容性

- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+

## 许可证

MIT License

## 致谢

- [DeepSeek](https://deepseek.com/) - AI 大模型服务
- [Font Awesome](https://fontawesome.com/) - 图标库
