export interface Comment {
  index: number
  text: string
  author: string
  date: string       // YYYY-MM-DD
  time: string       // HH:MM
  scope: string      // e.g. "all", "grace"
  raw: string        // original line — preserved for non-parseable entries
  parseable: boolean
}

// Matches: "{text} /{author}, {YYYY-MM-DD}, {HH:MM} @{scope}"
const COMMENT_RE = /^(.*?)\s+\/([^,\n]+),\s*(\d{4}-\d{2}-\d{2}),\s*(\d{2}:\d{2})\s+@(.+?)\s*$/

export function parseComments(raw: string | null): Comment[] {
  if (!raw?.trim()) return []
  return raw
    .split('\n')
    .filter(line => line.trim() !== '')
    .map((line, index) => {
      const m = line.match(COMMENT_RE)
      if (m) {
        return {
          index,
          text: m[1].trim(),
          author: m[2].trim(),
          date: m[3],
          time: m[4],
          scope: m[5],
          raw: line,
          parseable: true,
        }
      }
      return { index, text: line, author: '', date: '', time: '', scope: '', raw: line, parseable: false }
    })
}

export function serializeComments(comments: Comment[]): string {
  return comments
    .map(c =>
      c.parseable
        ? `${c.text} /${c.author}, ${c.date}, ${c.time} @${c.scope}`
        : c.raw
    )
    .join('\n')
}

export function buildCommentLine(text: string, author: string, scope: string): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const time = now.toTimeString().slice(0, 5)
  return `${text.trim()} /${author.trim()}, ${date}, ${time} @${scope.trim() || 'all'}`
}
