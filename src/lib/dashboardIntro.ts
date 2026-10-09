/** Browser-local display preference, independent of IndexedDB and API credentials. */
export const DASHBOARD_INTRO_SEEN_KEY='youtube-radar-dashboard-intro-seen-v1';
export type IntroStorage = Pick<Storage,'getItem'|'setItem'>;

export function introHasBeenSeen(store:IntroStorage|null):boolean {
 try {return store?.getItem(DASHBOARD_INTRO_SEEN_KEY)==='1';}
 catch {return false;}
}

export function recordIntroSeen(store:IntroStorage|null):void {
 try {store?.setItem(DASHBOARD_INTRO_SEEN_KEY,'1');}
 catch { /* Private browsing and storage policies may block this preference. */ }
}

export function browserIntroStorage():IntroStorage|null {
 try {return typeof window==='undefined'?null:window.localStorage;}
 catch {return null;}
}
