import medalha from '../../../assets/medalha.svg'
import type { DashboardAchievement } from '../../utils/dashboardHighlights'

function AchievementChip({ achievement }: { achievement: DashboardAchievement }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-surface py-1.5 pe-1.5 ps-2.5 text-sm shadow-sm">
      <span className="text-base leading-none" aria-hidden>
        {achievement.emoji}
      </span>
      <span className="font-semibold text-foreground">{achievement.title}</span>
      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
        {achievement.detail}
      </span>
    </span>
  )
}

type AchievementShelfProps = {
  title: string
  emptyText: string
  achievements: DashboardAchievement[]
}

/**
 * Banda das conquistas. Tem fundo e moldura próprios para não ser mais um
 * cartão branco, e usa chips para escalar para qualquer número de conquistas.
 */
export function AchievementShelf({ title, emptyText, achievements }: AchievementShelfProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/15 via-surface to-primary/10 p-5 sm:p-6">
      <img
        src={medalha}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -bottom-4 -end-4 h-32 w-auto rotate-12 object-contain opacity-25"
      />

      <div className="relative">
        <h2 className="font-display text-2xl tracking-wide text-foreground">{title}</h2>

        {achievements.length === 0 ? (
          <p className="mt-2 max-w-md text-sm text-muted">{emptyText}</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {achievements.map((achievement) => (
              <li key={achievement.id}>
                <AchievementChip achievement={achievement} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
