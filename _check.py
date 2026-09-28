#!/usr/bin/env python3
"""EtherCAT 学院静态检查：python3 _check.py [课号 ...]
检查 curriculum.js 登记的全部课：七区块 class 齐全且顺序正确、调用 Academy.init('课号')、quiz JSON 可解析且 4 题字段合法、
Academy.stepper 调用存在且步数 ≥6（含初始画面）、无外部 <script src>、无 assets 以外的本地脚本。"""
import json, re, sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ORDER = ['lesson-locate', 'lesson-anim', 'lesson-mech', 'lesson-duo', 'lesson-verify', 'lesson-quiz', 'lesson-next']
LESSONS = re.findall(r"id: '(u\d-l\d)'", (ROOT / 'assets/curriculum.js').read_text(encoding='utf-8'))


class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sections, self.scripts, self.quiz, self.inline = [], [], None, []
        self._cap = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get('class') or '').split()
        if tag == 'section':
            self.sections += [c for c in cls if c in ORDER]
        if tag == 'script':
            if a.get('src'):
                self.scripts.append(a['src'])
            elif a.get('id') == 'quiz-data':
                self._cap = 'quiz'; self.quiz = ''
            elif a.get('type') in (None, '', 'text/javascript', 'module'):
                self._cap = 'js'; self.inline.append('')

    def handle_endtag(self, tag):
        if tag == 'script':
            self._cap = None

    def handle_data(self, d):
        if self._cap == 'quiz':
            self.quiz += d
        elif self._cap == 'js':
            self.inline[-1] += d


def count_steps(js):
    """粗略数 Academy.stepper 第二个参数数组里的步骤：数 title: 出现次数。"""
    m = re.search(r'Academy\.stepper\s*\(', js)
    if not m:
        return 0
    return len(re.findall(r'\btitle\s*:', js[m.end():]))


def check(lid):
    f = ROOT / f'{lid}.html'
    if not f.exists():
        return ['文件不存在']
    src = f.read_text(encoding='utf-8')
    p = P(); p.feed(src)
    errs = []
    if p.sections != ORDER:
        errs.append('七区块不齐或顺序不对：' + ' > '.join(p.sections))
    js = '\n'.join(p.inline)
    if not re.search(r"Academy\.init\(\s*['\"]%s['\"]\s*\)" % re.escape(lid), js):
        errs.append(f"缺少 Academy.init('{lid}')")
    steps = count_steps(js)
    if steps == 0:
        errs.append('没有调用 Academy.stepper')
    elif steps < 6:
        errs.append(f'步进器约 {steps} 步（含初始画面应 ≥6）')
    for s in p.scripts:
        if re.match(r'(https?:)?//', s):
            errs.append('外部脚本：' + s)
        elif s not in ('assets/curriculum.js', 'assets/site.js'):
            errs.append('非共享本地脚本：' + s)
    if 'assets/site.js' not in p.scripts:
        errs.append('未引入 assets/site.js')
    if p.quiz is None:
        errs.append('缺少 #quiz-data')
    else:
        try:
            qs = json.loads(p.quiz)
            if not isinstance(qs, list) or len(qs) != 4:
                errs.append(f'测验题数 {len(qs) if isinstance(qs, list) else "?"}，应为 4')
            else:
                for i, q in enumerate(qs, 1):
                    if not isinstance(q.get('q'), str) or not q['q'].strip(): errs.append(f'Q{i} 缺 q')
                    opts = q.get('options')
                    if not isinstance(opts, list) or len(opts) < 2: errs.append(f'Q{i} options 少于 2')
                    elif not isinstance(q.get('answer'), int) or not 0 <= q['answer'] < len(opts): errs.append(f'Q{i} answer 越界')
                    if not isinstance(q.get('explain'), str) or not q['explain'].strip(): errs.append(f'Q{i} 缺 explain')
        except json.JSONDecodeError as e:
            errs.append(f'quiz JSON 解析失败：{e}')
    m = re.search(r'<dl class="pre-terms">(.*?)</dl>', src, re.S)
    if m:
        for href in re.findall(r'href="([^"#]+)', m.group(1)):
            if not (ROOT / href).exists():
                errs.append('先知道这些：链接指向不存在的页面 ' + href)
        if 'lesson-locate' in src and src.find('pre-terms') < src.find('lesson-locate'):
            errs.append('先知道这些不在定位区块内')
    if re.search(r'<link[^>]+rel="stylesheet"[^>]+href="https?://(?!fonts\.googleapis\.com)', src):
        errs.append('外部样式表（仅允许 Google Fonts）')
    if '课名' in src.split('</title>')[0]:
        errs.append('<title> 仍是模板占位')
    return errs


def check_changelog():
    """changelog.html 须由当前 CHANGELOG.md 生成（内嵌 sha256 一致），最新版本号与 curriculum.js 一致。"""
    import hashlib
    errs = []
    page, src = ROOT / 'changelog.html', ROOT / 'CHANGELOG.md'
    if not page.exists():
        return ['changelog.html 不存在，先运行 python3 _build_changelog.py']
    ps = page.read_text(encoding='utf-8')
    m = re.search(r'<meta name="changelog-hash" content="([0-9a-f]{64})">', ps)
    digest = hashlib.sha256(src.read_bytes()).hexdigest()
    if not m:
        errs.append('changelog.html 缺少 changelog-hash')
    elif m.group(1) != digest:
        errs.append('changelog.html 与 CHANGELOG.md 不同步，运行 python3 _build_changelog.py 重新生成')
    top = re.search(r'^## \[(\d+\.\d+\.\d+)\]', src.read_text(encoding='utf-8'), re.M)
    ver = re.search(r"version: '([\d.]+)'", (ROOT / 'assets/curriculum.js').read_text(encoding='utf-8'))
    if not top or not ver or top.group(1) != ver.group(1):
        errs.append(f'CHANGELOG.md 最新版本 {top and top.group(1)} 与 curriculum.js version {ver and ver.group(1)} 不一致')
    if "Academy.init('changelog')" not in ps:
        errs.append("缺少 Academy.init('changelog')")
    if re.search(r'<script[^>]+src="(?:https?:)?//', ps):
        errs.append('外部脚本')
    return errs


def check_anchors():
    """所有页面里 href="页面.html#id" 的锚点必须在目标页存在。"""
    errs = []
    pages = {p.name: p.read_text(encoding='utf-8') for p in ROOT.glob('*.html') if not p.name.startswith('_')}
    for name, src in pages.items():
        for target, anchor in set(re.findall(r'href="([\w.-]+\.html)#([\w-]+)"', src)):
            if target in pages and not re.search(r'id="%s"' % re.escape(anchor), pages[target]):
                errs.append(f'{name} → {target}#{anchor} 锚点不存在')
    return sorted(errs)


def main():
    ids = sys.argv[1:] or LESSONS
    bad = 0
    for lid in ids:
        errs = check(lid)
        print(('OK   ' if not errs else 'FAIL ') + lid + ('' if not errs else '\n     - ' + '\n     - '.join(errs)))
        bad += bool(errs)
    g = ROOT / 'glossary.html'
    if not sys.argv[1:]:
        if not g.exists():
            print('FAIL glossary.html 不存在'); bad += 1
        else:
            gs = g.read_text(encoding='utf-8')
            rows = len(re.findall(r'<tr[\s>]', gs)) - 1
            ext = re.findall(r'<script[^>]+src="(?:https?:)?//', gs)
            ok = rows >= 80 and not ext and "Academy.init('glossary')" in gs
            print(('OK   ' if ok else 'FAIL ') + f'glossary.html（约 {rows} 条，外部脚本 {len(ext)}）')
            bad += not ok
    if not sys.argv[1:]:
        errs = check_changelog()
        print(('OK   ' if not errs else 'FAIL ') + 'changelog.html' + ('' if not errs else '\n     - ' + '\n     - '.join(errs)))
        bad += bool(errs)
        errs = check_anchors()
        print(('OK   ' if not errs else 'FAIL ') + '跨页锚点' + ('' if not errs else '\n     - ' + '\n     - '.join(errs)))
        bad += bool(errs)
    print(f'\n{len(ids) - bad if not sys.argv[1:] else len(ids)}/{len(ids)} 通过' if bad == 0 else f'\n{bad} 项未通过')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
