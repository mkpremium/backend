## Create backup

```bash
  cbbackup http://localhost:8091 /tmp/backup -u USERNAME -p PASSWORD
  backup_filename=`date +"%Y-%m-%d_%H-%M-%ST%Z"`-backup.tar.gz
  tar -czvf /tmp/$backup_filename /tmp/backup
```

## Restore backup
```bash
  scp COUCHBASE_HOST:/tmp/$BACKUP_FILENAME .
  tar -xzvf $BACKUP_FILENAME backup
  /opt/couchbase/bin/cbrestore /tmp/backup http://localhost:8091 -u USERNAME -p PASSWORD
```

## Build indexes from indexes pages

In the indices page on the Couchbase web console, open web console and run:

```javascript
const indexes = []
document.querySelectorAll(".cbui-tablerow .cbui-table-cell:first-child").forEach(it => indexes.push(it.textContent.trim()))
`BUILD INDEX ON mkpremium( ${indexes.join(", ")} )`
```

Copy the resulting query and execute it to build the indices. 
