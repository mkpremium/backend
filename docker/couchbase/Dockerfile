FROM couchbase:community-6.0.0

RUN ["apt-get", "update"]
RUN ["apt-get", "install", "-y", "less", "vim"]

COPY init-couchbase /etc/service/init-couchbase
