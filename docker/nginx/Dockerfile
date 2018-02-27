FROM nginx:alpine

COPY nginx.vh.default.conf /etc/nginx/conf.d/default.conf

VOLUME ["/sites", "/etc/nginx/certs"]

EXPOSE 80 443

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]
