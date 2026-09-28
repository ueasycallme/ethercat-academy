#!/usr/bin/env python3
"""从各课页内的 quiz-data 汇总生成 assets/quizbank.js（复习页的题库）。

用法：python3 _build_quizbank.py
单一事实来源仍是各课 <script type="application/json" id="quiz-data">；本脚本只做汇总。
题 id = 课号 + '#' + 序号（从 1 起），如 u3-l2#2。
生成文件里带 sources 哈希（按课号顺序拼接各课 quiz-data 原文的 sha256），_check.py 会重算比对，防止改了课页题目却忘了重新生成。
本脚本列在 .assetsignore 里，不会上线；生成的 assets/quizbank.js 随提交上线。"""
import hashlib, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'assets' / 'quizbank.js'
QUIZ_RE = re.compile(r'<script type="application/json" id="quiz-data">(.*?)</script>', re.S)


def lesson_ids():
    return re.findall(r"id: '(u\d-l\d)'", (ROOT / 'assets/curriculum.js').read_text(encoding='utf-8'))


def collect():
    """返回 (题目列表, 源哈希)。哈希的计算方式必须与 _check.py 的 quizbank_digest() 一致。"""
    items, h = [], hashlib.sha256()
    for lid in lesson_ids():
        f = ROOT / f'{lid}.html'
        if not f.exists():
            raise SystemExit(f'{f.name} 不存在，无法生成题库')
        m = QUIZ_RE.search(f.read_text(encoding='utf-8'))
        if not m:
            raise SystemExit(f'{lid} 没有 quiz-data')
        raw = m.group(1).strip()
        h.update(lid.encode() + b'\n' + raw.encode('utf-8') + b'\n')
        for i, q in enumerate(json.loads(raw), 1):
            items.append({'id': f'{lid}#{i}', 'lesson': lid, 'q': q['q'], 'options': q['options'],
                          'answer': q['answer'], 'explain': q['explain']})
    return items, h.hexdigest()


def main():
    items, digest = collect()
    body = json.dumps({'sources': digest, 'count': len(items), 'questions': items}, ensure_ascii=False, indent=1)
    OUT.write_text('/* 由 _build_quizbank.py 从各课 quiz-data 生成，不要手改 */\n'
                   'window.ACADEMY_QUIZBANK = ' + body + ';\n', encoding='utf-8')
    print(f'已生成 {OUT.relative_to(ROOT)}：{len(items)} 题，sources {digest[:12]}…')


if __name__ == '__main__':
    main()
