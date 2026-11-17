/* OFFFRAME V10 — content-based discovery + locally saved art-event prototype.
   Demonstration data is labelled. No server accounts, synced RSVP, or real event feed. */
'use strict';
(() => {
 const esc = clean;
 const n = x => String(x||'').trim().toLowerCase();
 const uniq = a => [...new Set(a.filter(Boolean))];
 const eventStorage = 'events_v10';
 const viewportCityKey = 'event_city_v10';
 const daysFromNow = d => {const dt=new Date();dt.setHours(12,0,0,0);dt.setDate(dt.getDate()+d);return dt.toISOString().slice(0,10)};
 const cityOptions=['Washington, DC','New Orleans, LA'];
 const scene={city:get(viewportCityKey,'Washington, DC'),view:'browse',eventId:null,timeFilter:'all',kindFilter:'all',search:'',personalize:get('personalization_v10',true),dwell:get('view_time_v10',{}),localEvents:get(eventStorage,[]),responses:get('event_responses_v10',{}),savedEvents:get('saved_events_v10',[]),sharedEvent:null};
 const worksById=id=>byId(id);
 const sampleEvents=[
  {id:'sample-dc-open',title:'Open Studio: Color & Form',city:'Washington, DC',district:'Shaw · sample venue',date:daysFromNow(5),time:'18:30',duration:150,category:'Open studio',description:'A sample studio night for exploring paintings and meeting the artists behind them. This is a design preview, not a real listing.',artists:['nia','oren'],workIds:['n3','n1','o1'],cover:'n3',sample:true,public:true},
  {id:'sample-dc-prints',title:'Print & Paper: A Gallery Night',city:'Washington, DC',district:'Georgetown · sample venue',date:daysFromNow(12),time:'17:00',duration:120,category:'Gallery opening',description:'A fictional exhibition page showing how a visitor could explore featured prints and participating artists before attending.',artists:['oren','nia'],workIds:['o3','o1','n5'],cover:'o3',sample:true,public:true},
  {id:'sample-nola-gallery',title:'After Hours: Contemporary Art',city:'New Orleans, LA',district:'Arts District · sample venue',date:daysFromNow(7),time:'19:00',duration:180,category:'Gallery opening',description:'An illustrative exhibition linking art discovery to a local event page. No actual gallery or event has been confirmed.',artists:['nia','oren'],workIds:['n1','n2','o1'],cover:'n1',sample:true,public:true},
  {id:'sample-nola-sketch',title:'Sketchbook Social',city:'New Orleans, LA',district:'Bywater · sample venue',date:daysFromNow(14),time:'14:00',duration:120,category:'Workshop',description:'A sample community drawing meetup with artist portfolios connected to the invitation.',artists:['oren'],workIds:['o2','o3'],cover:'o2',sample:true,public:true}
 ];
 const allEvents=()=>[...scene.localEvents,...sampleEvents,...(scene.sharedEvent?[scene.sharedEvent]:[])].filter((e,i,a)=>a.findIndex(v=>v.id===e.id)===i);
 const futureEvents=()=>allEvents().filter(e=>e.date>=daysFromNow(0)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const eventById=id=>allEvents().find(e=>e.id===id);
 const artistEvents=(id,city=scene.city)=>futureEvents().filter(e=>e.city===city&&((e.sample&&e.artists.includes(id))||(!e.sample&&e.confirmedArtists?.includes(id))));
 const featured=e=>worksById(e.cover)||worksById(e.workIds?.[0]);
 const displayDate=(day,time)=>{const dt=new Date(`${day}T${time||'12:00'}:00`);return Number.isNaN(dt.getTime())?'Date pending':new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(dt)};
 const monthDay=day=>new Date(`${day}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'});
 const artTokens=w=>{const a=artists[w.artist];return uniq([`style:${n(w.style)}`,`medium:${n(w.medium)}`,...(w.tags||[]).map(t=>`tag:${n(t)}`),...(a?.discoveryTags||[]).slice(0,5).map(t=>`tag:${n(t)}`),...(a?.mood||[]).map(t=>`mood:${n(t)}`)]).filter(s=>s.length>6)};
 function makeTaste(){
  const weights=new Map();let signals=0;
  const add=(w,amount)=>{if(!w||!Number.isFinite(amount)||amount<=0)return;signals+=amount;for(const t of artTokens(w))weights.set(t,Math.min(55,(weights.get(t)||0)+amount));};
  state.favorites.forEach(id=>add(worksById(id),7));
  state.liked.forEach(id=>{if(!id.startsWith('post:'))add(worksById(id),4)});
  state.following.forEach(id=>artistWorks(id).slice(0,3).forEach(w=>add(w,1.7)));
  Object.entries(scene.dwell).forEach(([id,secs])=>{const t=Math.min(120,Number(secs)||0);if(t>=6)add(worksById(id),Math.min(3,Math.log2(t/6+1)));});
  return {weights,signals};
 }
 function matchWork(w,taste){const tokens=artTokens(w);const ranked=tokens.map(t=>[t,taste.weights.get(t)||0]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);const score=ranked.reduce((sum,[,v])=>sum+Math.sqrt(v),0);return {score,reason:ranked[0]?.[0].split(':').slice(1).join(':')||''};}
 function scoreArtist(a,taste){const aw=artistWorks(a.id);const best=aw.map(w=>matchWork(w,taste)).sort((x,y)=>y.score-x.score)[0]||{score:0,reason:''};return {score:best.score+(state.following.includes(a.id)?2.4:0)+(a.archive?0:.65),reason:best.reason};}
 const originalRenderFeed=renderFeed;
 renderFeed=function(){
  originalRenderFeed();
  if(state.feed!=='all'||state.mood)return;
  const feed=$('#swipe-feed'),slides=$$('.swipe-slide',feed);if(!slides.length)return;
  const taste=makeTaste();
  if(scene.personalize&&taste.signals>0){
   const ranked=slides.map((el,i)=>{const a=artists[el.dataset.slide];const best=scoreArtist(a,taste);const w=worksById(el.dataset.work);const workScore=w?matchWork(w,taste).score:0;return {el,i,score:best.score+workScore*.26,reason:best.reason};});
   ranked.sort((a,b)=>b.score-a.score||a.i-b.i);
   // A deliberate exploration slot every fifth card keeps less familiar styles visible.
   const arranged=[],pool=ranked.slice();
   while(pool.length){
    const fresh=arranged.length%5===4&&pool.length>1;
    const index=fresh?Math.min(pool.length-1,Math.floor(pool.length*.65)):0;
    let picked=pool.splice(index,1)[0];
    if(arranged.length&&arranged[arranged.length-1].el.dataset.slide===picked.el.dataset.slide){const alternative=pool.findIndex(p=>p.el.dataset.slide!==picked.el.dataset.slide);if(alternative>=0){pool.push(picked);picked=pool.splice(alternative,1)[0];}}
    arranged.push(picked);
   }
   arranged.forEach(r=>feed.appendChild(r.el));
  }
  const existing=$('#taste-control-strip');if(existing)existing.remove();
  const strip=document.createElement('div');strip.id='taste-control-strip';strip.className='taste-control-strip';
  const learned=Object.values(scene.dwell).filter(t=>t>=6).length;
  strip.innerHTML=`<span>${icon('palette')} <strong>${scene.personalize&&taste.signals?'Tuned to your taste':'Explore the unexpected'}</strong> <small>${scene.personalize?'Likes, saves, follows & meaningful viewing time':'Personalization paused'} · ${learned} artworks viewed attentively</small></span><div><button type="button" data-v10="explain-taste">How it works</button><button type="button" data-v10="toggle-taste">${scene.personalize?'Pause':'Resume'} suggestions</button></div>`;
  $('.discover-channels')?.insertAdjacentElement('afterend',strip);
  scheduleFocusedSlide();
 };
 // Browsing time is a weak signal, never counted while the tab is hidden or in a modal.
 let lastTick=performance.now(),lastWork='',unsavedMs=0;
 function captureViewTime(){
  const now=performance.now(),delta=Math.min(1200,Math.max(0,now-lastTick));lastTick=now;
  const canObserve=scene.personalize&&state.page==='discover'&&document.visibilityState==='visible'&&!$('#modal-cover')?.classList.contains('open')&&!$('#comment-sheet')?.classList.contains('open');
  const slide=canObserve?focusedSlide():null;
  const feed=$('#swipe-feed');const r=slide?.getBoundingClientRect(),box=feed?.getBoundingClientRect();
  const visible=r&&box?Math.max(0,Math.min(r.bottom,box.bottom)-Math.max(r.top,box.top))/Math.max(1,r.height):0;
  const work=visible>=.7?slide?.dataset.work:'';
  if(!work||!worksById(work)){lastWork='';unsavedMs=0;return;}
  if(work!==lastWork){lastWork=work;unsavedMs=0;}
  unsavedMs+=delta;
  if(unsavedMs>=1000){const seconds=Math.floor(unsavedMs/1000);unsavedMs%=1000;scene.dwell[work]=Math.min(120,Math.max(0,Number(scene.dwell[work])||0)+seconds);const entries=Object.entries(scene.dwell).slice(-350);scene.dwell=Object.fromEntries(entries);put('view_time_v10',scene.dwell);}
 }
 setInterval(captureViewTime,850);
 document.addEventListener('visibilitychange',()=>{lastTick=performance.now();lastWork='';unsavedMs=0});
 document.addEventListener('pagehide',()=>put('view_time_v10',scene.dwell));
 // Event affinity is based on the same visual signals, plus followed artists and locality.
 function eventRelevance(e,taste){const af=(e.artists||[]).reduce((s,id)=>s+(state.following.includes(id)?10:0)+scoreArtist(artists[id]||{id,archive:true},taste).score*.15,0);const soon=Math.max(0,16-Math.max(0,(new Date(e.date+'T12:00:00')-new Date())/86400000));return af+soon*.18+(scene.savedEvents.includes(e.id)?2:0);}
 function eventCard(e,taste){
  const cover=featured(e),imageUrl=cover?.image||asset('sunroom.jpg'),names=(e.artists||[]).map(id=>artists[id]?.name).filter(Boolean);
  const reason=(e.artists||[]).some(id=>state.following.includes(id))?'Featuring an artist you follow':(taste.signals?'Matched to your art interests':'Explore the participating artists');
  return `<article class="scene-event-card"><button class="scene-event-cover" data-event-id="${esc(e.id)}" aria-label="View ${esc(e.title)}"><img src="${esc(imageUrl)}" alt="Artwork featured in the event preview" loading="lazy"><span class="scene-event-date"><b>${esc(monthDay(e.date).split(' ')[1])}</b>${esc(monthDay(e.date).split(' ')[0])}</span><span class="scene-event-badge">${e.sample?'SAMPLE EVENT':'LOCAL DRAFT'}</span></button><div class="scene-event-content"><div class="scene-event-kind">${esc(e.category)} · ${esc(e.district)}</div><button class="scene-event-name" data-event-id="${esc(e.id)}">${esc(e.title)}</button><p>${esc(displayDate(e.date,e.time))}</p><div class="scene-event-avatars">${names.map(v=>`<span>${esc(v)}</span>`).join('')}<small>${esc(reason)}</small></div><div class="scene-event-actions"><button data-event-id="${esc(e.id)}">Explore event ${icon('arrow')}</button><button class="scene-save ${scene.savedEvents.includes(e.id)?'on':''}" data-v10="save-event" data-id="${esc(e.id)}">${scene.savedEvents.includes(e.id)?'Saved':'Save'}</button></div></div></article>`;
 }
 function renderEvents(){
  const parent=$('#events-main');if(!parent)return;
  if(scene.view==='detail'&&eventById(scene.eventId)){renderEventDetail(eventById(scene.eventId));return;}
  if(scene.view==='create'){renderEventCreate();return;}
  const taste=makeTaste();let list=futureEvents().filter(e=>e.city===scene.city);
  if(scene.timeFilter==='week')list=list.filter(e=>e.date<=daysFromNow(7));
  if(scene.timeFilter==='month')list=list.filter(e=>e.date<=daysFromNow(30));
  if(scene.kindFilter!=='all')list=list.filter(e=>e.category===scene.kindFilter);
  if(scene.search){const term=n(scene.search);list=list.filter(e=>[e.title,e.description,e.category,e.district,...(e.artists||[]).map(id=>artists[id]?.name||'')].some(t=>n(t).includes(term)));}
  list.sort((a,b)=>eventRelevance(b,taste)-eventRelevance(a,taste)||(a.date+a.time).localeCompare(b.date+b.time));
  parent.innerHTML=`<div class="scene-hero"><div class="scene-hero-brow">OFFFRAME / THE LOCAL SCENE</div><h1>Art is better<br><em>in person.</em></h1><p>Find openings, studio nights and creative gatherings through the work—and the people—behind them.</p><div class="scene-hero-actions"><button data-v10="create-event" class="scene-primary">Create an event ${icon('arrow')}</button><button data-v10="open-event-how" class="scene-secondary">How events work</button></div></div><div class="scene-filters"><label>Your area<select id="scene-city">${cityOptions.map(c=>`<option value="${esc(c)}" ${scene.city===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label>When<select id="scene-when"><option value="all" ${scene.timeFilter==='all'?'selected':''}>All upcoming</option><option value="week" ${scene.timeFilter==='week'?'selected':''}>Next 7 days</option><option value="month" ${scene.timeFilter==='month'?'selected':''}>Next 30 days</option></select></label><label>Type<select id="scene-kind">${['all','Gallery opening','Open studio','Workshop','Artist talk'].map(c=>`<option value="${esc(c)}" ${scene.kindFilter===c?'selected':''}>${c==='all'?'All experiences':esc(c)}</option>`).join('')}</select></label><label class="scene-search-label">Find something<input id="scene-search" type="search" value="${esc(scene.search)}" placeholder="Artist, neighborhood, style…"></label></div><div class="scene-section-head"><div><span>DISCOVER NEAR YOU</span><h2>Coming up in ${esc(scene.city.split(',')[0])}</h2><p>${list.length} event ${list.length===1?'preview':'previews'} · ranked by your interests, followed artists and date</p></div><button data-v10="show-saved-events">${scene.savedEvents.length} saved</button></div><div class="scene-events-grid">${list.length?list.map(e=>eventCard(e,taste)).join(''):'<div class="scene-empty">Nothing matches these filters yet. Try another date or category.</div>'}</div><div class="scene-disclosure"><strong>About these listings:</strong> All built-in events are explicitly fictional examples. Only events you create are stored in this browser. Real listings, organizer verification, shared invitations and synchronized RSVPs require a future data source and backend.</div>`;
 }
 function renderEventDetail(e){
  const parent=$('#events-main'),cover=featured(e);if(!parent)return;
  const invited=e.artists||[],confirmed=e.sample?invited:(e.confirmedArtists||[]),proposed=invited.filter(id=>!confirmed.includes(id));
  const local=scene.city===e.city,responded=scene.responses[e.id];
  const artistsHtml=invited.map(id=>{const a=artists[id],w=artistWorks(id)[0];if(!a)return '';return `<div class="scene-person"><button data-artist="${esc(id)}" aria-label="Open ${esc(a.name)} profile">${w?.image?`<img src="${esc(w.image)}" alt="Artwork by ${esc(a.name)}">`:`<div class="scene-avatar">${esc(a.name.slice(0,1))}</div>`}</button><div><button data-artist="${esc(id)}">${esc(a.name)} ${icon('arrow')}</button><span>${esc(a.style)}</span><small>${e.sample?'Sample participating artist':confirmed.includes(id)?'Confirmed by profile owner':'Invited · unconfirmed'}</small></div></div>`}).join('');
  const gallery=(e.workIds||[]).map(id=>{const w=worksById(id);if(!w)return '';return `<button class="scene-artwork" data-artist="${esc(w.artist)}">${w.image?`<img src="${esc(w.image)}" alt="${esc(w.title)}">`:'<div class="scene-artwork-placeholder">Artwork record</div>'}<strong>${esc(w.title)}</strong><span>${esc(artists[w.artist]?.name)}</span></button>`}).join('');
  parent.innerHTML=`<div class="scene-detail"><button class="scene-back" data-v10="back-events">${icon('left')} All events</button><div class="scene-detail-hero"><div class="scene-detail-photo">${cover?.image?`<img src="${esc(cover.image)}" alt="Selected artwork in event preview">`:''}<span>${e.sample?'FICTIONAL EVENT PREVIEW':'CREATED IN THIS BROWSER'}</span></div><div class="scene-detail-summary"><span class="scene-overline">${esc(e.category)} · ${esc(e.city)}</span><h1>${esc(e.title)}</h1><p>${esc(e.description||'Discover local art in person.')}</p><div class="scene-when-where"><div><strong>WHEN</strong>${esc(displayDate(e.date,e.time))}</div><div><strong>WHERE</strong>${esc(e.district)}<small>${esc(e.city)}</small></div></div><div class="scene-respond"><button class="${responded==='going'?'selected':''}" data-v10="respond-event" data-id="${esc(e.id)}" data-response="going">${responded==='going'?'Going':'I’m going'}</button><button class="${responded==='interested'?'selected':''}" data-v10="respond-event" data-id="${esc(e.id)}" data-response="interested">Interested</button><button data-v10="calendar-event" data-id="${esc(e.id)}">Add to calendar</button></div><div class="scene-detail-share"><button data-v10="share-event" data-id="${esc(e.id)}">${icon('share')} Share event</button><button data-v10="save-event" data-id="${esc(e.id)}">${scene.savedEvents.includes(e.id)?'Saved to events':'Save event'}</button></div><small class="scene-local-note">${e.sample?'This is not a real event. RSVP is a local preview only.':'RSVPs are local to this browser; no invitation or attendee list is synchronized.'}${!local?' · Outside your selected area.':''}</small></div></div><div class="scene-exhibit"><div class="scene-block-title"><span>THE PEOPLE BEHIND THE WORK</span><h2>Featured artists <small>${invited.length}</small></h2><p>Explore the people whose work is connected to this exhibition.</p></div><div class="scene-people">${artistsHtml||'<p>Artists will appear here once added and confirmed.</p>'}</div></div><div class="scene-exhibit"><div class="scene-block-title"><span>THE WORK ON VIEW</span><h2>Explore the collection</h2><p>${e.sample?'Sample linked artworks, not a real exhibition checklist.':'Works selected for this local event draft.'}</p></div><div class="scene-artworks">${gallery||'<p>Artwork connections will appear here when added.</p>'}</div></div></div>`;
 }
 function renderEventCreate(){
  const parent=$('#events-main');const candidates=Object.values(artists).filter(a=>!a.archive);
  parent.innerHTML=`<div class="scene-create"><button data-v10="back-events" class="scene-back">${icon('left')} Events</button><span class="scene-overline">MAKE SOMETHING HAPPEN</span><h1>Gather around art.</h1><p>Design a gathering, connect artist portfolios and artworks, and create a shareable invitation preview. Nothing is published to other accounts.</p><form id="offframe-event-create"><div class="scene-field-grid"><label>Event name<input name="title" maxlength="90" required placeholder="Studio opening, exhibition, meetup…"></label><label>City<select name="city">${cityOptions.map(c=>`<option ${c===scene.city?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label>Date<input name="date" type="date" min="${daysFromNow(0)}" value="${daysFromNow(7)}" required></label><label>Starts at<input name="time" type="time" value="18:00" required></label><label>Type<select name="category">${['Gallery opening','Open studio','Workshop','Artist talk'].map(v=>`<option>${esc(v)}</option>`).join('')}</select></label><label>Venue or neighborhood<input name="district" required maxlength="95" placeholder="e.g. Warehouse District, venue TBA"></label></div><label>What makes this event special?<textarea name="description" maxlength="650" required placeholder="Tell guests what they'll see, who it's for, and what to expect."></textarea></label><fieldset><legend>Link participating artists</legend><p>Other artists are listed as invited, not confirmed. Only the owner of a signed-in demo artist profile can confirm their own participation.</p><div class="scene-artist-choices">${candidates.map(a=>`<label><input name="artists" type="checkbox" value="${esc(a.id)}"><span>${esc(a.name)}<small>${esc(a.style)}</small></span></label>`).join('')}</div></fieldset><button class="scene-primary" type="submit">Create local event preview ${icon('arrow')}</button></form><div class="scene-disclosure">Events created here are saved on this device. Sharing uses a self-contained invitation preview link; RSVPs on different devices will not sync.</div></div>`;
 }
 function eventLink(e){
  if(e.sample)return location.origin+location.pathname+'#event/'+encodeURIComponent(e.id);
  const safe={id:e.id,title:e.title,city:e.city,district:e.district,date:e.date,time:e.time,duration:e.duration,category:e.category,description:e.description,artists:e.artists,confirmedArtists:e.confirmedArtists,workIds:e.workIds,cover:e.cover,public:true};
  const raw=encodeURIComponent(JSON.stringify(safe));return location.origin+location.pathname+'#event-data/'+btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 }
 function navigateEvent(id,updateHash=true){scene.eventId=id;scene.view='detail';markPage('events');if(updateHash){const e=eventById(id);if(e)history.replaceState(null,'',eventLink(e));}}
 const baseMarkPage=markPage;
 markPage=function(page){baseMarkPage(page);if(page==='events'){$('#topbar-label').textContent='ART HAPPENING NEAR YOU';renderEvents();}else if(page==='artist')renderArtistEventNotice();};
 const baseRenderArtist=renderArtist;
 renderArtist=function(){baseRenderArtist();renderArtistEventNotice();};
 function renderArtistEventNotice(){
  const root=$('#artist-main'),heading=$('.profile-main-actions',root),a=artists[state.artist];if(!root||!heading||!a)return;
  $('.scene-profile-upcoming',root)?.remove();
  const upcoming=artistEvents(a.id).slice(0,2);if(!upcoming.length)return;
  heading.insertAdjacentHTML('afterend',`<div class="scene-profile-upcoming"><span>UPCOMING NEAR YOU · ${esc(scene.city)}</span>${upcoming.map(e=>`<button data-event-id="${esc(e.id)}"><strong>${esc(e.title)}</strong><small>${esc(monthDay(e.date))} · ${e.sample?'Sample listing':'Confirmed event'}</small>${icon('arrow')}</button>`).join('')}</div>`);
 }
 const originalRenderFeedTagged=renderFeed;
 renderFeed=function(){originalRenderFeedTagged();if(state.feed==='all'){ $$('.swipe-slide', $('#swipe-feed')).forEach(slide=>{const events=artistEvents(slide.dataset.slide),meta=$('.slide-meta',slide);if(!events.length||!meta)return;const old=$('.scene-art-nearby',slide);if(old)old.remove();meta.insertAdjacentHTML('beforeend',`<button class="scene-art-nearby" data-event-id="${esc(events[0].id)}">${icon('grid')} ${events[0].sample?'Sample event':'Exhibiting'} near you · ${esc(monthDay(events[0].date))} ${icon('arrow')}</button>`);});}};
 function notifyTaste(){if(state.page==='discover')renderFeed();if(state.page==='events')renderEvents();}
 document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.eventId){e.preventDefault();navigateEvent(b.dataset.eventId);return;}
  const action=b.dataset.v10;if(!action)return;e.preventDefault();
  if(action==='toggle-taste'){scene.personalize=!scene.personalize;put('personalization_v10',scene.personalize);notifyTaste();return;}
  if(action==='explain-taste'){setModal(`<span class="eyebrow rose">WHY YOU'RE SEEING THIS</span><h2>Your taste, not a random feed.</h2><p>Offframe's early recommendations match artwork categories, mediums, movements and tags to the things you explicitly like, save or follow.</p><p>Viewing time is a <strong>weak signal</strong> only after six seconds with the artwork mostly visible and the tab in focus. Each work is capped at two minutes, and viewing alone doesn't imply approval. Every fifth recommendation deliberately explores unfamiliar art.</p><div class="callout">This is an on-device algorithm demonstration. Nothing is sent to a recommendation server, and the artist examples are not genuine social engagement.</div><div class="inquiry-actions"><button class="profile-main-btn secondary" data-v10="clear-view-time">Clear viewing-time history</button><button class="profile-main-btn primary" data-v10="toggle-taste">${scene.personalize?'Pause':'Resume'} personalization</button></div>`);return;}
  if(action==='clear-view-time'){scene.dwell={};put('view_time_v10',{});closeModal();notifyTaste();toast('Viewing history cleared from this browser');return;}
  if(action==='open-event-how'){setModal(`<span class="eyebrow rose">FROM ART TO REAL LIFE</span><h2>Discover the people behind the exhibition.</h2><p>Browse local events, preview participating artist portfolios, save dates, and build a personal invitation.</p><p><strong>Current prototype:</strong> Sample event listings are not real events. Created events and responses are stored locally. Shared invitation links carry event details, but live guest lists, approvals, notifications and real event imports will need a backend.</p>`);return;}
  if(action==='back-events'){scene.view='browse';scene.eventId=null;history.replaceState(null,'',location.pathname+location.search);renderEvents();return;}
  if(action==='create-event'){scene.view='create';renderEvents();return;}
  if(action==='save-event'){const id=b.dataset.id;const index=scene.savedEvents.indexOf(id);if(index>=0)scene.savedEvents.splice(index,1);else scene.savedEvents.push(id);put('saved_events_v10',scene.savedEvents);renderEvents();toast(index>=0?'Removed from saved events':'Event saved in this browser');return;}
  if(action==='show-saved-events'){scene.search='';scene.timeFilter='all';scene.kindFilter='all';const saved=futureEvents().filter(ev=>scene.savedEvents.includes(ev.id));if(!saved.length){toast('Save an event to add it to your list');return;}scene.view='browse';scene.city=saved[0].city;put(viewportCityKey,scene.city);renderEvents();toast('Showing the area of your saved events');return;}
  if(action==='respond-event'){const id=b.dataset.id,res=b.dataset.response;if(!eventById(id))return;scene.responses[id]=scene.responses[id]===res?'':res;put('event_responses_v10',scene.responses);renderEvents();toast('Response saved in this browser only');return;}
  if(action==='share-event'){const ev=eventById(b.dataset.id);if(!ev)return;const link=eventLink(ev);const message=`${ev.title}\n${displayDate(ev.date,ev.time)} · ${ev.district}, ${ev.city}\n${link}`;
   if(navigator.share){try{await navigator.share({title:ev.title,text:message,url:link});return}catch(err){if(err.name==='AbortError')return;}}
   if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(message);toast('Event invitation copied');return}catch{}}
   setModal(`<h2>Share this event</h2><p>Copy the invitation below. This is an event preview, not a live guest list.</p><textarea class="inquiry-draft" readonly>${esc(message)}</textarea>`);return;
  }
  if(action==='calendar-event'){
   const ev=eventById(b.dataset.id);if(!ev)return;
   const z=ev.city.includes('New Orleans')?'America/Chicago':'America/New_York';
   const start=ev.date.replace(/-/g,'')+'T'+ev.time.replace(':','')+'00';
   const endDate=new Date(ev.date+'T'+ev.time+':00');endDate.setMinutes(endDate.getMinutes()+(ev.duration||120));
   const end=`${endDate.getFullYear()}${String(endDate.getMonth()+1).padStart(2,'0')}${String(endDate.getDate()).padStart(2,'0')}T${String(endDate.getHours()).padStart(2,'0')}${String(endDate.getMinutes()).padStart(2,'0')}00`;
   const ical=v=>String(v||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
   const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//OFFFRAME//Art Event Preview//EN','BEGIN:VEVENT','UID:'+ev.id+'@offframe.local','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'').slice(0,15)+'Z',`DTSTART;TZID=${z}:${start}`,`DTEND;TZID=${z}:${end}`,'SUMMARY:'+ical(ev.title),'LOCATION:'+ical(ev.district+', '+ev.city),'DESCRIPTION:'+ical((ev.sample?'FICTIONAL SAMPLE EVENT — NOT A REAL LISTING. ':'')+ev.description),'END:VEVENT','END:VCALENDAR'].join('\r\n');
   const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='offframe-'+ev.id.replace(/[^a-z0-9-]/gi,'-')+'.ics';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
  }
 });
 document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='scene-city'){scene.city=t.value;put(viewportCityKey,scene.city);renderEvents();return;}
  if(t.id==='scene-when'){scene.timeFilter=t.value;renderEvents();return;}
  if(t.id==='scene-kind'){scene.kindFilter=t.value;renderEvents();return;}
 });
 document.addEventListener('input',e=>{if(e.target.id!=='scene-search')return;const position=e.target.selectionStart;scene.search=e.target.value;renderEvents();const next=$('#scene-search');next?.focus();try{next?.setSelectionRange(position,position)}catch{}});
 document.addEventListener('submit',e=>{
  const form=e.target;if(form.id!=='offframe-event-create')return;e.preventDefault();const data=new FormData(form);
  const title=String(data.get('title')||'').trim(),city=String(data.get('city')||''),date=String(data.get('date')||''),time=String(data.get('time')||''),district=String(data.get('district')||'').trim(),description=String(data.get('description')||'').trim();
  if(title.length<3||title.length>90||!cityOptions.includes(city)||date<daysFromNow(0)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)||!district||!description)return toast('Check the event name, date, time, place, and description.');
  const participants=uniq(data.getAll('artists').filter(id=>artists[id]&&!artists[id].archive)).slice(0,10);
  const confirmed=participants.filter(id=>ownerOf(id));
  const associated=participants.flatMap(id=>artistWorks(id).slice(0,2).map(w=>w.id)).slice(0,6);
  const event={id:'local-'+Date.now(),title,city,date,time,district,description,category:String(data.get('category')),artists:participants,confirmedArtists:confirmed,workIds:associated,cover:associated[0]||'n1',sample:false,public:false,duration:120};
  scene.localEvents.push(event);scene.localEvents=scene.localEvents.slice(-30);put(eventStorage,scene.localEvents);scene.view='detail';scene.eventId=event.id;navigateEvent(event.id);toast('Local event draft created');
 });
 function openSharedHash(){
  const m=location.hash.match(/^#event\/([a-z0-9_-]+)$/i);
  if(m&&eventById(decodeURIComponent(m[1]))){navigateEvent(decodeURIComponent(m[1]),false);return;}
  const shared=location.hash.match(/^#event-data\/([A-Za-z0-9_-]{1,3800})$/);
  if(shared){try{let encoded=shared[1].replace(/-/g,'+').replace(/_/g,'/');const obj=JSON.parse(decodeURIComponent(atob(encoded)));
   if(typeof obj.id==='string'&&obj.id.startsWith('local-')&&typeof obj.title==='string'&&obj.title.length<=90&&cityOptions.includes(obj.city)&&/^\d{4}-\d{2}-\d{2}$/.test(obj.date)&&typeof obj.time==='string'&&/^\d{2}:\d{2}$/.test(obj.time)){
    scene.sharedEvent={...obj,sample:false,public:false,description:String(obj.description||'').slice(0,650),district:String(obj.district||'').slice(0,95),artists:(obj.artists||[]).filter(id=>artists[id]),confirmedArtists:[],workIds:(obj.workIds||[]).filter(id=>worksById(id))};navigateEvent(obj.id,false);return;
   }
  }catch{}}
 }
 window.addEventListener('hashchange',openSharedHash);
 const existingNav=$('[data-page="events"]');if(!existingNav)throw Error('Events navigation not present');
 renderFeed();openSharedHash();
})();