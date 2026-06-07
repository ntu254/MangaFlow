from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RETIRED_CONTRACTS = (
    "docs/contracts/manga-catalog.md",
    "docs/contracts/library-management.md",
    "docs/contracts/chapter-reader.md",
    "docs/contracts/reading-progress.md",
)
PRODUCT_CONTRACTS = (
    "docs/contracts/auth.md",
    "docs/contracts/series-proposal.md",
    "docs/contracts/manuscript-review.md",
    "docs/contracts/board-approval.md",
    "docs/contracts/chapter-production.md",
    "docs/contracts/page-workspace.md",
    "docs/contracts/production-team.md",
    "docs/contracts/task-assignment.md",
    "docs/contracts/submission-review.md",
    "docs/contracts/comment-resolution.md",
    "docs/contracts/publication-ranking.md",
    "docs/contracts/payroll.md",
    "docs/contracts/ai-bubble-translation.md",
    "docs/contracts/admin-dashboard.md",
)
REQUIRED_HEADINGS = (
    "## Scope",
    "## Out of scope",
    "## Actors",
    "## Business rules",
    "## API surface",
    "## Acceptance criteria",
    "## Validation",
)


def main() -> int:
    failures: list[str] = []

    for relative_path in RETIRED_CONTRACTS:
        path = ROOT / relative_path
        if path.exists():
            failures.append(f"{relative_path}: retired contract still exists")

    for relative_path in PRODUCT_CONTRACTS:
        path = ROOT / relative_path
        if not path.exists():
            failures.append(f"{relative_path}: missing")
            continue

        content = path.read_text(encoding="utf-8")
        for heading in REQUIRED_HEADINGS:
            if heading not in content:
                failures.append(f"{relative_path}: missing heading {heading}")

    boundary_files = (
        "README.md",
        "README.vi.md",
        "docs/product/README.md",
        "docs/product/overview.md",
        "docs/product/requirements.md",
        "docs/product/feature-list.md",
        "docs/product/out-of-scope.md",
        "docs/contracts/main.md",
        "docs/contracts/README.md",
    )
    for relative_path in boundary_files:
        content = (ROOT / relative_path).read_text(encoding="utf-8").lower()
        if "mvp" not in content:
            failures.append(f"{relative_path}: missing explicit MVP boundary")

    if failures:
        print("Product contract scope verification: FAIL")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("Product contract scope verification: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
