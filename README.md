# EtherCAT 学院

用可步进的图示，从零学会 EtherCAT 机器人关节控制的主站侧与从站侧全链路：帧与拓扑、ESC、ESM 与 CoE、分布式时钟、CiA402、IgH 主站与从站固件、故障诊断。8 个单元、21 课，约 30 小时。

每课固定七段：定位、主动画、机制拆解、主从对照、在真机上看、自测（4 题）、误区与关联。纯静态站点，无构建步骤，无框架，无外部脚本（仅加载 Google Fonts 样式表）。

线上地址：https://ethercat.kiloong.com（Cloudflare Workers 静态资源托管）

## 本地预览

```bash
cd web/academy
python3 -m http.server 8765 --bind 127.0.0.1
# 浏览器打开 http://127.0.0.1:8765/index.html
```

学习进度存在浏览器 localStorage 的 `ecat.progress` 键里，主题存在 `ecat.theme`。

## 目录

| 路径 | 说明 |
| --- | --- |
| `index.html` | 首页：可点击的系统总图、单元课表、完成进度 |
| `u0-l1.html` … `u7-l2.html` | 21 课课页，每课一个文件 |
| `glossary.html` | 术语表（缩写、对象号、寄存器） |
| `404.html` | 找不到页面时由 Cloudflare 返回 |
| `assets/site.css` | 设计令牌、外壳、七区块样式、SVG 工具类、响应式规则（契约文件） |
| `assets/site.js` | 全局 `Academy`：外壳、步进器、测验、进度、总图、`fx` 助手（契约文件） |
| `assets/curriculum.js` | 课程目录与站点版本号（契约文件） |
| `_template.html` | 课页模板，新课从它复制 |
| `_check.py` | 静态检查：七区块、`Academy.init`、4 题测验、步进器步数、无外部脚本 |
| `DESIGN.md` | 软件设计文档：教学法、课程矩阵、接口契约、响应式规范、每课规格 |
| `REVIEW.md` | 验收记录 |
| `_AGENT_BRIEF.md`、`_reports.md` | 课页编写简报与各课"待抽查条目"汇总 |
| `wrangler.jsonc`、`.assetsignore` | Cloudflare Workers 部署配置；`.assetsignore` 里的文件不会被发布 |

契约文件（`assets/` 三个文件）由站点维护者统一修改；课页只写自己的 HTML，页面私有样式写在本页 `<style>` 里并加 `.lesson` 前缀。

## 加一课

1. 复制模板：`cp _template.html u8-l1.html`。
2. 在 `assets/curriculum.js` 对应单元里登记：`id`、`title`、`hours`、`highlight`（系统总图层键）、`prereq`。
3. 改新页面的 `<title>`、`data-lesson`、`.lesson-title`、`.lesson-lede`，页尾调用 `Academy.init('u8-l1')`。
4. 七个 `<section>` 的 class 与顺序不改；主动画用 `Academy.stepper`，第 0 步为初始画面，每步只改一件事；测验 4 题写在 `#quiz-data`。
5. 跑检查：`python3 -B _check.py`，全部 OK 后在浏览器里走一遍主动画和测验。
6. 在 `CHANGELOG.md` 记一笔，按下面的规则升版本号。

接口细节见 `DESIGN.md` 第 5 节和 `assets/site.js` 顶部注释。

## 版本规则

语义化版本 `X.Y.Z`，每次发布打附注 tag `vX.Y.Z`，并同步修改 `assets/curriculum.js` 里的 `version`（侧栏底部会显示它）。

- **X（主版本）**：课程结构重排、课号变化、契约接口不兼容（课页需要跟着改）。
- **Y（次版本）**：新增课、新增单元、新增向后兼容的接口或页面功能。
- **Z（修订）**：内容勘误、样式修正、不影响接口的 bug 修复。

```bash
git tag -a v1.0.1 -m "勘误：…"
```
