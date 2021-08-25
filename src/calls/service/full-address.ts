import { WorksheetBuildingAddressProps } from '../../worksheet/repository/worksheet.repository'

export type FullAddress = Pick<WorksheetBuildingAddressProps, 'street' | 'number' | 'city'>
