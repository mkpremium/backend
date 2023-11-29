import { BuildingProps } from '../building/building'

export interface Repository {
  get (id: string): Promise<BuildingProps>

  save (data: any): Promise<any>
}
