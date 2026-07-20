import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSortedResultsPlatforms, resultsPlatformLabel } from '../../../shared/officialResults'
import { timingDisclaimerPath } from '../../config/timingDisclaimer'
import { isCompleteParkrunnerId } from '../../types/UserResultsProfile'
import { ParkrunnerIdInput } from '../../components/ParkrunnerIdInput/ParkrunnerIdInput'
import { ParkrunEventPicker } from '../../components/ParkrunEventPicker/ParkrunEventPicker'
import { findParkrunEventsBySlugs, loadParkrunCatalog } from '../../services/parkrunCatalog'
import type { ParkrunCatalog, ParkrunCatalogEvent } from '../../../shared/parkrun/catalog'
import { useToast } from '../../contexts/ToastContext'
import { useUserResultsProfile } from '../../hooks/useUserResultsProfile'
import { hasResultsName } from '../../types/UserResultsProfile'

export function ResultsProfileSection() {
  const { t } = useTranslation()
  const toast = useToast()
  const { profile, loading, saving, saveProfile } = useUserResultsProfile()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nameAliases, setNameAliases] = useState('')
  const [parkrunnerId, setParkrunnerId] = useState('')
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([])
  const [favoritePickerSlug, setFavoritePickerSlug] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<ParkrunCatalog | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadParkrunCatalog().then((loaded) => {
      if (!cancelled) setCatalog(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setFirstName(profile.resultFirstName ?? '')
    setLastName(profile.resultLastName ?? '')
    setNameAliases((profile.resultNameAliases ?? []).join('\n'))
    setParkrunnerId(profile.parkrunnerId ?? '')
    setFavoriteSlugs(profile.favoriteParkrunSlugs ?? [])
    setFavoritePickerSlug(null)
    setDirty(false)
  }, [profile])

  if (loading) {
    return (
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('officialResults.settingsTitle')}</h2>
        <p className="mt-2 text-sm text-muted">{t('common.loading')}</p>
      </section>
    )
  }

  async function handleSave() {
    if (!hasResultsName({ resultFirstName: firstName, resultLastName: lastName })) {
      toast.error(t('officialResults.nameRequired'))
      return
    }

    if (parkrunnerId.trim() && !isCompleteParkrunnerId(parkrunnerId)) {
      toast.error(t('officialResults.parkrunnerIdInvalid'))
      return
    }

    try {
      await saveProfile({
        resultFirstName: firstName,
        resultLastName: lastName,
        resultNameAliases: nameAliases
          .split(/\r?\n/)
          .map((alias) => alias.trim())
          .filter(Boolean),
        parkrunnerId,
        favoriteParkrunSlugs: favoriteSlugs,
      })
      setDirty(false)
      toast.success(t('officialResults.saved'))
    } catch {
      toast.error(t('officialResults.saveError'))
    }
  }

  const supportedPlatforms = getSortedResultsPlatforms()
    .map((platform) => resultsPlatformLabel(platform))
    .join(', ')

  const favoriteEvents = catalog ? findParkrunEventsBySlugs(catalog, favoriteSlugs) : []

  function handleAddFavorite(event: ParkrunCatalogEvent) {
    setFavoriteSlugs((current) =>
      current.includes(event.slug) ? current : [...current, event.slug],
    )
    setFavoritePickerSlug(event.slug)
    setDirty(true)
  }

  function handleRemoveFavorite(slug: string) {
    setFavoriteSlugs((current) => current.filter((item) => item !== slug))
    setDirty(true)
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-foreground">{t('officialResults.settingsTitle')}</h2>
      <p className="mt-2 text-sm text-muted">{t('officialResults.settingsSubtitle')}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="resultFirstName" className="block text-sm font-semibold text-foreground">
            {t('officialResults.firstName')}
          </label>
          <input
            id="resultFirstName"
            type="text"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value)
              setDirty(true)
            }}
            placeholder={t('officialResults.firstNamePlaceholder')}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="resultLastName" className="block text-sm font-semibold text-foreground">
            {t('officialResults.lastName')}
          </label>
          <input
            id="resultLastName"
            type="text"
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value)
              setDirty(true)
            }}
            placeholder={t('officialResults.lastNamePlaceholder')}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">{t('officialResults.nameHint')}</p>

      <div className="mt-4">
        <label htmlFor="resultNameAliases" className="block text-sm font-semibold text-foreground">
          {t('officialResults.nameAliases')}
        </label>
        <textarea
          id="resultNameAliases"
          value={nameAliases}
          onChange={(event) => {
            setNameAliases(event.target.value)
            setDirty(true)
          }}
          placeholder={t('officialResults.nameAliasesPlaceholder')}
          rows={3}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <p className="mt-2 text-xs text-muted">{t('officialResults.nameAliasesHint')}</p>
      </div>

      <div className="mt-4">
        <label htmlFor="parkrunnerId" className="block text-sm font-semibold text-foreground">
          {t('officialResults.parkrunnerId')}
        </label>
        <div className="mt-1">
          <ParkrunnerIdInput
            id="parkrunnerId"
            value={parkrunnerId}
            onChange={(value) => {
              setParkrunnerId(value)
              setDirty(true)
            }}
          />
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">{t('parkrun.favoritesTitle')}</h3>
        <p className="mt-1 text-xs text-muted">{t('parkrun.favoritesHint')}</p>

        {favoriteEvents.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {favoriteEvents.map((event) => (
              <li key={event.slug}>
                <button
                  type="button"
                  onClick={() => handleRemoveFavorite(event.slug)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground hover:border-danger hover:text-danger"
                  title={t('parkrun.removeFavorite')}
                >
                  <span>{event.shortName}</span>
                  <span aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-3">
          <label htmlFor="favoriteParkrun" className="block text-sm font-semibold text-foreground">
            {t('parkrun.addFavorite')}
          </label>
          <div className="mt-1">
            <ParkrunEventPicker
              id="favoriteParkrun"
              value={favoritePickerSlug}
              favoriteSlugs={[]}
              onChange={handleAddFavorite}
            />
          </div>
        </div>
      </div>

      {dirty ? (
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      ) : null}

      <p className="mt-6 border-t border-border pt-4 text-xs text-muted">
        {t('officialResults.supportedPlatforms')}{' '}
        <span className="text-foreground/80">{supportedPlatforms}</span>
      </p>
      <p className="mt-2 text-xs text-muted">
        {t('officialResults.disclaimer')}{' '}
        <Link
          to={timingDisclaimerPath()}
          className="font-semibold text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
        >
          {t('officialResults.disclaimerLink')}
        </Link>
      </p>
    </section>
  )
}
