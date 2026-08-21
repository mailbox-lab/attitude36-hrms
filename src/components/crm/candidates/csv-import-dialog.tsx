'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import { EnhancedDialogHeader } from '@/components/crm/enhanced-dialog-header'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'

// ===== Types =====

type Step = 'upload' | 'preview' | 'result'

type ValidationError = { row: number; field: string; message: string }
type Warning = { row: number; message: string }

type ImportResponse = {
  success: boolean
  imported: number
  errors: ValidationError[]
  warnings: Warning[]
}

// ===== CSV Parsing (client-side) =====

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

const DISPLAY_COLUMNS = [
  'name',
  'email',
  'phone',
  'title',
  'company',
  'experience',
  'currentCtc',
  'expectedCtc',
  'noticePeriod',
  'source',
  'status',
  'skills',
  'notes',
]

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

function parseCSVText(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) {
    return { headers: [] as string[], mappedHeaders: [] as string[], rows: [] as string[][], colIndices: new Map<string, number>() }
  }

  const rawHeaders = parseCSVLine(lines[0]).map((h) => h.toLowerCase())

  const mappedHeaders: string[] = []
  const colIndices: Map<string, number> = new Map()

  rawHeaders.forEach((h, i) => {
    const field = HEADER_MAP[h]
    if (field) {
      mappedHeaders.push(field)
      colIndices.set(field, i)
    }
  })

  const rows = lines.slice(1).map((l) => parseCSVLine(l))

  return { headers: rawHeaders, mappedHeaders, rows, colIndices }
}

const VALID_STATUSES = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On-Hold']

function validateRow(values: Record<string, string>, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = []

  const name = values.name
  if (!name || name.length < 2) {
    errors.push({
      row: rowNumber,
      field: 'name',
      message: !name ? 'Name is required' : 'Name must be at least 2 characters',
    })
  }

  const email = values.email
  if (!email) {
    errors.push({ row: rowNumber, field: 'email', message: 'Email is required' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ row: rowNumber, field: 'email', message: 'Invalid email format' })
  }

  const phone = values.phone
  if (phone && !/^\d+$/.test(phone.replace(/[\s\-+()]/g, ''))) {
    errors.push({ row: rowNumber, field: 'phone', message: 'Phone must be numeric' })
  }

  const experience = values.experience
  if (experience && (isNaN(Number(experience)) || Number(experience) < 0)) {
    errors.push({
      row: rowNumber,
      field: 'experience',
      message: 'Experience must be a positive number',
    })
  }

  const currentCtc = values.currentCtc
  if (currentCtc && (isNaN(Number(currentCtc)) || Number(currentCtc) < 0)) {
    errors.push({
      row: rowNumber,
      field: 'currentCtc',
      message: 'Current CTC must be a positive number',
    })
  }

  const expectedCtc = values.expectedCtc
  if (expectedCtc && (isNaN(Number(expectedCtc)) || Number(expectedCtc) < 0)) {
    errors.push({
      row: rowNumber,
      field: 'expectedCtc',
      message: 'Expected CTC must be a positive number',
    })
  }

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ===== Animation Variants =====

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

// ===== Component =====

export function CsvImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<{
    mappedHeaders: string[]
    rows: string[][]
    colIndices: Map<string, number>
    errors: ValidationError[]
    validCount: number
  } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [warningsExpanded, setWarningsExpanded] = useState(false)

  const importMutation = useMutation<ImportResponse, Error, FormData>({
    mutationFn: async (formData) => {
      const res = await fetch('/api/candidates/import', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Import failed')
      }
      return res.json()
    },
    onSuccess: (data) => {
      setStep('result')
      if (data.imported > 0) {
        queryClient.invalidateQueries({ queryKey: ['candidates'] })
      }
    },
    onError: () => {
      setStep('upload')
    },
  })

  const handleFile = useCallback(
    (selectedFile: File) => {
      setFile(selectedFile)
      setParsedData(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const { mappedHeaders, rows, colIndices } = parseCSVText(text)

        const errors: ValidationError[] = []
        let validCount = 0

        for (let i = 0; i < rows.length; i++) {
          const rowNumber = i + 2
          const values: Record<string, string> = {}
          colIndices.forEach((colIdx, field) => {
            values[field] = rows[i][colIdx] || ''
          })

          const rowErrors = validateRow(values, rowNumber)
          if (rowErrors.length > 0) {
            errors.push(...rowErrors)
          } else {
            validCount++
          }
        }

        setParsedData({ mappedHeaders, rows, colIndices, errors, validCount })
      }
      reader.readAsText(selectedFile)
    },
    []
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && droppedFile.name.endsWith('.csv')) {
        handleFile(droppedFile)
      }
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) handleFile(selectedFile)
  }

  function handlePreview() {
    setStep('preview')
  }

  function handleBack() {
    setStep('upload')
    setParsedData(null)
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleImport() {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    importMutation.mutate(formData)
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setStep('upload')
      setFile(null)
      setParsedData(null)
      setWarningsExpanded(false)
      importMutation.reset()
      if (fileInputRef.current) fileInputRef.current.value = ''
    }, 200)
  }

  // Build error lookup for preview table
  const errorMap = useMemo(() => {
    const map = new Map<string, string>()
    if (parsedData) {
      for (const err of parsedData.errors) {
        map.set(`${err.row}-${err.field}`, err.message)
      }
    }
    return map
  }, [parsedData])

  // Columns to display in preview (only those present in the CSV)
  const displayCols = parsedData
    ? parsedData.mappedHeaders.filter((h) => DISPLAY_COLUMNS.includes(h))
    : []

  const hasErrors = parsedData ? parsedData.errors.length > 0 : false
  const canImport = parsedData && !hasErrors && parsedData.validCount > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <EnhancedDialogHeader
          icon={Upload}
          title="Import Candidates"
          subtitle="Upload a CSV file to add candidates in bulk"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />

        <div className="relative flex-1 overflow-y-auto -mx-6 px-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Upload */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Mutation error display */}
                {importMutation.isError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {importMutation.error.message}
                    </p>
                  </div>
                )}

                {/* Drop Zone */}
                <div
                  className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors ${
                    isDragOver
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-muted-foreground/25 hover:border-emerald-400 hover:bg-muted/50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
                  }}
                  aria-label="Upload CSV file"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drag & drop your CSV file here
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>

                {/* File Info */}
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-lg border bg-emerald-50 p-3 dark:bg-emerald-950/30"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Expected Columns Info */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Expected columns:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    name, email, phone, title, company, experience, currentCtc, expectedCtc, noticePeriod, source, status, skills, notes
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Preview */}
            {step === 'preview' && parsedData && (
              <motion.div
                key="preview"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Summary */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    {parsedData.validCount} valid row{parsedData.validCount !== 1 ? 's' : ''}
                  </span>
                  {hasErrors && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      {parsedData.errors.length} error{parsedData.errors.length !== 1 ? 's' : ''} found
                    </span>
                  )}
                </div>

                {/* Preview Table */}
                <div className="max-h-64 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        {displayCols.map((col) => (
                          <TableHead
                            key={col}
                            className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider"
                          >
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.rows.slice(0, 10).map((row, rowIdx) => {
                        const rowNumber = rowIdx + 2
                        const hasRowError = parsedData.errors.some(
                          (e) => e.row === rowNumber
                        )

                        return (
                          <TableRow
                            key={rowIdx}
                            className={`${hasRowError ? 'bg-red-50 dark:bg-red-950/20' : rowIdx % 2 === 1 ? 'bg-muted/30' : ''}`}
                          >
                            {displayCols.map((col) => {
                              const colIdx = parsedData.colIndices.get(col)
                              const cellValue = colIdx !== undefined ? (row[colIdx] || '') : ''
                              const errorKey = `${rowNumber}-${col}`
                              const cellError = errorMap.get(errorKey)
                              const isInvalid = !!cellError

                              return (
                                <TableCell
                                  key={col}
                                  className={`whitespace-nowrap text-xs ${isInvalid ? 'border-b-2 border-b-red-500 pb-1' : ''}`}
                                >
                                  <span className={isInvalid ? 'text-red-600 dark:text-red-400' : ''}>
                                    {cellValue}
                                  </span>
                                  {cellError && (
                                    <p className="mt-0.5 text-[10px] leading-tight text-red-500">
                                      {cellError}
                                    </p>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {parsedData.rows.length > 10 && (
                  <p className="text-xs text-muted-foreground">
                    Showing first 10 of {parsedData.rows.length} rows
                  </p>
                )}

                {/* Validation errors detail */}
                {hasErrors && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">
                      Please fix the errors in your CSV file and re-upload.
                    </p>
                    <ul className="mt-1.5 max-h-24 space-y-0.5 overflow-y-auto text-xs text-red-600 dark:text-red-400">
                      {parsedData.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>
                          Row {err.row} ({err.field}): {err.message}
                        </li>
                      ))}
                      {parsedData.errors.length > 10 && (
                        <li>...and {parsedData.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Result */}
            {step === 'result' && importMutation.data && (
              <motion.div
                key="result"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Success */}
                <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                  <CheckCircle className="h-12 w-12 text-emerald-500" />
                  <div>
                    <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                      Successfully imported {importMutation.data.imported} candidate{importMutation.data.imported !== 1 ? 's' : ''}
                    </p>
                    {importMutation.data.imported === 0 && importMutation.data.warnings.length === 0 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        No new candidates were imported.
                      </p>
                    )}
                  </div>
                </div>

                {/* Warnings */}
                {importMutation.data.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                    <button
                      className="flex w-full items-center gap-2 p-3 text-left"
                      onClick={() => setWarningsExpanded(!warningsExpanded)}
                      aria-expanded={warningsExpanded}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className="flex-1 text-sm font-medium text-amber-700 dark:text-amber-300">
                        {importMutation.data.warnings.length} row{importMutation.data.warnings.length !== 1 ? 's' : ''} were skipped
                      </span>
                      {warningsExpanded ? (
                        <ChevronUp className="h-4 w-4 text-amber-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-amber-500" />
                      )}
                    </button>
                    <AnimatePresence>
                      {warningsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <ul className="max-h-40 space-y-1 overflow-y-auto border-t border-amber-200 p-3 dark:border-amber-900">
                            {importMutation.data.warnings.map((w, i) => (
                              <li key={i} className="text-xs text-amber-600 dark:text-amber-400">
                                Row {w.row}: {w.message}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Server-side errors */}
                {importMutation.data.errors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">
                      {importMutation.data.errors.length} validation error{importMutation.data.errors.length !== 1 ? 's' : ''} encountered
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading overlay */}
          {importMutation.isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-sm text-muted-foreground">Importing candidates...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter>
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!file || !parsedData}
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Preview Data
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleBack} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              {hasErrors ? (
                <Button variant="outline" onClick={handleBack} className="gap-1.5">
                  Fix errors in CSV and re-upload
                </Button>
              ) : (
                <Button
                  onClick={handleImport}
                  disabled={!canImport || importMutation.isPending}
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {importMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Import {parsedData?.validCount} Candidate{parsedData && parsedData.validCount !== 1 ? 's' : ''}
                </Button>
              )}
            </>
          )}

          {step === 'result' && (
            <Button onClick={handleClose} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
