'use client'

export function ShareButton() {
  return (
    <button
      onClick={() => {
        if (typeof navigator !== 'undefined') {
          navigator.clipboard?.writeText(window.location.href)
        }
      }}
      className="hover:text-brand-red transition-colors text-sm text-gray-400"
      title="Copy link"
    >
      🔗 Copy link
    </button>
  )
}
