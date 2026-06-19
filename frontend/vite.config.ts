import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'pinia',
          '@vueuse/core',
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useNotification',
              'useLoadingBar',
            ],
          },
        ],
        dts: 'src/auto-imports.d.ts',
        dirs: ['src/shared/composables'],
        vueTemplate: true,
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.json',
        },
      }),
      Components({
        resolvers: [NaiveUiResolver()],
        dts: 'src/components.d.ts',
        dirs: [],
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      include: ['naive-ui'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "@/app/styles/settings" as *; @use "@/app/styles/tools" as *;`,
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
