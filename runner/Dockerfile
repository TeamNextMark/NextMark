ARG RUNNER_BASE_IMAGE=python:3.11-slim
FROM ${RUNNER_BASE_IMAGE}

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY worker.py /app/worker.py
COPY job_contract.py /app/job_contract.py

CMD ["python", "-u", "/app/worker.py"]
