/* ShoppingBuddy: city-specific store directory + collaborative routes */
const cityStoreCatalogue = {
 "Aalst":[
  {name:"Zara",category:"Mode",icon:"👗",address:"Nieuwstraat 27",url:"https://www.zara.com/be/nl/z-winkels-st1404.html"},
  {name:"H&M",category:"Mode",icon:"👕",address:"Nieuwstraat 27–29",url:"https://www.openingsuren.vlaanderen/h-en-m"},
  {name:"C&A",category:"Mode",icon:"🧥",address:"Nieuwstraat 45/49",url:"https://www.c-and-a.com/stores/be-nl/oost-vlaanderen/aalst/nieuwstraat-45-49.html"},
  {name:"JBC",category:"Mode",icon:"👖",address:"Nieuwstraat 42/52 · Gentsesteenweg 450",url:"https://www.jbc.be/nl-be/winkels/detail/?location=aalst"}
 ],
 "Antwerpen":[
  {name:"Zara",category:"Mode",icon:"👗",address:"Meir 58 · Huidevettersstraat 39",url:"https://www.zara.com/be/nl/z-winkels-st1404.html"},
  {name:"H&M",category:"Mode",icon:"👕",address:"Meir 89–97 · Meir 28",url:"https://www.openingsuren.vlaanderen/h-en-m"},
  {name:"Primark",category:"Mode & lifestyle",icon:"🛍️",address:"Meir 22–30",url:"https://www.primark.com/nl-be/stores/antwerp/meir-22-30"}
 ],
 "Brugge":[
  {name:"Zara",category:"Mode",icon:"👗",address:"Steenstraat 29",url:"https://www.zara.com/be/nl/z-winkels-st1404.html"},
  {name:"H&M",category:"Mode",icon:"👕",address:"Steenstraat 80 · Zuidzandstraat 46",url:"https://www.openingsuren.vlaanderen/h-en-m"}
 ],
 "Gent":[
  {name:"Zara",category:"Mode",icon:"👗",address:"Veldstraat 56",url:"https://www.zara.com/be/nl/z-winkels-st1404.html"},
  {name:"H&M",category:"Mode",icon:"👕",address:"Veldstraat 23–27",url:"https://www.openingsuren.vlaanderen/h-en-m"},
  {name:"Primark",category:"Mode & lifestyle",icon:"🛍️",address:"Langemunt 54",url:"https://www.primark.com/nl-be/stores/ghent/langemunt-54"}
 ],
 "Hasselt":[
  {name:"Zara",category:"Mode",icon:"👗",address:"Hoogstraat 17",url:"https://www.zara.com/be/nl/z-winkels-st1404.html"},
  {name:"Primark",category:"Mode & lifestyle",icon:"🛍️",address:"Molenstraat 5",url:"https://www.primark.com/nl-be/stores"}
 ],
 "Leuven":[
  {name:"Zara",category:"Mode",icon:"👗",address:"Bondgenotenlaan 75–79",url:"https://www.zara.com/be/nl/z-winkels-st1404.html"}
 ],
 "Mechelen":[
  {name:"Zara",category:"Mode",icon:"👗",address:"Bruul 67",url:"https://www.zara.com/be/nl/z-winkels-st1404.html"},
  {name:"H&M",category:"Mode",icon:"👕",address:"Bruul 42",url:"https://www.openingsuren.vlaanderen/h-en-m"}
 ],
 "Brussel":[
  {name:"Zara",category:"Mode",icon:"👗",address:"Nieuwstraat 30 · Nieuwstraat 123",url:"https://www.zara.com/be/nl/z-winkels-st1404.html"},
  {name:"Primark",category:"Mode & lifestyle",icon:"🛍️",address:"Nieuwstraat 13–15",url:"https://www.primark.com/nl-be/stores"}
 ],
 "Sint-Niklaas":[
  {name:"Zara",category:"Mode",icon:"👗",address:"Kapelstraat 100",url:"https://www.zara.com/be/nl/z-winkels-st1404.html"}
 ]
};
let shoppingRoutes=[];
let joinedShoppingRouteIds=new Set();

function storesForCity(city){return cityStoreCatalogue[city]||[];}

function renderStoreDirectory(){
 const grid=document.getElementById("shoppingStoresGrid");
 const citySelect=document.getElementById("storeDirectoryCity");
 if(!grid||!citySelect)return;
 const city=citySelect.value;
 if(!city){grid.innerHTML='<p class="muted small">Kies een stad om de gevonden winkels en adressen te bekijken.</p>';return;}
 const stores=storesForCity(city);
 grid.innerHTML=stores.length?stores.map(s=>`<article class="store-card"><div class="store-logo">${s.icon}</div><div class="store-card-copy"><strong>${escapeHTML(s.name)}</strong><small>${escapeHTML(s.category)}</small><small class="store-address">${escapeHTML(s.address)}</small><a href="${escapeHTML(s.url)}" target="_blank" rel="noopener">Controleer winkel ↗</a></div></article>`).join(""):'<p class="muted small">Er zijn nog geen gecontroleerde winkeladressen voor deze stad toegevoegd.</p>';
}

function updateCityStores(){
 const city=document.getElementById("routeCity")?.value||"";
 const choices=document.getElementById("routeStoreChoices");
 const help=document.getElementById("routeStoreHelp");
 const directory=document.getElementById("storeDirectoryCity");
 if(directory){directory.value=city;renderStoreDirectory();}
 if(!choices)return;
 if(!city){choices.innerHTML='<div class="small muted">Kies eerst een stad.</div>';if(help)help.textContent="Kies eerst een stad om de beschikbare winkels te zien.";return;}
 const stores=storesForCity(city);
 if(help)help.textContent=stores.length?`Winkels met een gevonden vestiging in ${city}. Vink aan wat je wilt bezoeken.`:`Nog geen gecontroleerde winkels in ${city}.`;
 choices.innerHTML=stores.length?stores.map(s=>`<label class="route-store-choice" title="${escapeHTML(s.address)}"><input type="checkbox" name="routeStores" value="${escapeHTML(s.name)}"><span>${s.icon} <strong>${escapeHTML(s.name)}</strong><small>${escapeHTML(s.address)}</small></span></label>`).join(""):'<div class="small muted">Geen gecontroleerde winkels beschikbaar voor deze stad.</div>';
}

async function loadShoppingRoutes(){
 const el=document.getElementById("shoppingRoutesList");if(!el)return;
 el.innerHTML='<div class="card route-empty">Shoppingroutes laden...</div>';
 try{
  const {data,error}=await supabaseClient.from("shopping_routes_with_counts").select("*").gte("route_date",new Date().toISOString().slice(0,10)).order("route_date").order("start_time");
  if(error)throw error;shoppingRoutes=data||[];joinedShoppingRouteIds=new Set();
  if(currentUser){const m=await supabaseClient.from("shopping_route_members").select("route_id").eq("user_id",currentUser.user.id);if(m.error)throw m.error;(m.data||[]).forEach(x=>joinedShoppingRouteIds.add(x.route_id));}
  renderShoppingRoutes();
 }catch(e){console.error("ROUTES LOAD",e);el.innerHTML=`<div class="card route-empty"><h3>Shoppingroutes laden nog niet</h3><p class="muted" style="margin:9px 0">${escapeHTML(e.message||"Onbekende fout")}</p><p class="small muted">Voer eerst ShoppingBuddy_ShoppingRoutes.sql uit in Supabase SQL Editor.</p><button class="secondary-btn" style="margin-top:15px" onclick="loadShoppingRoutes()">Opnieuw proberen</button></div>`;}
}
function renderShoppingRoutes(){
 const el=document.getElementById("shoppingRoutesList");if(!el)return;
 if(!shoppingRoutes.length){el.innerHTML='<div class="card route-empty"><div style="font-size:35px">🛍️</div><h3 style="margin:10px 0">Nog geen shoppingroutes</h3><p class="muted">Wees de eerste die een route maakt.</p></div>';return;}
 el.innerHTML=shoppingRoutes.map(r=>{
  const stops=Array.isArray(r.stops)?r.stops:[],count=Number(r.participant_count||0),joined=joinedShoppingRouteIds.has(r.id),owner=currentUser&&r.creator_id===currentUser.user.id,full=count>=r.max_participants;
  const action=owner?'<span class="route-pill">Jouw route</span>':joined?'<span class="route-pill">✓ Je bent erbij</span>':full?'<span class="route-pill">Volzet</span>':`<button class="primary-btn" onclick="joinShoppingRoute('${r.id}')">Join route</button>`;
  return `<article class="route-card"><div class="route-card-top"><span class="route-pill">🛍️ Shoppingroute</span><span class="small muted">${count}/${r.max_participants} deelnemers</span></div><h3>${escapeHTML(r.title)}</h3><div class="small muted">Door ${escapeHTML(r.creator_name||"ShoppingBuddy")}</div><div class="route-meta"><span>📍 ${escapeHTML(r.city)} · Afspraak: ${escapeHTML(r.meeting_point)}</span><span>📅 ${escapeHTML(formatDate(r.route_date))} · 🕐 ${escapeHTML(String(r.start_time).slice(0,5))}</span></div><div class="route-stops">${stops.map((s,i)=>`<span class="route-stop">${i+1}. ${escapeHTML(s)}</span>`).join("")||'<span class="route-stop">Vrije shoppingroute</span>'}</div><p class="small muted" style="line-height:1.5">${escapeHTML(r.description||"Samen op ontdekking.")}</p><div class="route-card-footer"><span class="small muted">👥 Max. ${r.max_participants} personen</span>${action}</div></article>`;
 }).join("");
}
async function createShoppingRoute(){
 if(!currentUser){showToast("Log eerst in om een shoppingroute te maken.","error");showPage("loginPage");return;}
 const title=document.getElementById("routeTitle").value.trim(),city=document.getElementById("routeCity").value,meeting=document.getElementById("routeMeeting").value.trim(),date=document.getElementById("routeDate").value,time=document.getElementById("routeTime").value,limit=Number(document.getElementById("routeMax").value),description=document.getElementById("routeDescription").value.trim(),stops=[...document.querySelectorAll('input[name="routeStores"]:checked')].map(x=>x.value);
 if(!title||!city||!meeting||!date||!time){showToast("Vul naam, stad, afspreekpunt, datum en startuur in.","error");return;}
 if(date<new Date().toISOString().slice(0,10)){showToast("Kies een datum vanaf vandaag.","error");return;}
 if(!storesForCity(city).length){showToast("Voor deze stad zijn nog geen gecontroleerde winkels beschikbaar.","error");return;}
 const btn=document.getElementById("createRouteButton");btn.disabled=true;btn.textContent="Route publiceren...";
 try{
  const name=currentUser.profile?.username||currentUser.email?.split("@")[0]||"ShoppingBuddy";
  const {data,error}=await supabaseClient.from("shopping_routes").insert({creator_id:currentUser.user.id,creator_name:name,title,city,meeting_point:meeting,route_date:date,start_time:time,max_participants:limit,description,stops}).select().single();
  if(error)throw error;
  const joined=await supabaseClient.rpc("join_shopping_route",{p_route_id:data.id});if(joined.error)console.warn("Creator auto-join:",joined.error);
  ["routeTitle","routeMeeting","routeDate","routeTime","routeDescription"].forEach(id=>document.getElementById(id).value="");document.getElementById("routeCity").value="";document.querySelectorAll('input[name="routeStores"]').forEach(x=>x.checked=false);document.getElementById("routeMax").value="4";updateCityStores();
  showToast("Je shoppingroute is gepubliceerd! 🎉","success");await loadShoppingRoutes();
 }catch(e){console.error("CREATE ROUTE",e);showToast(e.message||"De route kon niet worden gepubliceerd.","error");}
 finally{btn.disabled=false;btn.textContent="Route publiceren";}
}
async function joinShoppingRoute(id){
 if(!currentUser){showToast("Log eerst in om mee te gaan.","error");showPage("loginPage");return;}
 try{const {error}=await supabaseClient.rpc("join_shopping_route",{p_route_id:id});if(error)throw error;showToast("Je bent toegevoegd aan de shoppingroute! 🎉","success");await loadShoppingRoutes();}
 catch(e){console.error("JOIN ROUTE",e);showToast(e.message||"Je kon niet deelnemen aan deze route.","error");}
}
