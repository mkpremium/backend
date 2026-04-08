export interface TaskCall {
    toNumber:string;
    variables: CallVariables;
    metadata: CallMetadata;
}

export interface CallVariables {
  name: string;
  lastName: string;
  address: string;
}

export interface CallMetadata {
  buildingId: string;
  ownerId: string;
  contactId: string;
  city: string;
  use: string;
  callQueueId: string;
  address: string;
}
