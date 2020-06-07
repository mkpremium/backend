socket: nodemon bin/socket.js --exec babel-node
api: nodemon bin/www.js --exec babel-node
cron: nodemon bin/cronjobs.js --exec babel-node
# cross_worker: nodemon --exec babel-node src/migration/workers/cross-csv.js
# gearman: docker run -p 4730:4730 --rm -i artefactual/gearmand
banks_worker_0: nodemon --exec babel-node src/banks/worker/bank-load.js
banks_worker_1: nodemon --exec babel-node src/banks/worker/bank-process.js
