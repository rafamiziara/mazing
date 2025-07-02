type StageCardProps = React.HTMLAttributes<HTMLElement> & {
  stage: string
}

const StageCard: React.FC<StageCardProps> = ({ stage, ...rest }) => {
  return <div className={`font-medium text-xl p-8 rounded-2xl ${rest.className}`}>{stage.toLocaleUpperCase()}</div>
}

export default StageCard
