import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { devWarn } from '../lib/debug';

export type AlertLang = 'en' | 'hi' | 'te';

export async function translateAlertText(text: string, target: AlertLang): Promise<string> {
  if (target === 'en' || !text.trim()) {
    return text;
  }
  try {
    const callable = httpsCallable<
      { text: string; target: AlertLang; source?: AlertLang },
      { translatedText: string; mode?: string }
    >(functions, 'translateAlert');
    const { data } = await callable({ text, target, source: 'en' });
    return data.translatedText ?? text;
  } catch (e) {
    devWarn('[translate] translateAlert failed', e);
    return text;
  }
}
