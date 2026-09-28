#!/usr/bin/env python3
"""从 CHANGELOG.md 生成 changelog.html（更新记录页）。

用法：python3 _build_changelog.py
CHANGELOG.md 是唯一事实来源，格式（Keep a Changelog）：
  ## [x.y.z] - YYYY-MM-DD
  （可选）一段说明文字
  ### 新增 / ### 变更 / ### 修正
  - 条目，可含 **加粗**、`代码`、课号标记 [uX-lY]（裸写的 uX-lY 也会链到课页，代码里的除外）
生成页内嵌 CHANGELOG.md 的 sha256（<meta name="changelog-hash">），_check.py 会比对，防止忘记重新生成。
本脚本列在 .assetsignore 里，不会上线。"""
import hashlib, html, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'CHANGELOG.md'
OUT = ROOT / 'changelog.html'
LESSONS = set(re.findall(r"id: '(u\d-l\d)'", (ROOT / 'assets/curriculum.js').read_text(encoding='utf-8')))
CUR_VER = re.search(r"version: '([\d.]+)'", (ROOT / 'assets/curriculum.js').read_text(encoding='utf-8')).group(1)
GROUP_TONE = {'新增': 'drive', '变更': 'bus', '修正': 'fault'}


def inline(md):
    """行内 Markdown：先整体转义，再处理 `代码`、**加粗**、课号链接（代码片段里不链）。"""
    parts = re.split(r'(`[^`]+`)', md)
    out = []
    for p in parts:
        if p.startswith('`') and p.endswith('`') and len(p) > 1:
            out.append('<code>' + html.escape(p[1:-1]) + '</code>')
            continue
        t = html.escape(p)
        t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)

        def link(m):
            lid = m.group(2)
            if lid not in LESSONS:
                return m.group(0)
            return f'<a class="lid-chip" href="{lid}.html">{lid}</a>'
        # [uX-lY] 标记或裸写的 uX-lY（前后不是 ASCII 字母数字或连字符，避免误伤 u3-l0.html；不用 \w，它会匹配中文）
        t = re.sub(r'(\[)?(?<![A-Za-z0-9_-])(u\d-l\d)(?![A-Za-z0-9_-])(?(1)\])', link, t)
        out.append(t)
    return ''.join(out)


def parse(text):
    versions = []
    cur = grp = None
    for raw in text.splitlines():
        line = raw.rstrip()
        m = re.match(r'^## \[(\d+\.\d+\.\d+)\]\s*-\s*(\d{4}-\d{2}-\d{2})\s*$', line)
        if m:
            cur = {'ver': m.group(1), 'date': m.group(2), 'notes': [], 'groups': []}
            versions.append(cur); grp = None
            continue
        if cur is None:
            continue
        m = re.match(r'^### (.+)$', line)
        if m:
            grp = {'name': m.group(1).strip(), 'items': []}
            cur['groups'].append(grp)
            continue
        m = re.match(r'^[-*] (.+)$', line)
        if m:
            if grp is None:
                grp = {'name': '', 'items': []}; cur['groups'].append(grp)
            grp['items'].append(m.group(1).strip())
            continue
        if line.strip():
            if grp and grp['items'] and raw.startswith('  '):   # 条目的续行
                grp['items'][-1] += ' ' + line.strip()
            else:
                cur['notes'].append(line.strip())
    return versions


def render(versions, digest):
    cards = []
    for i, v in enumerate(versions):
        is_cur = v['ver'] == CUR_VER
        head = (f'<h2 id="v{v["ver"]}"><span class="cl-ver">v{v["ver"]}</span>'
                f'<time class="cl-date" datetime="{v["date"]}">{v["date"]}</time>'
                + ('<span class="cl-current">当前版本</span>' if is_cur else '') + '</h2>')
        body = ''.join(f'<p class="cl-note">{inline(n)}</p>' for n in v['notes'])
        for g in v['groups']:
            tone = GROUP_TONE.get(g['name'], 'muted')
            if g['name']:
                body += f'<h3 class="cl-group"><span class="tag tag-{tone}">{html.escape(g["name"])}</span></h3>'
            body += '<ul class="cl-list">' + ''.join(f'<li>{inline(it)}</li>' for it in g['items']) + '</ul>'
        cards.append(f'<section class="lesson-block cl-card{" is-current" if is_cur else ""}" data-version="{v["ver"]}">{head}{body}</section>')
    return TEMPLATE.format(digest=digest, cur=CUR_VER, n=len(versions), cards='\n'.join(cards))


TEMPLATE = """<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="changelog-hash" content="{digest}">
<!-- 本页由 _build_changelog.py 从 CHANGELOG.md 生成，不要手改 -->
<title>更新记录 · EtherCAT 学院</title>
<meta name="description" content="EtherCAT 学院各版本的新增、变更与修正。">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@400;600&family=Noto+Sans+SC:wght@400;500;700&display=swap">
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png">
<link rel="icon" href="assets/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<meta name="theme-color" content="#1f6feb">
<link rel="stylesheet" href="assets/site.css">
<script src="assets/curriculum.js"></script>
<script src="assets/site.js"></script>
</head>
<body>
<header class="topbar" id="topbar"></header>
<aside class="sidebar" id="sidebar"></aside>

<div class="main">
<main id="changelog">
  <header class="lesson-head">
    <h1>更新记录</h1>
    <p class="lesson-lede">当前版本 v{cur}，共 {n} 个版本，最新的在最上面。条目里的课号可以直接点进对应的课。</p>
  </header>
{cards}
</main>
</div>

<script>Academy.init('changelog');</script>
</body>
</html>
"""


def main():
    raw = SRC.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    versions = parse(raw.decode('utf-8'))
    if not versions:
        raise SystemExit('CHANGELOG.md 里没有找到 "## [x.y.z] - YYYY-MM-DD" 版本标题')
    if versions[0]['ver'] != CUR_VER:
        print(f'警告：CHANGELOG.md 最新版本 {versions[0]["ver"]} 与 curriculum.js version {CUR_VER} 不一致')
    OUT.write_text(render(versions, digest), encoding='utf-8')
    print(f'已生成 {OUT.name}：{len(versions)} 个版本，当前 v{CUR_VER}，sha256 {digest[:12]}…')


if __name__ == '__main__':
    main()
