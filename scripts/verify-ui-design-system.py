from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

DESIGN_DOCS = (
    "docs/design/ui-style-guide.md",
    "docs/design/design-tokens.md",
    "docs/design/component-system.md",
    "docs/design/layout-patterns.md",
    "docs/design/screen-patterns.md",
    "docs/design/interaction-states.md",
    "docs/design/responsive-rules.md",
    "docs/design/accessibility-rules.md",
    "docs/design/ui-do-dont.md",
)

UI_CONTRACTS = (
    "docs/contracts/ui-main.md",
    "docs/contracts/ui-dashboard.md",
    "docs/contracts/ui-workspace.md",
    "docs/contracts/ui-series-chapter.md",
    "docs/contracts/ui-task.md",
    "docs/contracts/ui-review.md",
    "docs/contracts/ui-board.md",
    "docs/contracts/ui-admin.md",
    "docs/contracts/ui-marketing.md",
)

REQUIRED_COMPONENTS = (
    "MFButton",
    "MFCard",
    "MFBadge",
    "MFIconCircle",
    "MFProgress",
    "MFTabs",
    "MFSection",
    "MFPagePreviewCard",
    "MFUploadBox",
    "MarketingNavbar",
    "AppNavbar",
    "RoleSidebar",
    "PageShell",
)


def read(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def main() -> int:
    failures: list[str] = []

    for relative_path in DESIGN_DOCS + UI_CONTRACTS:
        path = ROOT / relative_path
        if not path.exists():
            failures.append(f"{relative_path}: missing")

    if failures:
        print("UI design system verification: FAIL")
        for failure in failures:
            print(f"- {failure}")
        return 1

    ui_main = read("docs/contracts/ui-main.md")
    for component in REQUIRED_COMPONENTS:
        if component not in ui_main:
            failures.append(f"docs/contracts/ui-main.md: missing {component}")

    required_ui_terms = (
        "Clean Pastel Creative SaaS",
        "Light theme only",
        "Plus Jakarta Sans",
        "soft purple",
        "rounded",
        "design tokens",
        "status-ui.ts",
        "production-only",
    )
    combined_design = "\n".join(read(path) for path in DESIGN_DOCS + UI_CONTRACTS)
    for term in required_ui_terms:
        if term.lower() not in combined_design.lower():
            failures.append(f"UI docs: missing `{term}`")

    token_doc = read("docs/design/design-tokens.md").lower()
    for token_section in (
        "color tokens",
        "typography tokens",
        "radius tokens",
        "spacing tokens",
        "shadow tokens",
        "status ui token rule",
    ):
        if token_section not in token_doc:
            failures.append(f"docs/design/design-tokens.md: missing {token_section}")

    for contract in UI_CONTRACTS:
        content = read(contract)
        if "Validation" not in content and "Verify" not in content:
            failures.append(f"{contract}: missing validation section")

    forbidden_contract_terms = (
        "/catalog",
        "/library",
        "/reader",
        "/reading-progress",
        "reading progress screen",
        "catalog browsing screen",
    )
    for contract in UI_CONTRACTS:
        content = read(contract).lower()
        for term in forbidden_contract_terms:
            if term in content:
                failures.append(f"{contract}: contains retired scope `{term}`")

    checklist = read("docs/validation/ui-review-checklist.md").lower()
    for checklist_term in (
        "mfbutton",
        "mfcard",
        "mfbadge",
        "status-ui.ts",
        "mobile layout",
        "keyboard focus",
        "aria-label",
    ):
        if checklist_term not in checklist:
            failures.append(
                f"docs/validation/ui-review-checklist.md: missing {checklist_term}"
            )

    if failures:
        print("UI design system verification: FAIL")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("UI design system verification: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
