FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml README.md ./
COPY config ./config
COPY data ./data
COPY scripts ./scripts
COPY src ./src

RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir .

RUN useradd --create-home --shell /usr/sbin/nologin appuser \
    && mkdir -p /app/models /app/reports /app/data/processed \
    && chown -R appuser:appuser /app

USER appuser

ENTRYPOINT ["currency-hedge-llm"]
CMD ["--help"]
