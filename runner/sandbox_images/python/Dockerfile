ARG SANDBOX_PYTHON_BASE_IMAGE=python:3.11-alpine
FROM ${SANDBOX_PYTHON_BASE_IMAGE}

RUN addgroup -S sandbox && adduser -S sandbox -G sandbox

WORKDIR /workspace
USER sandbox

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

CMD ["python", "main.py"]
