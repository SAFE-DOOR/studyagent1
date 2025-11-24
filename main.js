// ========== Utility & Storage ===========
const dbKey = 'ai-ace-data-v1';
const defaultData = {
  notes: [],
  progress: {total:0,done:0,streak:0,dailyGoal:0,history:[]},
  pomodoro: {completed:0},
  flashcards: [],
  reminders: [],
  savedTests: [],
  mastery: [] // New Mastery Array
};
let state = loadData();

// Helper functions
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
function notify(msg) { alert(msg); }
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Data Handling
function loadData(){
  try{const s = localStorage.getItem(dbKey); return s? JSON.parse(s): JSON.parse(JSON.stringify(defaultData));}catch(e){return JSON.parse(JSON.stringify(defaultData));}
}
function saveData(){localStorage.setItem(dbKey, JSON.stringify(state));updateUI();}


// ========== CHART.JS LOGIC ===========
function updateChart() {
  const ctx = document.getElementById('chart').getContext('2d');
  
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const pomodoroData = [2, 4, 3, 5, 0, 1, state.pomodoro.completed % 6]; 
  const chapterData = [1, 0, 1, 0, 2, 0, state.progress.done - (state.progress.done > 3 ? state.progress.done - 3 : 0)]; 

  if (window.myChart) {
    window.myChart.destroy();
  }

  window.myChart = new Chart(ctx, {
    type: 'bar', 
    data: {
      labels: labels,
      datasets: [{
        label: 'Pomodoro Sessions',
        data: pomodoroData,
        backgroundColor: '#00eaffaa', 
        borderColor: '#00eaff',
        borderWidth: 1,
        yAxisID: 'y'
      }, {
        type: 'line', 
        label: 'Chapters Done (Weekly Mock)',
        data: chapterData,
        borderColor: '#8b5cf6', 
        backgroundColor: '#8b5cf633',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#e6eef8' }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Pomodoro Sessions', color: '#e6eef8' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { stepSize: 1, color: '#e6eef8' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Chapters Done', color: '#e6eef8' },
          grid: { drawOnChartArea: false },
          ticks: { stepSize: 1, color: '#e6eef8' }
        }
      },
      plugins: {
        legend: { labels: { color: '#e6eef8' } }
      }
    }
  });
}


// ========== Update UI and Init ===========

function updateProgressUI(){
  const t = state.progress.total||0; const d = state.progress.done||0; const pct = t?Math.round((d/t)*100):0;
  document.getElementById('totalCh').value = t||''; document.getElementById('doneCh').value = d||''; document.getElementById('dailyGoal').value = state.progress.dailyGoal||'';
  document.getElementById('progFill').style.width = pct+'%'; document.getElementById('progText').innerText = `Progress: ${pct}%`;
  document.getElementById('streak').innerText = state.progress.streak||0;
}

function renderFlash(){
  const el = document.getElementById('flashCard');
  if(!state.flashcards.length){el.innerHTML='No flashcards yet'}else{
    const c = state.flashcards[flashIndex]; el.innerHTML = flashFlipped?escapeHtml(c.back):escapeHtml(c.front);
  }
}

function renderReminders(){ 
  const el = document.getElementById('remList'); el.innerHTML=''; 
  state.reminders.forEach((r,i)=>{ 
    const d = new Date(r.when); 
    const diff = d.getTime() - Date.now();
    const isPast = diff < 0;
    const timeText = isPast ? 'Past Due' : Math.ceil(diff / (1000 * 60 * 60 * 24)) + ' days left';

    const div = document.createElement('div'); 
    div.className='muted'; 
    div.style.marginBottom = '5px';
    div.innerHTML = `<strong>${escapeHtml(r.title)}</strong> — ${d.toLocaleString()} (${timeText}) <button style="padding:4px 6px;margin-left:5px" data-i="${i}">Delete</button>`; 
    el.appendChild(div); 
  }); 
}
document.getElementById('remList').addEventListener('click',e=>{ if(e.target.dataset && e.target.dataset.i){ const idx= parseInt(e.target.dataset.i); state.reminders.splice(idx,1); saveData(); renderReminders(); } });
document.getElementById('clearRem').addEventListener('click',()=>{ state.reminders = []; saveData(); renderReminders(); alert('All reminders cleared.'); });

// ========== Mastery Tracker Logic ===========
function renderMastery(){
    const el = document.getElementById('masteryList');
    el.innerHTML = '';
    state.mastery.slice(0, 5).forEach((m, i) => {
        const stars = '⭐'.repeat(m.score);
        const div = document.createElement('div');
        div.innerHTML = `(${m.date}) <strong>${escapeHtml(m.topic)}</strong>: ${stars}`;
        el.appendChild(div);
    });
}
document.getElementById('saveMastery').addEventListener('click', () => {
    const topic = document.getElementById('masteryTopic').value.trim();
    const score = parseInt(document.getElementById('masteryScore').value);
    
    if (!topic || score < 1 || score > 5) {
        return alert('Please enter a topic and a score between 1 and 5.');
    }
    state.mastery.unshift({
        topic: topic,
        score: score,
        date: new Date().toLocaleDateString()
    });
    state.mastery = state.mastery.slice(0, 20); 
    saveData();
    notify(`Mastery for "${topic}" saved as ${score} stars!`);
});

function updateUI(){
  updateProgressUI();
  renderFlash();
  document.getElementById('pomCount').innerText = state.pomodoro.completed || 0;
  renderReminders();
  updateChart();
  renderMastery(); // Added Mastery Render
}


// ========== AI Notes (Mock fallback) ===========
function simpleEnhance(text){
  const s = text.split(/[\.\n]+/).map(x=>x.trim()).filter(Boolean);
  let summary = s.slice(0,2).join('. ');
  if(!summary) summary = text.slice(0,80);
  let bullets = s.map(l=>`• ${escapeHtml(l)}`).join('<br>');
  return `<div style="padding:10px;background:linear-gradient(90deg, rgba(255,255,255,0.01), rgba(255,255,255,0.02));border-radius:8px">
         <strong>Summary:</strong> ${escapeHtml(summary)}<br><br><strong>Key Points:</strong><br>${bullets}</div>`;
}

// Basic local mock generate 
document.getElementById('generateBtn').addEventListener('click', generateNotes);
function generateNotes(){
  const txt = document.getElementById('inputNotes').value.trim();
  if(!txt) return alert('Type or paste notes first');
  const enhanced = simpleEnhance(txt);
  const examTips = '<div class="muted" style="margin-top:8px">Exam Tip: Focus on definitions and one worked example per topic.</div>';
  const out = enhanced + examTips;
  document.getElementById('aiOutput').innerHTML = out;
}

// ========== AI Doubt Solver Logic ===========
document.getElementById('solveDoubtBtn').addEventListener('click', () => {
    const txt = document.getElementById('inputNotes').value.trim();
    if (!txt) return alert('Type your specific doubt or question in the box above.');

    let mockResponse = '';

    if (txt.toLowerCase().includes('what is') || txt.toLowerCase().includes('explain') || txt.toLowerCase().includes('how does')) {
        mockResponse = `<div style="padding:10px; border-left: 4px solid var(--accent-2); background: rgba(139, 92, 246, 0.1);">
            <strong>✅ AI Answer Simulation:</strong><br>
            Apne doubt ka pehla sentence/phrase paste karne par, system uske baare mein 2-3 line ki sankshipt (brief) jaankari dega. Jaise: **"The topic is related to ${txt.split(' ').slice(0, 5).join(' ')}. Key point: Focus on the central definition and practical application."**
        </div>`;
    } else {
        mockResponse = `<div class="muted" style="padding:10px; border: 1px dashed var(--muted);">
            **AI Search Simulation:** Your question "${txt.slice(0, 50)}..." has been cross-referenced with your notes. Please be specific (e.g., 'What is Bernoulli's principle?').
        </div>`;
    }

    document.getElementById('aiOutput').innerHTML = mockResponse;
});
// ===========================================

// Save note
document.getElementById('saveNoteBtn').addEventListener('click',()=>{
  const txt = document.getElementById('inputNotes').value.trim(); if(!txt) return alert('No notes to save');
  state.notes.unshift({text:txt,created:Date.now()}); saveData(); alert('Saved to local deck');
});

// Enhance button
document.getElementById('enhanceBtn').addEventListener('click',()=>{
  const txt = document.getElementById('inputNotes').value.trim(); if(!txt) return alert('No notes');
  document.getElementById('aiOutput').innerHTML = simpleEnhance(txt) + '<div class="muted" style="margin-top:8px">Enhanced automatically.</div>';
});


// ========== Flashcards ===========
let flashIndex = 0, flashFlipped=false;
function genFlashcardsFrom(text){
  const s = text.split(/[\.\n]+/).map(x=>x.trim()).filter(Boolean).slice(0,30);
  const cards = s.map(line=>({front:line,back:`Explanation: ${line}`}));
  return cards.length?cards:[];
}
document.getElementById('flashGenBtn').addEventListener('click',()=>{
  const txt = document.getElementById('inputNotes').value.trim(); if(!txt) return alert('Paste notes first');
  state.flashcards = genFlashcardsFrom(txt);
  flashIndex=0; flashFlipped=false; saveData(); renderFlash();
});
document.getElementById('nextFlash').addEventListener('click',()=>{if(state.flashcards.length){flashIndex=(flashIndex+1)%state.flashcards.length; flashFlipped=false; renderFlash();}});
document.getElementById('prevFlash').addEventListener('click',()=>{if(state.flashcards.length){flashIndex=(flashIndex-1+state.flashcards.length)%state.flashcards.length; flashFlipped=false; renderFlash();}});
document.getElementById('flipFlash').addEventListener('click',()=>{flashFlipped=!flashFlipped; renderFlash();});
document.getElementById('studyFlashSave').addEventListener('click',()=>{if(state.flashcards.length){saveData(); alert('Flashcards saved')}});


// ========== Progress Tracker ===========
document.getElementById('saveProgress').addEventListener('click',()=>{
  const t = parseInt(document.getElementById('totalCh').value)||0; const d = parseInt(document.getElementById('doneCh').value)||0; const g = parseInt(document.getElementById('dailyGoal').value)||0;
  state.progress.total = t; state.progress.done = d; state.progress.dailyGoal = g; saveData(); notify('Progress saved');
});

// Mark today's goal done -> increases streak
document.getElementById('markToday').addEventListener('click',()=>{
  const today = new Date().toISOString().slice(0,10);
  const h = state.progress.history||[]; if(h.includes(today)){return alert('Already marked today')}
  h.push(today); state.progress.history = h; state.progress.streak = (state.progress.streak||0)+1; saveData(); notify('Daily goal marked done — streak +1 🎉');
});


// ========== Pomodoro Timer ===========
let pomTimer = null; let pomRemain = 25*60; let pomRunning=false; let pomMode='work';
function setPomFromInputs(){ 
  pomRemain = (parseInt(document.getElementById('pomSession').value)||25)*60; 
  updatePomTime(); 
}
function updatePomTime(){ 
  const mm = String(Math.floor(pomRemain/60)).padStart(2,'0'); 
  const ss = String(pomRemain%60).padStart(2,'0'); 
  document.getElementById('pomTime').innerText = `${mm}:${ss}`; 
}
function startPom(){ 
  if(pomRunning) return; 
  pomRunning=true; 
  document.getElementById('startPom').innerText = 'Running...';
  pomTimer = setInterval(()=>{ 
    pomRemain--; 
    if(pomRemain<=0){clearInterval(pomTimer); pomRunning=false; onPomComplete(); } 
    updatePomTime(); 
  },1000); 
}
function pausePom(){ 
  if(pomTimer){clearInterval(pomTimer);} 
  pomRunning=false; 
  document.getElementById('startPom').innerText = 'Start';
}
function resetPom(){ 
  pausePom(); 
  setPomFromInputs(); 
  pomMode='work';
  document.getElementById('startPom').innerText = 'Start';
}
function onPomComplete(){ // toggle mode
  if(pomMode==='work'){ 
    state.pomodoro.completed = (state.pomodoro.completed||0)+1; 
    notify('Pomodoro complete! Take a break.');
    const short = parseInt(document.getElementById('pomShort').value)||5; 
    const long = parseInt(document.getElementById('pomLong').value)||15; 
    pomMode='break'; 
    pomRemain = (state.pomodoro.completed%4===0)? long*60: short*60;
  } else { // break ended
    notify('Break is over! Time to work.');
    pomMode='work'; 
    pomRemain = (parseInt(document.getElementById('pomSession').value)||25)*60;
  }
  saveData(); 
  updatePomTime(); 
  startPom(); 
}

document.getElementById('startPom').addEventListener('click', startPom);
document.getElementById('pausePom').addEventListener('click', pausePom);
document.getElementById('resetPom').addEventListener('click', resetPom);
setPomFromInputs();


// ========== Mock MCQ Generator (simple) ===========
function generateMCQsFrom(text, n=10){
  const sentences = text.split(/[\.\n]+/).map(s=>s.trim()).filter(Boolean);
  const pool = sentences.length?sentences: [text];
  const questions = [];
  for(let i=0;i<n;i++){
    const idx = i%pool.length; const s = pool[idx];
    const words = s.split(' ').filter(Boolean);
    const key = words[Math.floor(words.length/2)]||words[0]||'answer';
    const qtext = s.replace(new RegExp(key,'i'),'...'); 
    const opts = [key];
    while(opts.length<4){ let w = pool[Math.floor(Math.random()*pool.length)].split(' ')[Math.floor(Math.random()*5)]||('opt'+Math.floor(Math.random()*100)); if(!opts.includes(w) && w.length > 2) opts.push(w); }
    shuffle(opts);
    questions.push({q:qtext,opts:opts,ans:key});
  }
  return questions;
}

function renderMCQs(questions){
  const area = document.getElementById('mcqArea'); area.innerHTML = ''; questions.forEach((q,i)=>{
    const div = document.createElement('div'); div.className='mcq card'; div.innerHTML = `<strong>Q${i+1}.</strong> ${escapeHtml(q.q)}<div style="margin-top:6px">${q.opts.map((o,oi)=>`<button data-q="${i}" data-opt="${escapeHtml(o)}" data-selected="false">${oi+1}. ${escapeHtml(o)}</button>`).join('')}</div>`;
    area.appendChild(div);
  });
}

let currentMcq = [];
document.getElementById('mcqGenerateBtn').addEventListener('click',()=>{
  const txt = document.getElementById('inputNotes').value.trim(); if(!txt) return alert('Paste notes to generate MCQs');
  currentMcq = generateMCQsFrom(txt,10); renderMCQs(currentMcq);
  document.getElementById('mcqResult').innerHTML = ''; 
});

document.getElementById('mcqArea').addEventListener('click', e=>{
  if(e.target.tagName==='BUTTON' && e.target.dataset.q){ 
    const q = parseInt(e.target.dataset.q); 
    const opt = e.target.dataset.opt; 
    const parent = e.target.parentElement; 
    Array.from(parent.querySelectorAll('button')).forEach(b=>{ b.dataset.selected = 'false'; b.style.opacity=1; }); 
    e.target.dataset.selected = 'true';
    currentMcq[q].selected = opt;
  }
});

document.getElementById('submitMCQ').addEventListener('click',()=>{
  if(!currentMcq.length) return alert('No test to submit');
  let score=0; 
  currentMcq.forEach((q, qIndex)=>{ 
    const isCorrect = q.selected && q.selected.toLowerCase()===q.ans.toLowerCase();
    if(isCorrect) score++; 
    
    const mcqDiv = document.querySelector(`#mcqArea > div:nth-child(${qIndex + 1})`);
    if(mcqDiv) {
        Array.from(mcqDiv.querySelectorAll('button')).forEach(b => {
            b.style.opacity = 0.6;
            if (b.dataset.opt.toLowerCase() === q.ans.toLowerCase()) {
                b.style.backgroundColor = '#10b981'; 
                b.style.color = '#000';
                b.style.opacity = 1;
            } else if (b.dataset.selected === 'true' && !isCorrect) {
                b.style.backgroundColor = '#ef4444'; 
                b.style.color = '#000';
                b.style.opacity = 1;
            }
        });
    }
  });

  const pct = Math.round((score/currentMcq.length)*100);
  document.getElementById('mcqResult').innerHTML = `<div class="muted">Test Submitted! Score: <strong>${score}/${currentMcq.length}</strong> (${pct}%)</div>`;
});

document.getElementById('saveTest').addEventListener('click',()=>{ if(!currentMcq.length) return alert('No test'); state.savedTests.push({questions:currentMcq,created:Date.now()}); saveData(); notify('Test saved'); });

// ========== Reminders ===========
document.getElementById('addReminder').addEventListener('click',()=>{
  const title = document.getElementById('testTitle').value.trim(); 
  const when = document.getElementById('testDate').value; 
  if(!title||!when) return alert('Title + date required');
  state.reminders.push({title,when}); 
  saveData(); 
  notify('Reminder added');
});


// ========== Lofi & Motivational Mode (with Volume Control) ===========
const lofiAudio = document.getElementById('lofiAudio');
const lofiVolumeControl = document.getElementById('lofiVolume');

// Set initial volume
lofiAudio.volume = parseFloat(lofiVolumeControl.value);
lofiVolumeControl.addEventListener('input', (e) => {
    lofiAudio.volume = parseFloat(e.target.value);
});

document.getElementById('playLofi').addEventListener('click',()=>{
  lofiAudio.play().catch(e => console.error("Audio play failed:", e));
  notify('Lofi Mode ON 🎧');
});
document.getElementById('stopLofi').addEventListener('click',()=>{
  lofiAudio.pause();
  lofiAudio.currentTime = 0; // Rewind
  notify('Lofi Mode OFF');
});

const quotes = [
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "Study smart — not just hard.",
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Success is the sum of small efforts, repeated day in and day out. - Robert Collier",
    "Don't stop until you're proud."
];
document.getElementById('motivateBtn').addEventListener('click',()=>{
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById('quoteBox').innerHTML = `"${quote}"`;
});

// ========== Export / Import Data ===========
document.getElementById('exportBtn').addEventListener('click',()=>{
  const dataStr = JSON.stringify(state, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+encodeURIComponent(dataStr);
  const exportFileDefaultName = 'ai_ace_data.json';
  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', exportFileDefaultName);
  link.click();
  notify('Data exported as JSON.');
});

document.getElementById('importBtn').addEventListener('click',()=>{
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData.progress && importedData.pomodoro) {
          state = importedData;
          saveData(); 
          notify('Data imported successfully!');
        } else {
          notify('Error: Invalid data format in file.');
        }
      } catch (err) {
        notify('Error reading or parsing file.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
});


// ========== Initialization Call ===========
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
});
// ========== Mastery Tracker Logic (FIXED) ===========

function renderMastery(){
    const el = document.getElementById('masteryList');
    if (!el) return;
    
    el.innerHTML = '';
    
    // Sort by most recent date (date is a string, sorting helps keep recent items at top)
    state.mastery.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // केवल नवीनतम 5 एंट्री दिखाएँ
    state.mastery.slice(0, 5).forEach((m) => {
        // ⭐ Star Rendering FIX: 
        const stars = '⭐'.repeat(m.score);
        
        const div = document.createElement('div');
        // HTML संरचना को सरल बनाया गया है ताकि डिस्प्ले की समस्या न हो
        div.innerHTML = `<div class="small" style="margin-bottom: 3px;">
            (${m.date}) <strong>${escapeHtml(m.topic)}</strong>: ${stars}
        </div>`;
        el.appendChild(div);
    });
}

document.getElementById('saveMastery').addEventListener('click', () => {
    const topic = document.getElementById('masteryTopic').value.trim();
    const score = parseInt(document.getElementById('masteryScore').value);
    
    if (!topic) {
        return alert('कृपया टॉपिक (Topic) का नाम दर्ज करें।');
    }
    if (score < 1 || score > 5 || isNaN(score)) {
        return alert('मास्टरी स्कोर 1 और 5 के बीच होना चाहिए।');
    }
    
    // नया Mastery ऑब्जेक्ट बनाएं
    state.mastery.unshift({
        topic: topic,
        score: score,
        // आज की तारीख को सही फ़ॉर्मेट में सेव करें
        date: new Date().toLocaleDateString('en-IN') 
    });
    
    state.mastery = state.mastery.slice(0, 20); 
    
    // डेटा को सेव करें (जो स्वतः ही updateUI() और renderMastery() को कॉल करेगा)
    saveData(); 
    notify(`Mastery for "${topic}" saved as ${score} stars!`);
});

//... (बाकी main.js कोड नीचे जारी रहेगा)
// main.js (updateUI function)

function updateUI(){
  updateProgressUI();
  renderFlash();
  document.getElementById('pomCount').innerText = state.pomodoro.completed || 0;
  renderReminders();
  updateChart();
  renderMastery(); // <--- यह कॉल यहाँ होनी चाहिए
}
