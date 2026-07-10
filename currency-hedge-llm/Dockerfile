FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml README.md ./
COPY DEPLOYMENT.md SECURITY.md ./
COPY src ./src
COPY config ./config
COPY data ./data
COPY scripts ./scripts

RUN python -m pip install --upgrade pip \
    && python -m pip install -e .

CMD ["bash", "scripts/run_demo.sh"]
