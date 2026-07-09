"""Deployment readiness checks for the currency hedge workflow."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from currency_hedge_llm.config import AppConfig


@dataclass(frozen=True)
class DoctorCheck:
    """One deploy-time readiness check."""

    name: str
    passed: bool
    detail: str


@dataclass(frozen=True)
class DoctorResult:
    """Summary of all readiness checks."""

    checks: list[DoctorCheck]

    @property
    def passed(self) -> bool:
        """Return True when every readiness check passes."""

        return all(check.passed for check in self.checks)


def run_doctor(
    config: AppConfig,
    *,
    require_model: bool = False,
    create_output_dirs: bool = False,
) -> DoctorResult:
    """Validate files and output locations needed for batch execution."""

    checks = [
        _path_exists("FX rates CSV", config.data.fx_rates_path),
        _path_exists("exposures CSV", config.data.exposures_path),
        _parent_dir_ready(
            "processed feature output directory",
            config.data.processed_features_path,
            create=create_output_dirs,
        ),
        _parent_dir_ready(
            "model output directory",
            config.model.model_path,
            create=create_output_dirs,
        ),
        _parent_dir_ready(
            "recommendation output directory",
            config.recommendation.recommendation_path,
            create=create_output_dirs,
        ),
        _parent_dir_ready(
            "memo output directory",
            config.memo.memo_path,
            create=create_output_dirs,
        ),
        _supported_llm_provider(config.llm.provider),
    ]

    if require_model:
        checks.append(_path_exists("trained model", config.model.model_path))

    return DoctorResult(checks=checks)


def format_doctor_report(result: DoctorResult) -> str:
    """Render readiness checks for CLI output."""

    lines = ["Currency hedge deployment doctor:"]
    for check in result.checks:
        status = "PASS" if check.passed else "FAIL"
        lines.append(f"- [{status}] {check.name}: {check.detail}")
    lines.append(f"Overall: {'PASS' if result.passed else 'FAIL'}")
    return "\n".join(lines)


def _path_exists(name: str, path: Path) -> DoctorCheck:
    if path.is_file():
        return DoctorCheck(name=name, passed=True, detail=str(path))
    return DoctorCheck(name=name, passed=False, detail=f"missing file: {path}")


def _parent_dir_ready(name: str, path: Path, *, create: bool) -> DoctorCheck:
    parent = path.parent
    if create:
        parent.mkdir(parents=True, exist_ok=True)
    if not parent.exists():
        return DoctorCheck(
            name=name,
            passed=False,
            detail=f"missing directory: {parent}",
        )
    if not parent.is_dir():
        return DoctorCheck(
            name=name,
            passed=False,
            detail=f"not a directory: {parent}",
        )
    probe = parent / ".write-check"
    try:
        probe.write_text("ok", encoding="utf-8")
        probe.unlink()
    except OSError as exc:
        return DoctorCheck(
            name=name,
            passed=False,
            detail=f"directory is not writable: {parent} ({exc})",
        )
    return DoctorCheck(name=name, passed=True, detail=str(parent))


def _supported_llm_provider(provider: str) -> DoctorCheck:
    supported = {"none", "ollama", "openai"}
    normalized = provider.lower()
    if normalized in supported:
        return DoctorCheck(
            name="LLM provider",
            passed=True,
            detail=normalized,
        )
    return DoctorCheck(
        name="LLM provider",
        passed=False,
        detail=f"unsupported provider {provider!r}; expected one of {sorted(supported)}",
    )
