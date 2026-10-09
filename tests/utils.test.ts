import {describe, expect, it} from 'vitest';
import {channelIdentifier, expired, kindOf, median, parseDuration, prettyNumber} from '../src/lib/utils';
import type {Video} from '../src/lib/types';
const base:Video={id:'v',channelId:'c',title:'t',description:'',thumbnail:'',publishedAt:'2026-10-09T00:00:00Z',durationSeconds:120,categoryId:'28',viewCount:100,likeCount:null,commentCount:null,fetchedAt:'2026-10-09T00:00:00Z'};
describe('채널 및 영상 유틸리티',()=>{
 it('채널 URL과 @handle을 정확히 해석한다',()=>{expect(channelIdentifier('https://youtube.com/@GoogleDevelopers')).toEqual({handle:'@GoogleDevelopers'});expect(channelIdentifier('UC1234567890123456789012')).toEqual({id:'UC1234567890123456789012'});expect(channelIdentifier('요리 유튜버')).toEqual({search:'요리 유튜버'});});
 it('영상 길이를 초 단위로 바꾼다',()=>{expect(parseDuration('PT1H2M3S')).toBe(3723);expect(parseDuration('PT15M')).toBe(900);expect(parseDuration('PT2M30S')).toBe(150);});
 it('짧은 영상은 임의로 쇼츠로 확정하지 않는다',()=>{expect(kindOf(base)).toBe('unknown');expect(kindOf({...base,durationSeconds:181})).toBe('long');expect(kindOf({...base,kindOverride:'short'})).toBe('short');});
 it('누락된 숫자를 0으로 표기하지 않는다',()=>{expect(prettyNumber(null)).toBe('비공개');expect(prettyNumber(15000)).toBe('1.5만');});
 it('중앙값 및 30일 만료를 확인한다',()=>{expect(median([2,20,8])).toBe(8);expect(median([])).toBeNull();expect(expired('2026-09-01T00:00:00Z',Date.parse('2026-10-09T00:00:00Z'))).toBe(true);});
});
