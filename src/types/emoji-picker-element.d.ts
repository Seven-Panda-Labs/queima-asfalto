import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type EmojiPickerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  locale?: string
  'data-source'?: string
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'emoji-picker': EmojiPickerAttributes
    }
  }
}
