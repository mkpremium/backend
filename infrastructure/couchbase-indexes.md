```sql
CREATE INDEX _documentType on mkpremium(`_documentType`) WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX _documentType_id on mkpremium(`_documentType`,`id`) WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX available_worksheets_by_province on mkpremium (`queueId`, `worksheetIndex`, ( `buildingAddress` . `province`)) where (((((`_documentType` = "worksheet") and (`status` in ["LOOKING_MEETING", "OPEN"]))) and ((`buildingAddress`.`province`) is not missing)) and ((`buildingAddress`.`province`) is not null)) WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX building_by_assigned_agent on mkpremium (`assignedAgentId`) where (`_documentType` = "building") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX building_by_owner on mkpremium (`_documentType`, `ownerId`) where ((`_documentType` = "building") and (`ownerId` is not null)) WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX building_cadastre on mkpremium (`_documentType`, ( `cadastre` . `reference`)) where (`_documentType` = "building") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX building_documents on mkpremium (`buildingId`) where (`_documentType` = "metadata") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX building_id on mkpremium (`_documentType`, `id`) where (`_documentType` = "building") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX building_meetings ON mkpremium(_documentType, event.buildingId)
    WHERE _documentType = "scheduled-event" AND type = 'MEETINGS'
WITH { "defer_build":TRUE, "nodes":[ "10.0.3.22:8091" ] }
CREATE INDEX building_negotiation_status on mkpremium (`negotiationStatus`, `id`) where (`_documentType` = "building") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX building_stock on mkpremium (`_documentType`, `buildingId`) where (`_documentType` = "stock") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX call_to_number ON mkpremium (phoneNumber) WHERE _documentType = 'virtual-agent-call' WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX event_by_building on mkpremium (`_documentType`, ( `event` . `buildingId`)) where (`_documentType` = "scheduled-event") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX event_by_worksheet on mkpremium (`_documentType`, ( `event` . `worksheetId`)) where (`_documentType` = "scheduled-event") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX id on mkpremium (`id`) WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX next_worksheet on mkpremium (`queueId`, `viewedAt`, ( `buildingAddress` . `province`)) where ((((`_documentType` = "worksheet") and (`status` in ["OPEN", "LOOKING_MEETING"]))) and (`queueId` is null)) WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX non_discarded_owners
    ON mkpremium(buildingId)
    WHERE _documentType = 'owner'
AND status NOT IN ["ERRONEO", "WITHOUT_CONTACT"] WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX note_migration on mkpremium (`_documentType`, ( `context` . `_migrateId`)) where (`_documentType` = "note") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX operator_roles on mkpremium ((all (tokens(`roles`)))) where (`_documentType` = "operator") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX operators_idx on mkpremium (`username`) where (`_documentType` = "operator") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX owner_contact on mkpremium ((distinct (array (`c` . `value`) for `c` within (`person` . `contacts`)
                                          end))) where (`_documentType` = "owner") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX owner_to_building on mkpremium (`_documentType`, `buildingId`) where (`_documentType` = "owner") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX user_meetings ON mkpremium (notifyTo) WHERE _documentType = 'scheduled-event' AND type = 'MEETINGS' WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX user_scheduled_calls on mkpremium (`notifyTo`) where ((`_documentType` = "scheduled-event") and (`type` = "CALLS")) WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX virtual_call_created_at on mkpremium (`createdAt`) where (`_documentType` = "virtual-agent-call") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX virtual_caller_worksheet on mkpremium (`status`) where (`_documentType` = "virtual-call-worksheet") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX worksheet_building on mkpremium ((`relatedBuildingIds`[0]),`id`) where (`_documentType` = "worksheet") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX worksheet_queue_id on mkpremium (`_documentType`, `queueId`) where (`_documentType` = "worksheet") WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX worksheet_stats_by_province on mkpremium (`_documentType`, `status`, ( `buildingAddress` . `province`)) where ((`_documentType` = "worksheet") and (`status` is not missing)) WITH {"nodes": ["10.0.3.22:8091"]};
CREATE INDEX worksheet_to_assign on mkpremium ((`buildingAddress` . `province`),`status`,`_documentType`,`queueId`) where (((`_documentType` = "worksheet") and (`queueId` is null)) and ((`status` = "OPEN") or (`status` = "LOOKING_MEETING"))) WITH {"nodes": ["10.0.3.22:8091"]};
```
