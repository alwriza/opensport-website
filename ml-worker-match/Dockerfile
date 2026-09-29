FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    WEIGHTS_DIR=/weights \
    DEVICE=cuda

RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.10 python3-pip ffmpeg libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .
RUN ./setup.sh

CMD ["python3", "worker.py"]
