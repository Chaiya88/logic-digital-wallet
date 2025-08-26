export function ulidLike(){
  return Date.now().toString(36)+Math.random().toString(36).substring(2,10);
}
export interface AuditEventInput {
  event_type: string;
  actor_type?: string;
  actor_id?: string;
  subject_type?: string;
  subject_id?: string;
  severity?: string;
  trace_id?: string;
  metadata?: any;
}
export function buildAuditRow(i: AuditEventInput){
  const now = Date.now();
  const id = ulidLike();
  const trace = i.trace_id || ulidLike();
  return {
    id, ts: now, event_type: i.event_type,
    actor_type: i.actor_type || 'system',
    actor_id: i.actor_id || 'system',
    subject_type: i.subject_type || null,
    subject_id: i.subject_id || null,
    trace_id: trace,
    severity: i.severity || 'INFO',
    metadata: JSON.stringify(i.metadata || {}),
    created_at: now
  };
}
