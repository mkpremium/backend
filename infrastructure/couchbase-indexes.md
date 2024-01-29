```
# General (document_type and id)
CREATE INDEX _documentType on mkpremium(`_documentType`)
    WITH {"defer_build": true};
CREATE INDEX _documentType_id on mkpremium(`_documentType`,`id`)
    WITH {"defer_build": true};
CREATE INDEX id on mkpremium (`id`)
    WITH {"defer_build": true};

# Worksheets
CREATE INDEX available_worksheets_by_province on mkpremium (`queueId`, `worksheetIndex`, ( `buildingAddress` . `province`))
    where (((((`_documentType` = "worksheet") and (`status` in ["LOOKING_MEETING", "OPEN"]))) and ((`buildingAddress`.`province`) is not missing)) and ((`buildingAddress`.`province`) is not null))
    WITH {"defer_build": true};
CREATE INDEX next_worksheet on mkpremium (`queueId`, `viewedAt`, ( `buildingAddress` . `province`))
    where ((((`_documentType` = "worksheet") and (`status` in ["OPEN", "LOOKING_MEETING"]))) and (`queueId` is null))
    WITH {"defer_build": true};
CREATE INDEX call_to_number ON mkpremium (phoneNumber)
    WHERE _documentType = 'virtual-agent-call'
    WITH {"defer_build": true};
CREATE INDEX event_by_worksheet on mkpremium (`_documentType`, ( `event` . `worksheetId`))
    where (`_documentType` = "scheduled-event")
    WITH {"defer_build": true};
CREATE INDEX virtual_caller_worksheet on mkpremium (`status`)
    where (`_documentType` = "virtual-call-worksheet")
    WITH {"defer_build": true};
CREATE INDEX worksheet_building on mkpremium ((`relatedBuildingIds`[0]),`id`)
    where (`_documentType` = "worksheet")
    WITH {"defer_build": true};
CREATE INDEX worksheet_queue_id on mkpremium (`_documentType`, `queueId`)
    where (`_documentType` = "worksheet")
    WITH {"defer_build": true};
CREATE INDEX worksheet_stats_by_province on mkpremium (`_documentType`, `status`, ( `buildingAddress` . `province`))
    where ((`_documentType` = "worksheet") and (`status` is not missing))
    WITH {"defer_build": true};
CREATE INDEX worksheet_to_assign on mkpremium ((`buildingAddress` . `province`),`status`,`_documentType`,`queueId`)
    where (((`_documentType` = "worksheet") and (`queueId` is null)) and ((`status` = "OPEN") or (`status` = "LOOKING_MEETING")))
    WITH {"defer_build": true};

# Buildings
CREATE INDEX building_by_assigned_agent on mkpremium (`assignedAgentId`)
    where (`_documentType` = "building")
    WITH {"defer_build": true};
CREATE INDEX building_by_owner on mkpremium (`_documentType`, `ownerId`) where ((`_documentType` = "building") and (`ownerId` is not null))
    WITH {"defer_build": true};
CREATE INDEX building_cadastre on mkpremium (`_documentType`, ( `cadastre` . `reference`)) where (`_documentType` = "building")
    WITH {"defer_build": true};
CREATE INDEX building_documents on mkpremium (`buildingId`) where (`_documentType` = "metadata")
    WITH {"defer_build": true};
CREATE INDEX building_meetings ON mkpremium(_documentType, event.buildingId)
    WHERE _documentType = "scheduled-event" AND type = 'MEETINGS'
    WITH {"defer_build": true};
CREATE INDEX building_negotiation_status on mkpremium (`negotiationStatus`, `id`) where (`_documentType` = "building")
    WITH {"defer_build": true};
CREATE INDEX building_stock on mkpremium (`_documentType`, `buildingId`) where (`_documentType` = "stock")
    WITH {"defer_build": true};
CREATE INDEX event_by_building on mkpremium (`_documentType`, ( `event` . `buildingId`))
    where (`_documentType` = "scheduled-event")
    WITH {"defer_build": true};


# Owner
CREATE INDEX non_discarded_owners
    ON mkpremium(buildingId)
    WHERE _documentType = 'owner'
        AND status NOT IN ["ERRONEO", "WITHOUT_CONTACT"]
    WITH {"defer_build": true};
CREATE INDEX owner_contact on mkpremium ((distinct (array (`c` . `value`) for `c` within (`person` . `contacts`)
                                          end))) where (`_documentType` = "owner")
    WITH {"defer_build": true};
CREATE INDEX owner_to_building on mkpremium (`_documentType`, `buildingId`) where (`_documentType` = "owner")
    WITH {"defer_build": true};

# Users
CREATE INDEX user_meetings ON mkpremium (notifyTo)
    WHERE _documentType = 'scheduled-event'
    AND type = 'MEETINGS' WITH {"defer_build": true};
CREATE INDEX user_scheduled_calls on mkpremium (`notifyTo`)
    where ((`_documentType` = "scheduled-event") and (`type` = "CALLS"))
    WITH {"defer_build": true};
CREATE INDEX virtual_call_created_at on mkpremium (`createdAt`)
    where (`_documentType` = "virtual-agent-call")
    WITH {"defer_build": true};



BUILD INDEX ON mkpremium(
    # General (document_type and id)
    _documentType,
    _documentType_id,
    id,
    
    # Worksheets
    available_worksheets_by_province,
    next_worksheet,
    call_to_number,
    event_by_worksheet,
    virtual_caller_worksheet,
    worksheet_building,
    worksheet_queue_id,
    worksheet_stats_by_province,
    worksheet_to_assign,
    
    # Buildings
    building_by_assigned_agent,
    building_by_owner,
    building_cadastre,
    building_documents,
    building_meetings,
    building_negotiation_status,
    building_stock,
    event_by_building,
    
    # Owner
    non_discarded_owners,
    owner_contact,
    owner_to_building,
    
    # Users
    user_meetings,
    user_scheduled_calls,
    virtual_call_created_at
)
```

