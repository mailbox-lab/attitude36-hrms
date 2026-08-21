/**
 * Export an array of objects to a CSV file with proper escaping and BOM for Excel compatibility.
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const escapeCell = (value: unknown): string => {
    const str = value === null || value === undefined ? '' : String(value)
    // If the value contains commas, quotes, or newlines, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvRows: string[] = []
  // Header row
  csvRows.push(headers.map(escapeCell).join(','))
  // Data rows
  for (const row of data) {
    const values = headers.map((h) => escapeCell(row[h]))
    csvRows.push(values.join(','))
  }

  const csvString = csvRows.join('\r\n')
  // BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvString], { type: 'text/csv;charset=utf-8;' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
