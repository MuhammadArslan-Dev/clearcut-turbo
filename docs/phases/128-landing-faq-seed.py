"""Phase 128: build the CMS `faq` seed (Lexical JSON, en/hi/mr) from the FAQ copy that
used to be hardcoded in apps/landing/src/components/sections/FAQsSection.tsx.

Usage (from the repo root):
  git show 975fe32:apps/landing/src/components/sections/FAQsSection.tsx > old.tsx
  python docs/phases/128-landing-faq-seed.py old.tsx seed.json

Every answer becomes ONE paragraph: <strong> -> bold text node, <br/> -> linebreak node,
literal "1." numbering kept as text. That reproduces the old rendering exactly (the old
copy never used <ol>/<ul>). Questions are one plain text node. Fails loudly on any markup
it does not know, so nothing is dropped silently.
"""
import json
import re
import sys

src = open(sys.argv[1], encoding="utf8").read().replace("\r\n", "\n")


def section(loc):
    start = src.index("\n  %s: {\n" % loc)
    ends = [src.find("\n  %s: {\n" % other, start + 5) for other in ("en", "hi", "mr")]
    ends = [e for e in ends if e > start] + [src.index("\n};\n", start)]
    return src[start : min(ends)]


def text_node(text, bold):
    return {"type": "text", "text": text, "format": 1 if bold else 0, "mode": "normal", "style": "", "detail": 0, "version": 1}


def para(children):
    return {"type": "paragraph", "format": "", "indent": 0, "version": 1, "direction": "ltr", "textFormat": 0, "textStyle": "", "children": children}


def root(children):
    return {"root": {"type": "root", "format": "", "indent": 0, "version": 1, "direction": "ltr", "children": children}}


def parse_answer(jsx):
    assert jsx.startswith("<>") and jsx.endswith("</>"), jsx[:30]
    kids, plain, html = [], "", ""
    for tok in re.split(r"(<strong>.*?</strong>|<br/>)", jsx[2:-3]):
        if not tok:
            continue
        if tok == "<br/>":
            kids.append({"type": "linebreak", "version": 1})
            plain += "\n"
            html += "<br>"
        elif tok.startswith("<strong>"):
            t = tok[8:-9]
            assert "<" not in t, t
            kids.append(text_node(t, True))
            plain += t
            html += "<strong>" + t + "</strong>"
        else:
            assert "<" not in tok and "{" not in tok, tok
            kids.append(text_node(tok, False))
            plain += tok
            html += tok
    return root([para(kids)]), plain, html


out = {}
for loc in ("en", "hi", "mr"):
    s = section(loc)
    cats = []
    for label, key in re.findall(r'\{ label: "([^"]+)", key: "([a-z]+)" \}', s):
        blk = s[s.index("\n      %s: [\n" % key) :]
        blk = blk[: blk.index("\n      ],\n")]
        rows = []
        for q, a in re.findall(r'q: "([^"]*)",\n\s+a: (<>.*?</>),\n', blk):
            lex, plain, html = parse_answer(a)
            rows.append({
                "question": q,
                "questionRich": root([para([text_node(q, False)])]),
                "answerRich": lex,
                "expectAnswerText": plain,
                "expectAnswerHtml": html,
            })
        cats.append({"key": key, "label": label, "questions": rows})
    out[loc] = cats
    print(loc, [(c["key"], len(c["questions"])) for c in cats])

json.dump(out, open(sys.argv[2], "w", encoding="utf8"), ensure_ascii=False, indent=1)
