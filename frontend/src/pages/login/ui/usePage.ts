import type { FormInst, FormRules } from 'naive-ui'
import { useSessionStore } from '@/entities/user'
import { RouteNames } from '@/shared/config/routes'

export function usePage() {
  const router = useRouter()
  const session = useSessionStore()

  const formRef = useTemplateRef<FormInst>('formRef')
  const model = ref({ username: '', password: '' })

  const rules: FormRules = {
    username: { required: true, message: 'Введите логин', trigger: 'blur' },
    password: { required: true, message: 'Введите пароль', trigger: 'blur' },
  }

  async function onSubmit(e: Event) {
    e.preventDefault()
    await formRef.value?.validate()
    try {
      await session.login(model.value.username, model.value.password)
      const redirect = router.currentRoute.value.query.redirect as string | undefined
      if (redirect) router.replace(redirect)
      else router.replace({ name: RouteNames.HOME })
    } catch {
      // ошибка уже показана глобальным toast в axios interceptor
    }
  }

  return {
    session,
    formRef,
    model,
    rules,
    onSubmit,
  }
}
