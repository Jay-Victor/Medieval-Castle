<div align="center">

# 金鸢尾堡 · Castellum Aureliae

**一座为光而建的中世纪城堡** —— 可以在浏览器里旋转、剖开、点灯、带走的三维建筑模型

![Three.js](https://img.shields.io/badge/Three.js-r186-000000?style=flat-square&logo=three.js&logoColor=white)
![build](https://img.shields.io/badge/build-none-3c8c6b?style=flat-square)
![furnishings](https://img.shields.io/badge/furnishings-79-c8a262?style=flat-square)
![triangles](https://img.shields.io/badge/triangles-566%2C934-c8a262?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

[中文](README.md) · [English](README.en.md)

</div>

![白昼总览](previews/hero-day.png)

---

## 这是什么

一座**完全由代码生成**的中世纪城堡。没有外部模型文件，没有贴图素材：石墙、板岩、木材、彩窗、织物、草地与水纹都由 Canvas 程序化绘制，建筑、家具、植物与光照由 Three.js 在浏览器里现场搭建。

它同时是一件可以“上手看”的建筑模型：

- **环绕** —— 拖动旋转、滚轮推近，没有固定导览路线；
- **剖层** —— 五档楼层剖面（全览 / 大厅层 / 领主层 / 藏书层 / 塔顶），屋顶与墙面依次隐去；
- **分层展开** —— 三层结构沿垂直轴升起，像一页摊开的手稿；
- **九室图录** —— 每个房间都有档案：楼层、朝向、陈设数量与设计说明；
- **一日之光** —— 拖动时间轴，太阳从黎明走到子夜，窗光、炉火、星光与界面纸色同步变化；
- **带走** —— 一键导出 GLB 2.0 二进制模型。

![分层展开](previews/exploded.png)

## 快速开始

需要 **Node.js 18+**（推荐 20 或更高）与 **pnpm**。

```bash
git clone https://github.com/Jay-Victor/Medieval-Castle.git
cd Medieval-Castle
pnpm install     # 首次运行前安装依赖
pnpm start       # 启动本地静态服务
```

然后打开 <http://127.0.0.1:4173> 。

Windows 用户也可以双击项目根目录的 **`start.bat`**：脚本会检查 Node.js 与依赖、启动服务，并在就绪后自动打开浏览器。

> 请通过本地服务器访问，不要直接双击 `index.html`——项目使用原生 ES Modules 与 import map，`file://` 协议下无法加载。

## 操作

| 操作 | 方式 |
| --- | --- |
| 环绕 / 缩放 | 拖动画面、滚轮 |
| 查看房间 | 点击画面中的房间标签，或「房间索引」打开九室图录 |
| 楼层剖面 | 右侧「楼层剖面」切换 全览 / 大厅层 / 领主层 / 藏书层 / 塔顶 |
| 分层展开 | 打开「分层展开」，楼层沿垂直轴分离，可拖动观察每层内部 |
| 昼夜光照 | 拖动底部时间轴；播放键启动自动巡日，`Space` 也可切换 |
| 图层 | 右侧六个开关独立控制墙体、屋顶、家具、花园、地景与标注 |
| 复位 / 标注 | `R` 复位视角，`L` 显示或隐藏标签 |
| 导出 | 「导出 GLB 模型」，浏览器直接下载 |

## 建筑与陈设

- **建筑**：三层主堡、四角圆塔、六座门塔、双门楼、幕墙、垛口、南向晨露露台与北向星象露台、双桥、护城河、侧翼与马厩工坊。
- **九个房间**：大厅、领主套房、晨露露台、藏书阁、星象露台、礼拜堂、膳房、前庭花园、后庭花园。
- **七个可审校室内**：大厅 18 件、领主套房 12 件、晨露露台 5 件、藏书阁 19 件、星象露台 5 件、礼拜堂 11 件、膳房 9 件，合计 **79 件已登记的实体陈设**。
- **家具与陈设**：长桌与高台、王座、铁环吊灯、四柱帷幔床、炉边椅、写字桌、整墙书柜、读经桌、浑天仪与地球仪、祭坛、玫瑰彩窗、诵经长椅、石砌大灶、面包炉、望远镜、星图桌、茶桌、花盆、地毯、挂毯、旗帜、烛台与餐具。
- **前后对称花园**：两座镜像的正式花园，各有中央喷泉、四块花坛、玫瑰拱廊、灯柱、长椅、修剪树篱与橄榄/柏树；由同一模板镜像克隆，方向相反、布局严格对应。

![藏书阁](previews/library.png)

## 一日之光

24 小时的太阳与月亮方位、天空渐变、窗光、炉火、星光、雾气与界面纸色同步变化。夜间点亮室内点光源、壁炉暖光与萤火虫；清晨与黄昏各有独立的色温曲线。

| 白昼 10:23 | 夜晚 21:42 |
| --- | --- |
| ![白昼](previews/hero-day.png) | ![夜景](previews/hero-night.png) |

## 自动审校

`src/audit.js` 对每个已登记陈设做世界坐标 AABB 校验：桌面物件同时检查平面占位与垂直重叠，并检查家具是否越出房间边界。

```
PASS — 79 pieces in 7 rooms
大厅 18 · 领主套房 12 · 晨露露台 5 · 藏书阁 19 · 星象露台 5 · 礼拜堂 11 · 膳房 9
碰撞冲突 0 · 边界违规 0
```

运行时可点击「工艺审校通过」查看逐房间报告。

![工艺审校](previews/audit.png)

## GLB 导出

`exports/Castellum-Aureliae.glb` 已随仓库提供：

- GLB 2.0 Binary，约 **15.86 MiB**
- 501 个 mesh 节点，566,934 个三角形，87 个材质
- 包含地形、建筑、室内家具、花园与实例化植被
- 不包含展台、天空、UI、灯光与相机；导出时自动复位分层展开偏移
- 密集植被使用 `EXT_mesh_gpu_instancing`；建议使用 Three.js、Blender 4+ 或支持该扩展的查看器打开

界面中的「导出 GLB 模型」会按当前模型重新生成同名文件。

## 宣传片

仓库附带一支 2 分 04 秒的演示宣传片（1920×1080 · 30 fps）：十个章节，逐段旁白，画面标注与光标操作同步。

- **旁白**：Kokoro-82M 中文神经语音（`zf_xiaoxiao`，24 kHz），按标点切句后逐句合成
- **画面**：以项目真实渲染截图为“舞台”，叠加程序化运镜、光标轨迹、点击涟漪、引线标注与胶片调色
- **配乐**：D 小调持续低音 + 竖琴音型，程序化合成，按旁白包络自动闪避

成片约 190 MB，超过 GitHub 单文件上限，因此不进入 Git 历史，而是作为 **[Releases](../../releases)** 附件发布。

完整制作流水线见 **[video/README.md](video/README.md)**，其中包含分镜、时间轴、音画做法与重新生成的命令；
旁白文案见 [video/narration.md](video/narration.md)（[English](video/narration.en.md)），
逐句字幕见 [video/subtitles.srt](video/subtitles.srt)。

```bash
python video/make_tts_kokoro.py   # 旁白
python video/build_video.py --all # 画面
python video/make_audio.py        # 配乐与混音
```

## 技术

- **Three.js 0.186**，原生 ES Modules + import map，无打包步骤、无框架
- **程序化材质**：石材、板岩、木材、彩窗、织物、草地与水纹均由 CanvasTexture 生成
- **`FurnitureBuilder`** 按材质合并几何；静态建筑与室内焊接为少量材质批次
- **性能**：约 503 个运行期对象、626 draw calls、58 万三角形；静态阴影贴图按需节流刷新
- **导出**：`GLTFExporter`，导出前重新索引几何、复位楼层偏移、剔除 Points/Sprite
- **响应式**：移动端自适应全屏观览台，适配 390 × 844

| | |
| --- | --- |
| ![南露台](previews/balcony.png) | ![九室图录](previews/atlas.png) |
| 晨露露台细部 | 九室图录 |
| ![移动端](previews/mobile.png) | ![移动端面板](previews/mobile-panel.png) |
| 移动端 | 移动端观览台 |

## 目录

```
index.html              页面结构与 UI
server.mjs              零依赖静态服务器（4173）
start.bat               Windows 一键启动
src/main.js             场景、交互、标签、昼夜、导出
src/architecture.js     城堡建筑
src/furniture.js        家具模型库
src/furniture-scenes.js 七个室内布局
src/gardens.js          两座镜像花园
src/environment.js      地形、护城河、桥、展台
src/lighting.js         天空、太阳/月亮、昼夜配色
src/materials.js        材质库
src/textures.js         程序化纹理
src/audit.js            穿模 / 越界审校
src/bake.js             静态几何焊接
previews/               成品预览图
exports/                导出的 GLB
video/                  宣传片制作流水线（见 video/README.md）
```

## 环境要求

| | |
| --- | --- |
| Node.js | 18+（推荐 20 LTS） |
| 包管理器 | pnpm / npm 均可 |
| 浏览器 | 支持 WebGL2 与 import map 的现代浏览器（Chrome / Edge / Firefox / Safari 16.4+） |
| 显卡 | 集成显卡可运行；独立显卡可开启更高像素比 |

## 许可

[MIT](LICENSE) © 2026 Jay-Victor

---

<sub>Made with Three.js · 全部建筑、家具与纹理均为程序化生成，无第三方模型或贴图素材。</sub>
