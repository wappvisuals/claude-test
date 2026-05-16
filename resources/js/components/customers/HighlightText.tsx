interface HighlightTextProps {
  text: string | null
  tokens: string[]
  className?: string
}

export function HighlightText({ text, tokens, className }: HighlightTextProps) {
  if (!text) return null

  const activeTokens = tokens.filter((t) => t.trim().length > 0)
  if (activeTokens.length === 0) {
    return <span className={className}>{text}</span>
  }

  const pattern = activeTokens
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)

  // split() with a capturing group alternates: [plain, match, plain, match, ...]
  // odd indices are always the captured (matching) segments
  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-yellow-200 text-inherit rounded-sm px-0.5 font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  )
}
