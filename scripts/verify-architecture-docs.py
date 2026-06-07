from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = (
    "docs/architecture/overview.md",
    "docs/architecture/tech-stack.md",
    "docs/architecture/folder-structure.md",
    "docs/architecture/database.md",
    "docs/architecture/api.md",
    "docs/architecture/auth.md",
    "docs/architecture/storage.md",
    "docs/architecture/security.md",
    "docs/architecture/deployment.md",
    "docs/decisions/0001-tech-stack.md",
    "docs/decisions/0002-auth-strategy.md",
    "docs/decisions/0003-database-design.md",
    "docs/decisions/0015-production-only-mvp-boundary.md",
)

RETIRED_TERMS = (
    "/catalog",
    "/library",
    "/reader",
    "/reading-progress",
)


def read(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def require_contains(
    failures: list[str], relative_path: str, required_terms: tuple[str, ...]
) -> None:
    content = read(relative_path).lower()
    for term in required_terms:
        if term.lower() not in content:
            failures.append(f"{relative_path}: missing `{term}`")


def main() -> int:
    failures: list[str] = []

    for relative_path in REQUIRED_FILES:
        path = ROOT / relative_path
        if not path.exists():
            failures.append(f"{relative_path}: missing")

    if failures:
        print("Architecture docs verification: FAIL")
        for failure in failures:
            print(f"- {failure}")
        return 1

    for relative_path in (
        "docs/architecture/overview.md",
        "docs/architecture/api.md",
        "docs/architecture/database.md",
    ):
        require_contains(
            failures,
            relative_path,
            ("production-only", "internal", "mvp"),
        )

    require_contains(
        failures,
        "docs/architecture/tech-stack.md",
        ("React", "Vite", "Express", "TypeScript", "MongoDB", "Mongoose"),
    )
    require_contains(
        failures,
        "docs/architecture/tech-stack.md",
        ("Cloudflare R2", "MinIO", "FastAPI"),
    )
    require_contains(
        failures,
        "docs/architecture/auth.md",
        (
            "custom auth",
            "admin-created",
            "backend must enforce permissions",
            "board chair",
        ),
    )
    require_contains(
        failures,
        "docs/architecture/security.md",
        (
            "assistant cannot access full chapter by default",
            "admin cannot override board decisions",
            "signed url",
            "do not store base64",
        ),
    )
    require_contains(
        failures,
        "docs/architecture/storage.md",
        ("private storage", "signed urls", "do not store base64"),
    )
    require_contains(
        failures,
        "docs/architecture/folder-structure.md",
        ("server/", "client/", "ai-service/"),
    )
    require_contains(
        failures,
        "docs/architecture/deployment.md",
        ("vercel", "railway", "mongodb atlas", "cloudflare r2"),
    )

    database = read("docs/architecture/database.md")
    for collection in (
        "User",
        "Series",
        "Chapter",
        "Page",
        "Task",
        "Submission",
        "BoardVote",
        "AssistantEarning",
        "AuditLog",
    ):
        if collection not in database:
            failures.append(f"docs/architecture/database.md: missing {collection}")

    api = read("docs/architecture/api.md").lower()
    for retired_term in RETIRED_TERMS:
        if retired_term in api:
            failures.append(f"docs/architecture/api.md: retired route {retired_term}")

    for decision in (
        "docs/decisions/0001-tech-stack.md",
        "docs/decisions/0002-auth-strategy.md",
        "docs/decisions/0003-database-design.md",
    ):
        require_contains(failures, decision, ("## Status", "Accepted"))

    if failures:
        print("Architecture docs verification: FAIL")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("Architecture docs verification: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
