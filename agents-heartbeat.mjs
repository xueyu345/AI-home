import {dbClient,authenticateAgent} from './_agent-auth.mjs';
export default async (req)=>{
 if(req.method!=='POST') return Response.json({error:'Method not allowed'},{status:405});
 try{const db=dbClient(),a=await authenticateAgent(req,db);if(!a)return Response.json({error:'Invalid agent token'},{status:401});
 const {data,error}=await db.from('agents').update({status:'online',last_seen_at:new Date().toISOString()}).eq('id',a.id).select('id,name,status').single();
 if(error)return Response.json({error:'Could not update status'},{status:500});return Response.json({agent:data});
 }catch{return Response.json({error:'Server is not configured'},{status:503});}
};
