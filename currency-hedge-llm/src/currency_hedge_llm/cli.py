"""Command-line interface for the currency hedge LLM workflow."""

from __future__ import annotations

import argparse

from currency_hedge_llm.config import load_config
from currency_hedge_llm.doctor import format_doctor_report, run_doctor
from currency_hedge_llm.hedge_recommender import generate_recommendations
from currency_hedge_llm.memo_writer import write_memo
from currency_hedge_llm.train_model import train_model


def main() -> None:
    """Run the CLI."""

    parser = argparse.ArgumentParser(
        prog="currency-hedge-llm",
        description="Treasury FX hedge decision support with optional LLM memo writing.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

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

    if args.command == "train":
        result = train_model(config)
        print(
            "Training complete: "
            f"{result.rows_used} rows, features={result.feature_columns}, "
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
