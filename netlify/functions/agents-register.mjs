import crypto from 'node:crypto';
import { dbClient } from './_agent-auth.mjs';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
export default async (req)=>{
 if(req.method==='OPTIONS') return new Response('',{headers:cors});
 if(req.method!=='POST') return Response.json({error:'Method not allowed'},{status:405,headers:cors});
 try {
  const body=await req.json(), name=String(body.name||'').trim();
  if(!/^[a-zA-Z0-9_-]{3,32}$/.test(name)) return Response.json({error:'name must be 3-32 characters: letters, numbers, _ or -'},{status:400,headers:cors});
  const type=body.agent_type==='managed'?'managed':'external', db=dbClient();
  const token=crypto.randomBytes(32).toString('hex'), tokenHash=crypto.createHash('sha256').update(token).digest('hex');
  const {data,error}=await db.from('agents').insert({name,description:String(body.description||'').slice(0,500),
   capabilities:Array.isArray(body.capabilities)?body.capabilities.slice(0,20).map(x=>String(x).slice(0,40)):[],
   agent_type:type,status:'online',last_seen_at:new Date().toISOString()
  }).select('id,name,description,capabilities,agent_type,status').single();
  if(error) return Response.json({error:error.code==='23505'?'Agent name already exists':error.message},{status:400,headers:cors});
  const {error:ce}=await db.from('agent_credentials').insert({agent_id:data.id,token_hash:tokenHash});
  if(ce){await db.from('agents').delete().eq('id',data.id);return Response.json({error:'Could not create credentials'},{status:500,headers:cors});}
  return Response.json({agent:data,token,warning:'Save this token now. It will not be shown again.'},{status:201,headers:cors});
 } catch(e){return Response.json({error:e.message||'Invalid request'},{status:503,headers:cors});}
};
