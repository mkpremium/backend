import _ from 'lodash'
import moment from 'moment'

/**
 * @property {UserRepository} usersRepository
 */
export class UserBlockedAvailabilityService {
  constructor ({ usersRepository }) {
    this.usersRepository = usersRepository
  }

  blockedAvailabilityForUser (userId) {
    return this.usersRepository.get(userId)
      .then(({ restringedHours }) => {
        return _.flatMap(
          (Object.keys(restringedHours || {})).map(day => restringedHours[day].map(({ start, end }) => ({
            startsAt: moment(`${day}T${start}`),
            endsAt: moment(`${day}T${end}`)
          }))))
      })
  }
}
