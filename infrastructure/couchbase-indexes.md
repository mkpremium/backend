```sql
CREATE INDEX _documentType_replica on mkpremium(`_documentType`)
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX _documentType_id_replica on mkpremium(`_documentType`,`id`)
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX available_worksheets_by_province_replica on mkpremium (`queueId`, `worksheetIndex`, ( `buildingAddress` . `province`)) where (((((`_documentType` = "worksheet") and (`status` in ["LOOKING_MEETING", "OPEN"]))) and ((`buildingAddress`.`province`) is not missing)) and ((`buildingAddress`.`province`) is not null))
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX building_by_assigned_agent_replica on mkpremium (`assignedAgentId`) where (`_documentType` = "building")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX building_by_owner_replica on mkpremium (`_documentType`, `ownerId`) where ((`_documentType` = "building") and (`ownerId` is not null))
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX building_cadastre_replica on mkpremium (`_documentType`, ( `cadastre` . `reference`)) where (`_documentType` = "building")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX building_documents_replica on mkpremium (`buildingId`) where (`_documentType` = "metadata")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX building_id_replica on mkpremium (`_documentType`, `id`) where (`_documentType` = "building")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX building_meetings_replica ON mkpremium(_documentType, event.buildingId)
    WHERE _documentType = "scheduled-event" AND type = 'MEETINGS'
WITH { "nodes":[ "10.0.28.145:8091" ] };
CREATE INDEX building_negotiation_status_replica on mkpremium (`negotiationStatus`, `id`) where (`_documentType` = "building")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX building_stock_replica on mkpremium (`_documentType`, `buildingId`) where (`_documentType` = "stock")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX call_to_number_replica ON mkpremium (phoneNumber) WHERE _documentType = 'virtual-agent-call' WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX event_by_building_replica on mkpremium (`_documentType`, ( `event` . `buildingId`)) where (`_documentType` = "scheduled-event")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX event_by_worksheet_replica on mkpremium (`_documentType`, ( `event` . `worksheetId`)) where (`_documentType` = "scheduled-event")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX id_replica on mkpremium (`id`)
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX next_worksheet_replica on mkpremium (`queueId`, `viewedAt`, ( `buildingAddress` . `province`)) where ((((`_documentType` = "worksheet") and (`status` in ["OPEN", "LOOKING_MEETING"]))) and (`queueId` is null))
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX non_discarded_owners_replica
    ON mkpremium(buildingId)
    WHERE _documentType = 'owner'
AND status NOT IN ["ERRONEO", "WITHOUT_CONTACT"] WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX note_migration_replica on mkpremium (`_documentType`, ( `context` . `_migrateId`)) where (`_documentType` = "note")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX operator_roles_replica on mkpremium ((all (tokens(`roles`)))) where (`_documentType` = "operator")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX operators_idx_replica on mkpremium (`username`) where (`_documentType` = "operator")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX owner_contact_replica on mkpremium ((distinct (array (`c` . `value`) for `c` within (`person` . `contacts`)
                                          end))) where (`_documentType` = "owner")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX owner_to_building_replica on mkpremium (`_documentType`, `buildingId`) where (`_documentType` = "owner")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX user_meetings_replica ON mkpremium (notifyTo) WHERE _documentType = 'scheduled-event' AND type = 'MEETINGS' WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX user_scheduled_calls_replica on mkpremium (`notifyTo`) where ((`_documentType` = "scheduled-event") and (`type` = "CALLS"))
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX virtual_call_created_at_replica on mkpremium (`createdAt`) where (`_documentType` = "virtual-agent-call")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX virtual_caller_worksheet_replica on mkpremium (`status`) where (`_documentType` = "virtual-call-worksheet")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX worksheet_building_replica on mkpremium ((`relatedBuildingIds`[0]),`id`) where (`_documentType` = "worksheet")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX worksheet_queue_id_replica on mkpremium (`_documentType`, `queueId`) where (`_documentType` = "worksheet")
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX worksheet_stats_by_province_replica on mkpremium (`_documentType`, `status`, ( `buildingAddress` . `province`)) where ((`_documentType` = "worksheet") and (`status` is not missing))
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};
CREATE INDEX worksheet_to_assign_replica on mkpremium ((`buildingAddress` . `province`),`status`,`_documentType`,`queueId`) where (((`_documentType` = "worksheet") and (`queueId` is null)) and ((`status` = "OPEN") or (`status` = "LOOKING_MEETING")))
    WITH {"defer_build": true, "nodes": ["10.0.28.145:8091"]};

BUILD INDEX ON mkpremium(
    _documentType_replica,
    _documentType_id_replica,
    available_worksheets_by_province_replica,
    building_by_assigned_agent_replica,
    building_by_owner_replica,
    building_cadastre_replica,
    building_documents_replica,
    building_id_replica,
    building_meetings_replica,
    building_negotiation_status_replica,
    building_stock_replica,
    call_to_number_replica,
    event_by_building_replica,
    event_by_worksheet_replica,
    id_replica,
    next_worksheet_replica,
    non_discarded_owners_replica,
    note_migration_replica,
    operator_roles_replica,
    operators_idx_replica,
    owner_contact_replica,
    owner_to_building_replica,
    user_meetings_replica,
    user_scheduled_calls_replica,
    virtual_call_created_at_replica,
    virtual_caller_worksheet_replica,
    worksheet_building_replica,
    worksheet_queue_id_replica,
    worksheet_stats_by_province_replica,
    worksheet_to_assign_replica
)
```
