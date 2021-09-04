export interface BuildingOwnerPhone {
  id: string
  updatedAt: Date
  createdAt: Date
  phoneNumber: string

  lastSmsSentAt?: Date
  lastSmsSentId?: string
}
