import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_GUIDE_STEP_TITLES, RADAR_SITE_REFERRER, readSecurityFlags, saveSecurityFlags } from '../src/components/ApiKeyGuide';

describe('초보자 API 키 가이드', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('정확히 일곱 단계이며 OAuth 단계가 없다', () => {
    expect(API_GUIDE_STEP_TITLES).toHaveLength(7);
    expect(API_GUIDE_STEP_TITLES.join(' ')).not.toMatch(/OAuth|동의 화면|클라이언트 보안/);
  });
  it('실제 Radar 운영 도메인을 제한 값으로 안내한다', () => {
    expect(RADAR_SITE_REFERRER).toBe('https://youtube-radar-six.vercel.app/*');
  });
  it('보안 확인 기록은 불리언으로만 저장하고 다시 읽는다', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', {localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {values.set(key, value);},
    }});
    saveSecurityFlags({ site: true, api: false });
    expect(readSecurityFlags()).toEqual({ site: true, api: false });
  });
  it('손상된 또는 조작된 저장 기록을 안전하게 처리한다', () => {
    vi.stubGlobal('window', {localStorage: {getItem: () => '{bad json'}});
    expect(readSecurityFlags()).toEqual({ site: false, api: false });
    vi.stubGlobal('window', {localStorage: {getItem: () => '{"site":"true","api":true}'}});
    expect(readSecurityFlags()).toEqual({ site: false, api: true });
  });
});
