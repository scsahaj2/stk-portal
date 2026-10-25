import { createClient } from 'npm:@supabase/supabase-js@2';
const URL=Deno.env.get('SUPABASE_URL')!;
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON=Deno.env.get('SUPABASE_ANON_KEY')!;
const SETUP=Deno.env.get('STK_SETUP_SECRET')||'';
const PEPPER=Deno.env.get('STK_RECOVERY_PEPPER')||'';
const admin=createClient(URL,SERVICE,{auth:{autoRefreshToken:false,persistSession:false}});
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
function out(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}})}
const usernameOk=(s:unknown)=>typeof s==='string'&&/^[a-z][a-z0-9_]{2,31}$/.test(s);
const passwordOk=(s:unknown)=>typeof s==='string'&&s.length>=12&&s.length<=128;
const internalEmail=(u:string)=>`${u}@stk-users.example.com`;
function randomCode(){const b=crypto.getRandomValues(new Uint8Array(24));return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('')}
async function hashCode(s:string){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(PEPPER+':'+s));return Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join('')}
async function setRecovery(id:string){const code=randomCode();const {error}=await admin.from('username_recovery').upsert({user_id:id,code_hash:await hashCode(code),updated_at:new Date().toISOString()});if(error)throw Error(error.message);return code}
async function who(req:Request){const token=req.headers.get('Authorization')?.replace(/^Bearer /i,'');if(!token)throw Error('લૉગિન જરૂરી છે');const {data,error}=await admin.auth.getUser(token);if(error||!data.user)throw Error('લૉગિન સત્ર અમાન્ય છે');const {data:p,error:e}=await admin.from('profiles').select('role').eq('id',data.user.id).single();if(e||p?.role!=='super_admin')throw Error('Super Admin નો અધિકાર જરૂરી છે');return data.user}
async function assignUser(id:string,username:string,full_name:string,role:string,department:string|null,committee_id:string|null){
 if(!['super_admin','department_saint','samiti_sanchalak'].includes(role))throw Error('અધિકાર અમાન્ય છે');
 if(role==='super_admin'){department=null;committee_id=null}
 else if(!['EDU','HRM','ADM'].includes(department||''))throw Error('વિભાગ પસંદ કરો');
 if(role==='department_saint')committee_id=null;
 if(role==='samiti_sanchalak'){
  if(!committee_id)throw Error('સમિતિ પસંદ કરો');
  const {data:s,error}=await admin.from('services').select('id').eq('committee_id',committee_id).eq('department',department).limit(1);
  if(error||!s?.length)throw Error('વિભાગ અને સમિતિ મેળ ખાતાં નથી');
 }
 const {error}=await admin.from('profiles').update({username,full_name,role,department,committee_id}).eq('id',id);
 if(error)throw Error(error.message);
}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return out({error:'POST only'},405);
 try{
  if(!PEPPER||PEPPER.length<32)throw Error('STK_RECOVERY_PEPPER secret configured નથી');
  const body=await req.json();const action=body.action;
  if(action==='bootstrap'){
   if(!SETUP||SETUP.length<24||body.setup_secret!==SETUP)throw Error('Setup secret અમાન્ય છે');
   const {count,error}=await admin.from('profiles').select('*',{count:'exact',head:true}).eq('role','super_admin');if(error)throw Error(error.message);
   if(count && count>0)throw Error('Super Admin પહેલેથી છે; bootstrap બંધ છે. Migration સૂચના વાંચો.');
   if(body.username!=='superadmin'||!passwordOk(body.password))throw Error('superadmin યુઝરનેમ અને ઓછામાં ઓછા 12 અક્ષરનો પાસવર્ડ જરૂરી');
   const {data,error:e}=await admin.auth.admin.createUser({email:internalEmail('superadmin'),password:body.password,email_confirm:true,user_metadata:{full_name:'STK Super Admin'}});
   if(e)throw Error(e.message);
   await assignUser(data.user.id,'superadmin','STK Super Admin','super_admin',null,null);
   return out({ok:true,username:'superadmin',recovery_code:await setRecovery(data.user.id)});
  }
  if(action==='migrate_existing_admin'){
   if(!SETUP||SETUP.length<24||body.setup_secret!==SETUP)throw Error('Setup secret અમાન્ય છે');
   if(!body.old_email||typeof body.old_email!=='string')throw Error('જૂનું admin email જરૂરી છે');
   const {data:found,error:e}=await admin.from('profiles').select('id,role,username').eq('email',body.old_email).eq('role','super_admin').maybeSingle();
   if(e||!found)throw Error('જૂનું Super Admin એકાઉન્ટ મળ્યું નથી');
   if(found.username)return out({error:'આ એકાઉન્ટમાં username પહેલેથી છે'},409);
   const {error:up}=await admin.auth.admin.updateUserById(found.id,{email:internalEmail('superadmin'),email_confirm:true});if(up)throw Error(up.message);
   const {error:pr}=await admin.from('profiles').update({username:'superadmin',email:''}).eq('id',found.id);if(pr)throw Error(pr.message);
   return out({ok:true,username:'superadmin',recovery_code:await setRecovery(found.id),note:'જૂનો પાસવર્ડ યથાવત્ છે'});
  }
  if(action==='recover'){
   if(!usernameOk(body.username)||!passwordOk(body.password)||typeof body.recovery_code!=='string')throw Error('માહિતી અમાન્ય છે');
   const {data:p}=await admin.from('profiles').select('id').eq('username',body.username).maybeSingle();
   // Generic error to avoid revealing account existence.
   if(!p)throw Error('યુઝરનેમ અથવા Recovery Code અમાન્ય છે');
   const {data:r}=await admin.from('username_recovery').select('code_hash').eq('user_id',p.id).maybeSingle();
   if(!r||r.code_hash!==await hashCode(body.recovery_code))throw Error('યુઝરનેમ અથવા Recovery Code અમાન્ય છે');
   const {error:e}=await admin.auth.admin.updateUserById(p.id,{password:body.password});if(e)throw Error(e.message);
   return out({ok:true,recovery_code:await setRecovery(p.id)});
  }
  await who(req);
  if(action==='create_user'){
   if(!usernameOk(body.username)||!passwordOk(body.password)||typeof body.full_name!=='string'||!body.full_name.trim())throw Error('યુઝરનેમ, નામ અને 12+ અક્ષરનો પાસવર્ડ જરૂરી છે');
   const role=String(body.role||'samiti_sanchalak'),department=body.department||null,committee=body.committee_id||null;
   // Validate values before creating auth account.
   if(!['super_admin','department_saint','samiti_sanchalak'].includes(role))throw Error('અધિકાર અમાન્ય');
   if(role!=='super_admin'&&!['EDU','HRM','ADM'].includes(department))throw Error('વિભાગ જરૂરી છે');
   if(role==='samiti_sanchalak'&&!committee)throw Error('સમિતિ જરૂરી છે');
   const {data,error}=await admin.auth.admin.createUser({email:internalEmail(body.username),password:body.password,email_confirm:true,user_metadata:{full_name:body.full_name.trim()}});
   if(error)throw Error(error.message);
   try{await assignUser(data.user.id,body.username,body.full_name.trim(),role,department,committee);return out({ok:true,recovery_code:await setRecovery(data.user.id)})}
   catch(e){await admin.auth.admin.deleteUser(data.user.id);throw e}
  }
  if(action==='reset_password'){
   if(!body.user_id||!passwordOk(body.password))throw Error('યુઝર અને 12+ અક્ષરનો પાસવર્ડ જરૂરી');
   const {data:p}=await admin.from('profiles').select('id').eq('id',body.user_id).maybeSingle();if(!p)throw Error('યુઝર મળ્યો નથી');
   const {error}=await admin.auth.admin.updateUserById(p.id,{password:body.password});if(error)throw Error(error.message);
   return out({ok:true,recovery_code:await setRecovery(p.id)});
  }
  if(action==='migrate_user'){
   if(!usernameOk(body.username)||!body.old_email)throw Error('જૂનું ઈમેલ અને નવું યુઝરનેમ જરૂરી');
   const {data:p}=await admin.from('profiles').select('id,username').eq('email',body.old_email).maybeSingle();
   if(!p)throw Error('જૂનું એકાઉન્ટ મળ્યું નથી');if(p.username)throw Error('યુઝરનેમ પહેલેથી સેટ છે');
   const {error}=await admin.auth.admin.updateUserById(p.id,{email:internalEmail(body.username),email_confirm:true});if(error)throw Error(error.message);
   const {error:e}=await admin.from('profiles').update({username:body.username,email:''}).eq('id',p.id);if(e)throw Error(e.message);
   return out({ok:true,recovery_code:await setRecovery(p.id)});
  }
  throw Error('અમાન્ય કાર્ય');
 }catch(e){return out({error:e instanceof Error?e.message:'સર્વર ભૂલ'},400)}
});
