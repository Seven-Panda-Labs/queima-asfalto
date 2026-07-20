import { Link } from 'react-router-dom'
import logoSapatilha from '../../../assets/sapatilha-logo.png'

type LogoProps = {
  className?: string
  linkTo?: string
}

export function Logo({ className = 'h-9 w-9 object-contain', linkTo }: LogoProps) {
  const image = (
    <img src={logoSapatilha} alt="Queima Asfalto" className={className} />
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex shrink-0">
        {image}
      </Link>
    )
  }

  return image
}
