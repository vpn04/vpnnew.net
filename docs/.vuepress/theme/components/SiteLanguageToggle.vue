<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoutePath } from 'vuepress/client'

type Language = 'zh' | 'en'

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (options: Record<string, unknown>, elementId: string) => void
      }
    }
    googleTranslateElementInit?: () => void
    __youyouTranslateReady?: boolean
  }
}

const routePath = useRoutePath()
const language = ref<Language>('zh')
const isLoading = ref(false)
const storageKey = 'youyou-site-language'
const translateContainerId = 'google_translate_element'
const translateScriptId = 'youyou-google-translate-script'

let toggleRoot: HTMLDivElement | undefined
let toggleButton: HTMLButtonElement | undefined
let retryTimers: number[] = []
let chromeCleanupTimers: number[] = []
let cleanupObserver: MutationObserver | undefined
let cleanupQueued = false
let translateAttemptToken = 0

const googleChromeSelectors = [
  '.goog-te-banner-frame',
  '.goog-te-balloon-frame',
  '.goog-te-menu-frame',
  '.goog-te-spinner-pos',
  '.goog-te-gadget',
  '#goog-gt-tt',
  'iframe.skiptranslate',
  'body > .skiptranslate',
  '.VIpgJd-ZVi9od-ORHb',
  '.VIpgJd-ZVi9od-ORHb-OEVmcd',
  '.VIpgJd-yAWNEb-L7lbkb',
  '.VIpgJd-ZVi9od-aZ2wEe',
  '.VIpgJd-ZVi9od-aZ2wEe-wOHMyf',
  '.VIpgJd-ZVi9od-aZ2wEe-OiiCO',
]

const clearRetryTimers = (): void => {
  translateAttemptToken += 1
  retryTimers.forEach((timer) => window.clearTimeout(timer))
  retryTimers = []
}

const clearChromeCleanupTimers = (): void => {
  chromeCleanupTimers.forEach((timer) => window.clearTimeout(timer))
  chromeCleanupTimers = []
}

const setImportantStyle = (element: HTMLElement, property: string, value: string): void => {
  if (element.style.getPropertyValue(property) === value && element.style.getPropertyPriority(property) === 'important') {
    return
  }

  element.style.setProperty(property, value, 'important')
}

const hideGoogleTranslateChrome = (): void => {
  if (typeof document === 'undefined') return

  setImportantStyle(document.documentElement, 'top', '0px')
  setImportantStyle(document.documentElement, 'margin-top', '0px')
  setImportantStyle(document.body, 'top', '0px')
  setImportantStyle(document.body, 'margin-top', '0px')

  document.querySelectorAll<HTMLElement>(googleChromeSelectors.join(',')).forEach((element) => {
    if (element.id === translateContainerId) return

    setImportantStyle(element, 'display', 'none')
    setImportantStyle(element, 'visibility', 'hidden')
    setImportantStyle(element, 'height', '0')
    setImportantStyle(element, 'min-height', '0')
    setImportantStyle(element, 'opacity', '0')
    setImportantStyle(element, 'pointer-events', 'none')
  })
}

const queueChromeCleanup = (): void => {
  if (cleanupQueued || typeof window === 'undefined') return

  cleanupQueued = true
  window.requestAnimationFrame(() => {
    cleanupQueued = false
    hideGoogleTranslateChrome()
  })
}

const setupChromeCleanupObserver = (): void => {
  if (typeof document === 'undefined' || cleanupObserver) return

  cleanupObserver = new MutationObserver(queueChromeCleanup)
  cleanupObserver.observe(document.body, {
    attributes: false,
    childList: true,
    subtree: true,
  })
}

const scheduleChromeCleanup = (): void => {
  clearChromeCleanupTimers()
  hideGoogleTranslateChrome()

  const delays = [0, 120, 300, 700, 1500, 3000]
  chromeCleanupTimers = delays.map((delay) => window.setTimeout(hideGoogleTranslateChrome, delay))
}

const setCookie = (name: string, value: string, maxAge: number): void => {
  const cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
  document.cookie = cookie

  const hostname = window.location.hostname
  if (hostname.includes('.') && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    document.cookie = `${name}=${value}; domain=.${hostname.replace(/^www\./, '')}; path=/; max-age=${maxAge}; SameSite=Lax`
  }
}

const clearTranslateCookie = (): void => {
  setCookie('googtrans', '', 0)
}

const setTranslateCookie = (targetLanguage: Language): void => {
  if (targetLanguage === 'zh') {
    clearTranslateCookie()
    return
  }

  setCookie('googtrans', '/zh-CN/en', 31536000)
}

const ensureTranslateContainer = (): void => {
  if (document.getElementById(translateContainerId)) return

  const container = document.createElement('div')
  container.id = translateContainerId
  container.setAttribute('aria-hidden', 'true')
  document.body.append(container)
  hideGoogleTranslateChrome()
}

const initGoogleTranslate = (): void => {
  ensureTranslateContainer()
  setupChromeCleanupObserver()
  scheduleChromeCleanup()

  if (window.__youyouTranslateReady) return
  if (!window.google?.translate?.TranslateElement) return

  new window.google.translate.TranslateElement(
    {
      pageLanguage: 'zh-CN',
      includedLanguages: 'en,zh-CN',
      autoDisplay: false,
      multilanguagePage: true,
    },
    translateContainerId,
  )
  window.__youyouTranslateReady = true
  scheduleChromeCleanup()
}

const findTranslateCombo = (): HTMLSelectElement | null =>
  document.querySelector<HTMLSelectElement>('.goog-te-combo')

const dispatchComboChange = (combo: HTMLSelectElement): void => {
  combo.dispatchEvent(new Event('input', { bubbles: true }))
  combo.dispatchEvent(new Event('change', { bubbles: true }))
}

const applyGoogleTranslate = (): boolean => {
  initGoogleTranslate()
  scheduleChromeCleanup()

  const combo = findTranslateCombo()
  if (!combo) return false

  if (language.value === 'en') {
    if (combo.value === 'en') {
      return true
    }

    combo.value = 'en'
  } else {
    if (!combo.value) {
      return true
    }

    combo.value = ''
  }

  dispatchComboChange(combo)
  scheduleChromeCleanup()
  return true
}

const scheduleTranslateApply = (): void => {
  clearRetryTimers()

  const token = ++translateAttemptToken
  const delays = [0, 300, 900, 1800, 3200, 5500]

  const attempt = (index: number): void => {
    const timer = window.setTimeout(() => {
      if (token !== translateAttemptToken) return

      const applied = applyGoogleTranslate()
      if (applied) {
        retryTimers = retryTimers.filter((item) => item !== timer)
        isLoading.value = false
        updateToggleButton()
        scheduleChromeCleanup()
        return
      }

      retryTimers = retryTimers.filter((item) => item !== timer)
      if (index + 1 < delays.length) {
        attempt(index + 1)
      } else {
        isLoading.value = false
        updateToggleButton()
      }
    }, delays[index])

    retryTimers.push(timer)
  }

  attempt(0)
}

const loadGoogleTranslate = (): void => {
  ensureTranslateContainer()
  setupChromeCleanupObserver()
  scheduleChromeCleanup()

  window.googleTranslateElementInit = () => {
    initGoogleTranslate()
    scheduleTranslateApply()
  }

  if (document.getElementById(translateScriptId)) {
    scheduleTranslateApply()
    return
  }

  const script = document.createElement('script')
  script.id = translateScriptId
  script.async = true
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  script.onerror = () => {
    isLoading.value = false
    updateToggleButton()
  }
  document.body.append(script)
  scheduleChromeCleanup()
}

const updateToggleButton = (): void => {
  if (!toggleButton) return

  const label = toggleButton.querySelector('.site-language-toggle__label')
  const icon = toggleButton.querySelector('.site-language-toggle__icon')

  toggleButton.setAttribute('aria-pressed', String(language.value === 'en'))
  toggleButton.setAttribute('title', language.value === 'en' ? 'Switch site to Chinese' : 'Switch site to English')

  if (icon) icon.textContent = language.value === 'en' ? 'CN' : 'EN'
  if (label) label.textContent = isLoading.value ? 'Translating' : language.value === 'en' ? 'Chinese' : 'English'
}

const insertToggleButton = (): void => {
  if (!toggleRoot) return

  const content = document.querySelector('#VPContent')
  if (content?.parentElement) {
    content.parentElement.insertBefore(toggleRoot, content)
  } else {
    document.body.prepend(toggleRoot)
  }
}

const ensureToggleButton = (): void => {
  if (typeof document === 'undefined' || toggleRoot) return

  toggleRoot = document.createElement('div')
  toggleRoot.id = 'site-language-toggle'
  toggleRoot.className = 'site-language-toggle notranslate'
  toggleRoot.setAttribute('aria-label', 'Site language switcher')
  toggleRoot.setAttribute('translate', 'no')

  toggleButton = document.createElement('button')
  toggleButton.type = 'button'
  toggleButton.className = 'site-language-toggle__button notranslate'
  toggleButton.setAttribute('translate', 'no')
  toggleButton.addEventListener('click', toggleLanguage)

  const icon = document.createElement('span')
  icon.className = 'site-language-toggle__icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.setAttribute('translate', 'no')

  const label = document.createElement('span')
  label.className = 'site-language-toggle__label'
  label.setAttribute('translate', 'no')

  toggleButton.append(icon, label)
  toggleRoot.append(toggleButton)
  updateToggleButton()
  insertToggleButton()
}

const syncLanguageState = (): void => {
  setupChromeCleanupObserver()
  scheduleChromeCleanup()
  ensureToggleButton()
  insertToggleButton()
  updateToggleButton()

  if (language.value === 'en') {
    setTranslateCookie('en')
    isLoading.value = true
    loadGoogleTranslate()
    scheduleTranslateApply()
  }
}

function toggleLanguage(): void {
  language.value = language.value === 'en' ? 'zh' : 'en'
  window.localStorage.setItem(storageKey, language.value)
  scheduleChromeCleanup()

  if (language.value === 'zh') {
    clearTranslateCookie()
    window.location.reload()
    return
  }

  isLoading.value = true
  updateToggleButton()
  setTranslateCookie('en')
  loadGoogleTranslate()
  scheduleTranslateApply()
}

onMounted(() => {
  language.value = window.localStorage.getItem(storageKey) === 'en' ? 'en' : 'zh'
  setupChromeCleanupObserver()
  scheduleChromeCleanup()
  void nextTick(syncLanguageState)
  window.setTimeout(syncLanguageState, 200)
})

watch(routePath, () => {
  void nextTick(syncLanguageState)
  window.setTimeout(syncLanguageState, 400)
  window.setTimeout(syncLanguageState, 1200)
})

onBeforeUnmount(() => {
  clearRetryTimers()
  clearChromeCleanupTimers()
  cleanupObserver?.disconnect()
  toggleRoot?.remove()
})
</script>

<template>
  <span hidden aria-hidden="true" />
</template>
