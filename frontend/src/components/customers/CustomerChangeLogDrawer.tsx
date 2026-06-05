import { useState } from 'react'
import { History } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { CustomerChangeLogContent } from './CustomerChangeLog'

/**
 * Floating right-edge button that opens the customer change log in a slide-over
 * drawer — keeps the profile page itself clean.
 */
export function CustomerChangeLogDrawer({ customerId }: { customerId: number }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="View change log"
        className="fixed right-0 top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 rounded-l-lg bg-gray-900 py-3 pl-3 pr-2.5 text-white shadow-lg transition-all hover:pr-4 hover:bg-gray-800"
      >
        <History size={18} />
        <span className="text-xs font-medium [writing-mode:vertical-rl] rotate-180">Change Log</span>
      </button>

      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Change Log"
        description="Audit trail of all edits to this customer."
      >
        <CustomerChangeLogContent customerId={customerId} />
      </Drawer>
    </>
  )
}
