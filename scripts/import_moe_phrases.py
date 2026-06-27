"""Extract four-character headwords from the official MOE dictionary XLSX files."""

from __future__ import annotations

import argparse
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NAMESPACE = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
CELL_COLUMN = re.compile(r"([A-Z]+)")


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


def is_four_character_term(value: str) -> bool:
    return len(value) == 4 and all("\u3400" <= char <= "\u9fff" for char in value)


def extract_rows(path: Path, pinyin_column: int) -> list[tuple[str, str]]:
    with zipfile.ZipFile(path) as archive:
        shared = read_shared_strings(archive)
        rows: list[tuple[str, str]] = []
        with archive.open("xl/worksheets/sheet1.xml") as source:
            for _, element in ET.iterparse(source, events=("end",)):
                if element.tag != f"{NAMESPACE}row":
                    continue
                values: dict[int, str] = {}
                for cell in element.findall(f"{NAMESPACE}c"):
                    index = column_number(cell.get("r", "A1"))
                    if index not in (0, pinyin_column):
                        continue
                    value = cell.find(f"{NAMESPACE}v")
                    if value is None:
                        continue
                    values[index] = shared[int(value.text)] if cell.get("t") == "s" else value.text or ""
                term, pinyin = values.get(0, "").strip(), values.get(pinyin_column, "").strip()
                if is_four_character_term(term) and pinyin:
                    rows.append((term, pinyin))
                element.clear()
    return rows


def write_module(rows: list[list[str]], output: Path) -> None:
    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    content = """// Generated from unmodified headword and Hanyu Pinyin fields in:
// MOE Concised Mandarin Chinese Dictionary, dict_concised_2014_20260325.
// MOE Revised Mandarin Chinese Dictionary, dict_revised_2015_20260325.
// License: CC BY-ND 3.0 TW. See licenses/.
export const MOE_PHRASE_ROWS = """ + payload + ";\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8", newline="\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("concised", type=Path)
    parser.add_argument("revised", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    combined: dict[str, list[str]] = {}
    for term, pinyin in extract_rows(args.concised, 9):
        combined.setdefault(term, [term, pinyin, "concised"])
    for term, pinyin in extract_rows(args.revised, 11):
        if term in combined:
            combined[term][2] = "both"
        else:
            combined[term] = [term, pinyin, "revised"]

    rows = list(combined.values())
    write_module(rows, args.output)
    print(f"wrote {len(rows)} four-character terms to {args.output}")


if __name__ == "__main__":
    main()
