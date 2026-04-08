export const isValidDay = (day:number, days: string):boolean => {
  if (days === '1-5') return day >= 1 && day <= 6
  return days.split(',').map(Number).includes(day)
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
