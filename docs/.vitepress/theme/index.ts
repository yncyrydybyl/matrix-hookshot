import { h, nextTick, watch } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { createMermaidRenderer } from 'vitepress-mermaid-renderer'
import '@catppuccin/vitepress/theme/mocha/green.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark } = useData()

    const initMermaid = () => {
      createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'forest',
        toolbar: {
          zoomIn: true,
          zoomOut: true,
          resetZoom: true,
          fullscreen: true,
          copyCode: true,
          download: {
            svg: true,
            png: true,
          },
          position: 'top-right',
        },
      })
    }

    nextTick(() => initMermaid())

    watch(
      () => isDark.value,
      () => initMermaid(),
    )

    return h(DefaultTheme.Layout)
  },
} satisfies Theme
