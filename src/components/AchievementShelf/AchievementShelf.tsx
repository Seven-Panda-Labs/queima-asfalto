import medalha from '../../../assets/medalha.svg'
import { PersonalRecordIndicator } from '../PersonalRecordIndicator/PersonalRecordIndicator'
import type { DashboardAchievement } from '../../utils/dashboardHighlights'

const TONE_STYLES: Record<DashboardAchievement['tone'], { chip: string; detail: string }> = {
  goal: { chip: 'border-success/40', detail: 'bg-success/15 text-success' },
  record: { chip: 'border-accent/40', detail: 'bg-accent/15 text-accent' },
}

function AchievementChip({ achievement }: { achievement: DashboardAchievement }) {
  const styles = TONE_STYLES[achievement.tone]

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border bg-surface py-1.5 pe-1.5 ps-2.5 text-sm shadow-sm',
        styles.chip,
      ].join(' ')}
    >
      {achievement.emoji ? (
        <span className="text-base leading-none" aria-hidden>
          {achievement.emoji}
        </span>
      ) : (
        <PersonalRecordIndicator />
      )}
      <span className="font-semibold text-foreground">{achievement.title}</span>
      <span
        className={['rounded-full px-2 py-0.5 text-xs font-bold', styles.detail].join(' ')}
      >
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
