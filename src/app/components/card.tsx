import Link from 'next/link'

type CardProps = React.HTMLAttributes<HTMLElement> & {
  stage: string
  href: string
}

const Card: React.FC<CardProps> = ({ stage, href, ...rest }) => {
  return (
    <Link
      key={href}
      href={`/game/${href}`}
      className={`col-span-6 lg:col-span-1 w-10/12 lg:w-36 font-semibold text-center text-nowrap text-black text-lg p-6 rounded-lg ${rest.className}`}
    >
      {stage.toLocaleUpperCase()}
    </Link>
  )
}

export default Card
