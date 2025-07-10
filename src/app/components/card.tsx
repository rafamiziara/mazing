import Link from 'next/link'

type CardProps = React.HTMLAttributes<HTMLElement> & {
  title: string
  stage: number
}

const Card: React.FC<CardProps> = ({ title, stage, ...rest }) => {
  return (
    <Link
      key={stage}
      href={`/game?stage=${stage}`}
      className={`col-span-6 lg:col-span-1 w-10/12 lg:w-36 font-semibold text-center place-content-center min-h-30 text-black text-lg p-6 rounded-lg ${rest.className}`}
    >
      {title.toLocaleUpperCase()}
    </Link>
  )
}

export default Card
