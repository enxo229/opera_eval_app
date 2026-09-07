import { createClient } from '@/lib/supabase/server'
import { getTeams } from '@/app/actions/teams'
import { EvaluatorHeader } from '@/components/evaluator/EvaluatorHeader'
import { EvaluatorNavTabs } from '@/components/evaluator/EvaluatorNavTabs'
import { DEFAULT_SQUADS } from '@/lib/schemas/user-form'

export const dynamic = 'force-dynamic'

export default async function EvaluatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get current auth session user
  const { data: { user } } = await supabase.auth.getUser()
  let userName = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    userName = profile?.full_name || null
  }

  // Get official teams catalog from database
  const officialTeams = await getTeams()
  const teamsList =
    officialTeams.length > 0
      ? officialTeams.map((t) => t.name)
      : (DEFAULT_SQUADS as unknown as string[])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Unified Top Header */}
      <EvaluatorHeader
        userEmail={user?.email}
        userName={userName}
        teams={teamsList}
      />

      {/* Global Navigation Tabs */}
      <EvaluatorNavTabs />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
