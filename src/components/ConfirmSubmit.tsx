'use client'

import type { ButtonHTMLAttributes } from 'react'

type ConfirmSubmitProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  message: string
}

export function ConfirmSubmit({ message, onClick, ...props }: ConfirmSubmitProps) {
  return (
    <button
      {...props}
      type="submit"
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented && !window.confirm(message)) event.preventDefault()
      }}
    />
  )
}
