import { describe, expect, it } from 'vitest'
import {
  buildParkrunProfileUrl,
  parkrunFetchHeadersForBase,
  parkrunProfileUrl,
  PARKRUN_PROFILE_BASE_URLS,
} from './parkrunProfile'

describe('parkrunProfile', () => {
  it('builds profile urls for each base', () => {
    expect(parkrunProfileUrl('A490')).toBe('https://www.parkrun.com.de/parkrunner/490/all/')
    expect(buildParkrunProfileUrl(PARKRUN_PROFILE_BASE_URLS[1]!, '490')).toBe(
      'https://www.parkrun.org.uk/parkrunner/490/all/',
    )
  })

  it('adds referer headers per base', () => {
    expect(parkrunFetchHeadersForBase('https://www.parkrun.org.uk')).toMatchObject({
      Referer: 'https://www.parkrun.org.uk/',
      'User-Agent': expect.stringContaining('Mozilla'),
    })
  })
})
