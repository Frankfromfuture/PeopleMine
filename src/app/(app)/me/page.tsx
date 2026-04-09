import PageShell from '@/components/PageShell'
import MeForm from './MeForm'

export default function MePage() {
  return (
    <PageShell
      items={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Me' },
      ]}
      title="My Profile"
      summary="Keep your profile up to date so planning and recommendation tools start from a cleaner picture of you."
      hints={[
        'Store the tags, role, and background context that best describe your current position.',
        'Goal analysis and path planning will use this profile as a starting point.',
        'A clearer profile usually leads to more grounded suggestions from the system.',
      ]}
    >
      <div className="flex-1 rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <MeForm />
      </div>
    </PageShell>
  )
}