import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import packageJson from '../../../package.json'
import { Changelog } from './Changelog'

const scrollIntoView = vi.fn()

beforeEach(() => {
  scrollIntoView.mockClear()
  // jsdom does not implement scrolling.
  Element.prototype.scrollIntoView = scrollIntoView
})

afterEach(() => {
  cleanup()
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Changelog />
    </MemoryRouter>,
  )
}

describe('Changelog', () => {
  it('shows the latest versions and keeps the rest behind a button', async () => {
    const { container } = renderAt('/novidades')

    const latest = await screen.findByRole('link', { name: new RegExp(`\\[${packageJson.version}\\]`) })
    expect(latest).toHaveAttribute('href', `#${packageJson.version}`)
    expect(container.querySelector('[id="0.1.0"]')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar versões anteriores' }))

    expect(container.querySelector('[id="0.1.0"]')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Mostrar versões anteriores' })).toBeNull()
  })

  it('opens the archive and scrolls when the link names an archived version', async () => {
    const { container } = renderAt('/novidades#0.1.0')

    await screen.findByRole('link', { name: /\[0\.1\.0\]/ })
    expect(scrollIntoView).toHaveBeenCalled()
    expect(scrollIntoView.mock.contexts[0]).toBe(container.querySelector('[id="0.1.0"]'))
  })
})
