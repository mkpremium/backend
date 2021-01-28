/**
 * @property {UserRepository} usersRepository
 */
export class SetFlipperMaxLineService {
  constructor ({ usersRepository }) {
    this.usersRepository = usersRepository
  }

  async setFlipperMaxLine (flipperId, maxLine) {
    const flipper = await this.usersRepository.get(flipperId)
    const updatedFlipper = flipper.withMaxLine(maxLine)

    return this.usersRepository.save(updatedFlipper)
  }
}
