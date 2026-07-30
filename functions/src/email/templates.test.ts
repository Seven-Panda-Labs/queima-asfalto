import { describe, expect, it } from 'vitest'
import { buildAdminNewUserEmail } from './templates.js'

describe('buildAdminNewUserEmail', () => {
  it('includes branded logo and approval links', () => {
    const { html, subject } = buildAdminNewUserEmail({
      instanceName: 'Test Instance',
      appPublicUrl: 'https://example.web.app',
      approvalHandlerBaseUrl: 'https://example.web.app/api/account-approval',
      tokenSecret: 'test-secret-min-16-chars',
      uid: 'user-abc',
      name: 'Zé Ninguém',
      email: 'ze@example.com',
      language: 'pt',
    })

    expect(subject).toContain('Test Instance')
    expect(html).toContain('https://example.web.app/queima-asfalto-logo.png')
    expect(html).toContain('api/account-approval?token=')
    expect(html).toContain('#2563EB')
  })
})
