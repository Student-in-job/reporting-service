interface DatePreset {
  key: string
  label: string
  range: () => [number, number]
}

function startOfDay(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function startOfNextDay(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() + 1)
  return x.getTime()
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const DATE_PRESETS: DatePreset[] = [
  {
    key: 'today',
    label: 'Сегодня',
    range: () => [startOfDay(new Date()), startOfNextDay(new Date())],
  },
  {
    key: 'yesterday',
    label: 'Вчера',
    range: () => [startOfDay(daysAgo(1)), startOfNextDay(daysAgo(1))],
  },
  {
    key: 'last7',
    label: '7 дней',
    range: () => [startOfDay(daysAgo(6)), startOfNextDay(new Date())],
  },
  {
    key: 'last30',
    label: '30 дней',
    range: () => [startOfDay(daysAgo(29)), startOfNextDay(new Date())],
  },
]

export function getPresetRange(key: string): [number, number] | null {
  return DATE_PRESETS.find((p) => p.key === key)?.range() ?? null
}

export function buildDateShortcuts(): Record<string, () => [number, number]> {
  return Object.fromEntries(DATE_PRESETS.map((p) => [p.label, p.range]))
}
