/* Meal Planner - Full Implementation */
'use strict';
(function(){
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MEAL_SUGGESTIONS=[
  {name:'Oatmeal with Berries',cat:'breakfast',cal:350,protein:12,carbs:55,fat:8,ingredients:['1 cup oats','1/2 cup mixed berries','1 tbsp honey','1 cup milk']},
  {name:'Scrambled Eggs & Toast',cat:'breakfast',cal:420,protein:22,carbs:35,fat:20,ingredients:['3 eggs','2 slices bread','1 tbsp butter','Salt & pepper']},
  {name:'Greek Yogurt Parfait',cat:'breakfast',cal:300,protein:18,carbs:40,fat:8,ingredients:['1 cup Greek yogurt','1/4 cup granola','1/2 cup berries','1 tsp honey']},
  {name:'Avocado Toast',cat:'breakfast',cal:380,protein:10,carbs:35,fat:22,ingredients:['2 slices sourdough','1 avocado','1 egg','Red pepper flakes']},
  {name:'Grilled Chicken Salad',cat:'lunch',cal:450,protein:38,carbs:15,fat:25,ingredients:['200g chicken breast','2 cups mixed greens','1/2 cucumber','Cherry tomatoes','2 tbsp dressing']},
  {name:'Turkey Sandwich',cat:'lunch',cal:480,protein:28,carbs:45,fat:18,ingredients:['2 slices whole wheat bread','150g turkey','Lettuce, tomato','1 slice cheese','Mustard']},
  {name:'Quinoa Buddha Bowl',cat:'lunch',cal:520,protein:18,carbs:65,fat:20,ingredients:['1 cup cooked quinoa','1/2 cup chickpeas','Roasted veggies','Tahini dressing']},
  {name:'Caesar Wrap',cat:'lunch',cal:440,protein:25,carbs:38,fat:22,ingredients:['1 large tortilla','Romaine lettuce','150g chicken','Parmesan','Caesar dressing']},
  {name:'Salmon & Rice',cat:'dinner',cal:580,protein:35,carbs:55,fat:22,ingredients:['200g salmon fillet','1 cup jasmine rice','Steamed broccoli','Lemon','Soy sauce']},
  {name:'Pasta Bolognese',cat:'dinner',cal:620,protein:30,carbs:72,fat:20,ingredients:['200g spaghetti','200g ground beef','Tomato sauce','Onion, garlic','Parmesan']},
  {name:'Stir Fry Tofu',cat:'dinner',cal:420,protein:22,carbs:45,fat:18,ingredients:['200g firm tofu','Mixed vegetables','Soy sauce','Sesame oil','Rice']},
  {name:'Chicken Curry',cat:'dinner',cal:550,protein:32,carbs:50,fat:22,ingredients:['200g chicken','Curry paste','Coconut milk','Rice','Onion, garlic']},
  {name:'Grilled Steak',cat:'dinner',cal:650,protein:45,carbs:30,fat:35,ingredients:['250g sirloin steak','Baked potato','Green beans','Butter','Seasoning']},
  {name:'Mixed Nuts',cat:'snack',cal:180,protein:5,carbs:8,fat:16,ingredients:['30g mixed nuts']},
  {name:'Protein Shake',cat:'snack',cal:220,protein:25,carbs:18,fat:5,ingredients:['1 scoop protein powder','1 cup milk','1 banana']},
  {name:'Apple & Peanut Butter',cat:'snack',cal:250,protein:7,carbs:30,fat:14,ingredients:['1 apple','2 tbsp peanut butter']},
  {name:'Hummus & Veggies',cat:'snack',cal:160,protein:6,carbs:20,fat:7,ingredients:['1/3 cup hummus','Carrot sticks','Celery sticks','Bell pepper']},
];

let weekOffset=0, currentDay=null, currentCat=null, editIdx=null;
const storeKey='qu_meals_v2';

function getWeekStart(offset=0){
  const d=new Date(); d.setDate(d.getDate()-d.getDay()+offset*7);
  d.setHours(0,0,0,0); return d;
}
function dateKey(d){ return d.toISOString().split('T')[0]; }
function loadMeals(){ try{return JSON.parse(localStorage.getItem(storeKey))||{};}catch{return {};} }
function saveMeals(data){ localStorage.setItem(storeKey,JSON.stringify(data)); }

function renderWeek(){
  const start=getWeekStart(weekOffset);
  const end=new Date(start); end.setDate(end.getDate()+6);
  const opts={month:'short',day:'numeric'};
  $('#weekLabel').textContent=`${start.toLocaleDateString('en-US',opts)} — ${end.toLocaleDateString('en-US',opts)}`;
  const today=dateKey(new Date());
  const meals=loadMeals();
  let totalCal=0,totalP=0,totalC=0,totalF=0,mealCount=0;
  let html='';
  for(let i=0;i<7;i++){
    const d=new Date(start); d.setDate(d.getDate()+i);
    const dk=dateKey(d);
    const isToday=dk===today;
    const dayMeals=meals[dk]||[];
    let dayCal=0;
    dayMeals.forEach(m=>{dayCal+=m.cal||0;totalCal+=m.cal||0;totalP+=m.protein||0;totalC+=m.carbs||0;totalF+=m.fat||0;mealCount++;});
    html+=`<div class="day-col"><div class="day-header${isToday?' today':''}">${DAYS[d.getDay()]}<br><span style="font-weight:400;font-size:0.7rem">${d.getDate()}</span><div class="day-cal">${dayCal} kcal</div></div><div class="day-meals">`;
    const cats=['breakfast','lunch','dinner','snack'];
    const catEmoji={breakfast:'🌅',lunch:'☀️',dinner:'🌙',snack:'🍿'};
    cats.forEach(cat=>{
      const catMeals=dayMeals.filter(m=>m.cat===cat);
      catMeals.forEach((m,idx)=>{
        const realIdx=dayMeals.indexOf(m);
        html+=`<div class="meal-card" data-day="${dk}" data-idx="${realIdx}"><div class="meal-cat">${catEmoji[cat]} ${cat}</div><div class="meal-title">${esc(m.name)}</div><div class="meal-kcal">${m.cal||0} kcal</div><button class="meal-del" data-day="${dk}" data-idx="${realIdx}">✕</button></div>`;
      });
    });
    html+=`<button class="add-meal-btn" data-day="${dk}">+ Add Meal</button></div></div>`;
  }
  $('#weekGrid').innerHTML=html;
  const avgCal=mealCount?Math.round(totalCal/7):0;
  $('#weekStats').innerHTML=`<div class="stat-item"><div class="stat-val">${totalCal.toLocaleString()}</div><div class="stat-lbl">Total Calories</div></div><div class="stat-item"><div class="stat-val">${avgCal}</div><div class="stat-lbl">Avg/Day</div></div><div class="stat-item"><div class="stat-val">${totalP}g</div><div class="stat-lbl">Protein</div></div><div class="stat-item"><div class="stat-val">${totalC}g</div><div class="stat-lbl">Carbs</div></div><div class="stat-item"><div class="stat-val">${totalF}g</div><div class="stat-lbl">Fat</div></div><div class="stat-item"><div class="stat-val">${mealCount}</div><div class="stat-lbl">Meals</div></div>`;
  // Event listeners
  $$('.add-meal-btn').forEach(b=>b.addEventListener('click',()=>openMealModal(b.dataset.day)));
  $$('.meal-del').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();deleteMeal(b.dataset.day,parseInt(b.dataset.idx));}));
}

function esc(s){return s?s.replace(/</g,'&lt;').replace(/>/g,'&gt;'):'';}

function openMealModal(day,cat){
  currentDay=day; editIdx=null;
  $('#mealModalTitle').textContent='Add Meal — '+new Date(day+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
  ['mealName','mealCal','mealProtein','mealCarbs','mealFat','mealIngredients','mealNotes'].forEach(id=>{$(('#'+id)).value='';});
  $('#mealServings').value='1';
  renderSuggestions();
  $('#mealModal').classList.add('active');
}

function renderSuggestions(){
  $('#suggestionsGrid').innerHTML=MEAL_SUGGESTIONS.map((s,i)=>`<div class="suggest-card" data-idx="${i}"><div class="s-name">${s.name}</div><div class="s-cal">${s.cal} kcal · ${s.protein}g P · ${s.carbs}g C · ${s.fat}g F</div></div>`).join('');
  $$('.suggest-card').forEach(c=>c.addEventListener('click',()=>{
    const s=MEAL_SUGGESTIONS[parseInt(c.dataset.idx)];
    $('#mealName').value=s.name;$('#mealCal').value=s.cal;$('#mealProtein').value=s.protein;
    $('#mealCarbs').value=s.carbs;$('#mealFat').value=s.fat;$('#mealCategory').value=s.cat;
    $('#mealIngredients').value=s.ingredients.join('\n');
  }));
}

$('#saveMealBtn').addEventListener('click',()=>{
  const name=$('#mealName').value.trim();
  if(!name){if(typeof QU!=='undefined')QU.showToast('Enter a meal name','error');return;}
  const servings=parseInt($('#mealServings').value)||1;
  const meal={name,cat:$('#mealCategory').value,cal:(parseInt($('#mealCal').value)||0)*servings,
    protein:(parseInt($('#mealProtein').value)||0)*servings,carbs:(parseInt($('#mealCarbs').value)||0)*servings,
    fat:(parseInt($('#mealFat').value)||0)*servings,servings,
    ingredients:$('#mealIngredients').value.split('\n').filter(l=>l.trim()),
    notes:$('#mealNotes').value.trim()};
  const meals=loadMeals();
  if(!meals[currentDay])meals[currentDay]=[];
  meals[currentDay].push(meal);
  saveMeals(meals);renderWeek();
  $('#mealModal').classList.remove('active');
  if(typeof QU!=='undefined')QU.showToast('Meal added!','success');
});

function deleteMeal(day,idx){
  const meals=loadMeals();
  if(meals[day]){meals[day].splice(idx,1);if(!meals[day].length)delete meals[day];saveMeals(meals);renderWeek();}
}

$('#closeMealModal').addEventListener('click',()=>$('#mealModal').classList.remove('active'));
$('#mealModal').addEventListener('click',e=>{if(e.target.id==='mealModal')$('#mealModal').classList.remove('active');});
$('#prevWeek').addEventListener('click',()=>{weekOffset--;renderWeek();});
$('#nextWeek').addEventListener('click',()=>{weekOffset++;renderWeek();});
$('#clearWeekBtn').addEventListener('click',()=>{
  if(!confirm('Clear all meals this week?'))return;
  const meals=loadMeals();const start=getWeekStart(weekOffset);
  for(let i=0;i<7;i++){const d=new Date(start);d.setDate(d.getDate()+i);delete meals[dateKey(d)];}
  saveMeals(meals);renderWeek();
});

// Grocery list
$('#groceryBtn').addEventListener('click',()=>{
  const meals=loadMeals();const start=getWeekStart(weekOffset);
  const allIngredients=[];
  for(let i=0;i<7;i++){const d=new Date(start);d.setDate(d.getDate()+i);const dk=dateKey(d);
    (meals[dk]||[]).forEach(m=>(m.ingredients||[]).forEach(ing=>allIngredients.push(ing)));}
  if(!allIngredients.length){$('#groceryList').innerHTML='<p style="color:var(--text-muted)">No meals planned this week. Add meals first!</p>';$('#groceryModal').classList.add('active');return;}
  // Group by category heuristic
  const cats={Produce:[],Protein:[],Dairy:[],Grains:[],Other:[]};
  const produceWords=['lettuce','tomato','cucumber','onion','garlic','pepper','broccoli','carrot','celery','apple','banana','berries','avocado','lemon','vegetable','greens'];
  const proteinWords=['chicken','beef','salmon','tofu','turkey','egg','steak','pork','fish','shrimp','protein'];
  const dairyWords=['milk','cheese','yogurt','butter','cream'];
  const grainWords=['bread','rice','oats','pasta','tortilla','quinoa','granola','spaghetti','sourdough'];
  allIngredients.forEach(ing=>{
    const l=ing.toLowerCase();
    if(produceWords.some(w=>l.includes(w)))cats.Produce.push(ing);
    else if(proteinWords.some(w=>l.includes(w)))cats.Protein.push(ing);
    else if(dairyWords.some(w=>l.includes(w)))cats.Dairy.push(ing);
    else if(grainWords.some(w=>l.includes(w)))cats.Grains.push(ing);
    else cats.Other.push(ing);
  });
  let html='';
  Object.entries(cats).forEach(([cat,items])=>{
    if(!items.length)return;
    const unique=[...new Set(items)];
    html+=`<div class="grocery-category"><h3>${cat}</h3>${unique.map(it=>`<div class="grocery-item"><input type="checkbox"><span>${esc(it)}</span></div>`).join('')}</div>`;
  });
  $('#groceryList').innerHTML=html;
  $('#groceryModal').classList.add('active');
});
$('#closeGrocery').addEventListener('click',()=>$('#groceryModal').classList.remove('active'));
$('#groceryModal').addEventListener('click',e=>{if(e.target.id==='groceryModal')$('#groceryModal').classList.remove('active');});
$('#copyGroceryBtn').addEventListener('click',()=>{
  const items=[];$$('#groceryList .grocery-item span').forEach(s=>items.push('- '+s.textContent));
  if(typeof QU!=='undefined')QU.copyToClipboard(items.join('\n'));
});

renderWeek();
if(typeof QU!=='undefined')QU.init({kofi:true,discover:true});
})();
