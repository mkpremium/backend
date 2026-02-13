import uuid from 'uuid/v4'
export interface ContactDTO {
    phoneNumber: string,
    name: string,
    lastName: string,
    address: string,
    buildingId: uuid,
    ownerId:uuid,
    city: string,
    use: string
}
