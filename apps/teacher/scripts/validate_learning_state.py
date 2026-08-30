#!/usr/bin/env python3
"""Validate invariants between roadmap checkboxes and course specs."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ROADMAP = ROOT / "roadmap.md"
SPECS_ROOT = ROOT / "course-specs"
LEDGER = ROOT / "validation" / "learning-ledger.md"

ROADMAP_ITEM = re.compile(r"^- \[(?P<checked>[ xX])\] \*\*(?P<id>[A-Z]\d{2}) —")
FRONTMATTER_FIELD = re.compile(r"^(?P<key>[a-z_]+):\s*(?P<value>.*)$")
ACTIVE_STATUSES = {"learning", "validating"}
COURSE_ID = re.compile(r"^(?P<id>[A-Z]\d{2})(?:\s|—|$)")


def parse_roadmap() -> dict[str, bool]:
    items: dict[str, bool] = {}
    for line in ROADMAP.read_text(encoding="utf-8").splitlines():
        match = ROADMAP_ITEM.match(line)
        if not match:
            continue
        course_id = match.group("id")
        if course_id in items:
            raise ValueError(f"duplicate roadmap course id: {course_id}")
        items[course_id] = match.group("checked").lower() == "x"
    if not items:
        raise ValueError("no roadmap course items found")
    return items


def parse_frontmatter(path: Path) -> dict[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"missing frontmatter: {path.relative_to(ROOT)}")

    fields: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            return fields
        match = FRONTMATTER_FIELD.match(line)
        if match:
            fields[match.group("key")] = match.group("value").strip()
    raise ValueError(f"unterminated frontmatter: {path.relative_to(ROOT)}")


def load_specs() -> dict[str, tuple[Path, dict[str, str]]]:
    specs: dict[str, tuple[Path, dict[str, str]]] = {}
    for path in sorted(SPECS_ROOT.glob("*/course-spec.md")):
        fields = parse_frontmatter(path)
        course_id = fields.get("course_id", "")
        if not course_id:
            raise ValueError(f"missing course_id: {path.relative_to(ROOT)}")
        if course_id in specs:
            raise ValueError(f"multiple course specs for {course_id}")
        specs[course_id] = (path, fields)
    return specs


def parse_passed_ledger_courses() -> set[str]:
    passed: set[str] = set()
    for line in LEDGER.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        columns = [column.strip() for column in line.strip().strip("|").split("|")]
        if len(columns) < 8 or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", columns[0]):
            continue
        match = COURSE_ID.match(columns[1])
        if not match:
            raise ValueError(f"ledger course cell must begin with an ID: {columns[1]}")
        if columns[3].lower() == "passed":
            passed.add(match.group("id"))
    return passed


def validate() -> list[str]:
    errors: list[str] = []
    roadmap = parse_roadmap()
    specs = load_specs()
    passed_ledger = parse_passed_ledger_courses()

    active: list[str] = []
    for course_id, (path, fields) in specs.items():
        status = fields.get("status", "")
        decision = fields.get("decision", "")

        if course_id not in roadmap:
            errors.append(f"{course_id}: spec has no roadmap item")
            continue

        if status in ACTIVE_STATUSES:
            active.append(course_id)

        passed_spec = status == "passed" and decision == "passed"
        if roadmap[course_id] and not passed_spec:
            errors.append(
                f"{course_id}: roadmap is checked but spec is not status/decision passed"
            )
        if passed_spec and not roadmap[course_id]:
            errors.append(f"{course_id}: spec is passed but roadmap is unchecked")
        if passed_spec and course_id not in passed_ledger:
            errors.append(f"{course_id}: passed spec has no passed ledger entry")

        if (status == "passed") != (decision == "passed"):
            errors.append(
                f"{course_id}: status and decision disagree in {path.relative_to(ROOT)}"
            )

    for course_id, checked in roadmap.items():
        if checked and course_id not in specs:
            errors.append(f"{course_id}: checked roadmap item has no course spec")
        if checked and course_id not in passed_ledger:
            errors.append(f"{course_id}: checked roadmap item has no passed ledger entry")

    for course_id in passed_ledger:
        if course_id not in roadmap:
            errors.append(f"{course_id}: passed ledger entry has no roadmap item")
        elif not roadmap[course_id]:
            errors.append(f"{course_id}: passed ledger entry but roadmap is unchecked")

    if len(active) > 1:
        errors.append(f"multiple active courses: {', '.join(active)}")

    return errors


def main() -> int:
    try:
        errors = validate()
    except (OSError, ValueError) as exc:
        print(f"ERROR: {exc}")
        return 1

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print("Learning state is consistent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
