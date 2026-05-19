import { useEffect } from 'react'

type AppToastProps = {
  /** Toast body text. */
  message: string
  /** When true, the toast is visible. */
  show: boolean
  /** Called when the user dismisses the toast or it auto-hides. */
  onClose: () => void
}

/**
 * Bootstrap toast fixed to the bottom-right (no {@code alert()}).
 */
export function AppToast({ message, show, onClose }: AppToastProps) {
  useEffect(() => {
    if (!show) {
      return undefined
    }
    const timer = window.setTimeout(onClose, 6000)
    return () => window.clearTimeout(timer)
  }, [show, onClose])

  if (!show || !message) {
    return null
  }

  return (
    <div
      className="toast-container position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 1080 }}
    >
      <div
        className="toast show text-bg-primary border-0"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="toast-header text-bg-primary border-0">
          <strong className="me-auto">TriviaHub</strong>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <div className="toast-body">{message}</div>
      </div>
    </div>
  )
}
