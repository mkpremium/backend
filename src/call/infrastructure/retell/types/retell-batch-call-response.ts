export interface RetellBatchCallResponse {
    batch_call_id: string;
    name: string;
    from_number: string;
    scheduled_timestamp: number;
    total_task_count: number;
    call_time_window: CallTimeWindow;
}

export interface CallTimeWindow {
    windows: Window[];
    timezone: string;
    day: string[];
}

export interface Window {
    start: number;
    end: number;
}
