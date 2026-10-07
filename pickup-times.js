/* Same-calendar-day demo pickup in Europe/Lisbon. All today's slots stay visible.
   Existing hours: weekdays 08:00 / weekends 08:30 until 00:30. The 00:00 and
   00:15 slots belong to TODAY's early-morning opening period, never tomorrow.
   Keep the existing 15-minute preparation allowance. No live capacity service. */
(() => {
  'use strict';
  const localParts = date => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  }).formatToParts(date).map(p=>[p.type,p.value]));
  const clock = minute => `${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
  function schedule(now=new Date()) {
    const p=localParts(now), date=`${p.year}-${p.month}-${p.day}`;
    const day=new Date(date+'T12:00:00Z').getUTCDay();
    const opening=[0,6].includes(day)?510:480;
    const earliest=Math.ceil((Number(p.hour)*60+Number(p.minute)+Number(p.second)/60+15)/15)*15;
    const minutes=[0,15];
    for(let m=opening;m<1440;m+=15)minutes.push(m);
    return minutes.map(m=>({id:`${date}T${clock(m)}`,time:clock(m),date,disabled:m<earliest}));
  }
  const preferenceTimes=[];
  for(let m=480;m<1440;m+=15)preferenceTimes.push(clock(m));
  preferenceTimes.push('00:00','00:15');
  window.CupsPickup={schedule,available:(now)=>schedule(now).filter(slot=>!slot.disabled),preferenceTimes};
})();
