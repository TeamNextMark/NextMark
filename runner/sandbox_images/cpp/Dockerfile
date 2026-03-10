ARG SANDBOX_CPP_BASE_IMAGE=gcc:14
FROM ${SANDBOX_CPP_BASE_IMAGE}

RUN useradd -m sandbox
WORKDIR /workspace
USER sandbox

CMD ["bash", "-lc", "g++ -std=c++20 -O2 -o /sandbox/app main.cpp && /sandbox/app"]
