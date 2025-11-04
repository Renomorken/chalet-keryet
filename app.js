
import { AIRBNB_ICAL_URL, NIGHTLY_PRICE, CLEANING_FEE, MIN_NIGHTS, STRIPE_PAYMENT_LINK, SERVERLESS_ENDPOINT } from './config.js';
const fmt = (d)=>d.toISOString().slice(0,10);
const parse = (s)=> new Date(s+'T00:00:00');

document.getElementById('priceIndic').textContent = new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(NIGHTLY_PRICE);
document.getElementById('year').textContent = new Date().getFullYear();

let bookedRanges = [];
async function loadBookings(){
  try{
    const res = await fetch('bookings.json');
    if(res.ok){
      const data = await res.json();
      for(const b of data.bookings){ bookedRanges.push({start:parse(b.start), end:parse(b.end)}); }
    }
  }catch(e){}
  // iCal via serverless endpoint (no CORS)
  try{
    const res2 = await fetch('/api/ical');
    if(res2.ok){
      const data2 = await res2.json();
      for(const b of (data2.bookings||[])) bookedRanges.push({start:parse(b.start), end:parse(b.end)});
    }
  }catch(e){ console.warn('Échec iCal serverless:', e); }
}
function within(d, r){ return d>=r.start && d<r.end; }
function isBooked(d){ return bookedRanges.some(r=>within(d,r)); }

const grid = document.getElementById('calGrid');
const label = document.getElementById('monthLabel');
let view = new Date(); view.setDate(1);
function build(){
  grid.innerHTML='';
  const month=view.getMonth(), year=view.getFullYear();
  label.textContent = new Intl.DateTimeFormat('fr-FR',{month:'long',year:'numeric'}).format(view);
  const first=new Date(year,month,1);
  const startDay=(first.getDay()+6)%7;
  const daysInMonth=new Date(year,month+1,0).getDate();
  const headers=['L','M','M','J','V','S','D'];
  for(const h of headers){ const el=document.createElement('div'); el.textContent=h; el.style.fontWeight='700'; grid.appendChild(el); }
  const prevDays=startDay; const prevMonthDays = new Date(year,month,0).getDate();
  for(let i=prevDays;i>0;i--){ const el=document.createElement('div'); el.className='cell muted'; el.textContent=(prevMonthDays-i+1); grid.appendChild(el); }
  for(let d=1; d<=daysInMonth; d++){
    const el=document.createElement('div'); el.className='cell'; el.dataset.date = fmt(new Date(year,month,d));
    el.textContent=d;
    const dateObj = new Date(year,month,d);
    if(isBooked(dateObj)) el.classList.add('booked');
    el.addEventListener('click', ()=>pick(el.dataset.date));
    grid.appendChild(el);
  }
  const total = headers.length + prevDays + daysInMonth;
  const remain = Math.ceil(total/7)*7 - total;
  for(let i=0;i<remain;i++){ const el=document.createElement('div'); el.className='cell muted'; grid.appendChild(el); }
}
let selStart=null, selEnd=null;
function pick(dateStr){
  const d = parse(dateStr);
  if(!selStart || (selStart && selEnd)){ selStart=d; selEnd=null; }
  else if(d>selStart){ selEnd=d; }
  else { selStart=d; selEnd=null; }
  paintSelection();
  updateForm();
}
function paintSelection(){
  document.querySelectorAll('.cell.selected').forEach(c=>c.classList.remove('selected'));
  if(selStart && selEnd){
    for(const el of document.querySelectorAll('.cell[data-date]')){
      const d = parse(el.dataset.date);
      if(d>=selStart && d<selEnd) el.classList.add('selected');
    }
  } else if(selStart){
    const el = document.querySelector(`.cell[data-date="${fmt(selStart)}"]`);
    if(el) el.classList.add('selected');
  }
}
function nights(){
  if(!(selStart && selEnd)) return 0;
  return Math.round((selEnd - selStart)/(1000*60*60*24));
}
function updateForm(){
  const sEl = document.getElementById('start');
  const eEl = document.getElementById('end');
  if(selStart) sEl.value = fmt(selStart);
  if(selEnd) eEl.value = fmt(selEnd);
  const n = nights();
  const quote = document.getElementById('quote');
  if(n>0){
    const subtotal = n*NIGHTLY_PRICE;
    const total = subtotal + CLEANING_FEE;
    quote.textContent = `${n} nuit(s) × ${NIGHTLY_PRICE.toLocaleString('fr-FR')} € + ménage ${CLEANING_FEE} € = ` + new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(total);
  }else quote.textContent='';
}
document.getElementById('prev').onclick=()=>{ view.setMonth(view.getMonth()-1); build(); paintSelection(); };
document.getElementById('next').onclick=()=>{ view.setMonth(view.getMonth()+1); build(); paintSelection(); };
await loadBookings(); build();

document.getElementById('bookingForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const s = document.getElementById('start').value;
  const en = document.getElementById('end').value;
  const g = document.getElementById('guests').value;
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;

  const n = Math.round((parse(en)-parse(s))/(1000*60*60*24));
  if(n < MIN_NIGHTS){ alert(`Séjour minimum: ${MIN_NIGHTS} nuit(s).`); return; }

  if(STRIPE_PAYMENT_LINK){
    const params = new URLSearchParams({prefilled_email:email, client_reference_id:`${s}_${en}_${g}`});
    window.location = STRIPE_PAYMENT_LINK + (STRIPE_PAYMENT_LINK.includes('?')?'&':'?') + params.toString();
    return;
  }

  if(SERVERLESS_ENDPOINT){
    const body = { start:s, end:en, guests:g, name, email, nightly:NIGHTLY_PRICE, cleaning:CLEANING_FEE };
    try{
      const res = await fetch(SERVERLESS_ENDPOINT, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
      const data = await res.json();
      if(data.url) window.location = data.url; else alert('Erreur de création de paiement.');
    }catch(err){ alert('Paiement indisponible pour le moment.'); }
    return;
  }

  alert('Configure STRIPE_PAYMENT_LINK ou SERVERLESS_ENDPOINT dans config.js');
});
