import { useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { MoreIcon } from '../icons/actionIcons'

export type RowAction = {
  label: string
  icon: ReactNode
  danger?: boolean
} & ({ to: string; state?: unknown } | { href: string } | { onClick: () => void })

type ControlProps = {
  action: RowAction
  className: string
  children: ReactNode
  iconOnly?: boolean
  onPick?: () => void
}

function Control({ action, className, children, iconOnly, onPick }: ControlProps) {
  const labels = iconOnly ? { title: action.label, 'aria-label': action.label } : {}
  if ('to' in action) {
    return (
      <Link to={action.to} state={action.state} onClick={onPick} className={className} {...labels}>
        {children}
      </Link>
    )
  }
  if ('href' in action) {
    return (
      <a href={action.href} target="_blank" rel="noopener noreferrer" onClick={onPick} className={className} {...labels}>
        {children}
      </a>
    )
  }
  return (
    <button
      type="button"
      onClick={() => {
        onPick?.()
        action.onClick()
      }}
      className={className}
      {...labels}
    >
      {children}
    </button>
  )
}

/** A row's actions: a line of icons where there is room, one button that opens them as a labelled sheet on a phone. */
export function RowActions({ title, actions }: { title: string; actions: RowAction[] }) {
  const { t } = useTranslation()
  const titleId = useId()
  const sheet = useRef<HTMLDialogElement>(null)
  const close = () => sheet.current?.close()
  // A sheet for a single icon would only add a tap.
  const collapses = actions.length > 1

  return (
    <>
      <div className={`${collapses ? 'hidden sm:flex' : 'flex'} flex-nowrap gap-1`}>
        {actions.map((action) => (
          <Control
            key={action.label}
            action={action}
            iconOnly
            className={`rounded-md p-1.5 text-muted transition-colors hover:bg-background ${
              action.danger ? 'hover:text-danger' : 'hover:text-primary'
            }`}
          >
            {action.icon}
          </Control>
        ))}
      </div>
      {collapses ? (
        <>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={t('common.actions')}
            title={t('common.actions')}
            onClick={() => sheet.current?.showModal()}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary sm:hidden"
          >
            <MoreIcon />
          </button>
          {/* A modal dialog sits above the table's scroll box and pinned column. */}
          <dialog
            ref={sheet}
            aria-labelledby={titleId}
            onClick={(event) => {
              if (event.target === event.currentTarget) close()
            }}
            className="m-0 mt-auto w-full max-w-none rounded-t-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50"
          >
            <div className="px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <p id={titleId} className="truncate px-3 py-2 text-sm text-muted">
                {title}
              </p>
              {actions.map((action) => (
                <Control
                  key={action.label}
                  action={action}
                  onPick={close}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-start text-sm font-semibold hover:bg-background ${
                    action.danger ? 'text-danger' : 'text-foreground'
                  }`}
                >
                  {action.icon}
                  {action.label}
                </Control>
              ))}
              <button
                type="button"
                onClick={close}
                className="mt-1 w-full rounded-md border border-border px-3 py-3 text-sm font-semibold text-muted"
              >
                {t('common.cancel')}
              </button>
            </div>
          </dialog>
        </>
      ) : null}
    </>
  )
}
