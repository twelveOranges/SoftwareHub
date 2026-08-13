# 我的软件库 (Personal Software Hub)

自用软件资产管理面板，部署在 NAS 上，方便随时查找 / 下载 / 记录自己收集的软件（含历史版本）。

## Features

- 📦 **多平台管理**：Mac / Windows / Android 一站式管理
- 🌟 **装机必备**：把重装系统必装的软件标为「装机必备」，组合选平台后一键得到装机清单
- ⚡ **一键批量下载**：当前平台的全部必备一键下载，附件可选择性勾选
- 🗂️ **历史版本**：每个软件支持多版本管理（每版本独立文件名、大小、发布日期、下载链接）
- 📎 **附件支持**：一个软件可带插件包、配置文件、字体包等附件，各自标注安装路径
- 🖼️ **本地图标**：自维护软件 logo（`icons/{platform}/xxx.png`），加载失败自动降级
- 📝 **备注记录**：软件级备注（序列号、激活方式），版本级备注（兼容说明等）
- 📊 **使用统计**：记录点击下载次数，支持按使用频率排序
- 🎨 **7 种主题**：明亮 / 复古 / 护眼 / 海天 / 深邃 / 暗黑 / 自动跟随系统
- ▦☰ **双视图**：网格 / 列表随意切换
- 🔎 **实时搜索**：名称 / 描述 / 备注 三字段搜索，快捷键 `/` 聚焦
- 🔗 **URL 路由**：过滤视图可分享，浏览器前进后退可用
- 💾 **零后端**：纯静态，丢 NAS 里 nginx / caddy / SMB 直接跑
## Project Structure

```
software-hub/
├── index.html            # Entry HTML
├── css/style.css         # 7 theme tokens + all layouts
├── js/
│   ├── main.js           # Entry — initializes all modules
│   ├── icons.js          # Inline Lucide SVG icon library
│   ├── core/             # State, DOM refs, utils
│   │   ├── state.js      # Reactive state + user data (localStorage)
│   │   ├── dom.js        # Cached element refs + escape helpers
│   │   └── utils.js      # Icon render / byte format helpers
│   └── modules/          # Independent feature modules
│   │   ├── catalog.js        # YAML loader (fetches per-platform catalogs)
│   │   ├── filter.js         # Filter / sort / title
│   │   ├── render.js         # Main render (cards, rows, stats, empty)
│   │   ├── modal-detail.js   # Detail modal (tags, versions, attachments)
│   │   ├── modal-attach.js   # Attachment picker (batch download step 2)
│   │   ├── download.js       # Batch download orchestration
│   │   ├── router.js         # Hash-based URL router
│   │   ├── theme.js          # Theme switcher (7 themes)
│   │   ├── view.js           # Grid/list view toggle
│   │   ├── events.js         # Global event wiring
│   │   └── probe.js          # HEAD probes for file size + last-modified date
│   └── vendor/js-yaml.min.js  # Third-party YAML parser├── data/                 # 👈 Your app catalog (YAML per platform)
│   ├── mac.yaml
│   ├── win.yaml
│   └── android.yaml
├── icons/                # 👈 Your software logos
│   ├── _fallback.svg     # Shown when image 404
│   ├── mac/ win/ android/
├── downloads/            # 👈 Your installer files
│   ├── mac/ win/ android/
│   └── mac/extras/       # Attachments (plugins/configs/etc)
├── fonts/                # Dosis webfont
├── scripts/              # One-off maintenance scripts (icon downloader, …)
├── Dockerfile            # Nginx-alpine image
├── docker-compose.yml    # One-command deploy
├── nginx.conf            # Custom nginx config (mime, gzip, cache, etc.)
└── README.md
```

## Deploy

### ⚡ Docker Compose (推荐，一键启动)

```bash
docker compose up -d
```

启动后访问 **http://localhost:8080**（端口可在 `docker-compose.yml` 修改）。

- `downloads/` 、`icons/` 、`data/` 都以 **read-only 挂载卷** 方式接入容器
- 你在宿主机上继续维护安装包 / 图标 / catalog，**容器无需重建** 即可看到更新
- 启动后内置 healthcheck，30 秒一次碰健康探针

常用命令：

```bash
docker compose up -d          # 启动
docker compose logs -f        # 看日志
docker compose restart        # 重启
docker compose down           # 停止
docker compose build --no-cache && docker compose up -d   # 代码改变后重建
```

### 群晖 Synology / QNAP (无 Docker)
1. 把整个目录扔进 `Web Station` 的 `web` 目录
2. 软件安装包放到 `downloads/mac`、`downloads/win`、`downloads/android` 下
3. 软件图标放到 `icons/{platform}/`
4. 浏览器访问 `http://nas-ip/software-hub/`

### 自己的 Nginx
参考本仓库的 [`nginx.conf`](./nginx.conf)，直接拷到已有 nginx 的 `conf.d/` 即可。

## Editing App Catalog

App catalog lives in three YAML files, one per platform:

- `data/mac.yaml`
- `data/win.yaml`
- `data/android.yaml`

Each file is a list of app entries. Full schema per entry:

```yaml
- name: Photoshop                       # 显示名 (required)
  icon: icons/mac/photoshop.png         # 图标路径 (推荐 128×128 PNG/SVG)
  desc: 专业图像处理软件            # 一句话描述
  category: design                      # design|dev|office|video|system|browser|chat|life|game
  essential: true                       # 是否装机必备 (默认 false)
  note: "序列号: 见 1Password「Adobe」条目"  # 软件级备注 (可选)
  versions:                             # 版本列表，第一个为推荐版本
    - version: "2024"
      downloadUrl: /downloads/mac/photoshop-2024.dmg
    - version: "2023"
      downloadUrl: /downloads/mac/photoshop-2023.dmg
      note: 兼容旧插件                     # 版本级备注 (可选)
  attachments:                          # (可选) 附件：插件包、配置、字体包等
    - name: 常用滤镜包
      desc: Nik Collection + Camera Raw 预设
      downloadUrl: /downloads/mac/extras/ps-filters.zip
      installPath: ~/Library/Application Support/Adobe/Plug-ins
```

### 自动提取的字段

不需要在 YAML 中手维以下两个字段，页面启动后会自动从文件服务器 HEAD 请求的响应头提取：

- **文件大小** ← `Content-Length`
- **发布日期** ← `Last-Modified`

你只需把真实安装包放到 `downloads/{platform}/` 目录下，大小和日期就会实时同步。

**分类 keys**: `design` `dev` `office` `video` `system` `browser` `chat` `life` `game`
**平台** 从 YAML 文件名自动推断（不需写 `platform` 字段）

### 图标约定

图标建议 **128×128 PNG** 或 **SVG**（矢量最好），放到对应平台目录：

```
icons/mac/photoshop.png
icons/win/postman.png
icons/android/wechat.png
```

- 图片会自动裁成 `object-fit: cover` 大圆角显示
- 加载失败会自动降级为 `icons/_fallback.svg`（问号占位符）
- 也支持仍然用 emoji（比如临时占位），代码会自动判断类型

### 装机必备用法

**场景**：新装的 Mac，我想装哪些软件？
1. 顶部点 **Mac** → 只显示 Mac 软件
2. 侧边栏点 **🌟 装机必备** → 只显示 Mac 平台里必装的
3. 得到 Mac 装机清单

或者直接分享 URL：`#platform=mac&category=essential`

在网页上悬停任何软件卡片点右上角 **☆** 可以随时切换必备状态（存本地，不改 YAML 文件）。

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `Esc` (in search) | Clear search |
| `Esc` (in modal) | Close detail |

## URL Hash Routes

| Hash | View |
|------|------|
| `#` | Home (all) |
| `#essential=1` 或 `#category=essential` | 🌟 装机必备 |
| `#platform=mac` | All Mac apps |
| `#category=design` | Design category |
| `#platform=mac&category=essential` | **Mac 装机必备** |
| `#q=chrome` | Search "chrome" |

## Persistent Data

Stored in `localStorage`:
- **Theme preference** (`theme`)
- **View preference** (`view`: grid / list)
- **Per-app state** (`sw-hub-userdata`): usage count, custom essential override

Clear with DevTools to reset.

## Roadmap

- [ ] 网页内直接编辑 catalog（免手改 YAML）
- [ ] 从 NAS 目录自动扫描生成 catalog
- [ ] PWA 安装到 Dock / 主屏
