export interface Task {
    to_number: string,
    metadata: Metadata,
    retell_llm_dynamic_variables: DynamicVariables
}

export type DynamicVariables = Record<string, unknown>;
export type Metadata = Record<string, unknown>;
