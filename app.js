App({
  globalData: {
    events: [],
    compliments: [],
    intentions: [],
    flowers: ['sunflower', 'daisy', 'jasmine', 'tulip', 'mint'],
    flowerNames: ['向日葵', '雏菊', '茉莉', '郁金香', '薄荷'],
    flowerEmojis: {
      sunflower: '🌻',
      daisy: '🌼',
      jasmine: '🌸',
      tulip: '🌷',
      mint: '🌿'
    },
    tags: ['自我提升', '健康自律', '生活秩序', '治愈滋养', '微小习惯'],
    customTags: [],
    complimentTags: ['小事高光', '情绪自洽', '成长突破', '自律完成', '爱己时刻']
  },

  onLaunch: function () {
    this.loadData()
  },

  loadData: function () {
    try {
      const eventsData = wx.getStorageSync('events')
      const complimentsData = wx.getStorageSync('compliments')
      const customTagsData = wx.getStorageSync('customTags')
      const intentionsData = wx.getStorageSync('intentions')

      if (eventsData) {
        this.globalData.events = eventsData
      }
      if (complimentsData) {
        this.globalData.compliments = complimentsData
      }
      if (customTagsData) {
        this.globalData.customTags = customTagsData
      }
      if (intentionsData) {
        this.globalData.intentions = intentionsData
      }
    } catch (e) {
      console.error('加载数据失败:', e)
    }
  },

  saveCustomTags: function () {
    try {
      wx.setStorageSync('customTags', this.globalData.customTags)
    } catch (e) {
      console.error('保存自定义标签失败:', e)
    }
  },

  addCustomTag: function (tagName) {
    if (!tagName.trim()) return false
    if (this.globalData.tags.includes(tagName.trim())) return false
    if (this.globalData.customTags.includes(tagName.trim())) return false

    this.globalData.customTags.push(tagName.trim())
    this.saveCustomTags()
    return true
  },

  getAllTags: function () {
    return [...this.globalData.tags, ...this.globalData.customTags]
  },

  saveEvents: function () {
    try {
      wx.setStorageSync('events', this.globalData.events)
    } catch (e) {
      console.error('保存事件失败:', e)
    }
  },

  saveCompliments: function () {
    try {
      wx.setStorageSync('compliments', this.globalData.compliments)
    } catch (e) {
      console.error('保存夸夸失败:', e)
    }
  },

  addEvent: function (event) {
    const existingEvent = this.globalData.events.find(e => e.name === event.name)
    if (existingEvent) {
      existingEvent.count++
    } else {
      const flowerIndex = this.globalData.events.length % this.globalData.flowers.length
      const newEvent = {
        id: Date.now(),
        name: event.name,
        purpose: event.purpose || '',
        tag: event.tag || '自我提升',
        flower: this.globalData.flowers[flowerIndex],
        flowerName: this.globalData.flowerNames[flowerIndex],
        count: 1,
        nutrients: 0,
        totalMinutes: 0,
        checkins: 0,
        createdAt: new Date().toISOString(),
        records: []
      }
      this.globalData.events.push(newEvent)
    }
    this.saveEvents()
    return existingEvent ? existingEvent : this.globalData.events[this.globalData.events.length - 1]
  },

  addCheckin: function (eventId, minutes, checkins) {
    const event = this.globalData.events.find(e => e.id === eventId)
    if (event) {
      const nutrientChange = Math.floor(minutes / 10) + checkins * 2
      event.totalMinutes += minutes
      event.checkins += checkins
      event.nutrients += nutrientChange

      const record = {
        id: Date.now(),
        date: new Date().toISOString(),
        minutes: minutes,
        checkins: checkins,
        nutrients: nutrientChange
      }
      event.records.push(record)
      this.saveEvents()
    }
    return event
  },

  getGrowthStage: function (nutrients) {
    if (nutrients < 20) return { stage: 0, name: '种子' }
    if (nutrients < 50) return { stage: 1, name: '发芽' }
    if (nutrients < 80) return { stage: 2, name: '长叶' }
    if (nutrients < 100) return { stage: 3, name: '花苞' }
    if (nutrients < 150) return { stage: 4, name: '盛开' }
    return { stage: 5, name: '繁茂' }
  },

  getGrowthPercent: function (nutrients) {
    return Math.min((nutrients / 150) * 100, 100)
  },

  addCompliment: function (compliment) {
    const newCompliment = {
      id: Date.now(),
      content: compliment.content,
      tag: compliment.tag || '小事高光',
      source: compliment.source || 'self',
      likes: compliment.likes || 0,
      actionCount: compliment.actionCount || 1,
      createdAt: new Date().toISOString()
    }
    this.globalData.compliments.push(newCompliment)
    this.saveCompliments()
    return newCompliment
  },

  likeCompliment: function (id) {
    const compliment = this.globalData.compliments.find(c => c.id === id)
    if (compliment) {
      compliment.likes++
      this.saveCompliments()
    }
    return compliment
  },

  deleteCompliment: function (id) {
    const index = this.globalData.compliments.findIndex(c => c.id === id)
    if (index !== -1) {
      this.globalData.compliments.splice(index, 1)
      this.saveCompliments()
    }
  },

  analyzeTalents: function () {
    const tagCounts = {}
    this.globalData.compliments.forEach(c => {
      tagCounts[c.tag] = (tagCounts[c.tag] || 0) + 1
    })

    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
    return {
      topTags: sortedTags.slice(0, 3),
      totalRecords: this.globalData.compliments.length,
      message: '根据你的夸夸记录，你可能在这些方面有天赋：'
    }
  },

  getTodayTop3: function () {
    const today = new Date().toDateString()
    const todayEvents = this.globalData.events.map(e => {
      const todayRecords = e.records.filter(r => new Date(r.date).toDateString() === today)
      const todayCheckins = todayRecords.reduce((sum, r) => sum + r.checkins, 0)
      return { ...e, todayCheckins }
    })
    return todayEvents.sort((a, b) => b.count - a.count).slice(0, 3)
  },

  getTodayData: function () {
    const today = new Date().toDateString()
    let todayCount = 0
    let todayCheckins = 0
    let todayNutrients = 0

    this.globalData.events.forEach(e => {
      todayCount += e.count
      const todayRecords = e.records.filter(r => new Date(r.date).toDateString() === today)
      todayCheckins += todayRecords.reduce((sum, r) => sum + r.checkins, 0)
      todayNutrients += todayRecords.reduce((sum, r) => sum + r.nutrients, 0)
    })

    return { todayCount, todayCheckins, todayNutrients }
  },

  getIntentions: function () {
    return this.globalData.intentions
  },

  addIntention: function (text) {
    this.globalData.intentions.unshift({
      id: Date.now(),
      text: text,
      done: false,
      createdAt: new Date().toISOString()
    })
    this.saveIntentions()
    return this.globalData.intentions[0]
  },

  toggleIntention: function (index) {
    if (this.globalData.intentions[index]) {
      this.globalData.intentions[index].done = !this.globalData.intentions[index].done
      this.saveIntentions()
    }
    return this.globalData.intentions[index]
  },

  saveIntentions: function () {
    try {
      wx.setStorageSync('intentions', this.globalData.intentions)
    } catch (e) {
      console.error('保存期待失败:', e)
    }
  },

  getRankList: function (period) {
    let filtered = [...this.globalData.events]
    const now = new Date()
    let startDate

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        const day = now.getDay() || 7
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    if (startDate) {
      filtered = filtered.map(e => {
        const periodRecords = e.records.filter(r => new Date(r.date) >= startDate)
        const periodCount = periodRecords.reduce((sum, r) => sum + r.checkins, 0) + e.count
        return { ...e, periodCount }
      }).filter(e => e.periodCount > 0)
    } else {
      filtered = filtered.map(e => ({ ...e, periodCount: e.count }))
    }

    return filtered.sort((a, b) => b.periodCount - a.periodCount).slice(0, 5)
  },

  getMonthHighlights: function () {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const monthCompliments = this.globalData.compliments.filter(c => {
      const date = new Date(c.createdAt)
      return date.getMonth() === month && date.getFullYear() === year
    })
    return monthCompliments.sort((a, b) => (b.likes + b.actionCount) - (a.likes + a.actionCount)).slice(0, 10)
  },

  getYearHighlights: function () {
    const now = new Date()
    const year = now.getFullYear()
    const yearCompliments = this.globalData.compliments.filter(c => {
      const date = new Date(c.createdAt)
      return date.getFullYear() === year
    })
    return yearCompliments.sort((a, b) => (b.likes + b.actionCount) - (a.likes + a.actionCount)).slice(0, 10)
  },

  getMostPersistent: function () {
    return [...this.globalData.events].sort((a, b) => b.count - a.count).slice(0, 3)
  },

  getDeepSeekConfig: function () {
    try {
      const config = wx.getStorageSync('deepseekConfig') || {}
      return {
        apiKey: config.apiKey || '',
        apiUrl: config.apiUrl || 'https://api.deepseek.com/v1/chat/completions'
      }
    } catch (e) {
      return { apiKey: '', apiUrl: 'https://api.deepseek.com/v1/chat/completions' }
    }
  },

  setDeepSeekConfig: function (apiKey) {
    try {
      wx.setStorageSync('deepseekConfig', { apiKey })
      return true
    } catch (e) {
      return false
    }
  },

  getTalentAnalysisData: function () {
    const compliments = this.globalData.compliments
    const events = this.globalData.events

    const processedRecords = compliments.map(r => ({
      content: r.content ? r.content.substring(0, 100) : '',
      tag: r.tag || '',
      createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('zh-CN') : ''
    }))

    const tagCount = {}
    compliments.forEach(c => {
      const tag = c.tag || '其他'
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })

    const eventStats = events.reduce((acc, e) => {
      acc.totalCount += 1
      acc.totalCheckins += e.checkins || 0
      acc.totalNutrients += e.nutrients || 0
      return acc
    }, { totalCount: 0, totalCheckins: 0, totalNutrients: 0 })

    return {
      records: processedRecords,
      recordCount: compliments.length,
      tagDistribution: tagCount,
      eventStats: eventStats,
      topTags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    }
  },

  // 后端API地址，请替换为你的Vercel域名
  BACKEND_API_URL: 'https://your-vercel-domain.vercel.app/api/analyze',

  analyzeWithDeepSeek: function (callback) {
    const compliments = this.globalData.compliments
    const events = this.globalData.events

    if (!compliments || compliments.length === 0) {
      callback({ error: '还没有夸夸记录，无法分析' })
      return
    }

    wx.showLoading({ title: '正在AI分析中...', mask: true })

    wx.request({
      url: this.BACKEND_API_URL,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        compliments: compliments,
        events: events
      },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200 && res.data.success) {
          callback({ result: res.data.result })
        } else {
          callback({ error: res.data.error || '分析失败，请重试' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        callback({ error: '网络请求失败: ' + (err.errMsg || '未知错误') })
      }
    })
  },

  // 保留旧函数，供备份使用（实际上不会被调用）
  analyzeWithDeepSeek_old: function (callback) {
    const config = this.getDeepSeekConfig()

    if (!config.apiKey) {
      callback({ error: '请先配置DeepSeek API Key' })
      return
    }

    const data = this.getTalentAnalysisData()

    const messages = [
      {
        role: 'system',
        content: `你是一位专业的个人成长教练和天赋分析师，拥有10年+经验。

分析框架：
1. 核心天赋领域（TOP3）- 基于记录内容提取关键词，识别重复出现的正向行为
2. 性格优势 - 从描述方式推断性格特点，分析处理问题的偏好方式
3. 成长建议 - 结合天赋给出具体方向，提供可落地的行动建议
4. 激励寄语 - 一句温暖有力的鼓励话语

输出语言：中文
输出格式：Markdown，4个章节，层级清晰，300-500字，温暖专业不鸡汤。`
      },
      {
        role: 'user',
        content: `请分析以下夸夸记录，发现用户的天赋：

## 用户夸夸记录（${data.recordCount}条）
${JSON.stringify(data.records, null, 2)}

## 标签分布
${data.topTags.map(([tag, count]) => `- ${tag}：${count}条`).join('\n')}

## 用户叨叨统计
- 念叨总次数：${data.eventStats.totalCount}
- 打卡总次数：${data.eventStats.totalCheckins}
- 积累养分：${data.eventStats.totalNutrients}

请按以下结构输出：
### 🌟 核心天赋领域（TOP3）
### 💪 性格优势
### 📈 成长建议
### 💝 激励寄语`
      }
    ]

    wx.showLoading({ title: '正在调用AI分析...', mask: true })

    wx.request({
      url: config.apiUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      data: {
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200 && res.data.choices && res.data.choices[0]) {
          callback({ result: res.data.choices[0].message.content })
        } else if (res.statusCode === 401) {
          callback({ error: 'API Key无效，请检查配置' })
        } else if (res.statusCode === 429) {
          callback({ error: '请求过于频繁，请稍后重试' })
        } else {
          callback({ error: '分析失败，请重试' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        callback({ error: '网络请求失败: ' + (err.errMsg || '未知错误') })
      }
    })
  }
})