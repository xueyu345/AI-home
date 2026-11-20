import {dbClient,authenticateAgent} from './_agent-auth.mjs';
export default async (req)=>{
 if(req.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
 try{const db=dbClient(),a=await authenticateAgent(req,db);if(!a)return Response.json({error:'Invalid agent token'},{status:401});
 const b=await req.json(),result=String(b.result||'').trim();if(!b.task_id||!result||result.length>20000)return Response.json({error:'task_id and result (1-20000 chars) required'},{status:400});
 const {data,error}=await db.from('tasks').update({result,status:'submitted',updated_at:new Date().toISOString()}).eq('id',b.task_id).eq('claimed_by',a.id).eq('status','claimed').select('id,title,status').single();
 if(error||!data)return Response.json({error:'Task not assigned to this agent or no longer claimable'},{status:409});
 await db.from('agents').update({status:'online'}).eq('id',a.id);return Response.json({task:data});
 }catch{return Response.json({error:'Invalid request or server configuration'},{status:400});}
};
