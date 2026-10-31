"""Command-line interface for the currency hedge LLM workflow."""

from __future__ import annotations

import argparse

from currency_hedge_llm.approval import (
    initialize_approval_workflow,
    set_approval_status,
)
from currency_hedge_llm.config import load_config
from currency_hedge_llm.dashboard import generate_dashboard
from currency_hedge_llm.deployment import (
    assess_deployment_readiness,
    format_readiness_report,
)
from currency_hedge_llm.doctor import format_doctor_report, run_doctor
from currency_hedge_llm.exposure_netting import generate_netted_exposures
from currency_hedge_llm.hedge_recommender import generate_recommendations
from currency_hedge_llm.ingestion import run_ingestion
from currency_hedge_llm.memo_writer import write_memo
from currency_hedge_llm.risk_reports import generate_risk_reports
from currency_hedge_llm.train_model import train_model
from currency_hedge_llm.validation import validate_outputs


def main() -> None:
    """Run the CLI."""

    parser = argparse.ArgumentParser(
        prog="currency-hedge-llm",
        description="Treasury FX hedge decision support with optional LLM memo writing.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    ingest_parser = subparsers.add_parser(
        "ingest", help="Normalize configured source data exports."
    )
    ingest_parser.add_argument("--config", required=True, help="Path to YAML config.")

    train_parser = subparsers.add_parser("train", help="Train the hedge model.")
    train_parser.add_argument("--config", required=True, help="Path to YAML config.")

    doctor_parser = subparsers.add_parser(
        "doctor", help="Validate deployment inputs and writable output locations."
    )
    doctor_parser.add_argument("--config", required=True, help="Path to YAML config.")
    doctor_parser.add_argument(
        "--require-model",
        action="store_true",
        help="Also require the trained model file to exist.",
    )
    doctor_parser.add_argument(
        "--require-recommendations",
        action="store_true",
        help="Also require the recommendation CSV to exist.",
    )
    doctor_parser.add_argument(
        "--create-output-dirs",
        action="store_true",
        help="Create missing output directories before checking writability.",
    )

    recommend_parser = subparsers.add_parser(
        "recommend", help="Generate hedge recommendations."
    )
    recommend_parser.add_argument("--config", required=True, help="Path to YAML config.")

    netting_parser = subparsers.add_parser(
        "netting", help="Generate a netted exposure report."
    )
    netting_parser.add_argument("--config", required=True, help="Path to YAML config.")

    risk_parser = subparsers.add_parser(
        "risk", help="Generate backtest, scenario, and VaR/CVaR reports."
    )
    risk_parser.add_argument("--config", required=True, help="Path to YAML config.")

    validate_parser = subparsers.add_parser(
        "validate", help="Validate generated workflow artifacts."
    )
    validate_parser.add_argument("--config", required=True, help="Path to YAML config.")

    approval_parser = subparsers.add_parser(
        "approval", help="Initialize or update approval workflow artifacts."
    )
    approval_parser.add_argument("--config", required=True, help="Path to YAML config.")
    approval_parser.add_argument(
        "--action",
        choices=["initialize", "set-status"],
        default="initialize",
        help="Approval workflow action.",
    )
    approval_parser.add_argument("--exposure-id", help="Exposure ID for set-status.")
    approval_parser.add_argument("--status", help="New status for set-status.")
    approval_parser.add_argument("--actor", default="system", help="Reviewer or system actor.")
    approval_parser.add_argument("--comment", default="", help="Audit comment.")

    dashboard_parser = subparsers.add_parser(
        "dashboard", help="Generate a static HTML dashboard."
    )
    dashboard_parser.add_argument("--config", required=True, help="Path to YAML config.")

    readiness_parser = subparsers.add_parser(
        "deployment-readiness", help="Score deployment readiness."
    )
    readiness_parser.add_argument("--config", required=True, help="Path to YAML config.")
    readiness_parser.add_argument(
        "--threshold",
        type=int,
        default=95,
        help="Minimum readiness score required for success.",
    )

    memo_parser = subparsers.add_parser("memo", help="Generate a hedge memo.")
    memo_parser.add_argument("--config", required=True, help="Path to YAML config.")
    memo_parser.add_argument(
        "--llm-provider",
        choices=["none", "ollama", "openai"],
        default=None,
        help="LLM provider for explanation text.",
    )

    args = parser.parse_args()
    config = load_config(args.config)

    if args.command == "ingest":
        result = run_ingestion(config)
        print(
            "Ingestion complete: "
            f"fx_rows={result.fx_rows}, "
            f"forward_curve_rows={result.forward_curve_rows}, "
            f"exposure_rows={result.exposure_rows}"
        )
    elif args.command == "train":
        result = train_model(config)
        print(
            "Training complete: "
            f"{result.rows_used} rows, features={result.feature_columns}, "
            f"pairs={result.pair_count} ({', '.join(result.pair_universe)}), "
            f"training_window={result.training_start_date}..{result.training_end_date}, "
            f"holdout_mae={result.holdout_mae:.6f}, "
            f"holdout_r2={result.holdout_r2:.4f}, "
            f"model={result.model_path}"
        )
    elif args.command == "doctor":
        result = run_doctor(
            config,
            require_model=args.require_model,
            require_recommendations=args.require_recommendations,
            create_output_dirs=args.create_output_dirs,
        )
        print(format_doctor_report(result))
        if not result.passed:
            raise SystemExit(1)
    elif args.command == "recommend":
        result = generate_recommendations(config)
        print(
            "Recommendations complete: "
            f"{result.rows_written} rows written to {result.recommendation_path}"
        )
    elif args.command == "netting":
        result = generate_netted_exposures(config)
        print(
            "Netting complete: "
            f"{result.rows_written} rows written to {result.netted_exposures_path}"
        )
    elif args.command == "risk":
        result = generate_risk_reports(config)
        print(
            "Risk reports complete: "
            f"backtest_rows={result.backtest_rows}, "
            f"scenario_rows={result.scenario_rows}, "
            f"risk_summary_rows={result.risk_summary_rows}, "
            f"pair_metrics_rows={result.pair_metrics_rows}"
        )
    elif args.command == "validate":
        result = validate_outputs(config)
        print(
            "Validation complete: "
            f"passed_checks={result.passed_checks}, "
            f"warning_count={result.warning_count}"
        )
        for warning in result.warnings:
            print(f"Validation warning: {warning}")
    elif args.command == "approval":
        if args.action == "initialize":
            result = initialize_approval_workflow(config)
        else:
            if not args.exposure_id or not args.status:
                parser.error("--exposure-id and --status are required for set-status")
            result = set_approval_status(
                config=config,
                exposure_id=args.exposure_id,
                status=args.status,
                actor=args.actor,
                comment=args.comment,
            )
        print(
            "Approval workflow complete: "
            f"{result.rows_written} rows, "
            f"status={result.approval_status_path}, "
            f"audit={result.audit_log_path}"
        )
    elif args.command == "dashboard":
        result = generate_dashboard(config)
        print(f"Dashboard complete: {result.dashboard_path}")
    elif args.command == "deployment-readiness":
        result = assess_deployment_readiness(config, threshold=args.threshold)
        print(format_readiness_report(result))
        if not result.passed:
            raise SystemExit(1)
    elif args.command == "memo":
        result = write_memo(config, llm_provider=args.llm_provider)
        print(
            "Memo complete: "
            f"provider={result.llm_provider}, memo={result.memo_path}"
        )
    else:
        parser.error(f"Unknown command: {args.command}")


if __name__ == "__main__":
    main()
