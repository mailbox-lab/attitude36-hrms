import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ===== Constants =====

const VALID_STATUSES = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On-Hold']

// Case-insensitive header mapping: CSV header → internal field name
const HEADER_MAP: Record<string, string> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  title: 'title',
  company: 'company',
  experience: 'experience',
  currentctc: 'currentCtc',
  current_ctc: 'currentCtc',
  expectedctc: 'expectedCtc',
  expected_ctc: 'expectedCtc',
  noticeperiod: 'noticePeriod',
  notice_period: 'noticePeriod',
  source: 'source',
  status: 'status',
  skills: 'skills',
  notes: 'notes',
}

// ===== CSV Parsing =====

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current.trim())
  return fields
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) {
    return { headers: [], rows: [] }
  }
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase())
  const rows = lines.slice(1).map((l) => parseCSVLine(l))
  return { headers, rows }
}

function mapHeaders(csvHeaders: string[]): Map<number, string> {
  const mapping = new Map<number, string>()
  csvHeaders.forEach((h, i) => {
    const field = HEADER_MAP[h]
    if (field) mapping.set(i, field)
  })
  return mapping
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
  }
  return { firstName: parts[0] || '', lastName: '' }
}

// ===== Validation =====

type ValidationError = { row: number; field: string; message: string }

type ParsedCandidate = {
  rowNumber: number
  firstName: string
  lastName: string
  email: string
  phone: string | null
  title: string | null
  currentCompany: string | null
  experience: number | null
  currentCTC: number | null
  expectedCTC: number | null
  noticePeriod: number | null
  source: string
  status: string
  skills: string
  notes: string | null
}

function extractValues(
  row: string[],
  headerMap: Map<number, string>
): Record<string, string> {
  const values: Record<string, string> = {}
  headerMap.forEach((field, colIndex) => {
    values[field] = row[colIndex] || ''
  })
  return values
}

function validateRow(
  values: Record<string, string>,
  rowNumber: number
): ValidationError[] {
  const errors: ValidationError[] = []

  // name is required (min 2 chars)
  const name = values.name
  if (!name || name.length < 2) {
    errors.push({
      row: rowNumber,
      field: 'name',
      message: !name ? 'Name is required' : 'Name must be at least 2 characters',
    })
  }

  // email is required and valid
  const email = values.email
  if (!email) {
    errors.push({ row: rowNumber, field: 'email', message: 'Email is required' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ row: rowNumber, field: 'email', message: 'Invalid email format' })
  }

  // phone is optional but must be numeric if provided
  const phone = values.phone
  if (phone && !/^\d+$/.test(phone.replace(/[\s\-+()]/g, ''))) {
    errors.push({ row: rowNumber, field: 'phone', message: 'Phone must be numeric' })
  }

  // experience must be positive number if provided
  const experience = values.experience
  if (experience && (isNaN(Number(experience)) || Number(experience) < 0)) {
    errors.push({
      row: rowNumber,
      field: 'experience',
      message: 'Experience must be a positive number',
    })
  }

  // currentCtc must be positive number if provided
  const currentCtc = values.currentCtc
  if (currentCtc && (isNaN(Number(currentCtc)) || Number(currentCtc) < 0)) {
    errors.push({
      row: rowNumber,
      field: 'currentCtc',
      message: 'Current CTC must be a positive number',
    })
  }

  // expectedCtc must be positive number if provided
  const expectedCtc = values.expectedCtc
  if (expectedCtc && (isNaN(Number(expectedCtc)) || Number(expectedCtc) < 0)) {
    errors.push({
      row: rowNumber,
      field: 'expectedCtc',
      message: 'Expected CTC must be a positive number',
    })
  }

  // status must be valid if provided
  const status = values.status
  if (status && !VALID_STATUSES.includes(status)) {
    errors.push({
      row: rowNumber,
      field: 'status',
      message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
    })
  }

  return errors
}

// ===== POST Handler =====

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are accepted' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const { headers, rows } = parseCSV(text)

    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or has no data rows' },
        { status: 400 }
      )
    }

    const headerMap = mapHeaders(headers)
    const allErrors: ValidationError[] = []
    const warnings: { row: number; message: string }[] = []
    const validCandidates: ParsedCandidate[] = []

    // First pass: validate all rows
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2 // +2: 1-indexed, skip header row
      const values = extractValues(rows[i], headerMap)
      const rowErrors = validateRow(values, rowNumber)

      if (rowErrors.length > 0) {
        allErrors.push(...rowErrors)
        continue
      }

      const { firstName, lastName } = splitName(values.name)
      validCandidates.push({
        rowNumber,
        firstName,
        lastName,
        email: values.email!,
        phone: values.phone || null,
        title: values.title || null,
        currentCompany: values.company || null,
        experience: values.experience ? parseFloat(values.experience) : null,
        currentCTC: values.currentCtc ? parseFloat(values.currentCtc) : null,
        expectedCTC: values.expectedCtc ? parseFloat(values.expectedCtc) : null,
        noticePeriod: values.noticePeriod ? parseInt(values.noticePeriod, 10) : null,
        source: values.source || 'Direct',
        status: values.status || 'New',
        skills: values.skills || '',
        notes: values.notes || null,
      })
    }

    // Check for duplicate emails within the CSV
    const seenEmails = new Set<string>()
    const uniqueCandidates: ParsedCandidate[] = []

    for (const candidate of validCandidates) {
      const lower = candidate.email.toLowerCase()
      if (seenEmails.has(lower)) {
        warnings.push({
          row: candidate.rowNumber,
          message: `Duplicate email "${candidate.email}" within CSV — row skipped`,
        })
      } else {
        seenEmails.add(lower)
        uniqueCandidates.push(candidate)
      }
    }

    // Check for duplicate emails in the database
    const existingCandidates = await db.candidate.findMany({
      where: { email: { in: Array.from(seenEmails), not: null } },
      select: { email: true },
    })

    const existingEmails = new Set(
      existingCandidates.map((c) => c.email!.toLowerCase())
    )

    const toInsert: Omit<ParsedCandidate, 'rowNumber'>[] = []
    for (const candidate of uniqueCandidates) {
      if (existingEmails.has(candidate.email.toLowerCase())) {
        warnings.push({
          row: candidate.rowNumber,
          message: `Email "${candidate.email}" already exists — row skipped`,
        })
      } else {
        toInsert.push(candidate)
      }
    }

    // Bulk insert
    let imported = 0
    if (toInsert.length > 0) {
      const result = await db.candidate.createMany({
        data: toInsert,
        skipDuplicates: true,
      })
      imported = result.count
    }

    return NextResponse.json({
      success: true,
      imported,
      errors: allErrors,
      warnings,
    })
  } catch (error) {
    console.error('Error importing candidates:', error)
    return NextResponse.json(
      { error: 'Failed to import candidates' },
      { status: 500 }
    )
  }
}
