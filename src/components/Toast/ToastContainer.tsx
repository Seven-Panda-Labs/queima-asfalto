import type { ToastType } from '../../contexts/ToastContext'
import { Toast } from './Toast'

type ToastContainerProps = {
  toasts: Array<{ id: string; type: ToastType; message: string }>
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed top-4 right-4 left-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-96">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  )
}
