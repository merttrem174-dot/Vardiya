
'use strict';
console.log('Shift Planner v4.5.2 loaded');
const $ = s => document.querySelector(s);
const dayNames = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

const state = {
  members: [], // {id,name,color}
  slots: [],   // [{id,label,s,e}] max 8
  holidays: [], // array for persistence; treated as Set in runtime
  dayoffs: {}, // {'YYYY-MM-DD':[memberId,...]}
  prefs: {balanceMonthly:true, antiRepeat:true, perDayOneSlot:true},
};

document.getElementById('thisMonthBtn').addEventListener('click', ()=>{
  const now = new Date(); $('#monthPick').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
});
document.getElementById('printBtn').addEventListener('click', ()=> window.print());

// Members
function colorFromName(name){
  let h = 0;
  for (let i=0;i<name.length;i++){ h = (h*31 + name.charCodeAt(i)) >>> 0; }
  const r = 150 + (h & 0x3F);
  const g = 120 + ((h >> 6) & 0x3F);
  const b = 160 + ((h >> 12) & 0x3F);
  return `rgb(${r},${g},${b})`;
}
function renderMembers(){
  const list = $('#membersList'); list.innerHTML='';
  const sel = $('#dayoffMember'); sel.innerHTML='';
  state.members.forEach(m=>{
    const row = document.createElement('div'); row.className='item';
    row.innerHTML = `<div><span class="member-dot" style="background:${m.color}"></span> <strong>${m.name}</strong> <span class="badge">${m.id.slice(0,6)}</span></div>`;
    const del = document.createElement('button'); del.className='btn danger'; del.textContent='Sil';
    del.onclick = ()=>{ state.members = state.members.filter(x=>x.id!==m.id); renderMembers(); renderDayoffs(); };
    row.appendChild(del);
    list.appendChild(row);
    const opt = document.createElement('option'); opt.value=m.id; opt.textContent=m.name; sel.appendChild(opt);
  });
  if(!state.members.length){ list.innerHTML='<div class="badge">Üye yok</div>'; }
}
$('#addMemberBtn').addEventListener('click', ()=>{
  const name = $('#memberName').value.trim(); if(!name) return;
  state.members.push({id:crypto.randomUUID(), name, color:colorFromName(name)});
  $('#memberName').value=''; renderMembers(); renderDayoffs();
});
$('#clearMembersBtn').addEventListener('click', ()=>{
  if(confirm('Tüm üyeler silinsin mi?')){ state.members=[]; renderMembers(); renderDayoffs(); }
});

// Slots
function renderSlots(){
  const wrap = $('#slotsList'); wrap.innerHTML='';
  if(!state.slots.length){ wrap.innerHTML = '<div class="badge">Slot ekleyin</div>'; return; }
  state.slots.sort((a,b)=>a.s.localeCompare(b.s));
  state.slots.forEach(s=>{
    const row = document.createElement('div'); row.className='item';
    row.innerHTML = `<div><strong>${s.label||'Slot'}</strong> <span class="badge">${s.s}–${s.e}</span></div>`;
    const del = document.createElement('button'); del.className='btn danger'; del.textContent='Sil';
    del.onclick = ()=>{ state.slots = state.slots.filter(x=>x.id!==s.id); renderSlots(); };
    row.appendChild(del);
    wrap.appendChild(row);
  });
}
$('#addSlotBtn').addEventListener('click', ()=>{
  if(state.slots.length>=8){ alert('En fazla 8 slot'); return; }
  const label = $('#slotLabel').value.trim() || 'Slot';
  const s = $('#slotStart').value, e = $('#slotEnd').value;
  if(!s||!e||e<=s){ alert('Saatleri kontrol edin'); return; }
  state.slots.push({id:crypto.randomUUID(), label, s, e});
  $('#slotLabel').value=''; renderSlots();
});
$('#clearSlotsBtn').addEventListener('click', ()=>{
  if(confirm('Tüm slotlar silinsin mi?')){ state.slots=[]; renderSlots(); }
});

// Holidays
function renderHolidays(){
  const wrap = $('#holidayList'); wrap.innerHTML='';
  const arr = Array.from(new Set(state.holidays)).sort();
  if(!arr.length){ wrap.innerHTML='<div class="badge">Tatil tarihi yok</div>'; return; }
  arr.forEach(d=>{
    const chip = document.createElement('span'); chip.className='chip'; chip.textContent=d;
    const x = document.createElement('span'); x.textContent='✕'; x.style.cursor='pointer';
    x.onclick = ()=>{ state.holidays = state.holidays.filter(xd=>xd!==d); renderHolidays(); };
    chip.append(' ',x); wrap.appendChild(chip);
  });
}
$('#addHolidayBtn').addEventListener('click', ()=>{
  const d = $('#holidayDate').value; if(!d) return; state.holidays.push(d); renderHolidays();
});
$('#clearHolidayBtn').addEventListener('click', ()=>{
  const d = $('#holidayDate').value; if(d){ state.holidays = state.holidays.filter(xd=>xd!==d); renderHolidays(); }
});

// Annual leaves (person-specific)
function monthDates(year, monthIdx){
  const out = [];
  const d = new Date(year, monthIdx, 1);
  while(d.getMonth() === monthIdx){
    out.push(new Date(d));
    d.setDate(d.getDate()+1);
  }
  return out;
}
function renderDayoffs(){
  const list = $('#dayoffList'); list.innerHTML='';
  const val = $('#monthPick').value || (new Date().toISOString().slice(0,7));
  const [yy,mm] = val.split('-').map(Number);
  const dates = monthDates(yy, mm-1).map(d=> d.toISOString().slice(0,10));
  let any = false;
  dates.forEach(ds=>{
    const ids = state.dayoffs[ds]||[]; if(!ids.length) return;
    any = true;
    const row = document.createElement('div'); row.className='item';
    const left = document.createElement('div'); left.innerHTML = `<strong>${ds}</strong> <span class="badge">${ids.length} izin</span>`;
    const right = document.createElement('div');
    ids.forEach(id=>{
      const m = state.members.find(x=>x.id===id); if(!m) return;
      const pill = document.createElement('span'); pill.className='member-pill';
      pill.innerHTML = `<span class="member-dot" style="background:${m.color}"></span>${m.name}`;
      pill.style.cursor='pointer'; pill.title='Kaldır';
      pill.onclick = ()=>{
        state.dayoffs[ds] = state.dayoffs[ds].filter(x=>x!==id);
        if(!state.dayoffs[ds].length) delete state.dayoffs[ds];
        renderDayoffs();
      };
      right.appendChild(pill);
    });
    row.appendChild(left); row.appendChild(right); list.appendChild(row);
  });
  if(!any){ list.innerHTML='<div class="badge">Bu ay için izin yok</div>'; }
}
$('#addDayoffBtn').addEventListener('click', ()=>{
  const d = $('#dayoffDate').value;
  const sel = document.getElementById('dayoffMember');
  const ids = Array.from(sel.selectedOptions).map(o=>o.value);
  if(!d || !ids.length) return;
  const set = new Set(state.dayoffs[d] || []);
  ids.forEach(id => set.add(id));
  state.dayoffs[d] = Array.from(set);
  renderDayoffs();
});
$('#clearDayoffBtn').addEventListener('click', ()=>{
  const d = $('#dayoffDate').value;
  if(d && state.dayoffs[d]){ delete state.dayoffs[d]; renderDayoffs(); }
});

document.getElementById('generateBtn').addEventListener('click', generate);
document.getElementById('csvBtn').addEventListener('click', exportCsv);

function hashStr(s){
  let h = 2166136261>>>0;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h>>>0;
}
function monthDatesObj(year, monthIdx){
  const d = new Date(year, monthIdx, 1);
  const out = [];
  while(d.getMonth() === monthIdx){
    out.push(new Date(d));
    d.setDate(d.getDate()+1);
  }
  return out;
}

function generate(){
  const monthVal = $('#monthPick').value || new Date().toISOString().slice(0,7);
  const [Y,M] = monthVal.split('-').map(Number);
  const dates = monthDatesObj(Y, M-1);
  if(!state.members.length || !state.slots.length){ alert('Önce kişi ve slot ekleyin'); return; }

  const maxMonthly = Math.max(0, parseInt(document.getElementById('maxMonthly').value||'0',10));
  const counts = Object.fromEntries(state.members.map(m=>[m.id,0]));
  const lastBySlot = {}; // slotId -> lastMemberId
  let prevSaturdaySet = new Set(); // members who worked on the most recent Saturday
  let prevDate = null;

  const tableHead = `<thead><tr><th>Tarih</th>` + state.slots.map((s,i)=>`<th>${s.label||('Slot '+(i+1))}<br><span class="badge">${s.s}–${s.e}</span></th>`).join('') + `</tr></thead>`;
  let tbody = '';

  for(let idx=0; idx<dates.length; idx++){
    const dObj = dates[idx];
    const ds = dObj.toISOString().slice(0,10);
    const weekday = dObj.getDay(); // 0=Sun..6=Sat
    const isHoliday = new Set(state.holidays).has(ds);
    const offSet = new Set(state.dayoffs[ds] || []);
    const assignedToday = new Set(); // enforce per-day one slot per person

    // Weekend pairing (Sat -> Sun rest)
    if(weekday === 6){ // Saturday
      prevSaturdaySet = new Set();
    }
    const isSunday = (weekday === 0);
    const sundayAvoidSet = (isSunday && prevDate && prevDate.getDay()===6) ? new Set(prevSaturdaySet) : new Set();

    let row = `<tr><th>${ds} <span class="badge">${dayNames[weekday]}</span>${isHoliday? ' · <span class="badge-dayoff">Tatil</span>':''}${offSet.size? ' · <span class="badge">'+offSet.size+' izin</span>':''}</th>`;

    const slotsToday = state.slots.slice().sort((a,b)=>a.s.localeCompare(b.s));
    let anyAssigned = False;
    for(let si=0; si<slotsToday.length; si++){
      const slot = slotsToday[si];
      if(isHoliday){
        row += `<td><span class="badge-dayoff">Tatil</span></td>`;
        continue;
      }
      // Build candidate list
      let candidates = state.members.filter(m => !offSet.has(m.id));
      // per-day one-slot-per-person
      candidates = candidates.filter(m => !assignedToday.has(m.id));
      // monthly cap
      if(maxMonthly > 0){
        candidates = candidates.filter(m => counts[m.id] < maxMonthly);
      }
      // Score
      const scored = candidates.map(m => {
        let score = counts[m.id];
        if(state.prefs.antiRepeat && lastBySlot[slot.id] === m.id) score += 0.6; // anti-repeat same slot day-to-day
        if(sundayAvoidSet.has(m.id)) score += 1000; // Sat worked -> Sun rest preference
        const tieRot = ((hashStr(m.name) + idx + si) % 97) / 10000; // tiny rotator
        score += tieRot;
        return {m, score};
      }).sort((a,b)=> a.score - b.score || a.m.name.localeCompare(b.m.name,'tr'));

      let chosen = scored.length ? scored[0].m : null;

      if(chosen){
        counts[chosen.id]++;
        lastBySlot[slot.id] = chosen.id;
        assignedToday.add(chosen.id);
        if(weekday===6) prevSaturdaySet.add(chosen.id);
        anyAssigned = True;
        row += `<td><span class="member-pill"><span class="member-dot" style="background:${chosen.color}"></span>${chosen.name}</span></td>`;
      }else{
        row += `<td><span class="badge-unavail">Boş</span></td>`;
      }
    }

    // Weekend guarantee: at least one slot on Sat/Sun (if not holiday)
    const isWeekend = (weekday===6 || weekday===0);
    if(isWeekend && !isHoliday && !anyAssigned){
      // Find an override (least loaded, under cap if set), ignoring dayoff veto only if absolutely necessary
      const basePool = state.members.filter(m => (not assignedToday.has(m.id)) and (maxMonthly==0 or counts[m.id] < maxMonthly));
      const pool = basePool.slice().sort((a,b)=> counts[a.id]-counts[b.id] || a.name.localeCompare(b.name,'tr'));
      let override = pool.find(m => !offSet.has(m.id));
      if(!override) override = pool[0];
      if(override){
        const emptyToken = '<td><span class="badge-unavail">Boş</span></td>';
        const tdIndex = row.indexOf(emptyToken);
        const content = `<td><span class="member-pill"><span class="member-dot" style="background:${override.color}"></span>${override.name} <span class="badge">⚠ override</span></span></td>`;
        if(tdIndex !== -1){ row = row.replace(emptyToken, content); } else { row += content; }
        counts[override.id]++;
        assignedToday.add(override.id);
        if(weekday===6) prevSaturdaySet.add(override.id);
        anyAssigned = True;
      }
    }

    row += `</tr>`;
    tbody += row;
    prevDate = dObj;
  }

  const table = `<table>${tableHead}<tbody>${tbody}</tbody></table>`;
  $('#tableWrap').innerHTML = table;

  // Legend
  const legend = $('#legend'); legend.innerHTML='';
  state.members.forEach(m=>{
    const pill = document.createElement('span'); pill.className='member-pill';
    pill.innerHTML = `<span class="member-dot" style="background:${m.color}"></span>${m.name}`;
    legend.appendChild(pill);
  });

  // Persist
  localStorage.setItem('shiftPlannerTRv452_state', JSON.stringify({
    members: state.members,
    slots: state.slots,
    holidays: state.holidays,
    dayoffs: state.dayoffs,
    prefs: state.prefs,
    maxMonthly,
  }));
}

function exportCsv(){
  const table = document.querySelector('#tableWrap table'); if(!table){ alert('Önce tablo oluşturun'); return; }
  const rows = Array.from(table.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(td=>'"'+td.textContent.replace(/"/g,'""')+'"').join(','));
  const csv = rows.join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a'); const url = URL.createObjectURL(blob);
  a.href = url; a.download = 'vardiya_aylik_v452.csv'; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 200);
}

// Load persisted state
(function load(){
  try{
    const s = localStorage.getItem('shiftPlannerTRv452_state');
    if(s){
      const d = JSON.parse(s);
      state.members = d.members || [];
      state.slots = d.slots || [];
      state.holidays = Array.isArray(d.holidays) ? d.holidays : [];
      state.dayoffs = d.dayoffs || {};
      state.prefs = Object.assign(state.prefs, d.prefs||{});
      if(typeof d.maxMonthly === 'number') document.getElementById('maxMonthly').value = String(d.maxMonthly);
    }
  }catch(e){}
  renderMembers(); renderSlots(); renderHolidays(); renderDayoffs();
})();