// @vitest-environment jsdom
/**
 * Smoke: Persian is selectable, mirrors the document, and keeps chat-facing
 * Persian/common strings translated.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { apply as settingsApply, inject as settingsInject } from '@deepseek-ai/dsh-client-ui-settings/client'
import { TestRemote } from '@deepseek-ai/dsh-client-test-runtime'
import { apply, inject, type LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { LOCALE_SETTINGS_NAMESPACE, LocaleSettingsSchema } from '../src/locale-settings.ts'
import { fa as chatFa } from '../../ui-chat/src/client/locale.ts'
import { fa as conversationFa } from '../../ui-conversation/src/client/locales.ts'

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  let stored: string | undefined
  let revision = 0
  const namespace = () => ({
    ns: LOCALE_SETTINGS_NAMESPACE,
    schema: LocaleSettingsSchema.toJSON(),
    value: stored === undefined ? {} : { preference: stored },
    autoGenerate: true, applies: 'live' as const,
    secrets: [],
    revision,
  })
  new TestRemote(ctx, {
    settings: {
      describe: vi.fn(async () => ({
        ok: true as const,
        value: { writable: true, hasDocument: true, namespaces: [namespace()] },
      })),
      mutate: vi.fn(async (_ns: string, ops: { value: string }[]) => {
        stored = ops[0]!.value
        revision += 1
        return { ok: true as const, value: namespace() }
      }),
    },
  })
  await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
  await ctx.plugin({ inject: [...inject], apply }).await()
  return ctx.get('locale') as LocaleRuntime
}

describe('Persian RTL smoke', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en'
    document.documentElement.dir = ''
    Object.defineProperty(navigator, 'languages', { value: ['en-US'], configurable: true })
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
  })

  afterEach(() => {
    const own = navigator as unknown as Record<string, unknown>
    delete own.languages
    delete own.language
  })

  it('activates فارسی, mirrors rtl, and translates primary UI keys', async () => {
    const locale = await bench()
    expect(locale.getLocale().locales.some(l => l.id === 'fa' && l.label === 'فارسی')).toBe(true)
    locale.setLocale('fa')
    expect(locale.getLocale().active).toBe('fa')
    expect(document.documentElement.lang).toBe('fa')
    expect(document.documentElement.dir).toBe('rtl')
    expect(locale.bind('common')('cancel')).toBe('لغو')
    expect(locale.bind('settings.locale')('language.title')).toBe('زبان')
    expect(chatFa['view.chat']).toBe('گفتگو')
    expect(chatFa['message.stepProcess.thinking']).toBe('در حال تحلیل درخواست')
    expect(conversationFa['input.send']).toBe('ارسال پیام')
    expect(conversationFa['placeholder.default']).toContain('پیام')
  })

  it('detects fa-IR from the browser language list', async () => {
    Object.defineProperty(navigator, 'languages', { value: ['fa-IR', 'en-US'], configurable: true })
    Object.defineProperty(navigator, 'language', { value: 'fa-IR', configurable: true })
    const locale = await bench()
    expect(locale.getLocale().active).toBe('fa')
    expect(document.documentElement.dir).toBe('rtl')
  })
})
