import dns from "node:dns/promises";
import net from "node:net";
export async function validatePublicUrl(raw:string) {
  let u:URL;
  try { u = new URL(raw); } catch { throw new Error("Enter a valid http or https link."); }
  if (!["http:","https:"].includes(u.protocol)) throw new Error("Only http and https links are supported.");
  if (u.username || u.password) throw new Error("Links containing credentials are not allowed.");
  const host=u.hostname.toLowerCase();
  if (host==="localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host==="metadata.google.internal") throw new Error("This address cannot be fetched.");
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Private network addresses cannot be fetched.");
  } else {
    const records=await dns.lookup(host,{all:true,verbatim:true}).catch(()=>[]);
    if (!records.length || records.some(r=>isPrivateIp(r.address))) throw new Error("This address cannot be fetched safely.");
  }
  return u;
}
function isPrivateIp(ip:string) {
  if (ip.includes(":")) return ip==="::1" || ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd") || ip.toLowerCase().startsWith("fe80");
  const p=ip.split(".").map(Number);
  return p[0]===10 || p[0]===127 || p[0]===0 || (p[0]===169&&p[1]===254) || (p[0]===172&&p[1]>=16&&p[1]<=31) || (p[0]===192&&p[1]===168) || p[0]>=224;
}