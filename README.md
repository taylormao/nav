# 网址导航 (Nav)

简洁好用的个人网址导航页面，支持自定义分类/网址、管理后台、Cloudflare R2 云同步。

**在线预览**：`https://5b9e78d2.nav-page-dwm.pages.dev`

---

## 功能

### 首页
| 功能 | 说明 |
|------|------|
| 多引擎搜索 | Google / Bing / 百度 / DuckDuckGo，偏好自动记忆 |
| 分类卡片 | 响应式网格布局，6/5/4/3/2 列自适应 |
| 左侧导航栏 | 分类列表，点击平滑滚动，IntersectionObserver 自动高亮 |
| 深色模式 | 浅色/深色切换，自动检测系统偏好 |
| 键盘快捷键 | `/` 聚焦搜索框，`Esc` 取消 |
| 时钟 | 右上角实时显示 |

### 管理后台
| 功能 | 说明 |
|------|------|
| 分类管理 | 添加/编辑/删除/上移下移 |
| 网址管理 | 添加/编辑/删除，图标支持 emoji、图片 URL、自动抓取 |
| 外观设置 | 自定义背景图片或纯色 |
| 数据备份 | JSON 导出/导入，一键恢复默认 |
| R2 同步 | 跨设备自动同步，配置测试/推送/拉取 |
| 认证保护 | 密码登录，哈希存储，sessionStorage 会话 |

### 图标抓取
手动输入优先，留空则自动抓取。国内可用的三路回退：

```
api.xinac.net → 0x3.com → 源站/favicon.ico → 🔗兜底
```

### 云同步
基于 Cloudflare R2 + Worker 代理，默认配置嵌入代码：
- **加载时**：自动从 R2 拉取最新数据
- **变更时**：500ms 防抖后自动推送
- **新设备**：首次打开即加载最新内容，无需配置

---

## 项目结构

```
nav/
├── index.html              # 主页面
├── worker.js               # Cloudflare Worker (R2 代理)
├── wrangler.toml           # Worker 部署配置
├── CHANGELOG.md            # 开发日志
├── .gitignore
├── css/
│   └── style.css           # 全部样式 (CSS 变量主题)
├── js/
│   ├── data.js             # 数据层 + DataStore (localStorage CRUD)
│   ├── main.js             # 主入口：渲染、时钟、快捷键
│   ├── theme.js            # 深色/浅色主题管理
│   ├── search.js           # 多引擎搜索路由
│   ├── auth.js             # 管理后台认证
│   ├── sync.js             # Cloudflare R2 云同步
│   └── admin.js            # 管理后台逻辑
```

---

## 技术栈

- 纯 HTML / CSS / JS，零依赖，零构建工具
- CSS 自定义属性（`--var`）实现主题系统
- localStorage 数据持久化 + sessionStorage 会话
- Cloudflare Pages 托管静态页面
- Cloudflare Workers + R2 对象存储云同步
- IntersectionObserver 滚动监听
- 响应式布局（Flexbox + Grid）

---

## 部署

### 前置条件

```bash
npm install -g wrangler
wrangler login
```

### 1. 创建 R2 存储桶

```bash
wrangler r2 bucket create nav-data
```

### 2. 设置 Worker 认证密钥

```bash
wrangler secret put AUTH_TOKEN
# 输入自定义密钥，例如: nav-r2-mysecret2026
```

### 3. 部署 Worker

```bash
wrangler deploy
# 获得 Worker URL: https://nav-r2-sync.xxx.workers.dev
```

### 4. 部署静态页面

```bash
wrangler pages deploy . --project-name=nav-page
```

### 5. 配置默认同步

编辑 `js/sync.js`，将 `DEFAULT_R2_CONFIG` 改为你自己的 Worker URL 和 Auth Token：

```js
const DEFAULT_R2_CONFIG = {
  workerUrl: 'https://你的-worker.workers.dev',
  authToken: '你的密钥',
};
```

重新部署：

```bash
wrangler pages deploy . --project-name=nav-page
```

---

## 使用

### 管理后台
1. 点击右上角 ⚙️ 齿轮
2. 首次使用设置管理密码（至少 4 位）
3. 后续访问输入密码登录
4. 锁定按钮退出登录

### 添加网址
1. 切换到「网址管理」标签
2. 选择分类 → 输入 URL → 自动抓取 favicon 并建议名称
3. 图标字段可选：留空自动抓取，手动输入 emoji 或图片 URL
4. 点击「添加网址」

### 跨设备同步
1. 首次在后台「R2同步」→ 填入 Worker URL 和 Token → 测试 → 推送
2. 其他设备打开页面即自动加载最新数据
3. 后续任何修改自动双向同步

### 数据备份
1. 后台「数据备份」→ 导出 JSON 文件
2. 新设备导入该文件即可恢复
3. 也可一键恢复默认数据

---

## 版本

当前版本：**v1.6.0**

详细变更记录见 [CHANGELOG.md](./CHANGELOG.md)。

---

## License

MIT
