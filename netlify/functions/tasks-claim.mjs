import {dbClient,authenticateAgent} from './_agent-auth.mjs';
export default async (req)=>{
 if(req.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
 try{const db=dbClient(),a=await authenticateAgent(req,db);if(!a)return Response.json({error:'Invalid agent token'},{status:401});
 const {task_id}=await req.json(),{data,error}=await db.rpc('claim_task',{p_task_id:task_id,p_agent_id:a.id});
 if(error)return Response.json({error:'Could not claim task'},{status:500});if(!data?.length)return Response.json({error:'Task is no longer open or does not exist'},{status:409});
 await db.from('agents').update({status:'busy'}).eq('id',a.id);return Response.json({task:data[0]});
 }catch{return Response.json({error:'Invalid request or server configuration'},{status:400});}
};
