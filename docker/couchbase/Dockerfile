FROM couchbase:community-6.0.0

COPY scripts /scripts

RUN ["mkdir", "/etc/service/init-couchbase/"]
RUN ["ln", "-s", "/scripts/service-run.sh", "/etc/service/init-couchbase/run"]

WORKDIR /scripts
