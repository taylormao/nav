// ============================================================
// Navigation Data — DataStore with localStorage persistence
// ============================================================

const DEFAULT_DATA = [
  {
    name: '常用工具',
    icon: '🛠️',
    sites: [
      { name: 'Google', url: 'https://www.google.com', icon: '🔍', description: '全球搜索引擎' },
      { name: 'Gmail', url: 'https://mail.google.com', icon: '📧', description: '谷歌邮箱' },
      { name: 'Google 翻译', url: 'https://translate.google.com', icon: '🌐', description: '在线翻译' },
      { name: '百度', url: 'https://www.baidu.com', icon: '🔎', description: '中文搜索' },
      { name: '必应', url: 'https://www.bing.com', icon: '🔎', description: '微软搜索' },
      { name: '百度地图', url: 'https://map.baidu.com', icon: '🗺️', description: '在线地图' },
      { name: '高德地图', url: 'https://www.amap.com', icon: '📍', description: '导航出行' },
      { name: 'DeepL', url: 'https://www.deepl.com/translator', icon: '📝', description: 'AI翻译' },
    ]
  },
  {
    name: '社交媒体',
    icon: '💬',
    sites: [
      { name: '微信网页版', url: 'https://web.wechat.com', icon: '💬', description: '即时通讯' },
      { name: '微博', url: 'https://weibo.com', icon: '📢', description: '社交媒体' },
      { name: '知乎', url: 'https://www.zhihu.com', icon: '❓', description: '问答社区' },
      { name: '豆瓣', url: 'https://www.douban.com', icon: '📚', description: '书影音社区' },
      { name: 'Twitter/X', url: 'https://x.com', icon: '🐦', description: '社交网络' },
      { name: 'Reddit', url: 'https://www.reddit.com', icon: '🤖', description: '英文论坛' },
      { name: '小红书', url: 'https://www.xiaohongshu.com', icon: '📕', description: '生活方式分享' },
    ]
  },
  {
    name: '开发者',
    icon: '💻',
    sites: [
      { name: 'GitHub', url: 'https://github.com', icon: '🐙', description: '代码托管平台' },
      { name: 'GitLab', url: 'https://gitlab.com', icon: '🦊', description: 'DevOps平台' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '📚', description: '技术问答' },
      { name: 'MDN', url: 'https://developer.mozilla.org', icon: '📖', description: 'Web文档' },
      { name: 'NPM', url: 'https://www.npmjs.com', icon: '📦', description: 'Node包管理' },
      { name: 'VS Code', url: 'https://code.visualstudio.com', icon: '🖥️', description: '代码编辑器' },
      { name: 'CodePen', url: 'https://codepen.io', icon: '✏️', description: '在线代码编辑' },
      { name: 'DevDocs', url: 'https://devdocs.io', icon: '📋', description: 'API文档聚合' },
    ]
  },
  {
    name: 'AI 工具',
    icon: '🤖',
    sites: [
      { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '🧠', description: 'OpenAI对话' },
      { name: 'Claude', url: 'https://claude.ai', icon: '✨', description: 'Anthropic助手' },
      { name: 'Gemini', url: 'https://gemini.google.com', icon: '💎', description: 'Google AI' },
      { name: 'DeepSeek', url: 'https://chat.deepseek.com', icon: '🔮', description: '深度求索' },
      { name: 'Hugging Face', url: 'https://huggingface.co', icon: '🤗', description: 'AI模型社区' },
      { name: 'Perplexity', url: 'https://www.perplexity.ai', icon: '🔬', description: 'AI搜索引擎' },
    ]
  },
  {
    name: '视频娱乐',
    icon: '🎬',
    sites: [
      { name: 'YouTube', url: 'https://www.youtube.com', icon: '▶️', description: '视频平台' },
      { name: 'Bilibili', url: 'https://www.bilibili.com', icon: '📺', description: '哔哩哔哩' },
      { name: '抖音', url: 'https://www.douyin.com', icon: '🎵', description: '短视频' },
      { name: 'Netflix', url: 'https://www.netflix.com', icon: '🎬', description: '流媒体' },
      { name: 'Twitch', url: 'https://www.twitch.tv', icon: '🎮', description: '直播平台' },
      { name: '优酷', url: 'https://www.youku.com', icon: '📹', description: '视频网站' },
    ]
  },
  {
    name: '购物',
    icon: '🛒',
    sites: [
      { name: '淘宝', url: 'https://www.taobao.com', icon: '🛍️', description: '电商平台' },
      { name: '京东', url: 'https://www.jd.com', icon: '🐶', description: '自营电商' },
      { name: '拼多多', url: 'https://www.pinduoduo.com', icon: '🌺', description: '社交电商' },
      { name: 'Amazon', url: 'https://www.amazon.com', icon: '📦', description: '全球电商' },
      { name: '1688', url: 'https://www.1688.com', icon: '🏭', description: '批发平台' },
      { name: '什么值得买', url: 'https://www.smzdm.com', icon: '💰', description: '优惠导购' },
    ]
  },
  {
    name: '学习资源',
    icon: '📖',
    sites: [
      { name: 'Coursera', url: 'https://www.coursera.org', icon: '🎓', description: '在线课程' },
      { name: 'W3Schools', url: 'https://www.w3schools.com', icon: '🏫', description: 'Web教程' },
      { name: 'LeetCode', url: 'https://leetcode.cn', icon: '⚡', description: '算法刷题' },
      { name: 'GitHub中文社区', url: 'https://github.com/ruanyf/weekly', icon: '📰', description: '科技周刊' },
      { name: '阮一峰博客', url: 'https://www.ruanyifeng.com', icon: '📝', description: '技术博客' },
      { name: 'WikiHow', url: 'https://zh.wikihow.com', icon: '📗', description: '生活百科' },
    ]
  },
  {
    name: '资源仓库',
    icon: '📦',
    sites: [
      { name: '百度网盘', url: 'https://pan.baidu.com', icon: '☁️', description: '云存储' },
      { name: '阿里云盘', url: 'https://www.alipan.com', icon: '☁️', description: '云存储' },
      { name: '蓝奏云', url: 'https://www.lanzou.com', icon: '📁', description: '文件分享' },
      { name: 'Pinterest', url: 'https://www.pinterest.com', icon: '📌', description: '图片灵感' },
      { name: 'Unsplash', url: 'https://unsplash.com', icon: '🖼️', description: '免费图片' },
      { name: 'Iconfont', url: 'https://www.iconfont.cn', icon: '🎨', description: '图标资源' },
    ]
  },
];

// ============================================================
// DataStore — localStorage-backed CRUD for categories & sites
// ============================================================

const DataStore = {
  STORAGE_KEY: 'nav-data',

  _clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) { /* corrupted data, use defaults */ }
    const seed = this._clone(DEFAULT_DATA);
    this.save(seed);
    return seed;
  },

  save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* quota exceeded */ }
    this._notify();
  },

  _notify() {
    window.dispatchEvent(new CustomEvent('navDataChanged'));
  },

  // ---- Category CRUD ----

  addCategory(name, icon) {
    const data = this.load();
    data.push({ name: name.trim(), icon: icon.trim() || '📁', sites: [] });
    this.save(data);
  },

  updateCategory(index, name, icon) {
    const data = this.load();
    if (index < 0 || index >= data.length) return;
    data[index].name = name.trim() || data[index].name;
    data[index].icon = icon.trim() || data[index].icon;
    this.save(data);
  },

  deleteCategory(index) {
    const data = this.load();
    if (index < 0 || index >= data.length) return;
    data.splice(index, 1);
    this.save(data);
  },

  moveCategory(fromIndex, toIndex) {
    const data = this.load();
    if (fromIndex < 0 || fromIndex >= data.length) return;
    if (toIndex < 0 || toIndex >= data.length) return;
    const item = data.splice(fromIndex, 1)[0];
    data.splice(toIndex, 0, item);
    this.save(data);
  },

  // ---- Site CRUD ----

  addSite(catIndex, site) {
    const data = this.load();
    if (catIndex < 0 || catIndex >= data.length) return;
    data[catIndex].sites.push({
      name: site.name.trim(),
      url: site.url.trim(),
      icon: site.icon || '🔗',
      description: (site.description || '').trim(),
    });
    this.save(data);
  },

  updateSite(catIndex, siteIndex, site) {
    const data = this.load();
    if (catIndex < 0 || catIndex >= data.length) return;
    const sites = data[catIndex].sites;
    if (siteIndex < 0 || siteIndex >= sites.length) return;
    sites[siteIndex].name = site.name.trim() || sites[siteIndex].name;
    sites[siteIndex].url = site.url.trim() || sites[siteIndex].url;
    if (site.icon !== undefined) sites[siteIndex].icon = site.icon;
    if (site.description !== undefined) sites[siteIndex].description = site.description.trim();
    this.save(data);
  },

  deleteSite(catIndex, siteIndex) {
    const data = this.load();
    if (catIndex < 0 || catIndex >= data.length) return;
    const sites = data[catIndex].sites;
    if (siteIndex < 0 || siteIndex >= sites.length) return;
    sites.splice(siteIndex, 1);
    this.save(data);
  },
};
