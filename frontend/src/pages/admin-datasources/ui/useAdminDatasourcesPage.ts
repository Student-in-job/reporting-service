import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { NButton, NSpace, NTag } from 'naive-ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  datasourcesAPI,
  type ApiDatasource,
  type DatasourceCreateDto,
  type DatasourceUpdateDto,
} from '@/entities/datasource'
import { formatDateTime } from '@/shared/lib'
import type {
  AdminDatasourceDialogMode,
  AdminDatasourceFormState,
} from '../model/types'

const DATASOURCES_QUERY_KEY = ['admin-datasources']
const DEFAULT_PORT = 5432

function createEmptyForm(): AdminDatasourceFormState {
  return {
    name: '',
    host: '',
    port: DEFAULT_PORT,
    database: '',
    username: '',
    password: '',
    is_active: true,
  }
}

export function useAdminDatasourcesPage() {
  const queryClient = useQueryClient()
  const message = useMessage()
  const dialog = useDialog()

  const datasourcesQuery = useQuery({
    queryKey: DATASOURCES_QUERY_KEY,
    queryFn: () => datasourcesAPI.list(),
  })

  const datasources = computed<ApiDatasource[]>(
    () => datasourcesQuery.data.value?.datasources ?? [],
  )

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: DATASOURCES_QUERY_KEY })

  const createMutation = useMutation({
    mutationFn: (dto: DatasourceCreateDto) => datasourcesAPI.create(dto),
    onSuccess: () => {
      message.success('Источник создан')
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: DatasourceUpdateDto }) =>
      datasourcesAPI.update(id, dto),
    onSuccess: () => {
      message.success('Источник обновлён')
      invalidate()
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => datasourcesAPI.remove(id),
    onSuccess: () => {
      message.success('Источник удалён')
      invalidate()
    },
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => datasourcesAPI.test(id),
    onSuccess: (res) => {
      if (res.status === 'ok') {
        message.success(
          `Соединение успешно${
            res.response_time_ms ? ` (${res.response_time_ms} мс)` : ''
          }`,
        )
      } else {
        message.error(res.detail ?? 'Ошибка соединения')
      }
    },
  })

  const isDialogOpen = ref(false)
  const dialogMode = ref<AdminDatasourceDialogMode>('create')
  const editingId = ref<string | null>(null)
  const formRef = useTemplateRef<FormInst>('formRef')
  const form = reactive<AdminDatasourceFormState>(createEmptyForm())

  const rules = computed<FormRules>(() => {
    const isCreate = dialogMode.value === 'create'
    return {
      name: [{ required: true, message: 'Введите название', trigger: ['blur'] }],
      host: [{ required: true, message: 'Введите host', trigger: ['blur'] }],
      port: [
        {
          required: true,
          type: 'number',
          message: 'Введите порт',
          trigger: ['blur', 'change'],
        },
      ],
      database: [
        { required: true, message: 'Введите имя БД', trigger: ['blur'] },
      ],
      username: [
        { required: true, message: 'Введите логин', trigger: ['blur'] },
      ],
      password: [
        {
          required: isCreate,
          message: 'Введите пароль',
          trigger: ['blur'],
        },
      ],
    }
  })

  function resetForm() {
    Object.assign(form, createEmptyForm())
    editingId.value = null
  }

  function openCreate() {
    resetForm()
    dialogMode.value = 'create'
    isDialogOpen.value = true
  }

  function openEdit(ds: ApiDatasource) {
    resetForm()
    dialogMode.value = 'edit'
    editingId.value = ds.id
    form.name = ds.name
    form.host = ds.host
    form.port = ds.port
    form.database = ds.database
    form.username = ds.username
    form.is_active = ds.is_active
    isDialogOpen.value = true
  }

  async function onSubmit() {
    try {
      await formRef.value?.validate()
    } catch {
      return
    }

    if (dialogMode.value === 'create') {
      await createMutation.mutateAsync({
        name: form.name.trim(),
        host: form.host.trim(),
        port: form.port,
        database: form.database.trim(),
        username: form.username.trim(),
        password: form.password,
        is_active: form.is_active,
      })
    } else if (editingId.value) {
      const dto: DatasourceUpdateDto = {
        name: form.name.trim(),
        host: form.host.trim(),
        port: form.port,
        database: form.database.trim(),
        username: form.username.trim(),
        is_active: form.is_active,
      }
      if (form.password) dto.password = form.password
      await updateMutation.mutateAsync({ id: editingId.value, dto })
    }
    isDialogOpen.value = false
  }

  function confirmRemove(ds: ApiDatasource) {
    dialog.warning({
      title: 'Удалить источник?',
      content: `Источник «${ds.name}» будет удалён без возможности восстановления.`,
      positiveText: 'Удалить',
      negativeText: 'Отмена',
      onPositiveClick: () => removeMutation.mutate(ds.id),
    })
  }

  function onTest(ds: ApiDatasource) {
    testMutation.mutate(ds.id)
  }

  const testingId = computed(() =>
    testMutation.isPending.value ? testMutation.variables.value : null,
  )

  const columns = computed<DataTableColumns<ApiDatasource>>(() => [
    { title: 'Название', key: 'name' },
    {
      title: 'Подключение',
      key: 'connection',
      render: (row) => `${row.host}:${row.port}/${row.database}`,
    },
    { title: 'Логин', key: 'username' },
    {
      title: 'Активен',
      key: 'is_active',
      render: (row) =>
        h(
          NTag,
          { type: row.is_active ? 'success' : 'error', size: 'small' },
          { default: () => (row.is_active ? 'да' : 'нет') },
        ),
    },
    {
      title: 'Создан',
      key: 'created_at',
      render: (row) => formatDateTime(row.created_at),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 320,
      render: (row) =>
        h(NSpace, { size: 'small', wrap: false }, () => [
          h(
            NButton,
            {
              size: 'small',
              loading: testingId.value === row.id,
              onClick: () => onTest(row),
            },
            { default: () => 'Проверить' },
          ),
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
    datasourcesQuery,
    datasources,
    columns,
    isDialogOpen,
    dialogMode,
    form,
    rules,
    isSubmitting,
    openCreate,
    onSubmit,
  }
}
