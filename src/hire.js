// Hire statuses: one-time projects and ongoing collaborations have different final stages.
import { now, refClosed } from './lib.js';
export const HIRE_ONCE = ['received','review','approved','progress','delivered','completed'];
export const HIRE_ONGOING = ['received','review','approved','active'];
export const HIRE_LABELS = { received:'Received',review:'Under review',approved:'Approved',progress:'In progress',delivered:'Delivered',completed:'Completed',active:'Active (ongoing)',paused:'Paused',ended:'Ended',declined:'Declined' };
export function hireKind(h) { return h.kind === 'ongoing' || /(?:ongoing|monthly|retainer)/i.test(JSON.parse(h.data||'{}').plan||'') ? 'ongoing' : 'once'; }
export function hireStatus(h) { return ({new:'received',done:'completed',rejected:'declined'})[h.status] || h.status || 'received'; }
export function hireSteps(h) {
  const kind=hireKind(h), st=hireStatus(h), base=kind==='ongoing'?HIRE_ONGOING:HIRE_ONCE;
  let ev=[];try{ev=JSON.parse(h.events||'[]')||[]}catch{};
  const at=s=>ev.filter(e=>e.s===s).slice(-1)[0]?.at||null;
  const idx=base.indexOf(st), complete=idx>=0?idx:base.indexOf(st==='paused'||st==='ended'?'active':st==='declined'?'received':'received');
  const steps=base.map((s,i)=>({s,label:HIRE_LABELS[s],at:at(s)||(s==='received'?h.created:s==='approved'?h.approved_at:st===s?h.updated||null:null),done:i<=complete,current:st===s}));
  if(['paused','ended','declined'].includes(st)) steps.push({s:st,label:HIRE_LABELS[st],at:at(st),done:true,current:true});
  return steps;
}
export function publicHire(h,{full=false}={}) {
  const kind=hireKind(h), st=hireStatus(h);
  const out={ number:h.number,topic:kind==='ongoing'?'Ongoing collaboration':'Hire request',kind,status:st,label:HIRE_LABELS[st]||st,created:h.created,steps:hireSteps(h) };
  if(full) out.message=JSON.parse(h.data||'{}').project||'';
  return out;
}
export async function setHireStatus(env,h,status,kind) {
  kind=kind==='ongoing'?'ongoing':kind==='once'?'once':hireKind(h);
  if(!HIRE_LABELS[status]) throw new Error('Invalid hire status');
  if(kind==='ongoing'&&['progress','delivered','completed'].includes(status)) throw new Error('Completed is for one-time projects only');
  if(kind==='once'&&['active','paused','ended'].includes(status)) throw new Error('Active collaboration is for ongoing work only');
  let ev=[];try{ev=JSON.parse(h.events||'[]')||[]}catch{};
  const at=now(); if(status!==hireStatus(h)||kind!==hireKind(h)) ev.push({s:status,at});
  await env.DB.prepare("UPDATE hire SET status = ?1, kind = ?2, events = ?3, updated = ?4, approved_at = CASE WHEN ?1 = 'approved' THEN ?4 ELSE approved_at END WHERE id = ?5").bind(status,kind,JSON.stringify(ev.slice(-40)),at,h.id).run();
  await refClosed(env,h.number,['completed','ended','declined'].includes(status));
  return { status,kind,label:HIRE_LABELS[status] };
}
