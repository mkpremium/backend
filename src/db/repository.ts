export interface Repository<T> {
  get (id: string): Promise<T>

  save (data: T): Promise<T>
}
