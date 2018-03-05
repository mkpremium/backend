# Temporary start just for migration
# later we can restore the api: entry from here to start script

api: nodemon bin/www.js --exec babel-node
cross_worker: nodemon --exec babel-node src/migration/workers/cross-csv.js
seed_worker: nodemon --exec babel-node src/migration/workers/seed.js
gearman: docker run -p 4730:4730 --rm -i artefactual/gearmand
