const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function kstTodayString() {
  const now = new Date(Date.now() + KST_OFFSET_MS);
  return now.toISOString().slice(0, 10);
}

export function moveKstDate(dateStr: string, days: number) {
  const base = new Date(`${dateStr}T00:00:00+09:00`);
  const moved = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return new Date(moved.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function utcRangeFromKstDate(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return {
    startUtc: start.toISOString(),
    endUtc: end.toISOString()
  };
}

export function formatTimeInSeoul(isoTime: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(isoTime));
}