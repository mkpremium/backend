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

indexes.map(i =>`CREATE INDEX \`${i}\` ON `mkpremium`(\`${i}`)`)
```

CREATE INDEX `_documentType` ON `mkpremium`(`_documentType`)
CREATE INDEX `_documentType__migrateOwnerId` ON `mkpremium`(`_documentType__migrateOwnerId`)
CREATE INDEX `_documentType_id` ON `mkpremium`(`_documentType_id`)
CREATE INDEX `_documentType_migratedId` ON `mkpremium`(`_documentType_migratedId`)
CREATE INDEX `_migratedId` ON `mkpremium`(`_migratedId`)
CREATE INDEX `building_cadastre` ON `mkpremium`(`building_cadastre`)
CREATE INDEX `building_cadastre_migrate_id` ON `mkpremium`(`building_cadastre_migrate_id`)
CREATE INDEX `building_id` ON `mkpremium`(`building_id`)
CREATE INDEX `call_by_status` ON `mkpremium`(`call_by_status`)
CREATE INDEX `call_by_user` ON `mkpremium`(`call_by_user`)
CREATE INDEX `call_call_id` ON `mkpremium`(`call_call_id`)
CREATE INDEX `event_by_building` ON `mkpremium`(`event_by_building`)
CREATE INDEX `event_by_worksheet` ON `mkpremium`(`event_by_worksheet`)
CREATE INDEX `id` ON `mkpremium`(`id`)
CREATE INDEX `mkpremium_primary` ON `mkpremium`(`mkpremium_primary`)
CREATE INDEX `note_migration` ON `mkpremium`(`note_migration`)
CREATE INDEX `note_migration_building` ON `mkpremium`(`note_migration_building`)
CREATE INDEX `operator_roles` ON `mkpremium`(`operator_roles`)
CREATE INDEX `operator_stats_count` ON `mkpremium`(`operator_stats_count`)
CREATE INDEX `operator_stats_operator_count` ON `mkpremium`(`operator_stats_operator_count`)
CREATE INDEX `operators_idx` ON `mkpremium`(`operators_idx`)
CREATE INDEX `owner_business_status` ON `mkpremium`(`owner_business_status`)
CREATE INDEX `owner_migrate_id` ON `mkpremium`(`owner_migrate_id`)
CREATE INDEX `owner_migration` ON `mkpremium`(`owner_migration`)
CREATE INDEX `owner_migration_related` ON `mkpremium`(`owner_migration_related`)
CREATE INDEX `owner_person_id` ON `mkpremium`(`owner_person_id`)
CREATE INDEX `owner_relationships` ON `mkpremium`(`owner_relationships`)
CREATE INDEX `person_address` ON `mkpremium`(`person_address`)
CREATE INDEX `person_document_number` ON `mkpremium`(`person_document_number`)
CREATE INDEX `person_migration` ON `mkpremium`(`person_migration`)
CREATE INDEX `person_migration_related` ON `mkpremium`(`person_migration_related`)
CREATE INDEX `person_name` ON `mkpremium`(`person_name`)
CREATE INDEX `worksheet_queue_id` ON `mkpremium`(`worksheet_queue_id`)
CREATE INDEX `worksheet_related_building_one` ON `mkpremium`(`worksheet_related_building_one`)
CREATE INDEX `worksheet_related_owners_one` ON `mkpremium`(`worksheet_related_owners_one`)
CREATE INDEX `worksheet_stats_by_province` ON `mkpremium`(`worksheet_stats_by_province`)
CREATE INDEX `worksheet_status` ON `mkpremium`(`worksheet_status`)
CREATE INDEX `worksheet_to_assign` ON `mkpremium`(`worksheet_to_assign`)
CREATE INDEX `worksheetIndex` ON `mkpremium`(`worksheetIndex`)

Copy the resulting query and execute it to build the indices. 
