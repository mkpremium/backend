import { BuildingAddressProps, BuildingProps } from '../building'
import { ContactProps } from '../../owner/owner'

interface StockTransaction {
  reservationAmount: number
  reservationDate: Date | string
  transactionAmount: number
  transactionDate: Date | string
}

export interface BuildingReadModel extends Omit<BuildingProps, 'address' | 'metadata'> {
  readonly address: Omit<BuildingAddressProps, 'fullAddress' | 'postalCode'> & {
    postalCode: { number: string }
  }
  readonly cadastreReference?: string
  readonly geolocation?: {
    latitude?: number
    longitude?: number
  }
  readonly metadata: {
    id: string
    mimeType: string
    // TODO: decide on the one to send.
    thumbnailUrl: string
    previewUrl: string
  }[]
  readonly stock: {
    purchase: StockTransaction
    sell: StockTransaction
    close: {
      transactionDate: Date | string
      gain: number
    }
  }
  readonly owner?: {
    id: string
    firstName: string
    name: string
    contacts: ContactProps[],
    featuredContact?: {
      phoneId?: string;
      emailId?: string;
    }
  }
  readonly latestProposal?: {
    amount: number
    createdAt: Date | string
    notificationStatus?: 'PENDING' | 'SENT'
    notificationSentAt?: Date | string
  }
  readonly usage?: string
  readonly lastMeeting?: {
    dateMeeting: Date | string
    inPerson: boolean
  }
  readonly salePrice?: number
  readonly totalExpensesAmount?: number
}

export interface BuildingsReadRepository {
  listProposalsForBuilding (buildingId): Promise<unknown[]>
}
