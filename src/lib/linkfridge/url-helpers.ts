/** Take a single URL from input (first line; if pasted twice without newline, take first URL only). */
export function getSingleUrl(input: string): string {
  const firstLine = input.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return "";
  try {
    new URL(firstLine);
    return firstLine;
  } catch {
    const protocol = firstLine.startsWith("https://")
      ? "https://"
      : firstLine.startsWith("http://")
        ? "http://"
        : null;
    if (protocol) {
      const rest = firstLine.slice(protocol.length);
      const nextStart = rest.indexOf("https://");
      const nextStartHttp = rest.indexOf("http://");
      const next =
        nextStart === -1 ? nextStartHttp : nextStartHttp === -1 ? nextStart : Math.min(nextStart, nextStartHttp);
      const single = next === -1 ? firstLine : protocol + rest.slice(0, next);
      try {
        new URL(single);
        return single;
      } catch {
        return firstLine;
      }
    }
  }
  return firstLine;
}

export function normalizeLinkUrl(url: string): string {
  const firstLine = url.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return url;
  try {
    let single = firstLine;
    if (firstLine.includes("https://") || firstLine.includes("http://")) {
      const protocol = firstLine.startsWith("https://")
        ? "https://"
        : firstLine.startsWith("http://")
          ? "http://"
          : null;
      if (protocol) {
        const rest = firstLine.slice(protocol.length);
        const next = Math.min(
          rest.indexOf("https://") === -1 ? 1e9 : rest.indexOf("https://"),
          rest.indexOf("http://") === -1 ? 1e9 : rest.indexOf("http://")
        );
        single = next > 0 && next < 1e9 ? protocol + rest.slice(0, next) : firstLine;
      }
    }
    const u = new URL(single);
    if ((u.hostname === "youtu.be" || u.hostname.includes("youtube.com")) && u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.replace(/^\/shorts\//, "").split("/")[0].split("?")[0];
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    if (u.hostname === "youtu.be" && u.pathname.length > 1) {
      const id = u.pathname.slice(1).split("/")[0].split("?")[0];
      if (id) return `https://www.youtube.com/watch?v=${id}`;
    }
    return single;
  } catch {
    return firstLine;
  }
}
