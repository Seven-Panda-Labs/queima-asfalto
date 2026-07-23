import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImportPreview } from '../../components/ImportPreview'
import { ImportReport } from '../../components/ImportReport'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import type { ParsedGoal } from '../../services/excelGoalParser'
import { parseImportWorkbook } from '../../services/excelImport'
import type { ParsedBucketListRow } from '../../services/excelBucketListParser'
import type { ParsedRow, SkippedRow } from '../../services/excelParser'
import { importData, type ImportResult } from '../../services/import'

type ImportStep = 'idle' | 'parsing' | 'preview' | 'importing' | 'done' | 'error'

type ImportSectionProps = {
  embedded?: boolean
}

export function ImportSection({ embedded = false }: ImportSectionProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<ImportStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<ParsedRow[]>([])
  const [goals, setGoals] = useState<ParsedGoal[]>([])
  const [bucketListItems, setBucketListItems] = useState<ParsedBucketListRow[]>([])
  const [skipped, setSkipped] = useState<SkippedRow[]>([])
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  function reset() {
    setStep('idle')
    setError(null)
    setEvents([])
    setGoals([])
    setBucketListItems([])
    setSkipped([])
    setSkipDuplicates(true)
    setReplaceExisting(false)
    setImportResult(null)
    setFileName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleFileSelected(file: File | null) {
    if (!file) return

    const extension = file.name.toLowerCase()
    if (!extension.endsWith('.xlsx') && !extension.endsWith('.xls')) {
      setError(t('import.invalidExtension'))
      setStep('error')
      return
    }

    setFileName(file.name)
    setStep('parsing')
    setError(null)

    try {
      const buffer = await file.arrayBuffer()
      const { parsed, goals: parsedGoals, bucketList: parsedBucketList } =
        await parseImportWorkbook(buffer)

      setEvents(parsed.events)
      setGoals(parsedGoals)
      setBucketListItems(parsedBucketList.items)
      setSkipped(parsed.skipped)
      setStep(parsed.events.length === 0 && parsedBucketList.items.length === 0 ? 'error' : 'preview')

      if (parsed.events.length === 0 && parsedBucketList.items.length === 0) {
        setError(t('import.noValidEvents'))
      }
    } catch {
      setError(t('import.readError'))
      setStep('error')
    }
  }

  async function handleConfirmImport() {
    if (!user) return

    setStep('importing')
    try {
      const result = await importData(
        user.uid,
        events.map((row) => row.event),
        goals.map((item) => item.goal),
        bucketListItems.map((row) => row.item),
        { skipDuplicates, replaceExisting },
      )
      setImportResult(result)
      setStep('done')
      toast.success(t('voice.success.import'))
    } catch {
      setError(t('import.importError'))
      setStep('error')
    }
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('import.title')}</h2>
          <p className="mt-2 text-sm text-muted">{t('import.subtitle')}</p>
        </div>
      ) : null}

      {step === 'idle' || step === 'error' ? (
        <div
          className="rounded-lg border-2 border-dashed border-border bg-surface p-8 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0] ?? null
            void handleFileSelected(file)
          }}
        >
          <p className="font-semibold text-foreground">{t('import.dragDrop')}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="mt-4 block w-full text-sm text-muted file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-hover"
            onChange={(e) => void handleFileSelected(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : null}

      {step === 'parsing' ? (
        <p className="text-muted">{t('import.parsing', { file: fileName ?? t('import.selectFile') })}</p>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {step === 'preview' ? (
        <ImportPreview
          events={events}
          goals={goals}
          bucketListItems={bucketListItems}
          skipped={skipped}
          skipDuplicates={skipDuplicates}
          replaceExisting={replaceExisting}
          onSkipDuplicatesChange={setSkipDuplicates}
          onReplaceExistingChange={(value) => {
            setReplaceExisting(value)
            if (value) setSkipDuplicates(false)
          }}
          onConfirm={() => void handleConfirmImport()}
          onCancel={reset}
        />
      ) : null}

      {step === 'importing' ? <p className="text-muted">{t('import.importing')}</p> : null}

      {step === 'done' && importResult ? (
        <ImportReport result={importResult} skipped={skipped} onImportAnother={reset} />
      ) : null}
    </div>
  )
}
