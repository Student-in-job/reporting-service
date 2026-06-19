import type { FormInst, FormRules } from 'naive-ui'
import type { ReportFilter } from '@/entities/report'
import { toIsoDate } from '@/shared/lib'
import { buildDateShortcuts, getPresetRange } from '../model/datePresets'
import type { ReportFiltersModel, ReportFiltersPayload } from '../model/types'

interface UseReportFilterBarParams {
  filters: () => ReportFilter[]
  emit: (e: 'submit', payload: ReportFiltersPayload) => void
}

export function useReportFilterBar(params: UseReportFilterBarParams) {
  const formRef = useTemplateRef<FormInst>('formRef')

  const [defFrom, defTo] = getPresetRange('last7') ?? [null, null]
  const model = reactive<ReportFiltersModel>({
    date_from: defFrom,
    date_to: defTo,
    filters: {},
  })

  const dateRange = computed<[number, number] | null>({
    get: (): [number, number] | null =>
      model.date_from !== null && model.date_to !== null
        ? [model.date_from, model.date_to]
        : null,
    set: (v: [number, number] | null) => {
      model.date_from = v?.[0] ?? null
      model.date_to = v?.[1] ?? null
    },
  })

  const dateShortcuts = buildDateShortcuts()

  watch(
    params.filters,
    (filters) => {
      const next: Record<string, unknown> = {}
      for (const f of filters) {
        if (f.name === 'date_from' || f.name === 'date_to') continue
        next[f.name] = model.filters[f.name] ?? null
      }
      model.filters = next
    },
    { immediate: true },
  )

  const customFilters = computed(() =>
    params.filters().filter((f) => f.name !== 'date_from' && f.name !== 'date_to'),
  )

  const rules = computed<FormRules>(() => {
    const r: FormRules = {
      dateRange: {
        validator: () => model.date_from !== null && model.date_to !== null,
        message: 'Укажите период',
        trigger: ['blur', 'change'],
      },
    }
    for (const f of customFilters.value) {
      if (f.required) {
        r[`filters.${f.name}`] = {
          validator: () => {
            const v = model.filters[f.name]
            return v !== null && v !== undefined && v !== ''
          },
          message: `${f.label} — обязательно`,
          trigger: ['blur', 'change'],
        }
      }
    }
    return r
  })

  async function onSubmit() {
    try {
      await formRef.value?.validate()
    } catch {
      return
    }
    if (model.date_from === null || model.date_to === null) return

    const dateFilterNames = new Set(
      customFilters.value.filter((f) => f.type === 'date').map((f) => f.name),
    )
    const filters: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(model.filters)) {
      filters[name] =
        dateFilterNames.has(name) && value !== null && value !== undefined
          ? toIsoDate(value as number)
          : value
    }

    params.emit('submit', {
      date_from: toIsoDate(model.date_from),
      date_to: toIsoDate(model.date_to),
      filters,
    })
  }

  return {
    model,
    dateRange,
    dateShortcuts,
    customFilters,
    rules,
    onSubmit,
  }
}
