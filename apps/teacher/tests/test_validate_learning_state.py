from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import validate_learning_state as validator


class LearningStateValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self.temp_dir.name)
        self.specs = self.root / "course-specs"
        self.specs.mkdir()
        validation = self.root / "validation"
        validation.mkdir()
        self.roadmap = self.root / "roadmap.md"
        self.ledger = validation / "learning-ledger.md"
        self.ledger.write_text(
            "| Date | Course | Attempt | Result | Score | Evidence | Gap | Spec |\n",
            encoding="utf-8",
        )
        self.globals_patch = patch.multiple(
            validator,
            ROOT=self.root,
            ROADMAP=self.roadmap,
            SPECS_ROOT=self.specs,
            LEDGER=self.ledger,
        )
        self.globals_patch.start()

    def tearDown(self) -> None:
        self.globals_patch.stop()
        self.temp_dir.cleanup()

    def write_roadmap(self, *items: tuple[str, bool]) -> None:
        lines = [
            f"- [{'x' if checked else ' '}] **{course_id} — Test course**"
            for course_id, checked in items
        ]
        self.roadmap.write_text("\n".join(lines) + "\n", encoding="utf-8")

    def write_spec(self, course_id: str, status: str, decision: str) -> None:
        directory = self.specs / f"{course_id}-test"
        directory.mkdir()
        (directory / "course-spec.md").write_text(
            "\n".join(
                [
                    "---",
                    f"course_id: {course_id}",
                    f"status: {status}",
                    f"decision: {decision}",
                    "---",
                    "",
                    "# Test",
                ]
            ),
            encoding="utf-8",
        )

    def write_passed_ledger(self, course_id: str) -> None:
        self.ledger.write_text(
            "| Date | Course | Attempt | Result | Score | Evidence | Gap | Spec |\n"
            f"| 2026-08-30 | {course_id} — Test | 1 | passed | 12/15 | applied | none | spec |\n",
            encoding="utf-8",
        )

    def test_all_unchecked_without_specs_is_consistent(self) -> None:
        self.write_roadmap(("C01", False), ("C02", False))
        self.assertEqual([], validator.validate())

    def test_checked_item_requires_spec_and_ledger(self) -> None:
        self.write_roadmap(("C01", True))
        errors = validator.validate()
        self.assertTrue(any("no course spec" in error for error in errors))
        self.assertTrue(any("no passed ledger entry" in error for error in errors))

    def test_passed_spec_requires_ledger(self) -> None:
        self.write_roadmap(("C01", True))
        self.write_spec("C01", "passed", "passed")
        errors = validator.validate()
        self.assertTrue(any("passed spec has no passed ledger entry" in error for error in errors))

    def test_complete_triplet_is_consistent(self) -> None:
        self.write_roadmap(("C01", True))
        self.write_spec("C01", "passed", "passed")
        self.write_passed_ledger("C01")
        self.assertEqual([], validator.validate())

    def test_multiple_active_courses_are_rejected(self) -> None:
        self.write_roadmap(("C01", False), ("C02", False))
        self.write_spec("C01", "learning", "pending")
        self.write_spec("C02", "validating", "pending")
        errors = validator.validate()
        self.assertTrue(any("multiple active courses" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
