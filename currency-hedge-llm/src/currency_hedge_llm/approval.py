"""Approval status and audit trail workflow for hedge recommendations."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import pandas as pd

from currency_hedge_llm.config import AppConfig


ALLOWED_STATUSES = {
    "pending_treasury_review",
    "changes_requested",
    "rejected",
    "approved_for_manual_treasury_action",
}


@dataclass(frozen=True)
class ApprovalResult:
    """Summary of approval workflow updates."""

    approval_status_path: str
    audit_log_path: str
    rows_written: int


def initialize_approval_workflow(config: AppConfig) -> ApprovalResult:
    """Initialize approval statuses from generated recommendations."""

    recommendations = _load_recommendations(config)
    now = _utc_now()
    status_rows = []
    audit_rows = []
    for record in recommendations.to_dict(orient="records"):
        status_rows.append(
            {
                "exposure_id": record["exposure_id"],
                "entity": record.get("entity", ""),
                "reviewer": record.get("reviewer", "unassigned"),
                "approval_status": "pending_treasury_review",
                "review_flags": record.get("review_flags", "none"),
                "recommended_next_step": record.get("recommended_next_step", ""),
                "last_updated_utc": now,
                "no_auto_execution": True,
            }
        )
        audit_rows.append(
            _audit_row(
                exposure_id=record["exposure_id"],
                actor="system",
                event="approval_initialized",
                from_status="",
                to_status="pending_treasury_review",
                comment="Initialized from hedge recommendation workflow.",
                timestamp=now,
            )
        )

    status = pd.DataFrame(status_rows)
    audit = pd.DataFrame(audit_rows)
    _write_approval_outputs(config, status, audit)
    return ApprovalResult(
        approval_status_path=str(config.approval.approval_status_path),
        audit_log_path=str(config.approval.audit_log_path),
        rows_written=len(status),
    )


def set_approval_status(
    config: AppConfig,
    exposure_id: str,
    status: str,
    actor: str,
    comment: str,
) -> ApprovalResult:
    """Set a recommendation review status and append an audit event."""

    if status not in ALLOWED_STATUSES:
        raise ValueError(f"status must be one of: {sorted(ALLOWED_STATUSES)}")
    if not config.approval.approval_status_path.exists():
        initialize_approval_workflow(config)

    status_frame = pd.read_csv(config.approval.approval_status_path)
    audit_frame = pd.read_csv(config.approval.audit_log_path)
    match = status_frame["exposure_id"] == exposure_id
    if not match.any():
        raise ValueError(f"Unknown exposure_id in approval status file: {exposure_id}")

    previous_status = str(status_frame.loc[match, "approval_status"].iloc[0])
    now = _utc_now()
    status_frame.loc[match, "approval_status"] = status
    status_frame.loc[match, "last_updated_utc"] = now
    status_frame.loc[match, "no_auto_execution"] = True

    audit_frame = pd.concat(
        [
            audit_frame,
            pd.DataFrame(
                [
                    _audit_row(
                        exposure_id=exposure_id,
                        actor=actor,
                        event="approval_status_changed",
                        from_status=previous_status,
                        to_status=status,
                        comment=comment,
                        timestamp=now,
                    )
                ]
            ),
        ],
        ignore_index=True,
    )
    _write_approval_outputs(config, status_frame, audit_frame)
    return ApprovalResult(
        approval_status_path=str(config.approval.approval_status_path),
        audit_log_path=str(config.approval.audit_log_path),
        rows_written=len(status_frame),
    )


def _load_recommendations(config: AppConfig) -> pd.DataFrame:
    if not config.recommendation.recommendation_path.exists():
        raise FileNotFoundError(
            "Recommendation file not found. Run recommend before approval."
        )
    return pd.read_csv(config.recommendation.recommendation_path)


def _write_approval_outputs(
    config: AppConfig, status: pd.DataFrame, audit: pd.DataFrame
) -> None:
    config.approval.approval_status_path.parent.mkdir(parents=True, exist_ok=True)
    config.approval.audit_log_path.parent.mkdir(parents=True, exist_ok=True)
    status.to_csv(config.approval.approval_status_path, index=False)
    audit.to_csv(config.approval.audit_log_path, index=False)


def _audit_row(
    exposure_id: str,
    actor: str,
    event: str,
    from_status: str,
    to_status: str,
    comment: str,
    timestamp: str,
) -> dict:
    return {
        "timestamp_utc": timestamp,
        "exposure_id": exposure_id,
        "actor": actor,
        "event": event,
        "from_status": from_status,
        "to_status": to_status,
        "comment": comment,
        "decision_support_only": True,
    }


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
