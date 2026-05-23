const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// DeepSeek API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-e667b8ac1af34c3db1a4ba841981aa58';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 天赋分析接口
app.post('/api/analyze', async (req, res) => {
  try {
    const { records, lang } = req.body;
    
    // 验证输入
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: '缺少records参数或格式错误' });
    }
    
    // 预处理记录（截断过长内容）
    const processedRecords = records.map(r => ({
      content: r.content ? r.content.substring(0, 100) : '',
      tag: r.tag || '',
      source: r.source || ''
    }));
    
    // 构建Prompt
    const messages = [
      {
        role: 'system',
        content: `你是一位专业的个人成长教练和天赋分析师，拥有10年+经验。

分析框架：
1. 核心天赋领域（TOP3）- 基于记录内容提取关键词，识别重复出现的正向行为
2. 性格优势 - 从描述方式推断性格特点，分析处理问题的偏好方式
3. 成长建议 - 结合天赋给出具体方向，提供可落地的行动建议
4. 激励寄语 - 一句温暖有力的鼓励话语

输出语言：${lang === 'zh' ? '中文' : 'English'}
输出格式：Markdown，4个章节，层级清晰，300-500字，温暖专业不鸡汤。`
      },
      {
        role: 'user',
        content: `请分析以下夸夸记录，发现用户的天赋：

${JSON.stringify(processedRecords, null, 2)}

## 记录说明
- self：自我肯定
- others：他人夸奖  
- special：特别时刻

请按以下结构输出：
### 🌟 核心天赋领域（TOP3）
### 💪 性格优势
### 📈 成长建议
### 💝 激励寄语`
      }
    ];
    
    // 调用DeepSeek API
    const response = await axios.post(DEEPSEEK_API_URL, {
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 800
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      timeout: 30000
    });
    
    // 返回结果
    res.json({
      success: true,
      result: response.data.choices[0].message.content,
      usage: response.data.usage
    });
    
  } catch (error) {
    console.error('DeepSeek API Error:', error.message);
    
    // 处理不同类型的错误
    if (error.response) {
      // API返回错误
      res.status(error.response.status).json({
        success: false,
        error: error.response.data.error?.message || 'API调用失败'
      });
    } else if (error.request) {
      // 请求发送但无响应
      res.status(503).json({
        success: false,
        error: '服务暂时不可用，请稍后重试'
      });
    } else {
      // 请求配置错误
      res.status(500).json({
        success: false,
        error: '服务器内部错误'
      });
    }
  }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 静态文件服务（用于开发环境）
app.use(express.static('.'));

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 服务器已启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔗 API接口: http://localhost:${PORT}/api/analyze`);
  console.log(`🖥️  前端页面: http://localhost:${PORT}/index.html`);
  console.log(`\n⏳ 等待连接...`);
});
