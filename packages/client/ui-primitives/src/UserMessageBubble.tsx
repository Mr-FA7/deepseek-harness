/** Shared user-message background, typography, and content inset. */
import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'
import css from './UserMessageBubble.module.css'

/** Native div attributes for user-authored message content. */
export type UserMessageBubbleProps = ComponentPropsWithoutRef<'div'>

/**
 * Render user-style message content without row placement or actions.
 * @param props - Native div attributes and the caller-owned content.
 * @returns A theme-aware message surface that wraps its content.
 */
export function UserMessageBubble({ className, ...props }: UserMessageBubbleProps) {
  // dir=auto follows the first strong letter, so a Persian bubble is RTL and an
  // English one stays LTR. Callers can still override dir.
  return <div dir="auto" {...props} className={clsx(css.bubble, className)} />
}
