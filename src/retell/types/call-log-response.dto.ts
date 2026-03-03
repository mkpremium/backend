export interface CallLogResponse {
    event: string;
    call: Call;
}

export interface Call {
    call_type?: string;
    from_number?: string;
    to_number?: string;
    call_analysis?: CallAnalysis;
    retell_llm_dynamic_variables: DynamicVariables;
    transcript?: string;
    disconnection_reason?: string;
    recording_url?: string;
    call_id?: string;
    call_status?: string;
    call_cost?: CallCost;
    start_timestamp?: number;
    end_timestamp?: number;
    duration_ms?: number;
    agent_id?: string;
    agent_name?: string;
    metadata?: Metadata;
}

export interface CallAnalysis {
    call_summary?: string;
    in_voicemail?: boolean;
    user_sentiment?: string;
    call_successful?: boolean;
    custom_analysis_data?: Data;
}

export type Metadata = Record<string, unknown>;
export type Data = Record<string, unknown>;
export type DynamicVariables = Record<string, unknown>;

export interface CallCost {
    product_costs?: ProductCost[];
    total_duration_seconds?: number;
    total_duration_unit_price?: number;
    combined_cost?: number;
}

export interface ProductCost {
    product?: string;
    cost?: number;
    unit_price?: number;
    is_transfer_leg_cost?: boolean;
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
