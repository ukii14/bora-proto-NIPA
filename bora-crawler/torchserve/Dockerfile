## Install image with torchserve==0.5.0-cpu.
## Python 3.8 is required to run Torchserve.
FROM pytorch/torchserve:latest

## Base working directory.
WORKDIR /home/model-server

## Install.
# RUN pip install --upgrade pip

COPY ./requirements ./
RUN pip install -r requirements

COPY ./model-store ./model-store
COPY ./handler.py ./
COPY ./torchserve.config ./

## Generate model archive files.
RUN torch-model-archiver \
    --model-name bart \
    --version 1.0 \
    --serialized-file ./model-store/20211207-192805/model.pth \
    --handler "./handler.py" \
    --export-path ./model-store \
    --force

## Start server.
CMD ["torchserve", \
     "--start", \
     "--ncs", \
     "--ts-config", "/home/model-server/torchserve.config", \
     "--model-store", "/home/model-server/model-store", \
     "--models", "bart=bart.mar"]
