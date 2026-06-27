"""Extract four-character example phrases from the official MOE Mini Dictionary XLSX."""

from __future__ import annotations

import argparse
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NAMESPACE = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
CELL_COLUMN = re.compile(r"([A-Z]+)")
QUOTED_TEXT = re.compile(r"「([^」]+)」")
ANNOTATED_CHARACTER = re.compile(r"([\u3400-\u9fff])([\u3105-\u312f\u02ca\u02c7\u02cb\u02d9]+)")
ANNOTATION = re.compile(r"[\u3105-\u312f\u02ca\u02c7\u02cb\u02d9&\s]")

INITIALS = {
    "ㄅ": "b", "ㄆ": "p", "ㄇ": "m", "ㄈ": "f",
    "ㄉ": "d", "ㄊ": "t", "ㄋ": "n", "ㄌ": "l",
    "ㄍ": "g", "ㄎ": "k", "ㄏ": "h", "ㄐ": "j",
    "ㄑ": "q", "ㄒ": "x", "ㄓ": "zh", "ㄔ": "ch",
    "ㄕ": "sh", "ㄖ": "r", "ㄗ": "z", "ㄘ": "c", "ㄙ": "s",
}
FINALS = {
    "ㄚ": "a", "ㄛ": "o", "ㄜ": "e", "ㄝ": "e", "ㄞ": "ai",
    "ㄟ": "ei", "ㄠ": "ao", "ㄡ": "ou", "ㄢ": "an", "ㄣ": "en",
    "ㄤ": "ang", "ㄥ": "eng", "ㄦ": "er",
    "ㄧ": "i", "ㄧㄚ": "ia", "ㄧㄛ": "io", "ㄧㄝ": "ie",
    "ㄧㄞ": "iai", "ㄧㄠ": "iao", "ㄧㄡ": "iu", "ㄧㄢ": "ian",
    "ㄧㄣ": "in", "ㄧㄤ": "iang", "ㄧㄥ": "ing",
    "ㄨ": "u", "ㄨㄚ": "ua", "ㄨㄛ": "uo", "ㄨㄞ": "uai",
    "ㄨㄟ": "ui", "ㄨㄢ": "uan", "ㄨㄣ": "un", "ㄨㄤ": "uang",
    "ㄨㄥ": "ong",
}
ZERO_INITIAL_FINALS = {
    "ㄧ": "yi", "ㄧㄚ": "ya", "ㄧㄛ": "yo", "ㄧㄝ": "ye",
    "ㄧㄞ": "yai", "ㄧㄠ": "yao", "ㄧㄡ": "you", "ㄧㄢ": "yan",
    "ㄧㄣ": "yin", "ㄧㄤ": "yang", "ㄧㄥ": "ying",
    "ㄨ": "wu", "ㄨㄚ": "wa", "ㄨㄛ": "wo", "ㄨㄞ": "wai",
    "ㄨㄟ": "wei", "ㄨㄢ": "wan", "ㄨㄣ": "wen", "ㄨㄤ": "wang",
    "ㄨㄥ": "weng", "ㄩ": "yu", "ㄩㄝ": "yue", "ㄩㄢ": "yuan",
    "ㄩㄣ": "yun", "ㄩㄥ": "yong",
}


def column_number(reference: str) -> int:
    letters = CELL_COLUMN.match(reference).group(1)
    value = 0
    for letter in letters:
        value = value * 26 + ord(letter) - 64
    return value - 1


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    values: list[str] = []
    with archive.open("xl/sharedStrings.xml") as source:
        for _, element in ET.iterparse(source, events=("end",)):
            if element.tag == f"{NAMESPACE}si":
                values.append("".join(node.text or "" for node in element.iter(f"{NAMESPACE}t")))
                element.clear()
    return values


def zhuyin_to_tone_key(value: str) -> str | None:
    tone = 5 if "˙" in value else 2 if "ˊ" in value else 3 if "ˇ" in value else 4 if "ˋ" in value else 1
    syllable = value.translate(str.maketrans("", "", "ˊˇˋ˙"))
    initial_symbol = syllable[0] if syllable and syllable[0] in INITIALS else ""
    initial = INITIALS.get(initial_symbol, "")
    final = syllable[len(initial_symbol):]

    if not initial:
        base = ZERO_INITIAL_FINALS.get(final, FINALS.get(final))
    elif not final and initial_symbol in "ㄓㄔㄕㄖㄗㄘㄙ":
        base = f"{initial}i"
    elif final.startswith("ㄩ"):
        suffixes = {"ㄩ": "", "ㄩㄝ": "e", "ㄩㄢ": "an", "ㄩㄣ": "n", "ㄩㄥ": "ong"}
        suffix = suffixes.get(final)
        if suffix is None:
            return None
        if final == "ㄩㄥ" and initial in {"j", "q", "x"}:
            base = f"{initial}iong"
        else:
            vowel = "u" if initial in {"j", "q", "x"} else "v"
            base = f"{initial}{vowel}{suffix}"
    else:
        ending = FINALS.get(final)
        base = f"{initial}{ending}" if ending else None
    return f"{base}{tone}" if base else None


def extract_phrases(path: Path) -> list[list[object]]:
    phrases: dict[str, list[object]] = {}
    with zipfile.ZipFile(path) as archive:
        shared = read_shared_strings(archive)
        with archive.open("xl/worksheets/sheet1.xml") as source:
            for _, element in ET.iterparse(source, events=("end",)):
                if element.tag != f"{NAMESPACE}row":
                    continue
                explanation = ""
                for cell in element.findall(f"{NAMESPACE}c"):
                    if column_number(cell.get("r", "A1")) != 5:
                        continue
                    value = cell.find(f"{NAMESPACE}v")
                    if value is not None:
                        explanation = shared[int(value.text)] if cell.get("t") == "s" else value.text or ""
                for quoted in QUOTED_TEXT.findall(explanation):
                    text = ANNOTATION.sub("", quoted)
                    tokens = ANNOTATED_CHARACTER.findall(quoted)
                    if len(tokens) != 4 or text != "".join(character for character, _ in tokens):
                        continue
                    sounds = [zhuyin_to_tone_key(zhuyin) for _, zhuyin in tokens]
                    if all(sounds):
                        phrases.setdefault(text, [text, sounds])
                element.clear()
    return list(phrases.values())


def write_module(rows: list[list[object]], output: Path) -> None:
    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    content = """// Generated from unmodified four-character example phrases and Zhuyin fields in:
// MOE Mini Dictionary, dict_mini_2019_20260324.
// License: CC BY-ND 3.0 TW. See licenses/MOE-mini-usage.pdf.
export const MOE_MINI_PHRASE_ROWS = """ + payload + ";\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8", newline="\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    rows = extract_phrases(args.input)
    write_module(rows, args.output)
    print(f"wrote {len(rows)} four-character examples to {args.output}")


if __name__ == "__main__":
    main()
