# 开发日志

## v1.6.0 (2026-06-19)

### 新增
- 全自动 R2 云同步：页面加载自动拉取，数据变更自动推送（500ms 防抖）
- 新用户/新浏览器首次访问自动从 R2 加载最新数据
- R2 配置默认值嵌入代码，无需手动配置即可自动同步
- 同步日志输出到浏览器 Console（`[Sync]` 前缀）
- 时间戳比对：仅远程数据更新时才覆盖本地

### 修复
- Worker OPTIONS 预检移到认证之前，解决 CORS 跨域问题
- Worker URL 自动补全 `https://` 前缀，防止 fetch 发送相对路径
- R2同步标签页 ID 大小写不匹配（`tabR2Sync` → `tabR2sync`）

---

## v1.5.0 (2026-06-19)

### 新增
- Cloudflare R2 对象存储同步功能
- 管理后台新增「R2同步」标签页（保存配置/测试连接/推送/拉取）
- 配套 Cloudflare Worker（`worker.js`）作为 R2 认证代理
- `wrangler.toml` 部署配置文件
- `js/sync.js` 前端同步模块

---

## v1.4.0 (2026-06-19)

### 新增
- 左侧分类导航栏：桌面端 sticky 侧边栏，移动端抽屉式（右下角浮动按钮）
- IntersectionObserver 滚动监听，自动高亮当前分类
- 管理后台新增「外观设置」标签页：自定义背景图片/纯色
- 管理后台新增「数据备份」标签页：导出/导入 JSON 备份
- 网站图标手动输入功能：支持 emoji 或图片 URL，留空自动抓取

### 修复
- 管理面板宽度从 640px 扩大到 760px，标签间距优化，锁定按钮不再换行
- 管理后台标签 ID 大小写一致性修复

---

## v1.3.0 (2026-06-19)

### 新增
- 页面背景自定义功能（图片 URL / 纯色）
- 网站图标手动设定（emoji 或图片 URL）
- Favicon 多路回退：`api.xinac.net` → `0x3.com` → 源站 `/favicon.ico` → `🔗`
- `worker.js` 和 `wrangler.toml` 部署配置文件

### 修复
- Google favicon 服务在国内不可访问 → 替换为三路 CDN 回退链
- Favicon `<img>` 加载失败时自动尝试下一个源
- 管理后台 `renderIconHTML` 中 favicon 回退字符乱码修复

---

## v1.2.0 (2026-06-19)

### 新增
- 管理后台（分类管理 + 网址管理）
- DataStore 数据持久化层（localStorage CRUD）
- 自定义分类：添加/编辑/删除/上移下移
- 自定义网址：添加/编辑/删除，favicon 自动抓取
- 管理员认证登录（密码哈希 + sessionStorage 会话）
- 后台锁定按钮
- 认证弹窗（首次设置密码 / 后续登录）

---

## v1.0.0 (2026-06-19)

### 新增
- 初始版本
- 多引擎搜索（Google / Bing / 百度 / DuckDuckGo），偏好记忆
- 8 大分类，50+ 预设网址卡片
- 深色/浅色主题切换，系统偏好自动检测
- 键盘快捷键：`/` 聚焦搜索，`Esc` 取消
- 响应式布局：6/5/4/3/2 列自适应
- 右上角时钟显示
- 版本号显示

---

## Bug 修复记录

| 版本 | 问题 | 修复 |
|------|------|------|
| v1.0.0 | `.search-input:focus ~ .search-icon` 选择器无效（icon 在 input 之前） | 移除无效规则，仅用 `focus-within` |
| v1.0.0 | 搜索引擎按钮文字在移动端未正确隐藏 | 按钮文字包裹 `<span>` 标签，CSS 精准控制 |
| v1.0.0 | 搜索图标绑定了无效的 click 事件（`pointer-events: none`） | 移除 JS handler，图标纯装饰 |
| v1.2.0 | `tabR2Sync` 与 `tabR2sync` ID 大小写不匹配 | 统一为 `tabR2sync` |
| v1.3.0 | Google favicon 国内不可用 | 替换为 api.xinac.net + 0x3.com + 源站三路回退 |
| v1.3.0 | `renderIconHTML` 中回退字符 `'�'` 应为 `'🔗'` | 修正回退 emoji |
| v1.5.0 | Worker CORS 预检返回 401 | OPTIONS handler 移到 auth 检查之前 |
| v1.5.0 | Worker URL 缺 `https://` 导致 fetch 发相对路径 | `setConfig` 自动补全协议前缀 |
| v1.5.0 | Pages 部署未同步最新代码 | 需要手动 `wrangler pages deploy` |
| v1.5.0 | `autoPush` 和 `autoPull` 未生效 | 添加日志、缩短防抖到 500ms、默认配置嵌入 |
