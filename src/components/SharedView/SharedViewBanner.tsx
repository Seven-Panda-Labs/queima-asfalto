import { useTranslation } from 'react-i18next'
import { EyeIcon } from '../icons/actionIcons'

/** Full width under the header, so it reads as a mode of the app, not a note on one page. */
export function SharedViewBanner({ ownerName, onShowMine }: { ownerName: string; onShowMine: () => void }) {
  const { t } = useTranslation()

  return (
    <div role="status" className="border-b border-accent/30 bg-accent/15">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm text-foreground">
        <span className="text-accent">
          <EyeIcon />
        </span>
        <span className="font-semibold">{t('shares.viewingBanner', { name: ownerName })}</span>
        <button
          type="button"
          onClick={onShowMine}
          className="ml-auto font-semibold text-accent underline-offset-2 hover:underline"
        >
          {t('shares.viewing.backToMine')}
        </button>
      </div>
    </div>
  )
}
