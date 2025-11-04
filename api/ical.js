
export default async function handler(req, res) {
  try {
    const r = await fetch("https://www.airbnb.com/calendar/ical/46642295.ics?s=a5e03028c3f458d024826733c282655c&locale=fr");
    if(!r.ok) throw new Error("ICS fetch failed");
    const txt = await r.text();
    const lines = txt.split(/\r?\n/);
    const ranges = [];
    let cur = {};
    for(const line of lines){
      if(line.startsWith("BEGIN:VEVENT")) cur = {};
      if(line.startsWith("DTSTART")){ const m=line.match(/:(\d{8})/); if(m) cur.start=m[1]; }
      if(line.startsWith("DTEND"))  { const m=line.match(/:(\d{8})/); if(m) cur.end=m[1]; }
      if(line.startsWith("END:VEVENT") && cur.start && cur.end){
        const s=cur.start, e=cur.end;
        ranges.push({start:`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`, end:`${e.slice(0,4)}-${e.slice(4,6)}-${e.slice(6,8)}`});
      }
    }
    let local = [];
    try { const base=(req.headers['x-forwarded-proto']||'https')+'://'+req.headers.host; const lr=await fetch(base+'/bookings.json'); if(lr.ok){ const d=await lr.json(); local=d.bookings||[]; } } catch(e){}
    const bookings=[...local,...ranges];
    res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json({bookings});
  } catch(e) { console.error(e); return res.status(500).json({error:'ical_error'}); }
}
