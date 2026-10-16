// Review-only change plans: an approval is not a publication.
// Keeping publication as a distinct integration prevents accidental writes.
export type ChangeChannel = 'website' | 'google_ads'
export type ChangeState = 'draft' | 'reviewed' | 'approved' | 'cancelled'
export type ProposedChange = {
  id:string; channel:ChangeChannel; target:string; field:string
  before:string; after:string; reason:string; source:string
  capturedAt:string|null; state:ChangeState
  reviewedBy:string|null; approvedBy:string|null
}
export function validateChange(change:ProposedChange) {
  if (!change.id || !change.target || !change.field || !change.reason.trim() || !change.source.trim())
    throw new Error('Muutoksen perustelut tai lähde puuttuvat')
  if (!change.after.trim() || change.before === change.after)
    throw new Error('Muutoksen sisältö puuttuu tai vastaa nykyistä')
  if (change.before.length > 20000 || change.after.length > 20000) throw new Error('Teksti liian pitkä')
  if (change.channel==='website') {
    const url=new URL(change.target)
    if(url.protocol!=='https:' || url.hostname!=='golfpassi.fi')throw new Error('Väärä verkkosivusto')
  }
}
export function moveChange(change:ProposedChange, action:'review'|'approve'|'cancel',actor:string):ProposedChange {
  validateChange(change)
  if(!actor.trim())throw new Error('Hyväksyjä puuttuu')
  if(change.state==='cancelled'||change.state==='approved')throw new Error('Päätettyä muutosta ei muokata')
  if(action==='review'&&change.state==='draft')return {...change,state:'reviewed',reviewedBy:actor}
  if(action==='approve'&&change.state==='reviewed')return {...change,state:'approved',approvedBy:actor}
  if(action==='cancel')return {...change,state:'cancelled'}
  throw new Error('Muutos täytyy arvioida ennen hyväksyntää')
}
export function makeWebsiteChangeDraft(args:{id:string;url:string;field:string;before:string|null;after:string;reason:string;source:string;capturedAt:string}) : ProposedChange {
  return {id:args.id,channel:'website',target:args.url,field:args.field,before:args.before??'',after:args.after,
    reason:args.reason,source:args.source,capturedAt:args.capturedAt,state:'draft',reviewedBy:null,approvedBy:null}
}
