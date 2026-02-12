export interface Task {
    to_number: string,
    retell_llm_dynamic_variables: DynamicVariables
}

export type DynamicVariables = Record<string, unknown>;
