export interface CallLogProps {
    duration?:string;
    summary?:string;
    toNumber?:string;
    transcript?:string;
    endReason?:string;
    recordingUrl?:string;
    callId?:string;
    interest?:string;
    tipoVivienda?:string;
    status?:string;
    ownerId?:string;
    cost?:string;
    fromNumber?:string;
    fromNumberNorm?: string;
    toNumberNorm?:string;
    name?:string;
    agentId?:string;
    metadata?: Metadata;
    provincia?:string;
    buildingId?:string;
    startTimestamp?: Date;
    callSuccessful?:boolean;
    vende?:boolean;
    resumen?:string;
    noLlamar?:boolean;
    rellamada?:boolean;
    contactId?:string;
    callQueueId?:string;
}

export interface Metadata {
    use?:string;
    city?:string;
    ownerId?:string;
    buildingId?:string;
    contactId?: string;
    callQueueId?: string
}

export interface UmindCallLog {
    duration?: string;
    to_number?: string;
    summary?: string;
    transcript?: string;
    end_reason?: string;
    recordings?: string;
    call_id: string;
    interest?: string;
    tipo_vivienda?: string;
    status?: string;
    client_id: string;
    cost?: string;
    from_number?: string;
    from_number_norm?: string;
    to_number_norm?: string;
    name?: string;
    agent_id?: string;
    metadata?: Metadata;
    provincia?: string;
}
