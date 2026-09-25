import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageShell } from '../../components/PageShell/PageShell'
import { useBucketList } from '../../hooks/useBucketList'
import { useSharedBucketList } from '../../hooks/useSharedBucketList'
import { getBucketListItem } from '../../services/bucketList'

/**
 * The note on a wish, and nothing else.
 *
 * A wish used to be written here: a name, a place, a distance, a target month,
 * an anchor flag and a role, thirteen fields for a race the catalog already
 * describes. It is a marker on a catalog race now, put there with one press in
 * the planning list, so the only thing left to write is why you want it.
 *
 * What the form used to carry lives where it belongs. The name, the place and
 * the distances are the race's. Being an anchor and what a race prepares are
 * facts about a season, on the race identity, set from the race's own page.
 */
export function WishForm() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sharedOwnerId = searchParams.get('owner')

  const ownBucketList = useBucketList()
  const sharedBucketList = useSharedBucketList(sharedOwnerId)
  const editItem = sharedOwnerId ? sharedBucketList.editItem : ownBucketList.editItem
  const listPath = sharedOwnerId ? `/planeamento?owner=${sharedOwnerId}` : '/planeamento'

  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void getBucketListItem(id)
      .then((item) => {
        if (cancelled || !item) return
        setName(item.name)
        setNotes(item.notes ?? '')
      })
      .catch(() => setError(t('bucketList.loadError')))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, t])

  async function handleSubmit(submitted: FormEvent) {
    submitted.preventDefault()
    if (!id) return
    setSaving(true)
    setError(null)
    try {
      await editItem(id, { notes: notes.trim() || undefined })
      navigate(listPath)
    } catch {
      setError(t('bucketList.saveError'))
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageShell title={t('bucketList.editItem')}>
        <div className="mt-6 h-32 animate-pulse rounded-2xl bg-border/60" aria-hidden />
      </PageShell>
    )
  }

  return (
    <PageShell title={name || t('bucketList.editItem')}>
      <form onSubmit={(submitted) => void handleSubmit(submitted)} className="mt-6 max-w-2xl space-y-5">
        <label className="block text-sm font-semibold text-foreground">
          {t('common.notes')}
          <textarea
            value={notes}
            rows={4}
            onChange={(changed) => setNotes(changed.target.value)}
            placeholder={t('bucketList.notesPlaceholder')}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(listPath)}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </PageShell>
  )
}
