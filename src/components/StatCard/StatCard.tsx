type StatCardProps = {
  value: string | number
  label: string
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="rounded-lg bg-background p-4">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}
