import { WorksheetBuildingAddressProps } from '../../worksheet/repository/worksheet.repository'

export type FullAddress = Pick<WorksheetBuildingAddressProps, 'type' | 'street' | 'number' | 'city'>
