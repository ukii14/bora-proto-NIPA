FROM python:3.8

## Install.
RUN pip install --upgrade pip

COPY ./requirements ./
RUN pip install -r requirements

## Base working directory.
WORKDIR /usr/src/app

## Run.
CMD streamlit run ./infer.py
