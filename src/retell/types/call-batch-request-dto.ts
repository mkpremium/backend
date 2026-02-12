export interface CityCallRequest {
    city: string;
    limit: number;
    startHour: string;
    endHour: string;
    days: string;
}

export interface CityCallResponse {
    city:string;
    status: 'ok' | 'error';
    info:string;
}
