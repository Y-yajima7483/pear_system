FROM mysql:8.4

# タイムゾーン設定
ENV TZ=Asia/Tokyo

# 文字コード設定
RUN echo '[mysqld]' > /etc/mysql/conf.d/charset.cnf && \
    echo 'character-set-server=utf8mb4' >> /etc/mysql/conf.d/charset.cnf && \
    echo 'collation-server=utf8mb4_0900_ai_ci' >> /etc/mysql/conf.d/charset.cnf && \
    echo '[client]' >> /etc/mysql/conf.d/charset.cnf && \
    echo 'default-character-set=utf8mb4' >> /etc/mysql/conf.d/charset.cnf

# A new development volume can receive an isolated PHPUnit database. The hook is
# disabled unless MYSQL_CREATE_TEST_DATABASE=true and is therefore a no-op in the
# production alternative. Official initdb hooks run only for an empty volume.
COPY initdb/10-create-test-database.sh /docker-entrypoint-initdb.d/10-create-test-database.sh
RUN chmod 0755 /docker-entrypoint-initdb.d/10-create-test-database.sh

EXPOSE 3306

CMD ["mysqld"]
