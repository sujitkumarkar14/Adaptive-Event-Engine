/**
 * Cloud Translation API v2 (REST) — key from Secret Manager (`TRANSLATION_API_KEY`).
 * @see https://cloud.google.com/translate/docs/reference/rest/v2/translate
 */

const TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

export type TranslationLangCode = "en" | "hi" | "te";

export async function translateText(params: {
    apiKey: string;
    text: string;
    target: TranslationLangCode;
    source?: TranslationLangCode;
}): Promise<string> {
    if (!params.text.trim()) {
        return params.text;
    }
    if (params.target === "en") {
        return params.text;
    }

    const body: Record<string, unknown> = {
        q: params.text,
        target: params.target,
        format: "text",
    };
    if (params.source) {
        body.source = params.source;
    }

    const url = `${TRANSLATE_URL}?key=${encodeURIComponent(params.apiKey)}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
        data?: { translations?: Array<{ translatedText?: string }> };
        error?: { message?: string };
    };

    if (!res.ok || !json.data?.translations?.[0]?.translatedText) {
        const msg = json.error?.message ?? res.statusText ?? "TRANSLATION_ERROR";
        throw new Error(msg);
    }

    return json.data.translations[0].translatedText!;
}
