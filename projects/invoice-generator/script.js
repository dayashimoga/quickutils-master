/* Invoice Generator - Full Implementation */
'use strict';
(function(){
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const CURRENCIES={USD:'$',EUR:'€',GBP:'£',INR:'₹',JPY:'¥',CAD:'C$',AUD:'A$'};
const STORE_KEY='qu_invoices_v1';
let items=[{desc:'Website Design',qty:1,rate:1500},{desc:'Logo Design',qty:1,rate:500},{desc:'SEO Setup',qty:1,rate:300}];

function getCurrSym(){return CURRENCIES[$('#currencySelect').value]||'$';}
function fmt(n){return getCurrSym()+n.toFixed(2);}

function renderItems(){
  const sym=getCurrSym();
  $('#lineItems').innerHTML=items.map((it,i)=>`<tr>
    <td><input type="text" value="${esc(it.desc)}" data-idx="${i}" data-field="desc" placeholder="Description"></td>
    <td><input type="number" value="${it.qty}" data-idx="${i}" data-field="qty" min="0" step="1" style="width:60px"></td>
    <td><input type="number" value="${it.rate}" data-idx="${i}" data-field="rate" min="0" step="0.01" style="width:100px"></td>
    <td class="item-amount">${fmt(it.qty*it.rate)}</td>
    <td><button class="item-del" data-idx="${i}">✕</button></td>
  </tr>`).join('');

  $$('#lineItems input').forEach(inp=>inp.addEventListener('change',()=>{
    const idx=parseInt(inp.dataset.idx),field=inp.dataset.field;
    if(field==='desc')items[idx].desc=inp.value;
    else items[idx][field]=parseFloat(inp.value)||0;
    renderItems();
  }));
  $$('#lineItems .item-del').forEach(b=>b.addEventListener('click',()=>{items.splice(parseInt(b.dataset.idx),1);renderItems();}));
  renderTotals();
}

function renderTotals(){
  const subtotal=items.reduce((s,it)=>s+it.qty*it.rate,0);
  const discPct=parseFloat($('#discountRate').value)||0;
  const discount=subtotal*(discPct/100);
  const afterDisc=subtotal-discount;
  const taxPct=parseFloat($('#taxRate').value)||0;
  const tax=afterDisc*(taxPct/100);
  const total=afterDisc+tax;
  let html=`<div class="total-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>`;
  if(discPct>0)html+=`<div class="total-row"><span>Discount (${discPct}%)</span><span>-${fmt(discount)}</span></div>`;
  if(taxPct>0)html+=`<div class="total-row"><span>Tax (${taxPct}%)</span><span>${fmt(tax)}</span></div>`;
  html+=`<div class="total-row grand"><span>Total</span><span>${fmt(total)}</span></div>`;
  $('#totalsSection').innerHTML=html;
}

function esc(s){return s?s.replace(/</g,'&lt;').replace(/>/g,'&gt;'):'';}

$('#addItemBtn').addEventListener('click',()=>{items.push({desc:'',qty:1,rate:0});renderItems();});
$('#taxRate').addEventListener('change',renderTotals);
$('#discountRate').addEventListener('change',renderTotals);
$('#currencySelect').addEventListener('change',renderItems);
$('#templateSelect').addEventListener('change',()=>{
  const page=$('#invoicePage');
  page.className='invoice-page '+$('#templateSelect').value;
});

// Set default dates
const today=new Date();
$('#invoiceDate').value=today.toISOString().split('T')[0];
const due=new Date(today);due.setDate(due.getDate()+30);
$('#dueDate').value=due.toISOString().split('T')[0];

// Save/Load
function getInvoiceData(){
  return {
    company:$('#companyName').textContent,from:$('#fromAddress').innerHTML,
    to:$('#toAddress').innerHTML,num:$('#invoiceNum').textContent,
    date:$('#invoiceDate').value,due:$('#dueDate').value,
    notes:$('#invoiceNotes').textContent,items:JSON.parse(JSON.stringify(items)),
    tax:$('#taxRate').value,discount:$('#discountRate').value,
    currency:$('#currencySelect').value,template:$('#templateSelect').value
  };
}

function loadInvoiceData(d){
  $('#companyName').textContent=d.company||'Your Company';
  $('#fromAddress').innerHTML=d.from||'';$('#toAddress').innerHTML=d.to||'';
  $('#invoiceNum').textContent=d.num||'INV-001';
  if(d.date)$('#invoiceDate').value=d.date;
  if(d.due)$('#dueDate').value=d.due;
  $('#invoiceNotes').textContent=d.notes||'';
  items=d.items||[];$('#taxRate').value=d.tax||0;$('#discountRate').value=d.discount||0;
  if(d.currency)$('#currencySelect').value=d.currency;
  if(d.template){$('#templateSelect').value=d.template;$('#invoicePage').className='invoice-page '+d.template;}
  renderItems();
}

function loadSaved(){try{return JSON.parse(localStorage.getItem(STORE_KEY))||{};}catch{return {};}}
function saveSaved(d){localStorage.setItem(STORE_KEY,JSON.stringify(d));}

function renderSavedList(){
  const saved=loadSaved();
  const keys=Object.keys(saved);
  if(!keys.length){$('#savedList').innerHTML='<p style="font-size:0.75rem;color:var(--text-muted)">No saved invoices</p>';return;}
  $('#savedList').innerHTML=keys.map(k=>`<div class="saved-item" data-key="${k}"><span>${k}</span><button class="si-del" data-key="${k}">✕</button></div>`).join('');
  $$('.saved-item').forEach(el=>el.addEventListener('click',e=>{
    if(e.target.classList.contains('si-del'))return;
    loadInvoiceData(loadSaved()[el.dataset.key]);
    if(typeof QU!=='undefined')QU.showToast('Invoice loaded','success');
  }));
  $$('.si-del').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();const saved=loadSaved();delete saved[b.dataset.key];saveSaved(saved);renderSavedList();
  }));
}

$('#saveBtn').addEventListener('click',()=>{
  const num=$('#invoiceNum').textContent||'INV-001';
  const saved=loadSaved();saved[num]=getInvoiceData();saveSaved(saved);renderSavedList();
  if(typeof QU!=='undefined')QU.showToast('Invoice saved!','success');
});

$('#loadBtn').addEventListener('click',()=>{
  const saved=loadSaved();const keys=Object.keys(saved);
  if(!keys.length){if(typeof QU!=='undefined')QU.showToast('No saved invoices','error');return;}
  loadInvoiceData(saved[keys[keys.length-1]]);
});

$('#newBtn').addEventListener('click',()=>{
  items=[{desc:'',qty:1,rate:0}];
  $('#companyName').textContent='Your Company';
  $('#fromAddress').innerHTML='123 Business St<br>City, State 12345<br>email@company.com';
  $('#toAddress').innerHTML='Client Name<br>456 Client Ave<br>City, State 67890';
  const saved=loadSaved();const count=Object.keys(saved).length+1;
  $('#invoiceNum').textContent='INV-'+String(count).padStart(3,'0');
  renderItems();
});

// PDF export using print
$('#exportPdfBtn').addEventListener('click',()=>{window.print();});

renderItems();renderSavedList();
if(typeof QU!=='undefined')QU.init({kofi:true,discover:true});
})();
