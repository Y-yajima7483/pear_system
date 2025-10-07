FROM mysql:8.0

# タイムゾーン設定
ENV TZ=Asia/Tokyo

# 文字コード設定
RUN echo '[mysqld]' > /etc/mysql/conf.d/charset.cnf && \
    echo 'character-set-server=utf8mb4' >> /etc/mysql/conf.d/charset.cnf && \
    echo 'collation-server=utf8mb4_0900_ai_ci' >> /etc/mysql/conf.d/charset.cnf && \
    echo 'default-authentication-plugin=mysql_native_password' >> /etc/mysql/conf.d/charset.cnf && \
    echo '[client]' >> /etc/mysql/conf.d/charset.cnf && \
    echo 'default-character-set=utf8mb4' >> /etc/mysql/conf.d/charset.cnf

EXPOSE 3306

CMD ["mysqld"]