FROM node:20-slim AS web
WORKDIR /w
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
COPY --from=web /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server ./server
COPY --from=web /w/dist ./dist
CMD gunicorn -b 0.0.0.0:${PORT:-8000} -w 1 --threads 8 -t 900 --chdir server server:app
