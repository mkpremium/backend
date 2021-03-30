FROM couchbase:community-6.0.0

ENV CLUSTER_NAME default
ENV COUCHBASE_USERNAME couchbase-user
ENV COUCHBASE_PASSWORD couchbase-password
COPY init-cluster.sh /opt/couchbase

CMD ["/opt/couchbase/init-cluster.sh"]

