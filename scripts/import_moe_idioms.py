"""Extract four-character entries from the official MOE Idioms Dictionary XLSX."""

from __future__ import annotations

import argparse
import io
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


def is_four_character_idiom(value: str) -> bool:
    return len(value) == 4 and all("\u3400" <= char <= "\u9fff" for char in value)


def extract_rows(archive: zipfile.ZipFile, shared: list[str]) -> list[list[str]]:
    rows: list[list[str]] = []
    seen: set[str] = set()
    with archive.open("xl/worksheets/sheet1.xml") as source:
        for _, element in ET.iterparse(source, events=("end",)):
            if element.tag != f"{NAMESPACE}row":
                continue
            cells = ["", "", "", ""]
            for cell in element.findall(f"{NAMESPACE}c"):
                index = column_number(cell.get("r", "A1"))
                if index > 3:
                    continue
                value = cell.find(f"{NAMESPACE}v")
                if value is None:
                    continue
                cells[index] = shared[int(value.text)] if cell.get("t") == "s" else value.text or ""
            term, pinyin = cells[1].strip(), cells[3].strip()
            if is_four_character_idiom(term) and pinyin and term not in seen:
                seen.add(term)
                rows.append([term, pinyin])
            element.clear()
    return rows


def write_module(rows: list[list[str]], output: Path) -> None:
    payload = json.dumps(rows, ensure_ascii=False, separators=(",", ":"))
    content = """// Generated from the unmodified term and Hanyu Pinyin fields in:
// Ministry of Education, R.O.C., Idioms Dictionary, dict_idioms_2020_20260324.
// Source: https://dict.idioms.moe.edu.tw/
// License: CC BY-ND 3.0 TW. See licenses/MOE-idioms-usage.pdf.
export const MOE_IDIOM_ROWS = """ + payload + ";\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8", newline="\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    with zipfile.ZipFile(args.input) as archive:
        rows = extract_rows(archive, read_shared_strings(archive))
    write_module(rows, args.output)
    print(f"wrote {len(rows)} idioms to {args.output}")


if __name__ == "__main__":
    main()

