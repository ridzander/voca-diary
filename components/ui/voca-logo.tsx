interface VocaLogoProps {
  /** Size of the icon square in px */
  iconSize?: number
  /** Whether to show the wordmark next to the icon */
  showWordmark?: boolean
  /** className for the outer wrapper */
  className?: string
}

export function VocaLogo({ iconSize = 32, showWordmark = true, className = '' }: VocaLogoProps) {
  const radius = Math.round(iconSize * 0.23)
  const fontSize = Math.round(iconSize * 0.22)

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon — green rounded square with VOCA in Monoton */}
      <div
        className="flex items-center justify-center shrink-0 bg-[#1D9E75]"
        style={{ width: iconSize, height: iconSize, borderRadius: radius }}
      >
        <span
          className="font-monoton text-white leading-none select-none"
          style={{ fontSize }}
        >
          VOCA
        </span>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <span className="font-body font-bold text-on-surface leading-none" style={{ fontSize: iconSize * 0.5 }}>
          Voca<span className="text-[#1D9E75]">Diary</span>
        </span>
      )}
    </div>
  )
}
