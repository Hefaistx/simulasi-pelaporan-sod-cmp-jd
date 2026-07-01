export function generateReportCode(propertyCode: string, count: number): string {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yy = String(now.getFullYear()).slice(2)
  const seq = String(count + 1).padStart(3, '0')
  return `${propertyCode}/SOD/${dd}/${mm}/${seq}`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  const day = d.getDate()
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mn = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year} jam ${hh}.${mn}`
}
