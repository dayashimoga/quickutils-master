/* Resume Builder - Full Implementation */
'use strict';
(function(){
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
let template='modern',experience=[
  {role:'Senior Software Engineer',company:'TechCorp Inc.',dates:'2021 - Present',desc:'Led development of microservices architecture serving 2M+ users. Reduced API response times by 40%. Mentored team of 5 junior developers.'},
  {role:'Software Engineer',company:'StartupXYZ',dates:'2018 - 2021',desc:'Built full-stack features using React and Node.js. Implemented CI/CD pipelines. Increased test coverage from 45% to 92%.'}
];
let education=[
  {role:'B.S. Computer Science',company:'University of California',dates:'2014 - 2018',desc:'GPA: 3.8/4.0. Dean\'s List. Senior project: Distributed task scheduling system.'}
];

function esc(s){return s?s.replace(/</g,'&lt;').replace(/>/g,'&gt;'):'';}

function renderEntries(section,data,containerId){
  const cont=$(containerId);
  cont.innerHTML=data.map((e,i)=>`<div class="entry-card">
    <div class="entry-header"><strong>${section} ${i+1}</strong><button class="entry-del" data-section="${section}" data-idx="${i}">🗑️</button></div>
    <input type="text" placeholder="Role / Degree" value="${esc(e.role)}" data-s="${section}" data-i="${i}" data-f="role">
    <input type="text" placeholder="Company / School" value="${esc(e.company)}" data-s="${section}" data-i="${i}" data-f="company">
    <input type="text" placeholder="Dates" value="${esc(e.dates)}" data-s="${section}" data-i="${i}" data-f="dates">
    <textarea placeholder="Description" rows="2" data-s="${section}" data-i="${i}" data-f="desc">${esc(e.desc)}</textarea>
  </div>`).join('');
  cont.querySelectorAll('input,textarea').forEach(inp=>inp.addEventListener('input',()=>{
    const arr=inp.dataset.s==='experience'?experience:education;
    arr[parseInt(inp.dataset.i)][inp.dataset.f]=inp.value;
    renderPreview();
  }));
  cont.querySelectorAll('.entry-del').forEach(b=>b.addEventListener('click',()=>{
    const arr=b.dataset.section==='experience'?experience:education;
    arr.splice(parseInt(b.dataset.idx),1);
    renderEntries(b.dataset.section,arr,containerId);
    renderPreview();
  }));
}

$$('.add-entry').forEach(b=>b.addEventListener('click',()=>{
  const arr=b.dataset.section==='experience'?experience:education;
  arr.push({role:'',company:'',dates:'',desc:''});
  renderEntries(b.dataset.section,arr,b.dataset.section==='experience'?'#experienceEntries':'#educationEntries');
  renderPreview();
}));

function renderPreview(){
  const name=$('#fullName').value,title=$('#jobTitle').value;
  const email=$('#email').value,phone=$('#phone').value;
  const loc=$('#location').value,web=$('#website').value;
  const summary=$('#summary').value;
  const skills=$('#skills').value.split(',').map(s=>s.trim()).filter(Boolean);

  let html=`<div class="r-header">
    <div class="r-name">${esc(name)}</div>
    <div class="r-title">${esc(title)}</div>
    <div class="r-contact">
      ${email?`<span>✉️ ${esc(email)}</span>`:''}
      ${phone?`<span>📱 ${esc(phone)}</span>`:''}
      ${loc?`<span>📍 ${esc(loc)}</span>`:''}
      ${web?`<span>🔗 ${esc(web)}</span>`:''}
    </div>
  </div>`;

  if(summary){
    html+=`<div class="r-section"><div class="r-section-title">Professional Summary</div><div class="r-summary">${esc(summary)}</div></div>`;
  }

  if(experience.length){
    html+=`<div class="r-section"><div class="r-section-title">Experience</div>`;
    experience.forEach(e=>{
      html+=`<div class="r-entry"><div class="r-entry-header"><span class="r-entry-role">${esc(e.role)}</span><span class="r-entry-dates">${esc(e.dates)}</span></div><div class="r-entry-company">${esc(e.company)}</div><div class="r-entry-desc">${esc(e.desc)}</div></div>`;
    });
    html+=`</div>`;
  }

  if(education.length){
    html+=`<div class="r-section"><div class="r-section-title">Education</div>`;
    education.forEach(e=>{
      html+=`<div class="r-entry"><div class="r-entry-header"><span class="r-entry-role">${esc(e.role)}</span><span class="r-entry-dates">${esc(e.dates)}</span></div><div class="r-entry-company">${esc(e.company)}</div><div class="r-entry-desc">${esc(e.desc)}</div></div>`;
    });
    html+=`</div>`;
  }

  if(skills.length){
    html+=`<div class="r-section"><div class="r-section-title">Skills</div><div class="r-skills">${skills.map(s=>`<span class="r-skill">${esc(s)}</span>`).join('')}</div></div>`;
  }

  $('#resumePage').innerHTML=html;
  $('#resumePage').className='resume-page '+template;
}

// Template switching
$$('.tmpl-btn').forEach(b=>b.addEventListener('click',()=>{
  $$('.tmpl-btn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');template=b.dataset.tmpl;renderPreview();
}));

// Live update
$$('#editPanel input, #editPanel textarea').forEach(el=>el.addEventListener('input',renderPreview));

// Save/Load
$('#saveBtn').addEventListener('click',()=>{
  const data={name:$('#fullName').value,title:$('#jobTitle').value,email:$('#email').value,
    phone:$('#phone').value,location:$('#location').value,website:$('#website').value,
    summary:$('#summary').value,skills:$('#skills').value,template,experience:JSON.parse(JSON.stringify(experience)),education:JSON.parse(JSON.stringify(education))};
  localStorage.setItem('qu_resume_v1',JSON.stringify(data));
  if(typeof QU!=='undefined')QU.showToast('Resume saved!','success');
});

$('#exportJsonBtn').addEventListener('click',()=>{
  const data={name:$('#fullName').value,title:$('#jobTitle').value,email:$('#email').value,
    phone:$('#phone').value,location:$('#location').value,website:$('#website').value,
    summary:$('#summary').value,skills:$('#skills').value,template,experience,education};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='resume.json';a.click();
});

$('#exportPdfBtn').addEventListener('click',()=>{window.print();});

// Load saved
try{
  const saved=JSON.parse(localStorage.getItem('qu_resume_v1'));
  if(saved){
    if(saved.name)$('#fullName').value=saved.name;
    if(saved.title)$('#jobTitle').value=saved.title;
    if(saved.email)$('#email').value=saved.email;
    if(saved.phone)$('#phone').value=saved.phone;
    if(saved.location)$('#location').value=saved.location;
    if(saved.website)$('#website').value=saved.website;
    if(saved.summary)$('#summary').value=saved.summary;
    if(saved.skills)$('#skills').value=saved.skills;
    if(saved.template){template=saved.template;$$('.tmpl-btn').forEach(b=>{b.classList.toggle('active',b.dataset.tmpl===template);});}
    if(saved.experience)experience=saved.experience;
    if(saved.education)education=saved.education;
  }
}catch{}

renderEntries('experience',experience,'#experienceEntries');
renderEntries('education',education,'#educationEntries');
renderPreview();
if(typeof QU!=='undefined')QU.init({kofi:true,discover:true});
})();
