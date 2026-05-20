interface IconProps {
  name: string
  fill?: 0 | 1
  size?: number
  className?: string
  weight?: number
}

export function Icon({ name, fill = 0, size = 24, weight = 400, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
