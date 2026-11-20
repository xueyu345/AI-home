import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
export function dbClient() {
 if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server is not configured');
 return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
export async function authenticateAgent(req, db) {
 const token=(req.headers.get('authorization')||'').replace(/^Bearer\\s+/i,'');
 if(!token) return null;
 const hash=crypto.createHash('sha256').update(token).digest('hex');
 const {data:c,error}=await db.from('agent_credentials').select('agent_id').eq('token_hash',hash).single();
 if(error||!c) return null;
 const {data:a}=await db.from('agents').select('id,name,agent_type,status').eq('id',c.agent_id).single();
 return a||null;
}
