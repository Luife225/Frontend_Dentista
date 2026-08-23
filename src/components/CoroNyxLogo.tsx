import logoSrc from '../imports/Logo_final.png'

interface Props {
  size?: number
  className?: string
}

/**
 * Isotipo oficial de CORONYX — usa la imagen PNG Logo_final.
 * Úsalo en cualquier componente con <CoroNyxLogo size={40} />
 */
export default function CoroNyxLogo({ size = 36, className = '' }: Props) {
  return (
    <img
      src={logoSrc}
      alt="CORONYX logo"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
