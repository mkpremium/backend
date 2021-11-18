```SQL
CREATE INDEX person_migration on mkpremium(`_documentType`,`name`,`_relatedTo`) where (`_documentType` = "person")
CREATE INDEX worksheet_related_building_one on mkpremium((distinct (array `v` for `v` in `relatedBuildingIds` end)))
where (`_documentType` = "worksheet")
CREATE INDEX owner_migrate_id on mkpremium(`_migrateId`,`_documentType`)
CREATE INDEX note_migration_building on mkpremium(`_documentType`,(`context`.`buildingId`),(`context`.`_migrateId`))
where (`_documentType` = "note")
CREATE INDEX _migratedId on mkpremium(`_migratedId`)
CREATE INDEX building_cadastre_migrate_id on mkpremium(`_migrateId`,`_documentType`,(`cadastre`.`reference`))
where (`_documentType` = "building")
CREATE INDEX DEV_valid_building_owner on mkpremium(`buildingId`,`status`) where (((`_documentType` = "owner") and (
not (`status` = "WITHOUT_CONTACT"))) and (not (`status` = "ERRONEO")))
CREATE INDEX _documentType_migratedId on mkpremium(`_documentType`,`_migratedId`)
CREATE INDEX owner_good_contacts on mkpremium(`_documentType`,`buildingId`,`status`) where (((`_documentType` = "owner")
and (not (`status` = "ERRONEO"))) and any `c` in (`person`.`contacts`) satisfies ((`c`.`status`) = "GOOD") end)
CREATE INDEX owner_good_contacts2 on mkpremium(`_documentType`,`buildingId`,`status`) where (((`_documentType` = "
owner") and (not (`status` = "VERIFICADO"))) and any `c` in (`person`.`contacts`) satisfies ((`c`.`status`) = "GOOD")
end)
CREATE INDEX TMP_none_documentType on mkpremium(`_documentType`) where (`_documentType` is missing)
CREATE INDEX worksheetIndex on mkpremium(`worksheetIndex`,`_documentType`) where (`_documentType` = "worksheet")
CREATE INDEX owner_id on mkpremium(`_documentType`,`id`) where (`_documentType` = "owner")
CREATE INDEX person_migration_related on mkpremium(`_documentType`,`_relatedTo`) where (`_documentType` = "person")
CREATE INDEX last_call_to_number ON mkpremium(status, phoneNumber) WHERE _documentType = 'virtual-agent-call' AND status
IN [ 'CALLING', 'INPUT_GATHERED', 'DONE' ]
CREATE INDEX virtual_call_worksheetId ON mkpremium(worksheetId) WHERE _documentType = 'virtual-agent-call'
CREATE INDEX worksheet_city ON mkpremium(buildingAddress.city)WHERE _documentType = 'worksheet'
```
