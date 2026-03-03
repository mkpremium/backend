export interface CityCallRequest {
    city?: string;
    limit?: number;
    timeWindow?: TimeWindow;
    days?: string;
}

export interface CityCallResponse {
    city:string;
    status: 'ok' | 'error';
    message:string;
}

export interface TimeWindow{
    startHour: string;
    endHour: string;
}
