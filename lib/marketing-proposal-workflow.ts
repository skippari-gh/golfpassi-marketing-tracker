export type ProposalStatus = 'suggested' | 'reviewed' | 'approved' | 'dismissed'
export type MarketingProposal = {
  id: string
  source: 'seo' | 'competitor' | 'analytics' | 'manual'
  title: string
  reason: string
  proposedAction: string
  sourceUrl: string | null
  observedAt: string | null
  confidence: 'low' | 'medium' | 'high'
  priority: 'low' | 'medium' | 'high'
  status: ProposalStatus
  owner: string | null
  dueDate: string | null
  outcome: { baseline: number | null; after: number | null; metric: string | null; measuredAt: string | null } | null
}
export type ProposalEvent = { proposalId: string; action: 'review' | 'approve' | 'dismiss'; actor: string; timestamp: string }

// A pure state transition for audit-ready eventual persistence. The caller
// must authenticate before saving; approval never publishes anything.
export function transitionProposal(proposal: MarketingProposal, event: ProposalEvent): MarketingProposal {
  if (proposal.id !== event.proposalId || !event.actor.trim() || !Number.isFinite(Date.parse(event.timestamp))) {
    throw new Error('Invalid proposal event')
  }
  if (proposal.status === 'dismissed' || proposal.status === 'approved') {
    throw new Error('Finalized proposal cannot be changed without a new review process')
  }
  const next: ProposalStatus =
    event.action === 'review' ? 'reviewed' : event.action === 'approve' ? 'approved' : 'dismissed'
  if (next === 'approved' && proposal.status !== 'reviewed') {
    throw new Error('Proposal must be reviewed before approval')
  }
  return { ...proposal, status: next }
}

export function toMarketingActionDraft(proposal: MarketingProposal, actionDate: string) {
  if (proposal.status !== 'approved') throw new Error('Only approved proposals may become drafts')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(actionDate)) throw new Error('Invalid date')
  // This is a draft object only. Do not write through anonymous Supabase RLS.
  return {
    action_date: actionDate,
    title: proposal.title,
    notes: [
      proposal.proposedAction,
      'Perustelu: ' + proposal.reason,
      'Lähde: ' + (proposal.sourceUrl ?? 'ei linkkiä'),
      'Havaittu: ' + (proposal.observedAt ?? 'ei päivämäärää'),
      'Luotettavuus: ' + proposal.confidence,
      'Markkinatutka ID: ' + proposal.id,
    ].join('\n'),
  }
}
