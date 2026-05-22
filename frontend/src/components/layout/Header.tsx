interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-16 items-center border-b bg-white px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
    </header>
  )
}
