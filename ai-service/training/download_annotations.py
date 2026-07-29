"""Download only MangaSegmentation annotations needed for training."""

import argparse
import os
from pathlib import Path

from huggingface_hub import snapshot_download


def build_snapshot_kwargs(repo_id: str, destination: Path, token: str) -> dict[str, object]:
    return {
        "repo_id": repo_id,
        "repo_type": "dataset",
        "local_dir": destination,
        "allow_patterns": ["jsons/**", "license.txt"],
        "token": token,
    }


def download_annotations(repo_id: str, destination: Path, token: str) -> Path:
    """Download annotation files without requesting source images."""
    if not token:
        raise ValueError("HF_TOKEN is required")

    snapshot_download(**build_snapshot_kwargs(repo_id, destination, token))
    return destination


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--destination", required=True, type=Path)
    parser.add_argument("--token-env", default="HF_TOKEN")
    parser.add_argument("--repo-id", default="MS92/MangaSegmentation")
    args = parser.parse_args()
    download_annotations(args.repo_id, args.destination, os.environ.get(args.token_env, ""))


if __name__ == "__main__":
    main()
