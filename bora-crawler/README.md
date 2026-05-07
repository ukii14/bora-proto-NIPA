# **bora-crawler**

진행사항 공유드립니다.

### 2021-09-17 (금)

Docker Container 설정에 관한 각각의 폴더와 설정파일인 `docker-compose.yml`이 포함되어 있습니다.

1. `flask_docker`
  - 기존의 `prep_test`에 있던 내용이 `flask_app/` 내부에 포함되어 있습니다.
  - gunicorn 사용을 위해 `app.py`와 `wsgi.py`로 분할되었습니다.
  - `Dockerfile`에 기반한 내용을 바탕으로 이미지를 만들게 됩니다. 베이스는 python:3.8 입니다.
  - `requirements.txt`에는 실행에 필요한 라이브러리가 적혀있습니다. 버전은 따로 정하지 않았고, 최신 버전을 다운로드해서 사용합니다.
  
2. `nginx`
  - Web Server의 설정을 위한 파일이 있습니다. 주 기능은 `8080`번 포트로 들어온 요청을 Flask Server의 `24810` 포트로 넘겨주는 역할입니다.
  
3. `proxy`
  - Reverse Proxy Server 설정을 위한 파일이 있습니다. 주 기능은 `9000`번 포트로 들어온 요청을 Web Server의 `8080` 포트로 넘겨주는 역할입니다.
  
`docker`, `docker-compose`가 설치되어 있다면, 로컬에서도 `bora-proto-NIPA/bora-crawler/` 경로에서 아래 명령어를 사용해서 실행 결과를 확인해 볼 수 있습니다. 

다만, 이미지는 Repository에 포함되어 있지 않으므로 현재 MongoDB Atlas에 저장된 일부 아이템의 이미지가 보이지 않을 수는 있습니다.

```
## -d: option for run in background
docker-compose up --build [-d]
```

종료할떄는 아래와 같은 명령어로 이미지까지 완전 제거할 수 있습니다.

```
docker stop $(docker ps -a -q)
docker rm $(docker ps -a -q)
docker rmi $(docker images -q)
```

도커 없이 실행을 원하시면, `bora-proto-NIPA/bora-crawler/flask_docker/flask_app/`에서 아래와 같은 명령어로 실행 가능합니다.

```
pip install -r ../requirements.txt
python wsgi.py
```

이때는 `wsgi.py`에서 실행되는 `http://localhost:24810` 경로로 접속하시면 됩니다.
