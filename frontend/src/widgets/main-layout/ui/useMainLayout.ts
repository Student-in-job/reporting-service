import { useSessionStore } from '@/entities/user'
import { RouteNames } from '@/shared/config/routes'
import { useReportsMenu } from '../lib/useReportsMenu'

export function useMainLayout() {
  const route = useRoute()
  const router = useRouter()
  const session = useSessionStore()
  const sidebar = useSidebar()

  const isAuthenticated = computed(() => session.isAuthenticated)
  const isAdmin = computed(() => session.isAdmin)

  const { options: menuOptions } = useReportsMenu({
    enabled: isAuthenticated,
    isAdmin,
  })

  const activeKey = computed(() => route.path)

  function onMenuSelect(key: string) {
    if (key.startsWith('/')) router.push(key)
  }

  function onLogout() {
    session.logout()
    router.push({ name: RouteNames.LOGIN })
  }

  return {
    route,
    session,
    sidebar,
    menuOptions,
    activeKey,
    onMenuSelect,
    onLogout,
  }
}
