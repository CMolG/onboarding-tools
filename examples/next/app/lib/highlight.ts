const cache = new Map<string, string>();

export async function highlightCode(code: string, lang = 'tsx') {
  const key = `${lang}:${code}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const { codeToHtml } = await import('shiki');
  const html = await codeToHtml(code, {
    lang,
    theme: 'github-light',
  });
  cache.set(key, html);
  return html;
}
