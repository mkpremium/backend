

```sql
CREATE INDEX _documentType on mkpremium(`_documentType`)
CREATE INDEX id on mkpremium(`id`)
CREATE INDEX test_buildings on mkpremium(`id`) where ((`_documentType` = "building") and `isTest`)
CREATE INDEX worksheet_status on mkpremium(`status`,`_documentType`) where (`_documentType` = "worksheet")
CREATE INDEX building_documents on mkpremium(`buildingId`) where (`_documentType` = "metadata")
CREATE INDEX operator_stats_count on mkpremium(`city`,`action`,`createdAt`) where ((`_documentType` = "operator-stats") and (`city` is not missing))
CREATE INDEX worksheet_to_assign on mkpremium((`buildingAddress`.`province`),`status`,`_documentType`,`queueId`) where (((`_documentType` = "worksheet") and (`queueId` is null)) and ((`status` = "OPEN") or (`status` = "LOOKING_MEETING")))

CREATE INDEX building_id on mkpremium(`_documentType`,`id`) where (`_documentType` = "building") WITH {"defer_build": true}
CREATE INDEX person_document_number on mkpremium(`_documentType`,`documentNumber`) where (`_documentType` = "person") WITH {"defer_build": true}
CREATE INDEX _documentType_id on mkpremium(`_documentType`,`id`) WITH {"defer_build": true}
CREATE INDEX building_by_assigned_agent on mkpremium(`assignedAgentId`) where (`_documentType` = "building") WITH {"defer_build": true}
CREATE INDEX operator_roles on mkpremium((all (tokens(`roles`)))) where (`_documentType` = "operator") WITH {"defer_build": true}
CREATE INDEX call_call_id on mkpremium(`callId`,`_documentType`) where (`_documentType` = "calls") WITH {"defer_build": true}
CREATE INDEX entity_changes on mkpremium(`modelId`) where (`_documentType` = "history") WITH {"defer_build": true}
CREATE INDEX verified_owners on mkpremium(`buildingId`,`personId`) where ((`_documentType` = "owner") and (`status` = "VERIFICADO")) WITH {"defer_build": true}
CREATE INDEX operator_stats_operator_count on mkpremium(`createdAt`,`operatorId`,`action`) where ((((`_documentType` = "operator-stats") and (`operatorId` is not missing)) and (`action` is not missing)) and (`createdAt` is not missing)) WITH {"defer_build": true}
CREATE INDEX call_by_status on mkpremium(`_documentType`,`status`) where (`_documentType` = "calls") WITH {"defer_build": true}
CREATE INDEX available_worksheets_by_province on mkpremium(`queueId`,`worksheetIndex`,(`buildingAddress`.`province`)) where (((((`_documentType` = "worksheet") and (`status` in ["LOOKING_MEETING", "OPEN"]))) and ((`buildingAddress`.`province`) is not missing)) and ((`buildingAddress`.`province`) is not null)) WITH {"defer_build": true}
CREATE INDEX person_address on mkpremium((distinct (array (`v`.`fullAddress`) for `v` in `addresses` end))) where (`_documentType` = "person") WITH {"defer_build": true}
CREATE INDEX next_worksheet on mkpremium(`queueId`,`viewedAt`,(`buildingAddress`.`province`)) where ((((`_documentType` = "worksheet") and (`status` in ["OPEN", "LOOKING_MEETING"]))) and (`queueId` is null)) WITH {"defer_build": true}
CREATE INDEX event_by_building on mkpremium(`_documentType`,(`event`.`buildingId`)) where (`_documentType` = "scheduled-event") WITH {"defer_build": true}
CREATE INDEX virtual_caller_worksheet on mkpremium(`status`) where (`_documentType` = "virtual-call-worksheet") WITH {"defer_build": true}
CREATE INDEX building_by_owner on mkpremium(`_documentType`,`ownerId`) where ((`_documentType` = "building") and (`ownerId` is not null)) WITH {"defer_build": true}
CREATE INDEX worksheet_queue_id on mkpremium(`_documentType`,`queueId`) where (`_documentType` = "worksheet") WITH {"defer_build": true}
CREATE INDEX event_by_worksheet on mkpremium(`_documentType`,(`event`.`worksheetId`)) where (`_documentType` = "scheduled-event") WITH {"defer_build": true}
CREATE INDEX building_negotiation_status on mkpremium(`negotiationStatus`,`id`) where (`_documentType` = "building") WITH {"defer_build": true}
CREATE INDEX worksheet_stats_by_province on mkpremium(`_documentType`,`status`,(`buildingAddress`.`province`)) where ((`_documentType` = "worksheet") and (`status` is not missing)) WITH {"defer_build": true}
CREATE INDEX operators_idx on mkpremium(`username`) where (`_documentType` = "operator") WITH {"defer_build": true}
CREATE INDEX worksheet_related_owners_one on mkpremium((distinct (array `v` for `v` in `relatedOwnerIds` end))) where (`_documentType` = "worksheet") WITH {"defer_build": true}
CREATE INDEX note_migration on mkpremium(`_documentType`,(`context`.`_migrateId`)) where (`_documentType` = "note") WITH {"defer_build": true}
CREATE INDEX invalid_building_owners on mkpremium(`buildingId`) where (((`_documentType` = "owner") and (`status` in ["ERRONEO", "WITHOUT_CONTACT"]))) WITH {"defer_build": true}
CREATE INDEX building_stock on mkpremium(`_documentType`,`buildingId`) where (`_documentType` = "stock") WITH {"defer_build": true}
CREATE INDEX owner_contact_value on mkpremium(array (`c`.`value`) for `c` in (`person`.`contacts`) end) where (`_documentType` = "owner") WITH {"defer_build": true}
CREATE INDEX building_cadastre on mkpremium(`_documentType`,(`cadastre`.`reference`)) where (`_documentType` = "building") WITH {"defer_build": true}
CREATE INDEX owner_contact on mkpremium((distinct (array (`c`.`value`) for `c` within (`person`.`contacts`) end))) where (`_documentType` = "owner") WITH {"defer_build": true}
CREATE INDEX building_already_sold on mkpremium(`id`) where ((`_documentType` = "building") and (`negotiationStatus` = "YA VENDIO")) WITH {"defer_build": true}
CREATE INDEX available_worksheets_by_city on mkpremium(`queueId`,`worksheetIndex`,(`buildingAddress`.`city`)) where (((((`_documentType` = "worksheet") and (`status` in ["LOOKING_MEETING", "OPEN"]))) and ((`buildingAddress`.`city`) is not missing)) and ((`buildingAddress`.`city`) is not null)) WITH {"defer_build": true}
CREATE INDEX person_name on mkpremium(`_documentType`,`id`,lower(`firstSurname`),lower(`secondSurname`)) where (`_documentType` = "person") WITH {"defer_build": true}
CREATE INDEX owner_business_status on mkpremium((`business`.`status`)) where ((`_documentType` = "owner") and ((`business`.`status`) is not missing)) WITH {"defer_build": true}
CREATE INDEX call_by_user on mkpremium(`_documentType`,`userId`) where (`_documentType` = "calls") WITH {"defer_build": true}
CREATE INDEX owner_to_building on mkpremium(`_documentType`,`buildingId`) where (`_documentType` = "owner") WITH {"defer_build": true}
CREATE INDEX worksheet_building on mkpremium((`relatedBuildingIds`[0]),`id`) where (`_documentType` = "worksheet") WITH {"defer_build": true}
CREATE INDEX verified_owner_good_contact on mkpremium(`_documentType`,`buildingId`,`status`) where (((`_documentType` = "owner") and (`status` = "VERIFICADO")) and any `c` in (`person`.`contacts`) satisfies ((`c`.`status`) = "GOOD") end) WITH {"defer_build": true}
CREATE INDEX user_scheduled_calls on mkpremium(`notifyTo`) where ((`_documentType` = "scheduled-event") and (`type` = "CALLS")) WITH {"defer_build": true}
CREATE INDEX virtual_call_created_at on mkpremium(`createdAt`) where (`_documentType` = "virtual-agent-call") WITH {"defer_build": true}
CREATE INDEX user_meetings ON mkpremium(notifyTo) WHERE _documentType = 'scheduled-event' AND type = 'MEETINGS' WITH {"defer_build": true}
```


CREATE INDEX person_migration on mkpremium(`_documentType`,`name`,`_relatedTo`) where (`_documentType` = "person")
CREATE INDEX worksheet_related_building_one on mkpremium((distinct (array `v` for `v` in `relatedBuildingIds` end))) where (`_documentType` = "worksheet")
CREATE INDEX owner_migrate_id on mkpremium(`_migrateId`,`_documentType`)
CREATE INDEX note_migration_building on mkpremium(`_documentType`,(`context`.`buildingId`),(`context`.`_migrateId`)) where (`_documentType` = "note")
CREATE INDEX _migratedId on mkpremium(`_migratedId`)
CREATE INDEX building_cadastre_migrate_id on mkpremium(`_migrateId`,`_documentType`,(`cadastre`.`reference`)) where (`_documentType` = "building")
CREATE INDEX DEV_valid_building_owner on mkpremium(`buildingId`,`status`) where (((`_documentType` = "owner") and (not (`status` = "WITHOUT_CONTACT"))) and (not (`status` = "ERRONEO")))
CREATE INDEX _documentType_migratedId on mkpremium(`_documentType`,`_migratedId`)
CREATE INDEX owner_good_contacts on mkpremium(`_documentType`,`buildingId`,`status`) where (((`_documentType` = "owner") and (not (`status` = "ERRONEO"))) and any `c` in (`person`.`contacts`) satisfies ((`c`.`status`) = "GOOD") end)
CREATE INDEX owner_good_contacts2 on mkpremium(`_documentType`,`buildingId`,`status`) where (((`_documentType` = "owner") and (not (`status` = "VERIFICADO"))) and any `c` in (`person`.`contacts`) satisfies ((`c`.`status`) = "GOOD") end)
CREATE INDEX TMP_none_documentType on mkpremium(`_documentType`) where (`_documentType` is missing)
CREATE INDEX worksheetIndex on mkpremium(`worksheetIndex`,`_documentType`) where (`_documentType` = "worksheet")
CREATE INDEX owner_id on mkpremium(`_documentType`,`id`) where (`_documentType` = "owner")
CREATE INDEX person_migration_related on mkpremium(`_documentType`,`_relatedTo`) where (`_documentType` = "person")
CREATE INDEX last_call_to_number ON mkpremium(status, phoneNumber) WHERE _documentType = 'virtual-agent-call' AND status IN [ 'CALLING', 'INPUT_GATHERED', 'DONE' ]
CREATE INDEX virtual_call_worksheetId ON mkpremium(worksheetId) WHERE _documentType = 'virtual-agent-call'
CREATE INDEX worksheet_city ON mkpremium(buildingAddress.city)WHERE _documentType = 'worksheet'
CREATE INDEX call_to_number ON mkpremium(phoneNumber) WHERE _documentType = 'virtual-agent-call'


BUILD INDEX mkpremium(
building_id,
person_document_number,
_documentType_id,
building_by_assigned_agent,
operator_roles,
call_call_id,
entity_changes,
verified_owners,
operator_stats_operator_count,
call_by_status,
available_worksheets_by_province,
person_address,
next_worksheet,
event_by_building,
virtual_caller_worksheet,
building_by_owner,
worksheet_queue_id,
event_by_worksheet,
building_negotiation_status,
worksheet_stats_by_province,
operators_idx,
worksheet_related_owners_one,
note_migration,
invalid_building_owners,
building_stock,
owner_contact_value,
building_cadastre,
owner_contact,
building_already_sold,
available_worksheets_by_city,
person_name,
owner_business_status,
call_by_user,
owner_to_building,
worksheet_building,
verified_owner_good_contact,
user_scheduled_calls,
virtual_call_created_at,
last_call_to_number,
user_meetings,
call_to_number
)
