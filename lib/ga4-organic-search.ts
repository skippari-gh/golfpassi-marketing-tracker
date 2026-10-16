import 'server-only'
import { createSign } from 'node:crypto'

type GaDay={date:string;sessions:number;activeUsers:number;keyEvents:number}
type EventRow={name:string;keyEvents:number}
function b64(value:string){return Buffer.from(value).toString('base64url')}
async function token(){
 const raw=process.env.GA4_SERVICE_ACCOUNT_JSON
 let email=process.env.GA4_CLIENT_EMAIL
 let key=process.env.GA4_PRIVATE_KEY
 if(raw){const creds=JSON.parse(raw);email=creds.client_email||email;key=creds.private_key||key}
 if(!email||!key)throw new Error('GA4 credentials missing')
 const now=Math.floor(Date.now()/1000)
 const header=b64(JSON.stringify({alg:'RS256',typ:'JWT'}))
 const payload=b64(JSON.stringify({iss:email,scope:'https://www.googleapis.com/auth/analytics.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}))
 const input=header+'.'+payload
 const signer=createSign('RSA-SHA256')
 signer.update(input)
 const jwt=input+'.'+signer.sign(key.replace(/\\n/g,'\n').trim(),'base64url')
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt}),cache:'no-store'})
 if(!response.ok)throw new Error('GA4 authorization failed ('+response.status+')')
 const data=await response.json()
 if(typeof data.access_token!=='string')throw new Error('GA4 access token missing')
 return data.access_token as string
}
export async function getGa4OrganicSearch(startDate:string,endDate:string){
 const property=process.env.GA4_PROPERTY_ID
 if(!property||!/^[0-9]+$/.test(property))throw new Error('GA4 property missing')
 if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!/^\d{4}-\d{2}-\d{2}$/.test(endDate)||startDate>endDate)throw new Error('Invalid GA4 dates')
 const bearer=await token()
 async function run(dimensions:string[],metrics:string[],limit:number){
  const response=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+property+':runReport',{
   method:'POST',headers:{authorization:'Bearer '+bearer,'content-type':'application/json'},
   body:JSON.stringify({dateRanges:[{startDate,endDate}],dimensions:dimensions.map(name=>({name})),metrics:metrics.map(name=>({name})),
    dimensionFilter:{filter:{fieldName:'sessionDefaultChannelGroup',stringFilter:{value:'Organic Search',matchType:'EXACT'}}},limit,keepEmptyRows:false}),cache:'no-store'})
  if(!response.ok)throw new Error('GA4 report failed ('+response.status+')')
  return response.json()
 }
 const [trend,events,summary]=await Promise.all([run(['date'],['sessions','activeUsers','keyEvents'],100),run(['eventName'],['keyEvents'],100),run([],['sessions','activeUsers','keyEvents'],1)])
 const daily:GaDay[]=(trend.rows||[]).map((r:any)=>({date:String(r.dimensionValues?.[0]?.value||'').replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3'),sessions:Number(r.metricValues?.[0]?.value||0),activeUsers:Number(r.metricValues?.[1]?.value||0),keyEvents:Number(r.metricValues?.[2]?.value||0)})).filter((r:GaDay)=>/^\d{4}-\d{2}-\d{2}$/.test(r.date)).sort((a:GaDay,b:GaDay)=>a.date.localeCompare(b.date))
 const keyEvents:EventRow[]=(events.rows||[]).map((r:any)=>({name:String(r.dimensionValues?.[0]?.value||''),keyEvents:Number(r.metricValues?.[0]?.value||0)})).filter((r:EventRow)=>r.keyEvents>0).sort((a:EventRow,b:EventRow)=>b.keyEvents-a.keyEvents)
 const totals=summary.rows?.[0]?.metricValues||[]
 return {daily,keyEvents,totals:{sessions:Number(totals[0]?.value||0),activeUsers:Number(totals[1]?.value||0),keyEvents:Number(totals[2]?.value||0)},channel:'Organic Search',source:'Google Analytics 4'}
}
