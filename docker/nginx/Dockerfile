FROM nginx:1.25-alpine

# タイムゾーン設定（JST）
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    echo "Asia/Tokyo" > /etc/timezone && \
    apk del tzdata

# nginx設定ファイルは docker-compose.yml でマウントするため、ここではコピーしない

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]