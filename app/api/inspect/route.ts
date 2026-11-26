import { NextResponse } from "next/server";
import { z } from "zod";
import { validatePublicUrl } from "@/lib/safety";
export const runtime="nodejs";
export const maxDuration=30;
const schema=z.object({url:z.string().url().max(2048)});
function clean(s:string|null|undefined,max=500){return (s||"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,max);}
function guessCategory(s:string){s=s.toLowerCase();if(/recipe|cook|food|bake/.test(s))return"Cooking";if(/paint|draw|art|design|craft|creative/.test(s))return"Art & creativity";if(/work|career|business|excel|project/.test(s))return"Work";if(/fitness|workout|yoga|run|exercise/.test(s))return"Fitness";if(/learn|course|tutorial|guide|lesson|study/.test(s))return"Learning";if(/diy|build|repair|make|woodworking/.test(s))return"DIY";return"Other";}
function estimateMinutes(s:string){return Math.max(5,Math.min(60,Math.ceil(s.split(/\s+/).length/180*60)||5));}
function meta(html:string,name:string){const e=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");const a=new RegExp(`<meta[^>]+(?:property|name)=["']${e}["'][^>]+content=["']([^"']*)["'][^>]*>`,'i');const b=new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${e}["'][^>]*>`,'i');return clean(html.match(a)?.[1]||html.match(b)?.[1]||null);}
function extractText(html:string){let body=html.replace(/<!--[\s\S]*?-->/g," ").replace(/<(script|style|noscript|svg|nav|footer|header|form)[^>]*>[\s\S]*?<\/\1>/gi," ");const main=body.match(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/i);if(main)body=main[2];return clean(body.replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi,"\n").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&nbsp;/g," ").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))),60000);}
async function youtubeTranscript(url:URL){
 const id=url.searchParams.get("v")||url.pathname.split("/").filter(Boolean).pop();if(!id||!/[A-Za-z0-9_-]{6,}/.test(id))return null;
 const page=await fetch(`https://www.youtube.com/watch?v=${id}`,{headers:{"user-agent":"Mozilla/5.0 (compatible; Laterless/1.0)","accept-language":"en-US,en;q=0.9"},signal:AbortSignal.timeout(10000)});if(!page.ok)return null;
 const html=await page.text();let player:any=null;const marker=html.match(/ytInitialPlayerResponse\s*=\s*/);if(marker){let i=marker.index!+marker[0].length,depth=0,inStr=false,esc=false,end=-1;for(;i<html.length;i++){const c=html[i];if(inStr){if(esc)esc=false;else if(c==="\\")esc=true;else if(c==='"')inStr=false;}else{if(c==='"')inStr=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){end=i+1;break;}}}if(end>0){try{player=JSON.parse(html.slice(marker.index!+marker[0].length,end));}catch{}}}
 const tracks=player?.captions?.playerCaptionsTracklistRenderer?.captionTracks||[];if(!tracks.length)return null;
 const track=tracks.find((t:any)=>/^en/i.test(t.languageCode||""))||tracks[0];const captionUrl=new URL(track.baseUrl);captionUrl.searchParams.set("fmt","json3");
 const cr=await fetch(captionUrl.toString(),{signal:AbortSignal.timeout(10000)});if(!cr.ok)return null;const raw=await cr.text();let lines:string[]=[];
 try{const j=JSON.parse(raw);lines=(j.events||[]).flatMap((ev:any)=>(ev.segs||[]).map((s:any)=>s.utf8||""));}catch{lines=Array.from(raw.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)).map(m=>clean(m[1],1000));}
 const transcript=lines.join(" ").replace(/\s+/g," ").trim().slice(0,150000);return transcript.length>100?transcript:null;
}
export async function POST(req:Request){try{
 const {url:raw}=schema.parse(await req.json());const url=await validatePublicUrl(raw);const host=url.hostname.replace(/^www\./,"");
 const isYoutube=host==="youtube.com"||host==="m.youtube.com"||host==="youtu.be";
 let title=url.hostname,description="",contentText="",resourceType="webpage",processingMethod="metadata only",processingStatus="limited",limited=true;
 if(isYoutube){resourceType="video";try{const y=await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url.toString())}&format=json`,{signal:AbortSignal.timeout(8000)});if(y.ok){const o=await y.json();title=clean(o.title,180)||title;}}catch{}
  try{const tr=await youtubeTranscript(url);if(tr){contentText=tr;processingMethod="available caption transcript";processingStatus="processed";limited=false;}}catch{}
  if(!contentText)description="Video transcript or captions could not be accessed. Upload a transcript or use an authorized video-analysis integration; no video-specific plan will be generated from metadata alone.";
 }else{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);let response:Response;
  try{response=await fetch(url.toString(),{signal:controller.signal,redirect:"manual",headers:{"user-agent":"Mozilla/5.0 (compatible; Laterless/1.0)","accept":"text/html,application/xhtml+xml"}});}finally{clearTimeout(timer);}
  if(response.status>=300&&response.status<400)throw new Error("This page redirects and could not be safely inspected. Open the page and paste its final URL, or upload its content.");
  if(!response.ok)throw new Error("The website blocked content extraction. Upload the article text or a screenshot instead.");
  const type=response.headers.get("content-type")||"";if(!type.includes("text/html"))throw new Error("This link is not an HTML article. Upload the relevant image or transcript instead.");
  const html=(await response.text()).slice(0,2_000_000);title=meta(html,"og:title")||meta(html,"twitter:title")||clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],180)||title;
  description=meta(html,"og:description")||meta(html,"description")||meta(html,"twitter:description")||"";
  contentText=extractText(html);if(contentText.length>500){resourceType="article/tutorial";processingMethod="article extraction";processingStatus="processed";limited=false;}else{processingMethod="metadata only";processingStatus="limited";}
 }
 return NextResponse.json({url:url.toString(),title,source:host,description:description||contentText.slice(0,500),category:guessCategory(title+" "+description+" "+contentText.slice(0,1000)),minutes:estimateMinutes(contentText||description||title),contentText,resourceType,processingMethod,processingStatus,limited});
 }catch(e:any){return NextResponse.json({error:e?.message||"Could not inspect this link."},{status:400});}}
