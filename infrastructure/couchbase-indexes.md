```
# General (document_type and id)
CREATE INDEX _documentType_replica_10_114_0_5 on mkpremium(`_documentType`)
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX _documentType_id_replica_10_114_0_5 on mkpremium(`_documentType`,`id`)
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX id_replica_10_114_0_5 on mkpremium (`id`)
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};

# Worksheets
CREATE INDEX available_worksheets_by_province_replica_10_114_0_5 on mkpremium (`queueId`, `worksheetIndex`, ( `buildingAddress` . `province`))
    where (((((`_documentType` = "worksheet") and (`status` in ["LOOKING_MEETING", "OPEN"]))) and ((`buildingAddress`.`province`) is not missing)) and ((`buildingAddress`.`province`) is not null))
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX next_worksheet_replica_10_114_0_5 on mkpremium (`queueId`, `viewedAt`, ( `buildingAddress` . `province`))
    where ((((`_documentType` = "worksheet") and (`status` in ["OPEN", "LOOKING_MEETING"]))) and (`queueId` is null))
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX call_to_number_replica_10_114_0_5 ON mkpremium (phoneNumber)
    WHERE _documentType = 'virtual-agent-call'
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX event_by_worksheet_replica_10_114_0_5 on mkpremium (`_documentType`, ( `event` . `worksheetId`))
    where (`_documentType` = "scheduled-event")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX virtual_caller_worksheet_replica_10_114_0_5 on mkpremium (`status`)
    where (`_documentType` = "virtual-call-worksheet")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX worksheet_building_replica_10_114_0_5 on mkpremium ((`relatedBuildingIds`[0]),`id`)
    where (`_documentType` = "worksheet")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX worksheet_queue_id_replica_10_114_0_5 on mkpremium (`_documentType`, `queueId`)
    where (`_documentType` = "worksheet")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX worksheet_stats_by_province_replica_10_114_0_5 on mkpremium (`_documentType`, `status`, ( `buildingAddress` . `province`))
    where ((`_documentType` = "worksheet") and (`status` is not missing))
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX worksheet_to_assign_replica_10_114_0_5 on mkpremium ((`buildingAddress` . `province`),`status`,`_documentType`,`queueId`)
    where (((`_documentType` = "worksheet") and (`queueId` is null)) and ((`status` = "OPEN") or (`status` = "LOOKING_MEETING")))
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};

# Buildings
CREATE INDEX building_by_assigned_agent_replica_10_114_0_5 on mkpremium (`assignedAgentId`)
    where (`_documentType` = "building")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX building_by_owner_replica_10_114_0_5 on mkpremium (`_documentType`, `ownerId`) where ((`_documentType` = "building") and (`ownerId` is not null))
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX building_cadastre_replica_10_114_0_5 on mkpremium (`_documentType`, ( `cadastre` . `reference`)) where (`_documentType` = "building")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX building_documents_replica_10_114_0_5 on mkpremium (`buildingId`) where (`_documentType` = "metadata")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX building_meetings_replica_10_114_0_5 ON mkpremium(_documentType, event.buildingId)
    WHERE _documentType = "scheduled-event" AND type = 'MEETINGS'
    WITH { "nodes":[ "10.114.0.5:8091" ] };
CREATE INDEX building_negotiation_status_replica_10_114_0_5 on mkpremium (`negotiationStatus`, `id`) where (`_documentType` = "building")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX building_stock_replica_10_114_0_5 on mkpremium (`_documentType`, `buildingId`) where (`_documentType` = "stock")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX event_by_building_replica_10_114_0_5 on mkpremium (`_documentType`, ( `event` . `buildingId`))
    where (`_documentType` = "scheduled-event")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};


# Owner
CREATE INDEX non_discarded_owners_replica_10_114_0_5
    ON mkpremium(buildingId)
    WHERE _documentType = 'owner'
        AND status NOT IN ["ERRONEO", "WITHOUT_CONTACT"]
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX owner_contact_replica_10_114_0_5 on mkpremium ((distinct (array (`c` . `value`) for `c` within (`person` . `contacts`)
                                          end))) where (`_documentType` = "owner")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX owner_to_building_replica_10_114_0_5 on mkpremium (`_documentType`, `buildingId`) where (`_documentType` = "owner")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};

# Users
CREATE INDEX user_meetings_replica_10_114_0_5 ON mkpremium (notifyTo)
    WHERE _documentType = 'scheduled-event'
    AND type = 'MEETINGS' WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX user_scheduled_calls_replica_10_114_0_5 on mkpremium (`notifyTo`)
    where ((`_documentType` = "scheduled-event") and (`type` = "CALLS"))
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};
CREATE INDEX virtual_call_created_at_replica_10_114_0_5 on mkpremium (`createdAt`)
    where (`_documentType` = "virtual-agent-call")
    WITH {"defer_build": true, "nodes": ["10.114.0.5:8091"]};



BUILD INDEX ON mkpremium(
    # General (document_type and id)
    _documentType_replica_10_114_0_5,
    _documentType_id_replica_10_114_0_5,
    id_replica_10_114_0_5,
    
    # Worksheets
    available_worksheets_by_province_replica_10_114_0_5,
    next_worksheet_replica_10_114_0_5,
    call_to_number_replica_10_114_0_5,
    event_by_worksheet_replica_10_114_0_5,
    virtual_caller_worksheet_replica_10_114_0_5,
    worksheet_building_replica_10_114_0_5,
    worksheet_queue_id_replica_10_114_0_5,
    worksheet_stats_by_province_replica_10_114_0_5,
    worksheet_to_assign_replica_10_114_0_5,
    
    # Buildings
    building_by_assigned_agent_replica_10_114_0_5,
    building_by_owner_replica_10_114_0_5,
    building_cadastre_replica_10_114_0_5,
    building_documents_replica_10_114_0_5,
    building_meetings_replica_10_114_0_5,
    building_negotiation_status_replica_10_114_0_5,
    building_stock_replica_10_114_0_5,
    event_by_building_replica_10_114_0_5,
    
    # Owner
    non_discarded_owners_replica_10_114_0_5,
    owner_contact_replica_10_114_0_5,
    owner_to_building_replica_10_114_0_5,
    
    # Users
    user_meetings_replica_10_114_0_5,
    user_scheduled_calls_replica_10_114_0_5,
    virtual_call_created_at_replica_10_114_0_5
)
```

