// Audit reproduction only: fresh, non-persistent memory store; fictional records; no external calls.
// Run from repo root: node --conditions=react-server --import tsx docs/security-audit-2026-10-09/reproduce.mjs
import { MemoryRepository } from '../../src/server/db/memory';
import { Tx } from '../../src/server/db/repository';
import { claimWebhookDelivery } from '../../src/server/services/integrations';
import { addSuppression } from '../../src/server/prospecting/compliance';
import { ctxOf, asUser } from '../../src/server/prospecting/access';
import { can } from '../../src/server/auth/policy';
async function main() {
  const r = new MemoryRepository();
  const tx = new Tx(r);
  const original = tx.insert('audit_logs', {actorId:'audit-fixture',actorName:'Fictional audit',action:'audit.fixture',targetType:'fixture',result:'success',correlationId:'fixture-only',detail:'original'});
  await tx.commit();
  const patch = new Tx(r);
  patch.patch('audit_logs',original,{detail:'changed'});
  await patch.commit();
  const claims = await Promise.all([claimWebhookDelivery(r,'audit-fixture','same-delivery','fixture-org'),claimWebhookDelivery(r,'audit-fixture','same-delivery','fixture-org')]);
  const actor = {user:{id:'fixture-user',email:'audit@example.invalid',name:'Fictional audit',status:'active',platformRole:'superadmin'},platformRole:'superadmin',memberships:[]};
  const ctx = ctxOf(r,asUser(actor));
  await addSuppression(ctx,{orgId:'fixture-org',kind:'email',value:'recipient@example.invalid',reason:'client_suppression',hard:false,channels:['email']});
  const after = await addSuppression(ctx,{orgId:'fixture-org',kind:'email',value:'recipient@example.invalid',reason:'unsubscribed',hard:true,channels:['all']});
  const softUnsub = await addSuppression(ctx,{orgId:'fixture-org',kind:'email',value:'other@example.invalid',reason:'unsubscribed',hard:false});
  const limited = {...actor,platformRole:'operator',user:{...actor.user,platformRole:'operator',operatorOrgIds:[]}};
  console.log(JSON.stringify({fixtureOnly:true,auditRecordPatchAccepted:(await r.get('audit_logs',original.id))?.detail==='changed',concurrentWebhookClaimsAccepted:claims.filter(Boolean).length,duplicateWebhookRecords:(await r.list('processed_webhooks')).length,unsubscribeUpgrade:{reason:after.reason,hard:after.hard,channels:after.channels},newUnsubscribeCanBeSoft:!softUnsub.hard,emptyOperatorScopeCanReadArbitraryTenant:can(limited,'ops.view','another-org')},null,2));
}
main().catch(e=>{console.error(e.name);process.exit(1)});
