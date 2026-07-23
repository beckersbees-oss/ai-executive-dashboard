import {
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CircleUserRound,
  Gauge,
  LogOut,
  MessageSquareText,
  Target,
  X,
} from 'lucide-react'

const navigationItems = [
  {
    id: 'command',
    label: 'Command Center',
    icon: Gauge,
    enabled: true,
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: BrainCircuit,
    enabled: false,
  },
  {
    id: 'priorities',
    label: 'Priorities',
    icon: Target,
    enabled: false,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: CalendarDays,
    enabled: false,
  },
  {
    id: 'chief-of-staff',
    label: 'Chief of Staff',
    icon: MessageSquareText,
    enabled: false,
  },
  {
    id: 'memory',
    label: 'Executive Memory',
    icon: BookOpen,
    enabled: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: CircleUserRound,
    enabled: false,
  },
]

export default function ExecutiveSidebar({
  activeView,
  mobileNav,
  onChangeView,
  onCloseMobileNav,
  onSignOut,
}) {
  return (
    <aside className={mobileNav ? 'open' : ''}>
      <div className="brand">
        <span>AE</span>

        <div>
          AI EXECUTIVE
          <small>INTELLIGENCE PLATFORM</small>
        </div>
      </div>

      <button
        type="button"
        className="close-nav"
        onClick={onCloseMobileNav}
        aria-label="Close navigation"
      >
        <X />
      </button>

      <nav>
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <button
              type="button"
              key={item.id}
              className={isActive ? 'active' : ''}
              onClick={() => {
                if (item.enabled) {
                  onChangeView(item.id)
                }
              }}
              aria-current={isActive ? 'page' : undefined}
              title={item.enabled ? item.label : `${item.label} coming soon`}
            >
              <Icon />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="live-status">
          <span />
          Intelligence active
        </div>

        <button type="button" className="signout" onClick={onSignOut}>
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
