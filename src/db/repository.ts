import { DeepPartial } from 'typeorm'

export interface Repository<T> {
  get (id: string): Promise<T>

  save (data: DeepPartial<T>): Promise<T>
}
