"""Deployment-readiness scoring for the hedge workflow project."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from currency_hedge_llm.config import AppConfig


@dataclass(frozen=True)
class ReadinessCheck:
    """A single weighted deployment-readiness check."""

    name: str
    points: int
    passed: bool
    detail: str


@dataclass(frozen=True)
class DeploymentReadinessResult:
    """Deployment readiness score and check details."""

    score: int
    threshold: int
    passed: bool
    checks: list[ReadinessCheck]


def assess_deployment_readiness(
    config: AppConfig, threshold: int = 95
) -> DeploymentReadinessResult:
    """Score deployment readiness using objective repository checks."""

    project_root = config.project_root
    repo_root = _repo_root(project_root)
    checks = [
        _check_file(project_root / "pyproject.toml", 8, "package_metadata"),
        _check_file(project_root / "README.md", 6, "readme"),
        _check_file(project_root / "DEPLOYMENT.md", 10, "deployment_runbook"),
        _check_file(project_root / "SECURITY.md", 6, "security_notes"),
        _check_file(project_root / "Dockerfile", 10, "container_image"),
        _check_file(project_root / ".dockerignore", 4, "dockerignore"),
        _check_file(project_root / "config" / "production.example.yaml", 8, "production_config"),
        _check_file(project_root / "scripts" / "run_demo.sh", 5, "demo_script"),
        _check_file(project_root / "scripts" / "self_improve.sh", 5, "self_improve_loop"),
        _check_file(
            repo_root / ".github" / "workflows" / "currency-hedge-llm-ci.yml",
            10,
            "ci_workflow",
        ),
        _check_directory_has_files(project_root / "tests", "*.py", 8, "test_suite"),
        _check_source_has_phrase(
            project_root / "src" / "currency_hedge_llm" / "cli.py",
            "deployment-readiness",
            5,
            "readiness_cli",
        ),
        _check_source_has_phrase(
            project_root / "README.md",
            "decision support only",
            5,
            "decision_support_docs",
        ),
        _check_source_has_phrase(
            project_root / "DEPLOYMENT.md",
            "No automatic trade execution",
            5,
            "no_trade_execution_runbook",
        ),
        _check_source_has_phrase(
            project_root / "scripts" / "self_improve.sh",
            "DEPLOYMENT_READY_TARGET",
            5,
            "loop_readiness_target",
        ),
    ]
    score = sum(check.points for check in checks if check.passed)
    return DeploymentReadinessResult(
        score=score,
        threshold=threshold,
        passed=score >= threshold,
        checks=checks,
    )


def format_readiness_report(result: DeploymentReadinessResult) -> str:
    """Render readiness score and checks as plain text."""

    lines = [
        f"Deployment readiness score: {result.score}/100",
        f"Threshold: {result.threshold}/100",
        f"Status: {'PASS' if result.passed else 'FAIL'}",
        "",
        "Checks:",
    ]
    for check in result.checks:
        mark = "PASS" if check.passed else "FAIL"
        lines.append(f"- {mark} {check.name} ({check.points} pts): {check.detail}")
    return "\n".join(lines)


def _check_file(path: Path, points: int, name: str) -> ReadinessCheck:
    passed = path.exists() and path.is_file() and path.stat().st_size > 0
    detail = str(path) if passed else f"Missing or empty: {path}"
    return ReadinessCheck(name=name, points=points, passed=passed, detail=detail)


def _check_directory_has_files(
    path: Path, pattern: str, points: int, name: str
) -> ReadinessCheck:
    files = list(path.glob(pattern)) if path.exists() else []
    passed = bool(files)
    detail = f"{len(files)} file(s) found" if passed else f"No {pattern} files in {path}"
    return ReadinessCheck(name=name, points=points, passed=passed, detail=detail)


def _check_source_has_phrase(
    path: Path, phrase: str, points: int, name: str
) -> ReadinessCheck:
    if not path.exists():
        return ReadinessCheck(
            name=name, points=points, passed=False, detail=f"Missing: {path}"
        )
    text = path.read_text(encoding="utf-8")
    passed = phrase.lower() in text.lower()
    detail = f"Found phrase: {phrase}" if passed else f"Missing phrase: {phrase}"
    return ReadinessCheck(name=name, points=points, passed=passed, detail=detail)


def _repo_root(project_root: Path) -> Path:
    return project_root.parent
