## App services

### CallcenterService
- [] this.apiClient.post(`caller/next-worksheet`)
- [] this.apiClient.post(`caller/assigned-queue/${ ids.worksheetId }`)
- [] this.apiClient.post('owners/search', { phoneNumber });
- [] this.apiClient.post(`buildings/${ cmd.buildingId }/owners`, {
  verified: true,
  buildingId: cmd.buildingId,
  status: 'VERIFICADO',
  type: 'NINGUNO',
  note: 'Creado desde el callcenter',
  person: {
  name: fullName,
  firstName: cmd.firstName,
  firstSurname: cmd.firstSurname,
  secondSurname: cmd.secondSurname,
  contacts
  }
  })
- [] this.apiClient.put(`owners/${ cmd.owner.id }`, {
  verified: true,
  featuredContact: {
  phoneId: phoneContact.id,
  emailId: cmd.owner.emailId
  },
  person: {
  name: fullName,
  firstName: cmd.firstName,
  firstSurname: cmd.firstSurname,
  secondSurname: cmd.secondSurname,
  contacts
  }
  })
- [ ] this.apiClient.post(`building/${ cmd.buildingId }/offer-requests`, {
  flipperId,
  ownerId: cmd.ownerId,
  destinationContactId: cmd.contactId,
  reporterContactId: cmd.reporterContactId,
  worksheetId: cmd.worksheetId,
  note: cmd.note,
  })
- [ ] this.apiClient.post('email', message)
- [ ] this.apiClient.put(`owners/${ ownerId }/contacts/${ contactId }/status`, { status })
- [ ] this.apiClient
  .post(`worksheets/status-changed?${ worksheetIds.map(id => `worksheetId=${ id }`).join('&') }`)



### ScheduledCallsService

- [ ] this.apiClient.delete(`scheduled-events/${ id }`)
- [ ] this.apiClient.get('scheduled-events/calls')
- [ ] this.apiClient.put(`scheduled-events/${ scheduledCallId }`, {
  eventDate: at.toISOString(),
  note
  })
- [ ] this.apiClient.post('scheduled-events/call', {
  createdBy: this.authService.userId(),
  notifyTo: this.authService.userId(),
  event: req,
  eventDate: at.toISOString(),
  note: req.note,
  })


### BlockedAvailabilityService

- [ ] this.apiClientService.get(`flipper/${ flipperId }/blocked-availability?seed=${ Math.random() }`)
- [ ] this.apiClientService.post('scheduled-events/meeting', createMeetingRequest)


### OwnersService

- [ ] ```this.apiClientService.get(`buildings/${ buildingId }/owners`)```
- [ ] ```this.apiClientService.get(`buildings/${ buildingId }/verified-owners`)```
- [ ] ```this.apiClientService.get(`owners/${ ownerId }`)```
- [ ] ```this.apiClientService.put(`owners/${ ownerId }/featured-contact`, featuredContact);```
- [ ] ```this.apiClientService.post(`buildings/${ buildingId }/owners`, body)```
- [ ] ```this.apiClientService.post(`owners/${ ownerId }/contacts`, { ownerId, isFeatured, status: 'GOOD', ...contact })```

### DocumentsService

- [ ] this.apiClientService.post(`buildings/${buildingId}/documents-signed-urls`, {})

### FavoritesService

- [ ] ```this.apiClientService.post('favorites', { buildingId })```
- [ ] ```this.apiClientService.delete(`favorites/${buildingId}`)```

### MeetingsService

- [ ] ```this.apiClient.post('scheduled-events/meeting', createMeetingRequest)```
- [ ] ```this.apiClient
            .put(`scheduled-events/${ ids.meetingId }`, {
                event: {
                    contactId: ids.contactId,
                    ownerId: ids.ownerId,
                    buildingId: ids.buildingId,
                    eventAddress,
                    inPerson,
                },
                eventDate,
            })```
- [ ] ```this.apiClient.delete(`scheduled-events/${ meetingId }`)```
- [ ] ```this.apiClient.get('me/meetings')```

### NotesService

- [ ] ```this.apiClientService.get(`notes?context={"buildingId":"${ buildingId }"}`)```
- [ ] ```this.apiClientService.post('notes', {
                    note,
                    context: { buildingId }
                })```
  

### StockService

- [ ] ```this.apiClientService.get(`property-manager/${ agentId }/stock-performance?year=${ year }`)```
- [ ] ```this.apiClientService.post(`stock/sell/cancel`, { buildingId: building.id })```
- [ ] ```this.apiClientService.put(`buildings/${ buildingId }/sale-price`, { salePrice });``` 
- [ ] ```this.apiClientService.post(`stock/close`, { buildingId: building.id })```
- [ ] ```this.apiClientService.post(`stock/purchase`, StockService.serialiseStockTransaction(purchase, buildingId))```
- [ ] ```this.apiClientService.put(`stock/purchase`, StockService.serialiseStockTransaction(purchase, buildingId))```
- [ ] ```this.apiClientService.post(`stock/sell`, StockService.serialiseStockTransaction(sell, buildingId))```
- [ ] ```this.apiClientService.put(`stock/sell`, StockService.serialiseStockTransaction(sell, buildingId))```


### BuildingService

- [ ] ```this.apiClient.put(`buildings/${ building.id }/negotiation-status`, { status, sourceOwnerId: building.ownerId })```
- [ ] ```this.apiClient.post(`buildings/${ buildingId }/set-featured-owner`, { ownerId })```
- [ ] ```this.apiClient.get(`buildings?id=${ buildingId }`)```
- [ ] ```this.apiClient.get(`buildings?allAssignedToMe=true`)```

### ProposalsService

- [ ] ```this.apiClientService.get(`buildings/${ buildingId }/proposals`)```
- [ ] ```this.apiClientService.put(`buildings/${ buildingId }/negotiation/${ proposalID }`, {
  ownerId,
  state: 'enviada',
  proposal: Number(proposal),
  aspiration: Number(aspiration)
  })```
- [ ] ```this.apiClientService.post(
                `building/${ cmd.building.id }/proposals`,
                {
                    ownerId: cmd.ownerId,
                    contactId: cmd.contactId,
                    amount: parseInt(cmd.amount, 10),
                    message: cmd.message,
                }
            )```
- [ ] ```this.apiClientService
            .post(`buildings/${ building.id }/negotiation`, {
                ownerId,
                state: 'pendiente',
                proposal: proposalAmount,
                aspiration: -1
            })```
