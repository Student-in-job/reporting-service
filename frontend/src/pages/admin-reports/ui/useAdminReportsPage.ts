import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { NButton, NInput, NSpace, NTag } from 'naive-ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  adminReportsAPI,
  REPORT_TYPES,
  reportsAPI,
  type AnalyzeSqlDto,
  type ApiReportListItem,
  type ColumnDef,
  type ReportAdmin,
  type ReportCreateDto,
  type ReportType,
  type ReportUpdateDto,
} from '@/entities/report'
import { datasourcesAPI } from '@/entities/datasource'
import type {
  AdminReportDialogMode,
  AdminReportFormState,
} from '../model/types'

const REPORTS_QUERY_KEY = ['admin-reports']
const REPORTS_MENU_QUERY_KEY = ['reports-menu']
const DATASOURCES_OPTIONS_QUERY_KEY = ['datasources-options']

const reportTypeOptions = REPORT_TYPES.map((t) => ({ label: t, value: t }))

function createEmptyForm(): AdminReportFormState {
  return {
    slug: '',
    name: '',
    description: '',
    group: '',
    type: 'table',
    datasource_id: null,
    sql_query: '',
    max_range_days: null,
    is_active: true,
  }
}

export function useAdminReportsPage() {
  const queryClient = useQueryClient()
  const message = useMessage()
  const dialog = useDialog()

  const reportsQuery = useQuery({
    queryKey: REPORTS_QUERY_KEY,
    queryFn: () => reportsAPI.list(),
  })

  const reports = computed<ApiReportListItem[]>(
    () => reportsQuery.data.value?.reports ?? [],
  )

  const datasourcesQuery = useQuery({
    queryKey: DATASOURCES_OPTIONS_QUERY_KEY,
    queryFn: () => datasourcesAPI.list(),
  })

  const datasourceOptions = computed(() =>
    (datasourcesQuery.data.value?.datasources ?? []).map((d) => ({
      label: `${d.name} (${d.host}:${d.port}/${d.database})`,
      value: d.id,
    })),
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: REPORTS_MENU_QUERY_KEY })
  }

  const createMutation = useMutation({
    mutationFn: (dto: ReportCreateDto) => adminReportsAPI.create(dto),
    onSuccess: () => {
      message.success('Отчёт создан')
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ReportUpdateDto }) =>
      adminReportsAPI.update(id, dto),
    onSuccess: () => {
      message.success('Отчёт обновлён')
      invalidate()
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => adminReportsAPI.remove(id),
    onSuccess: () => {
      message.success('Отчёт удалён')
      invalidate()
    },
  })

  const analyzedColumns = ref<ColumnDef[]>([])

  const analyzeMutation = useMutation({
    mutationFn: (dto: AnalyzeSqlDto) => adminReportsAPI.analyzeSql(dto),
    onSuccess: (data) => {
      analyzedColumns.value = data.columns
      message.success(`Найдено ${data.columns.length} колонок`)
    },
    onError: () => {
      analyzedColumns.value = []
    },
  })

  function onAnalyzeSql() {
    if (!form.datasource_id || !form.sql_query.trim()) {
      message.warning('Укажите источник данных и SQL-запрос')
      return
    }
    analyzeMutation.mutate({
      datasource_id: form.datasource_id,
      sql_query: form.sql_query,
    })
  }

  const isDialogOpen = ref(false)
  const dialogMode = ref<AdminReportDialogMode>('create')
  const editingId = ref<string | null>(null)
  const isLoadingEdit = ref(false)
  const formRef = useTemplateRef<FormInst>('formRef')
  const form = reactive<AdminReportFormState>(createEmptyForm())

  const rules = computed<FormRules>(() => {
    const isCreate = dialogMode.value === 'create'
    return {
      slug: [
        {
          required: isCreate,
          message: 'Введите slug',
          trigger: ['blur'],
        },
        {
          pattern: /^[a-z0-9_-]+$/,
          message: 'Только a-z, 0-9, _ и -',
          trigger: ['blur'],
        },
      ],
      name: [{ required: true, message: 'Введите название', trigger: ['blur'] }],
      datasource_id: [
        {
          required: true,
          type: 'string',
          message: 'Выберите источник',
          trigger: ['blur', 'change'],
        },
      ],
      sql_query: [
        { required: true, message: 'Введите SQL-запрос', trigger: ['blur'] },
      ],
    }
  })

  function resetForm() {
    Object.assign(form, createEmptyForm())
    editingId.value = null
    analyzedColumns.value = []
  }

  function openCreate() {
    resetForm()
    dialogMode.value = 'create'
    isDialogOpen.value = true
  }

  async function openEdit(r: ApiReportListItem) {
    resetForm()
    dialogMode.value = 'edit'
    editingId.value = r.id
    isLoadingEdit.value = true
    isDialogOpen.value = true
    try {
      const full: ReportAdmin = await adminReportsAPI.get(r.id)
      form.slug = full.slug
      form.name = full.name
      form.description = full.description ?? ''
      form.group = full.group ?? ''
      form.type = full.type
      form.datasource_id = full.datasource_id
      form.sql_query = full.sql_query
      form.max_range_days = full.config?.max_range_days ?? null
      form.is_active = full.is_active
    } finally {
      isLoadingEdit.value = false
    }
  }

  function buildConfig(): ReportCreateDto['config'] {
    return form.max_range_days != null
      ? { max_range_days: form.max_range_days }
      : undefined
  }

  async function onSubmit() {
    try {
      await formRef.value?.validate()
    } catch {
      return
    }
    if (!form.datasource_id) return

    if (dialogMode.value === 'create') {
      await createMutation.mutateAsync({
        slug: form.slug.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        group: form.group.trim() || null,
        type: form.type,
        datasource_id: form.datasource_id,
        sql_query: form.sql_query,
        columns: analyzedColumns.value.length ? analyzedColumns.value : undefined,
        config: buildConfig(),
      })
    } else if (editingId.value) {
      await updateMutation.mutateAsync({
        id: editingId.value,
        dto: {
          slug: form.slug.trim(),
          name: form.name.trim(),
          description: form.description.trim() || null,
          group: form.group.trim() || null,
          type: form.type,
          datasource_id: form.datasource_id,
          sql_query: form.sql_query,
          columns: analyzedColumns.value.length ? analyzedColumns.value : undefined,
          config: buildConfig(),
          is_active: form.is_active,
        },
      })
    }
    isDialogOpen.value = false
  }

  function confirmRemove(r: ApiReportListItem) {
    dialog.warning({
      title: 'Удалить отчёт?',
      content: `Отчёт «${r.name}» будет удалён без возможности восстановления.`,
      positiveText: 'Удалить',
      negativeText: 'Отмена',
      onPositiveClick: () => removeMutation.mutate(r.id),
    })
  }

  const columns = computed<DataTableColumns<ApiReportListItem>>(() => [
    { title: 'Slug', key: 'slug' },
    { title: 'Название', key: 'name' },
    {
      title: 'Группа',
      key: 'group',
      render: (row) => row.group ?? '—',
    },
    {
      title: 'Тип',
      key: 'type',
      render: (row) =>
        h(NTag, { size: 'small' }, { default: () => row.type as ReportType }),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 240,
      render: (row) =>
        h(NSpace, { size: 'small', wrap: false }, () => [
          h(
            NButton,
            { size: 'small', onClick: () => openEdit(row) },
            { default: () => 'Изменить' },
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              ghost: true,
              loading: removeMutation.isPending.value
                && removeMutation.variables.value === row.id,
              onClick: () => confirmRemove(row),
            },
            { default: () => 'Удалить' },
          ),
        ]),
    },
  ])

  const isSubmitting = computed(
    () => createMutation.isPending.value || updateMutation.isPending.value,
  )

  return {
    reportsQuery,
    reports,
    columns,
    datasourcesQuery,
    datasourceOptions,
    reportTypeOptions,
    isDialogOpen,
    dialogMode,
    isLoadingEdit,
    form,
    rules,
    isSubmitting,
    analyzedColumns,
    analyzedColumnsTableColumns: [
      { title: 'Key', key: 'key' },
      {
        title: 'Label',
        key: 'label',
        render: (_row: ColumnDef, rowIndex: number) =>
          h(NInput, {
            value: analyzedColumns.value[rowIndex].label,
            size: 'small',
            onUpdateValue: (v: string) => { analyzedColumns.value[rowIndex].label = v },
          }),
      },
      { title: 'Тип', key: 'type' },
    ],
    isAnalyzing: computed(() => analyzeMutation.isPending.value),
    openCreate,
    onSubmit,
    onAnalyzeSql,
  }
}
