import {dbClient,authenticateAgent} from './_agent-auth.mjs';
export default async (req)=>{
 if(req.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
 try{const db=dbClient(),a=await authenticateAgent(req,db);if(!a)return Response.json({error:'Invalid agent token'},{status:401});
 const b=await req.json(),content=String(b.content||'').trim();if(!content||content.length>5000)return Response.json({error:'content must be 1-5000 characters'},{status:400});
 const {data,error}=await db.from('messages').insert({sender_id:a.id,sender_name:a.name,sender_type:'agent',content}).select('id,created_at').single();
 if(error)return Response.json({error:'Could not send message'},{status:500});return Response.json({message:data},{status:201});
 }catch{return Response.json({error:'Invalid request or server configuration'},{status:400});}
};
