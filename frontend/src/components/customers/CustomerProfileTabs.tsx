import { NavLink } from 'react-router-dom'

/**
 * Sub-navigation inside a customer profile. Switches between the Overview
 * (details, subscriptions, etc.) and the dedicated Sinfrid dashboard.
 */
export function CustomerProfileTabs({ id }: { id: number }) {
  const tabs = [
    { to: `/customers/${id}`, label: 'Overview', end: true },
    { to: `/customers/${id}/sinfrid`, label: 'Sinfrid Account', end: false },
    { to: `/customers/${id}/comments`, label: 'Comments', end: false },
    { to: `/customers/${id}/changes`, label: 'Change Logs', end: false },
  ]

  return (
    <div className="flex gap-5 border-b border-[#EBEBF5] bg-white px-6">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            [
              'border-b-2 py-3 text-[13px] font-medium transition-colors',
              isActive
                ? 'border-[#00C48C] text-[#00C48C]'
                : 'border-transparent text-gray-400 hover:text-[#1A1A2E]',
            ].join(' ')
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  )
}
