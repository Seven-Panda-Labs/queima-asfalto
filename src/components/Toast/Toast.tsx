import type { ToastType } from '../../contexts/ToastContext'

const TOAST_STYLES: Record<ToastType, { background: string; color: string }> = {
  success: { background: '#10B981', color: '#FFFFFF' },
  warning: { background: '#F97316', color: '#FFFFFF' },
  error: { background: '#EF4444', color: '#FFFFFF' },
  info: { background: '#2563EB', color: '#FFFFFF' },
}

type ToastProps = {
  id: string
  type: ToastType
  message: string
  onDismiss: (id: string) => void
}

export function Toast({ id, type, message, onDismiss }: ToastProps) {
  const style = TOAST_STYLES[type]

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg"
      style={{ backgroundColor: style.background, color: style.color }}
    >
      <p className="flex-1 text-sm font-semibold">{message}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="text-lg leading-none opacity-80 hover:opacity-100"
        aria-label="Fechar notificação"
      >
        ✕
      </button>
    </div>
  )
}
