import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MarkdownDocument } from './MarkdownDocument'

afterEach(() => {
  cleanup()
})

describe('MarkdownDocument', () => {
  it('reads right to left in Arabic', () => {
    const { container } = render(<MarkdownDocument language="ar" markdown="مرحبا" />)

    expect(container.querySelector('article')).toHaveAttribute('dir', 'rtl')
  })

  it('reads left to right for Latin locales', () => {
    const { container } = render(<MarkdownDocument language="pt" markdown="Olá" />)

    expect(container.querySelector('article')).toHaveAttribute('dir', 'ltr')
  })

  it('renders tables from GitHub flavoured markdown', () => {
    render(<MarkdownDocument language="en" markdown={'| A | B |\n| - | - |\n| 1 | 2 |'} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('shows the fallback instead of the markdown while content loads', () => {
    render(<MarkdownDocument language="en" markdown="Ready" fallback={<p>Loading</p>} />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Ready')).not.toBeInTheDocument()
  })
})
