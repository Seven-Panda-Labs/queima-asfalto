import { useTranslation } from 'react-i18next'
import type { EventsPermission, SectionPermission, SharePermissions } from '../../types/Share'

const SECTION_OPTIONS: SectionPermission[] = ['none', 'read', 'write']
const EVENTS_OPTIONS: EventsPermission[] = ['none', 'read_no_results', 'read', 'write']

type SharePermissionsFieldsProps = {
  value: SharePermissions
  onChange: (next: SharePermissions) => void
  disabled?: boolean
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
  optionLabel,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  disabled?: boolean
  optionLabel: (value: string) => string
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-foreground">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-border bg-background px-3 py-2 text-foreground disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

export function SharePermissionsFields({ value, onChange, disabled }: SharePermissionsFieldsProps) {
  const { t } = useTranslation()

  function sectionLabel(permission: string) {
    return t(`shares.permission.${permission}`)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectField
        label={t('shares.sections.bucketList')}
        value={value.bucketList}
        options={SECTION_OPTIONS}
        disabled={disabled}
        optionLabel={sectionLabel}
        onChange={(bucketList) => onChange({ ...value, bucketList: bucketList as SectionPermission })}
      />
      <SelectField
        label={t('shares.sections.events')}
        value={value.events}
        options={EVENTS_OPTIONS}
        disabled={disabled}
        optionLabel={sectionLabel}
        onChange={(events) => onChange({ ...value, events: events as EventsPermission })}
      />
      <SelectField
        label={t('shares.sections.goals')}
        value={value.goals}
        options={SECTION_OPTIONS}
        disabled={disabled}
        optionLabel={sectionLabel}
        onChange={(goals) => onChange({ ...value, goals: goals as SectionPermission })}
      />
      <SelectField
        label={t('shares.sections.performanceGoals')}
        value={value.performanceGoals}
        options={SECTION_OPTIONS}
        disabled={disabled}
        optionLabel={sectionLabel}
        onChange={(performanceGoals) =>
          onChange({ ...value, performanceGoals: performanceGoals as SectionPermission })
        }
      />
    </div>
  )
}
