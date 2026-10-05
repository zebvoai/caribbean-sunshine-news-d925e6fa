// Pings IndexNow (Bing, Yandex, Seznam, DuckDuckGo via Bing) so new/updated articles get crawled fast.
const HOST = "www.dominicanews.dm";
const KEY = "7f3c9a2e5b8d4e1fa6c0b9d2e4f8a1c3";

export async function pingIndexNow(slugs: string[]): Promise<void> {
  const urlList = slugs.filter(Boolean).map((s) => `https://${HOST}/news/${s}`);
  if (!urlList.length) return;
  urlList.push(`https://${HOST}/`);
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList,
      }),
    });
    console.log("IndexNow ping", res.status, urlList.length);
  } catch (e) {
    console.error("IndexNow ping failed", e);
  }
}
