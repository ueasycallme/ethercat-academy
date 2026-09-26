# EtherCAT 学院 发版记录与流程

## v1.0.0（2026-09-26）

**线上地址**：https://ethercat.kiloong.com
**仓库**：github.com/ueasycallme/ethercat-academy（私有，分支 main，tag v1.0.0，提交 5b298f9）
**本地工作副本**：仓库根目录（仓库根即站点根）

### 本版内容
- 首页系统总图与课表，进度保存在浏览器本地
- 8 个单元 21 课：物理层与帧、ESC、协议与状态机、时间同步、CiA402、软件实现、综合诊断
- 每课七段：定位、可步进主动画、机制拆解、主从对照、在真机上看、4 题自测、误区与关联
- 术语表 158 条，每条链回首次出现的课
- 响应式版式：390px 手机到 2560px 大屏，内容列和字号随视口连续变化
- 404 页、侧栏版本号

### 验收
- 静态检查 21/21；浏览器逐页：动画可回退、测验写进度、无横向溢出；深色主题对比度 ≥ 4.5:1
- 线上：首页/课页/资源 200，.html 307 跳转到无扩展名路径，忽略文件 404，证书有效
- 记录：REVIEW.md；review/live-acceptance.md（仓库外）

### 已知未验证
- u6-l1 最小主站示例程序本机无 ecrt.h，未编译
- workers.dev 路由仍开启（可在 Cloudflare 项目 Domains & Routes 关闭）

## 托管结构
- GitHub 仓库通过 Cloudflare Workers 静态资源托管，项目名 ethercat-academy（与 wrangler.jsonc 一致），Deploy command `npx wrangler deploy`
- 推送到 main 自动部署；自定义域名 ethercat.kiloong.com 由 Cloudflare 管 DNS 与证书
- 推送用 SSH 别名 github-ethercat（~/.ssh/config，走 ssh.github.com:443，密钥 id_ed25519 作为仓库部署密钥）
- .assetsignore 里的文件（DESIGN.md、REVIEW.md、_check.py、_template.html、wrangler.jsonc 等）不会上线

## 发版流程
```bash
cd ~/wuql_ws/ethercat_ws/web/academy
# 1. 修改课页或 assets；新课复制 _template.html 并在 assets/curriculum.js 登记
python3 _check.py                       # 2. 静态检查须 21/21 通过
python3 -m http.server 8765 --bind 127.0.0.1   # 3. 本地预览 http://127.0.0.1:8765/
# 4. 改 assets/curriculum.js 的 version，CHANGELOG.md 加条目
git add -A && git commit -m "Release vX.Y.Z: 说明"
git tag -a vX.Y.Z -m "说明"
git push origin main --tags             # 5. 推送后 Cloudflare 自动部署，1–2 分钟生效
curl -sI https://ethercat.kiloong.com/ | head -1   # 6. 线上确认
```

版本规则：语义化版本。修错别字、改措辞为补丁号；加课或改契约层为次版本号；课程结构重排为主版本号。
