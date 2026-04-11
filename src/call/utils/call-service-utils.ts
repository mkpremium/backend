enum Days{
  LUNES = 1,
  DOMINGO = 7
}

export const isValidDay = (day:number, days: string):boolean => {
  if (!isValidRangeFormat(days)) throw new Error('Formato de los dias incorrecto')
  const normalizedDay = (day === 0) ? 7 : day
  const [startDay, endDay] = days.split('-').map(Number)
  if (normalizedDay >= startDay && normalizedDay <= endDay) return true
  return false
}

export const timeToMinutes = (time:string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours! * 60 + minutes!
}

export const formatMiliseconds = (ms: number):string => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const normalizePhoneNumber = (phone: string|undefined): string | undefined => {
  if (!phone) return undefined
  if (phone.startsWith('+351')) return phone.slice(4)
  return phone.slice(3)
}

const isValidRangeFormat = (days: string): boolean => {
  const match = days.match(/^([1-7])-([1-7])$/)
  if (!match) return false

  const start = Number(match[1])
  const end = Number(match[2])

  return start >= Days.LUNES && start < end && end <= Days.DOMINGO
}
