import type { DataTableColumns, FormInst, FormRules } from 'naive-ui'
import { NButton, NSpace, NTag } from 'naive-ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useSessionStore,
  usersAPI,
  type ApiUser,
  type UserCreateDto,
  type UserUpdateDto,
} from '@/entities/user'
import { formatDateTime } from '@/shared/lib'
import type {
  AdminUserDialogMode,
  AdminUserFormState,
  RoleOption,
} from '../model/types'

const USERS_QUERY_KEY = ['admin-users']
const PASSWORD_MIN_LENGTH = 6

const roleOptions: RoleOption[] = [
  { label: 'Viewer', value: 'viewer' },
  { label: 'Admin', value: 'admin' },
]

function createEmptyForm(): AdminUserFormState {
  return { username: '', password: '', role: 'viewer', is_active: true }
}

export function useAdminUsersPage() {
  const session = useSessionStore()
  const queryClient = useQueryClient()
  const message = useMessage()
  const dialog = useDialog()

  const usersQuery = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => usersAPI.list(),
  })

  const users = computed<ApiUser[]>(() => usersQuery.data.value?.users ?? [])

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })

  const createMutation = useMutation({
    mutationFn: (dto: UserCreateDto) => usersAPI.create(dto),
    onSuccess: () => {
      message.success('Пользователь создан')
      invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UserUpdateDto }) =>
      usersAPI.update(id, dto),
    onSuccess: () => {
      message.success('Пользователь обновлён')
      invalidate()
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersAPI.remove(id),
    onSuccess: () => {
      message.success('Пользователь деактивирован')
      invalidate()
    },
  })

  const isSelf = (u: ApiUser) => session.user?.id === u.id

  const isDialogOpen = ref(false)
  const dialogMode = ref<AdminUserDialogMode>('create')
  const editingId = ref<string | null>(null)
  const formRef = useTemplateRef<FormInst>('formRef')
  const form = reactive<AdminUserFormState>(createEmptyForm())

  const rules = computed<FormRules>(() => {
    const isCreate = dialogMode.value === 'create'
    return {
      username: [
        { required: isCreate, message: 'Введите логин', trigger: ['blur'] },
      ],
      password: [
        { required: isCreate, message: 'Введите пароль', trigger: ['blur'] },
        {
          validator: (_r, v: string) =>
            !v || v.length >= PASSWORD_MIN_LENGTH
              ? true
              : new Error(`Минимум ${PASSWORD_MIN_LENGTH} символов`),
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

  function openEdit(u: ApiUser) {
    resetForm()
    dialogMode.value = 'edit'
    editingId.value = u.id
    form.username = u.username
    form.role = u.role
    form.is_active = u.is_active ?? true
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
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        is_active: form.is_active,
      })
    } else if (editingId.value) {
      const dto: UserUpdateDto = {
        role: form.role,
        is_active: form.is_active,
      }
      if (form.password) dto.password = form.password
      await updateMutation.mutateAsync({ id: editingId.value, dto })
    }
    isDialogOpen.value = false
  }

  function confirmDeactivate(u: ApiUser) {
    dialog.warning({
      title: 'Деактивировать пользователя?',
      content: `Логин: ${u.username}. Пользователь не сможет входить в систему.`,
      positiveText: 'Деактивировать',
      negativeText: 'Отмена',
      onPositiveClick: () => deactivateMutation.mutate(u.id),
    })
  }

  const columns = computed<DataTableColumns<ApiUser>>(() => [
    { title: 'Логин', key: 'username' },
    {
      title: 'Роль',
      key: 'role',
      render: (row) =>
        h(
          NTag,
          { type: row.role === 'admin' ? 'success' : 'default', size: 'small' },
          { default: () => row.role },
        ),
    },
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
      width: 260,
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
              disabled: isSelf(row) || !row.is_active,
              loading: deactivateMutation.isPending.value
                && deactivateMutation.variables.value === row.id,
              onClick: () => confirmDeactivate(row),
            },
            { default: () => 'Деактивировать' },
          ),
        ]),
    },
  ])

  const isSubmitting = computed(
    () => createMutation.isPending.value || updateMutation.isPending.value,
  )

  return {
    usersQuery,
    columns,
    users,
    isDialogOpen,
    dialogMode,
    form,
    rules,
    roleOptions,
    isSubmitting,
    openCreate,
    onSubmit,
  }
}
