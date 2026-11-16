/* OFFFRAME v9.0 — local-only design preview. Fictional demo artists and posts are not
   live accounts, priced works are illustrative asking prices, and interaction counts
   reflect only this browser. Archive metadata is separate from social identities.
   Sign-in is a role preview, NOT authentication, and stores no credentials. */
'use strict';
const $=(q,root=document)=>root.querySelector(q);
const $$=(q,root=document)=>[...root.querySelectorAll(q)];
const clean=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset=x=>'assets/'+x;
const ICON_PATHS={
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  bookmark:'<path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-5-7 5V4Z"/>',
  comments:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 10 10 0 0 1-4-.9L3 21l1.4-4.7A8.5 8.5 0 1 1 21 11.5Z"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  left:'<path d="m15 18-6-6 6-6"/>',
  right:'<path d="m9 18 6-6-6-6"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
  people:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pencil:'<path d="m16 4 4 4-11 11-5 1 1-5L16 4Z"/><path d="m14 6 4 4"/>',
  share:'<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5m-8 7 8 5"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="m16 4 4 4-11 11-5 1 1-5L16 4Z"/><path d="m14 6 4 4"/>',
  repeat:'<path d="M17 2 21 6l-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/>',
  check:'<path d="m5 12 5 5L20 7"/>',
  palette:'<circle cx="12" cy="12" r="9"/><circle cx="7" cy="10" r="1"/><circle cx="11" cy="6" r="1"/><circle cx="17" cy="9" r="1"/><path d="M18 16a2 2 0 0 1-2 2 2 2 0 0 1-2-2c0-1.6 1-2 2-2h2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .8 1.4-2 2-.8-.7a8 8 0 0 1-2 .9L15 21h-3l-.4-2.4a7 7 0 0 1-2-.9l-1.8.7-1.9-2 .8-1.4a8 8 0 0 1-.7-2L3 12v-2.7l2.9-.4a8 8 0 0 1 .8-2L6 5.4l2-2 .9.7a8 8 0 0 1 2-.8L11.4 1h2.8l.4 2.4a8 8 0 0 1 2 .8l1.7-.7 2 2-.9 1.5a8 8 0 0 1 .8 2L22 9.4V12l-2.8.4a8 8 0 0 1 .2 2.6Z"/>',
};
const icon=(name,cls='')=>`<svg aria-hidden="true" class="of-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]||ICON_PATHS.arrow}</svg>`;

const get=(k,f)=>{try{return JSON.parse(localStorage.getItem('offframe_v2_'+k))??f}catch{return f}};
const put=(k,v)=>{try{localStorage.setItem('offframe_v2_'+k,JSON.stringify(v))}catch{}};
// Feed details are intentionally transient: first look lasts 3s, then artwork gets the space.
const feedOverlay={activeKey:null,activeArtist:null,mode:'full',timer:null,raf:0,suppressClickUntil:0,suspendUntil:0,suspendTimer:null};
function setSlideDetailMode(slide,mode){
 if(!slide)return;
 const compact=mode==='compact';
 slide.classList.toggle('is-compact',compact);
 slide.querySelector('.slide-compact-bar')?.setAttribute('aria-hidden',String(!compact));
 slide.querySelector('.slide-meta')?.setAttribute('aria-hidden',String(compact));
 slide.querySelector('.slide-actions')?.setAttribute('aria-hidden',String(compact));
}
function focusedSlide(){
 const feed=$('#swipe-feed');if(!feed)return null;
 const box=feed.getBoundingClientRect();const center=box.top+box.height/2;
 let chosen=null,closest=Infinity;
 $$('.swipe-slide',feed).forEach(slide=>{
  const r=slide.getBoundingClientRect();const distance=Math.abs((r.top+r.bottom)/2-center);
  if(distance<closest){closest=distance;chosen=slide;}
 });
 return chosen;
}
function collapseFeedDetails(key=feedOverlay.activeKey){
 if(!key||key!==feedOverlay.activeKey)return;
 clearTimeout(feedOverlay.timer);feedOverlay.timer=null;feedOverlay.mode='compact';
 const slide=$('#swipe-feed')?.querySelector(`[data-gallery-key="${CSS.escape(key)}"]`);
 setSlideDetailMode(slide,'compact');
}
function expandFeedDetails(key){
 const slide=$('#swipe-feed')?.querySelector(`[data-gallery-key="${CSS.escape(key)}"]`);
 if(!slide)return;
 clearTimeout(feedOverlay.timer);feedOverlay.timer=null;
 feedOverlay.activeKey=key;feedOverlay.activeArtist=slide.dataset.slide;feedOverlay.mode='full';
 setSlideDetailMode(slide,'full');
 // Explicitly reopened details stay visible until dismissed or the user moves on.
}
function syncFocusedSlide(){
 if(state.page!=='discover'||performance.now()<feedOverlay.suspendUntil)return;
 const slide=focusedSlide();if(!slide)return;
 const key=slide.dataset.galleryKey;
 if(feedOverlay.activeKey===key){setSlideDetailMode(slide,feedOverlay.mode);return;}
 clearTimeout(feedOverlay.timer);feedOverlay.timer=null;
 const sameArtist=feedOverlay.activeArtist===slide.dataset.slide;
 feedOverlay.activeKey=key;feedOverlay.activeArtist=slide.dataset.slide;
 feedOverlay.mode=sameArtist?'compact':'full';
 setSlideDetailMode(slide,feedOverlay.mode);
 if(!sameArtist){feedOverlay.timer=setTimeout(()=>collapseFeedDetails(key),3000);}
}
function scheduleFocusedSlide(){
 if(feedOverlay.raf)return;
 feedOverlay.raf=requestAnimationFrame(()=>{feedOverlay.raf=0;syncFocusedSlide();});
}

const state={artistStyles:get('artistStyles',{}),groupStyles:get('groupStyles',{}),groupEdits:get('groupEdits',{}),designSession:null,demoOrders:get('demoOrders',[]),commissionSettings:get('commissionSettings',{}),listingOverrides:get('listingOverrides',{}),page:'discover',feed:'all',artist:'nia',artistTab:'overview',group:'soft',groupTab:'posts',communityTab:'for-you',savedTab:'favorites',account:get('account',null),artistEdits:get('artistEdits',{}),postViews:get('postViews',{}),artworkViews:get('artworkViews',{}),collectorProfile:get('collectorProfile',{name:'Your corner',handle:'@you',bio:'Collecting the things that make me look twice.'}),communityFocus:'',communityShuffle:0,themes:get('themes',{}),liked:get('liked',[]),favorites:get('favorites',[]),collections:get('collections',{'Favorites':[]}),following:get('following',[]),joined:get('joined',[]),showLess:get('showLess',[]),comments:get('comments',{}),posts:get('posts',[]),slideIndexes:{},mood:'',lastPage:'discover'};
if(!state.collections.Favorites)state.collections.Favorites=[];
const works=[
{id:'n1',artist:'nia',title:'Familiar Faces',year:'2025',image:asset('portrait-original.jpg'),style:'Contemporary',medium:'Painting',tags:['portrait','intimate','vibrant'],askingPrice:1250,available:true},
{id:'n2',artist:'nia',title:'Blue Hour Still Life',year:'2026',image:asset('soft-blue.jpg'),style:'Contemporary',medium:'Oil on canvas',tags:['calm','still life','nature'],askingPrice:680,available:true,releasedAt:'2026-11-10'},
{id:'n3',artist:'nia',title:'Somewhere in Between',year:'2026',image:asset('sunroom.jpg'),style:'Abstract',medium:'Acrylic on canvas',tags:['dreamlike','vibrant','abstract'],askingPrice:920,available:true,releasedAt:'2026-11-06'},
{id:'n4',artist:'nia',title:'Three Little Things',year:'2025',image:asset('still-life.jpg'),style:'Contemporary',medium:'Painting',tags:['intimate','still life']},
{id:'n5',artist:'nia',title:'Afternoon Signal',year:'2026',image:asset('poster.jpg'),style:'Abstract',medium:'Mixed media',tags:['vibrant','geometric']},
{id:'n6',artist:'nia',title:'A Quiet Country',year:'2025',image:asset('landscape.jpg'),style:'Contemporary',medium:'Painting',tags:['nature','calm']},
{id:'o1',artist:'oren',title:'Soft Circuits',year:'2025',image:asset('violet.jpg'),style:'Abstract',medium:'Mixed media',tags:['dreamlike','intimate'],askingPrice:430,available:true},
{id:'o2',artist:'oren',title:'The Long Way Home',year:'2026',image:asset('landscape.jpg'),style:'Contemporary',medium:'Digital collage',tags:['nature','calm']},
{id:'o3',artist:'oren',title:'Something You Remember',year:'2026',image:asset('poster.jpg'),style:'Abstract',medium:'Print',tags:['vibrant','abstract'],askingPrice:140,available:true,releasedAt:'2026-11-09'},
{id:'a1',artist:'seurat',title:'A Sunday on La Grande Jatte — 1884',year:'1884–1886',image:'',style:'Pointillism',medium:'Oil on canvas',tags:['calm','landscape'],museumId:27992},
{id:'a2',artist:'vangogh',title:'The Bedroom',year:'1889',image:'',style:'Post-Impressionism',medium:'Oil on canvas',tags:['intimate','vibrant'],museumId:28560},
{id:'a3',artist:'hokusai',title:'The Great Wave',year:'1830–1832',image:'',style:'Japanese prints',medium:'Woodblock print',tags:['nature','vibrant'],museumId:24645},
{id:'a4',artist:'monet',title:'Water Lilies',year:'early 20th century',image:'',style:'Impressionism',medium:'Oil on canvas',tags:['nature','calm']},
{id:'a5',artist:'cassatt',title:'The Child’s Bath',year:'1893',image:'',style:'Impressionism',medium:'Oil on canvas',tags:['intimate','calm']},
{id:'a6',artist:'caillebotte',title:'Paris Street; Rainy Day',year:'1877',image:'',style:'Impressionism',medium:'Oil on canvas',tags:['urban','melancholic']},
{id:'a7',artist:'cezanne',title:'The Basket of Apples',year:'c. 1893',image:'',style:'Post-Impressionism',medium:'Oil on canvas',tags:['still life','calm']},
{id:'a8',artist:'renoir',title:'Two Sisters (On the Terrace)',year:'1881',image:'',style:'Impressionism',medium:'Oil on canvas',tags:['intimate','vibrant']}
];
const artists={
 nia:{id:'nia',name:'Nia Calder',handle:'@niacalder',location:'Brooklyn, New York',style:'Contemporary painting',bio:'I paint memory in fragments — the faces, rooms and colors that stay with us long after everything else changes.',tagline:'Studies in color, memory & the everyday.',story:'Painting the little moments that linger.',about:'My work lives somewhere between portraiture, storytelling and things I remember slightly differently every time. I work in oil, acrylic and mixed media, often moving between expressive faces and quieter compositions.',theme:'clay',demo:true,links:'instagram · portfolio',mood:['Vibrant','Intimate','Dreamlike']},
 oren:{id:'oren',name:'Oren Sato',handle:'@orensato',location:'Portland, Oregon',style:'Abstract · printmaking',bio:'Soft forms, surprising colors, and little visual puzzles that feel almost familiar.',tagline:'The shape of a half-remembered place.',story:'Between the real and the almost-real.',about:'Exploring the border between printmaking, collage, and places remembered from dreams.',theme:'indigo',demo:true,links:'studio · portfolio',mood:['Dreamlike','Calm']},
 cassatt:{id:'cassatt',name:'Mary Cassatt',handle:'Historic artist',location:'Paris, France',style:'Impressionism',bio:'Intimate paintings of family life, observation, care and modern experience.',tagline:'Everyday moments, seen closely.',about:'Historical artist archive; not an active creator account or marketplace listing.',theme:'archive',archive:true,mood:['Intimate','Calm']},
 caillebotte:{id:'caillebotte',name:'Gustave Caillebotte',handle:'Historic artist',location:'Paris, France',style:'Impressionism',bio:'Modern streets, changing perspectives and the quiet theatre of city life.',tagline:'A different angle on the modern city.',about:'Historical artist archive; not an active creator account or marketplace listing.',theme:'archive',archive:true,mood:['Melancholic','Calm']},
 cezanne:{id:'cezanne',name:'Paul Cézanne',handle:'Historic artist',location:'Aix-en-Provence, France',style:'Post-Impressionism',bio:'Still lifes and landscapes reimagined through patient structures of color.',tagline:'Finding the shape in everything.',about:'Historical artist archive; not an active creator account or marketplace listing.',theme:'archive',archive:true,mood:['Calm','Nature']},
 renoir:{id:'renoir',name:'Pierre-Auguste Renoir',handle:'Historic artist',location:'Paris, France',style:'Impressionism',bio:'Light, joyful gatherings and intimate portraits in luminous colors.',tagline:'Light from the everyday.',about:'Historical artist archive; not an active creator account or marketplace listing.',theme:'archive',archive:true,mood:['Vibrant','Intimate']},
 seurat:{id:'seurat',name:'Georges Seurat',handle:'Historic artist',location:'Paris, France',style:'Pointillism',bio:'Precise points of color, scenes of modern life, and an entirely new way to see light.',tagline:'A thousand dots, one extraordinary world.',about:'Historical artist archive entry with museum-catalog artwork metadata. Not a claimed account, live creator profile or sale listing.',theme:'archive',archive:true,mood:['Calm']},
 vangogh:{id:'vangogh',name:'Vincent van Gogh',handle:'Historic artist',location:'Arles, France',style:'Post-Impressionism',bio:'Emotional brushwork, luminous color, and everyday places transformed into something unforgettable.',tagline:'Color that feels like a heartbeat.',about:'Historical artist archive entry with museum-catalog artwork metadata. Not a claimed account, live creator profile or sale listing.',theme:'archive',archive:true,mood:['Vibrant','Melancholic']},
 hokusai:{id:'hokusai',name:'Katsushika Hokusai',handle:'Historic artist',location:'Edo, Japan',style:'Japanese prints',bio:'Waves, mountains and everyday worlds expressed in unforgettable graphic compositions.',tagline:'The world in a single line.',about:'Historical artist archive entry with museum-catalog artwork metadata. Not a claimed account, live creator profile or sale listing.',theme:'archive',archive:true,mood:['Nature','Vibrant']},
 monet:{id:'monet',name:'Claude Monet',handle:'Historic artist',location:'Giverny, France',style:'Impressionism',bio:'Light, water, changing weather, and a painter’s life spent watching a garden.',tagline:'Chasing the light.',about:'Historical artist archive entry; the museum catalog will be expanded and deduplicated before launch.',theme:'archive',archive:true,mood:['Calm','Nature']}
};
// V9 archive seeds: biographies, contexts and editorial discovery tags. Artwork images
// are never generated or attributed without a public-domain museum record.
const archiveSeeds={
 morisot:{id:'morisot',name:'Berthe Morisot',handle:'Historic artist',location:'Paris, France',style:'Impressionism',bio:'A central figure in Impressionism, Morisot painted interiors, gardens, portraits and the quick changes of modern life.',tagline:'Brushstrokes that catch a passing moment.',about:'Berthe Morisot (1841–1895) exhibited with the Impressionists and explored the relationships between people, domestic life and their surroundings. Her compositions often hold an immediacy that feels almost like a glimpse.',era:'1841–1895',region:'France',practice:'Painting · watercolor',theme:'archive',archive:true,mood:['Intimate','Calm'],discoveryTags:['impressionism','portraits','women artists','gardens','everyday life','color','painting']},
 hiroshige:{id:'hiroshige',name:'Utagawa Hiroshige',handle:'Historic artist',location:'Edo (Tokyo), Japan',style:'Ukiyo-e',bio:'A master of Japanese landscape prints whose rain, rivers, bridges and roads became lasting images of travel and place.',tagline:'Roads, rain, mountains, weather.',about:'Utagawa Hiroshige (1797–1858) was a Japanese ukiyo-e print designer, celebrated for landscape series including The Fifty-three Stations of the Tōkaidō and One Hundred Famous Views of Edo.',era:'1797–1858',region:'Japan',practice:'Woodblock print · landscape',theme:'archive',archive:true,mood:['Nature','Calm'],discoveryTags:['ukiyo-e','japanese prints','woodblock','landscape','rain','travel','nature','printmaking']},
 homer:{id:'homer',name:'Winslow Homer',handle:'Historic artist',location:'Prouts Neck, Maine · United States',style:'American Realism',bio:'Sea spray, working lives and changing weather painted with a remarkable feeling for light and strength.',tagline:'Where the sea meets the human world.',about:'Winslow Homer (1836–1910) began as an illustrator before turning to oil and watercolor. His late marine paintings drew on the Atlantic coast and lives shaped by it.',era:'1836–1910',region:'United States',practice:'Painting · watercolor · illustration',theme:'archive',archive:true,mood:['Nature','Melancholic'],discoveryTags:['american realism','realism','seascape','watercolor','nature','landscape','working life']},
 redon:{id:'redon',name:'Odilon Redon',handle:'Historic artist',location:'Bordeaux / Paris, France',style:'Symbolism',bio:'Dreamlike figures, luminous flowers and shadowy lithographs that look into the inner life.',tagline:'Images from the edge of dreaming.',about:'Odilon Redon (1840–1916) explored the possibilities of imagination through charcoal drawings, prints, pastels and painting. His early dark works and later radiant colors occupy a distinctive place in Symbolism.',era:'1840–1916',region:'France',practice:'Lithography · charcoal · pastel',theme:'archive',archive:true,mood:['Dreamlike','Melancholic'],discoveryTags:['symbolism','dreamlike','prints','lithography','fantasy','flowers','drawing']},
 kollwitz:{id:'kollwitz',name:'Käthe Kollwitz',handle:'Historic artist',location:'Berlin, Germany',style:'Expressionism',bio:'Powerful prints and drawings about grief, solidarity, working families and the human cost of violence.',tagline:'A line that refuses to look away.',about:'Käthe Kollwitz (1867–1945) worked in etching, lithography, woodcut and sculpture. Her figures draw attention to loss, labor and social struggle with direct emotional force.',era:'1867–1945',region:'Germany',practice:'Etching · lithography · woodcut',theme:'archive',archive:true,mood:['Intimate','Melancholic'],discoveryTags:['expressionism','printmaking','woodcut','social themes','portrait','drawing','lithography']},
 lautrec:{id:'lautrec',name:'Henri de Toulouse-Lautrec',handle:'Historic artist',location:'Paris, France',style:'Post-Impressionism',bio:'Posters, performers and nightlife: lively compositions at the crossroads of painting and graphic design.',tagline:'The city after dark, in bold lines.',about:'Henri de Toulouse-Lautrec (1864–1901) captured late-19th-century Parisian performance and social scenes in posters, lithographs, drawings and paintings.',era:'1864–1901',region:'France',practice:'Lithography · poster · painting',theme:'archive',archive:true,mood:['Vibrant','Intimate'],discoveryTags:['post-impressionism','lithography','posters','printmaking','city life','nightlife','graphic design']},
 pissarro:{id:'pissarro',name:'Camille Pissarro',handle:'Historic artist',location:'St. Thomas / France',style:'Impressionism',bio:'An observer of fields, villages and city streets, Pissarro returned again and again to changing light.',tagline:'The slow rhythm of a place.',about:'Camille Pissarro (1830–1903), born on St. Thomas in the Caribbean, became a pivotal Impressionist painter in France. His work spans rural landscapes and modern urban views.',era:'1830–1903',region:'Caribbean · France',practice:'Painting · printmaking',theme:'archive',archive:true,mood:['Nature','Calm'],discoveryTags:['impressionism','landscape','city life','rural life','light','painting','caribbean']},
 klimt:{id:'klimt',name:'Gustav Klimt',handle:'Historic artist',location:'Vienna, Austria',style:'Vienna Secession',bio:'Ornament, portraiture and symbolic motifs woven into a singular, decorative visual world.',tagline:'Patterns with a pulse.',about:'Gustav Klimt (1862–1918) was a founding figure of the Vienna Secession, associated with expressive portraiture, symbolism and highly decorative surfaces.',era:'1862–1918',region:'Austria',practice:'Painting · drawing · design',theme:'archive',archive:true,mood:['Vibrant','Dreamlike'],discoveryTags:['vienna secession','art nouveau','symbolism','ornament','portraits','pattern','design']}
};
Object.assign(artists,archiveSeeds);
// Bring the first archive profiles into the same coherent taxonomy as the new seeds.
const archiveContexts={
 cassatt:['1844–1926','United States · France','Painting · printmaking',['impressionism','portraits','women artists','motherhood','everyday life','printmaking']],
 caillebotte:['1848–1894','France','Painting · urban life',['impressionism','city life','perspective','urban','rain','painting']],
 cezanne:['1839–1906','France','Painting · still life',['post-impressionism','still life','landscape','geometry','color','painting']],
 renoir:['1841–1919','France','Painting · portraiture',['impressionism','portraits','color','intimate','painting']],
 seurat:['1859–1891','France','Painting · color theory',['pointillism','neo-impressionism','color theory','landscape','city life']],
 vangogh:['1853–1890','Netherlands · France','Painting · drawing',['post-impressionism','landscape','portrait','color','expressive brushwork']],
 hokusai:['1760–1849','Japan','Woodblock print · drawing',['ukiyo-e','japanese prints','woodblock','waves','landscape','printmaking']],
 monet:['1840–1926','France','Painting · landscape',['impressionism','water lilies','gardens','light','landscape','nature']]
};
for(const [id,parts] of Object.entries(archiveContexts)){
 const a=artists[id];Object.assign(a,{era:parts[0],region:parts[1],practice:parts[2],discoveryTags:parts[3]});
}
const archiveMovements=[
 {name:'Impressionism',desc:'Light, fleeting moments & everyday life',tint:'moss'},
 {name:'Post-Impressionism',desc:'Color, form & expressive new directions',tint:'amber'},
 {name:'Ukiyo-e',desc:'Landscape & life in Japanese woodblock prints',tint:'blue'},
 {name:'Pointillism',desc:'Tiny marks, optical color, surprising detail',tint:'plum'},
 {name:'Symbolism',desc:'Inner worlds, metaphor & imagination',tint:'indigo'},
 {name:'Expressionism',desc:'Emotion conveyed through mark & line',tint:'brick'},
 {name:'American Realism',desc:'Observation, working life & the outdoors',tint:'slate'},
 {name:'Vienna Secession',desc:'Decoration, pattern & modern design',tint:'gold'},
 {name:'Printmaking',desc:'Woodblock, lithography, etching & editions',tint:'clay'},
 {name:'Portraiture',desc:'Faces, identity & the human presence',tint:'berry'},
 {name:'Landscape',desc:'Places, weather, gardens & open space',tint:'sage'},
 {name:'Painting',desc:'Brushwork, pigment & visual expression',tint:'midnight'}
];
const archiveTags=['landscape','portrait','printmaking','woodblock','women artists','city life','color','gardens','still life','nature','social themes','dreamlike','light','watercolor','lithography','pattern','seascape','japanese prints','nightlife','graphic design'];
const normArtText=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function catalogDiscoveryTags(item,artist){
 const title=normArtText(item.title),a=artists[artist],tags=new Set((a?.discoveryTags||[]).slice(0,5));
 for(const [re,tag] of [[/portrait|head|woman|man|face|self-portrait/, 'portrait'],[/garden|flower|blossom/,'gardens'],[/wave|ocean|water|sea|harbor|river|lake/,'water'],[/street|bridge|paris|edo|city/,'city life'],[/landscape|forest|mountain|hill|shore/,'landscape'],[/night|moon|dark/,'night'],[/mother|child|family/,'family'],[/print|lithograph|etching|woodcut/,'printmaking']]){
  if(re.test(title))tags.add(tag);
 }
 return [...tags].slice(0,8);
}
const groups=[
 {id:'soft',symbol:'SW',name:'the soft weird',handle:'@@the-soft-weird',tagline:'dreamy, strange, tender art',description:'A little corner for art that feels like an unfinished dream. Sketchbooks, odd found things, gentle surrealism and big feelings.',cover:'linear-gradient(125deg,#ab99ba,#e2b2ba 48%,#e5cbad)',topic:'Dreamlike',rules:['Credit artists and link to the original work when sharing.','Be curious and kind. Critique the work, not the person.','No spam, stolen art claims or unsolicited selling.']},
 {id:'studio',symbol:'SA',name:'studio after hours',handle:'@@studio-after-hours',tagline:'the messy middle is the point',description:'Works in progress, studio photos, material experiments, and the glorious trial-and-error of making things.',cover:'linear-gradient(135deg,#475a69,#738e93 55%,#dbad9d)',topic:'Making',rules:['Share process generously.','No copying someone else’s work without permission.','Support beginners.']},
 {id:'editions',symbol:'SE',name:'small editions club',handle:'@@small-editions',tagline:'prints, zines and objects with stories',description:'For printmakers, zinesters, collectors of tiny editions, and people who love art they can hold.',cover:'linear-gradient(135deg,#92767f,#d4a798 52%,#ded0ba)',topic:'Printmaking',rules:['Post your source and process.','No counterfeit prints or ownership claims.','Keep buy/sell conversations transparent.']},
 {id:'color',symbol:'CP',name:'color people',handle:'@@color-people',tagline:'an ongoing argument about orange',description:'Palettes, obsessions, color studies, paintings that punch you in the eye, and very specific conversations about pigments.',cover:'linear-gradient(135deg,#ca665e,#e6aa79 50%,#8f839d)',topic:'Color',rules:['Be generous with references.','Don’t pass off somebody else’s work as your own.','Stay on the topic of color.']}
];
const demoPosts=[
 {id:'p1',group:'soft',user:'mothandmoon',name:'moth & moon',avatar:'M',tone:'sun',when:'sample post',title:'What if a painting could feel like a half-remembered dream?',body:'Collecting colors that feel like the hour right before you wake up. Warm pinks, soft shapes, a little bit of unease.',image:asset('violet.jpg'),tags:['dreamlike','color study','surreal'],reblog:null},
 {id:'p2',group:'studio',user:'linestostories',name:'lines to stories',avatar:'L',tone:'sage',when:'sample post',title:'The sketch is allowed to be better than the finished thing.',body:'A reminder to myself and maybe someone else. What are you working on that still feels unfinished?',image:asset('soft-blue.jpg'),tags:['process','studio notes','painting'],reblog:null},
 {id:'p3',group:'soft',user:'nightmuseum',name:'night museum',avatar:'N',tone:'',when:'sample reblog',title:'This color combination is staying with me.',body:'I keep coming back to this. Something about the small things being given so much space.',image:asset('still-life.jpg'),tags:['still life','found inspiration'],reblog:{name:'mothandmoon',text:'Today’s study: what happens if all the objects are just memories?'}},
 {id:'p4',group:'editions',user:'paperplanet',name:'paper planet',avatar:'P',tone:'sun',when:'sample post',title:'What makes a great tiny art book?',body:'I love a small edition that feels like a secret someone decided to share. Drop your favorite zine formats.',image:asset('poster.jpg'),tags:['zines','printmaking','small editions'],reblog:null},
 {id:'p5',group:'color',user:'coralnotes',name:'coral notes',avatar:'C',tone:'sage',when:'sample post',title:'Please defend this shade of orange.',body:'For research purposes I want your strongest opinions on peach, coral and vermilion.',image:asset('sunroom.jpg'),tags:['color','palette','painting'],reblog:null}
];
const moods=[
 {name:'Dreamlike',hint:'a little unreal',bg:'linear-gradient(130deg,#a57b9c,#4e5278)'},
 {name:'Vibrant',hint:'color turned up',bg:'linear-gradient(130deg,#db866e,#a34863)'},
 {name:'Calm',hint:'quiet beauty',bg:'linear-gradient(130deg,#95b6ac,#416473)'},
 {name:'Nature',hint:'everything grows',bg:'linear-gradient(130deg,#8b9c7c,#527a72)'},
 {name:'Intimate',hint:'human, close, honest',bg:'linear-gradient(130deg,#d7a1a2,#88637c)'},
 {name:'Melancholic',hint:'beautifully a little blue',bg:'linear-gradient(130deg,#686a91,#3d425b)'}
];
// Profile edits are limited to the creator demo, and validated before persistence.
if(state.artistEdits?.nia) Object.assign(artists.nia,state.artistEdits.nia);
for(const group of groups) if(state.groupEdits?.[group.id]) Object.assign(group,state.groupEdits[group.id]);
for(const w of works){const override=state.listingOverrides[w.id];if(override){w.askingPrice=override.askingPrice;w.available=override.available}}
const defaultCommissionSettings={
 nia:{enabled:true,email:'',options:[
  {id:'portrait',type:'Portrait or figure',min:450,max:1250,style:'Expressive portraiture',medium:'Oil / acrylic on canvas',timeline:'4–6 weeks'},
  {id:'abstract',type:'Abstract commission',min:350,max:950,style:'Color and abstraction',medium:'Acrylic / mixed media',timeline:'3–5 weeks'},
  {id:'study',type:'Small original study',min:175,max:350,style:'Intimate still life',medium:'Acrylic on paper',timeline:'2–3 weeks'}
 ]},
 oren:{enabled:false,email:'',options:[]}
};
const commissionFor=id=>state.commissionSettings[id]||defaultCommissionSettings[id]||{enabled:false,email:'',options:[]};
const money=v=>'$'+Number(v).toLocaleString('en-US',{maximumFractionDigits:0});
const demoSalesFor=id=>state.demoOrders.filter(o=>o.artistId===id&&o.status==='demo_complete');
const soldPreview=w=>state.demoOrders.some(o=>o.workId===w?.id&&o.status==='demo_complete');
const canBuy=w=>!!w&&!artists[w.artist]?.archive&&w.available===true&&Number.isFinite(w.askingPrice)&&w.askingPrice>0&&!soldPreview(w);
const commissionMin=id=>{const vals=commissionFor(id).options.map(o=>o.min).filter(v=>Number.isFinite(v)&&v>0);return vals.length?Math.min(...vals):null};
const askingLabel=w=>soldPreview(w)?`${money(w.askingPrice)} · sold (preview)`:canBuy(w)?`${money(w.askingPrice)} · asking`:(w?.available?'Price on request':'');
const marketReady=a=>(Array.isArray(a.verifiedSales)&&a.verifiedSales.length>0)||demoSalesFor(a.id).length>0;
const ownerOf=id=>state.account?.role==='creator'&&state.account.artistId===id;
const ownerOfGroup=id=>(state.account?.role==='community'&&state.account.groupId===id)||(state.account?.role==='creator'&&id==='soft');
const countLikes=id=>artistWorks(id).reduce((n,w)=>n+(state.liked.includes(w.id)?1:0),0);
const countFans=id=>state.following.includes(id)?1:0;
const dateCaption=iso=>{try{return new Date(iso+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}catch{return 'Recently'}};
function updateAccountUI(){
 const b=$('#account-button');if(!b)return;
 const logged=!!state.account;const label=!logged?'Sign in':state.account.role==='creator'?'My artist profile':state.account.role==='community'?'My community':'My profile';
 b.innerHTML=`${icon('user')} <span>${label}</span>`;b.setAttribute('aria-label',logged?'Open '+label:'Sign in');b.title=logged?'Go directly to your profile':'Sign in to Offframe';
 b.dataset.action=logged?'go-profile':'account';b.classList.toggle('signed-in',logged);
 const personal=$('#bottom-personal-link');if(personal){personal.dataset.page=logged?'':'saved';personal.dataset.action=logged?'go-profile':'';personal.innerHTML=logged?`<span>${icon('user')}</span>Profile`:`<span>${icon('bookmark')}</span>Saved`;}
}
function artistWorks(id){return works.filter(w=>w.artist===id)}
function byId(id){return works.find(w=>w.id===id)}
function byGroup(id){return groups.find(g=>g.id===id)}
function save(k){put(k,state[k])}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2600)}
function markPage(page){if(!$('#page-'+page))page='discover';if(page!=='discover'){clearTimeout(feedOverlay.timer);feedOverlay.activeKey=null;feedOverlay.activeArtist=null;}if(state.designSession&&page!==(state.designSession.kind==='artist'?'artist':'group')){state.designSession=null;}state.page=page;$$('.page').forEach(el=>el.classList.toggle('is-active',el.id==='page-'+page));$$('[data-page]').forEach(el=>el.classList.toggle('selected',el.dataset.page===page));$$('.bottom-link').forEach(el=>el.classList.toggle('active',el.dataset.page===page||(el.dataset.action==='go-profile'&&(page==='me'||(page==='artist'&&ownerOf(state.artist))||(page==='group'&&ownerOfGroup(state.group))))));$('#topbar-label').textContent={discover:'ART FOR THE CURIOUS',moods:'FIND YOUR FEELING',search:'LOOK A LITTLE CLOSER',community:'FIND YOUR PEOPLE',saved:'YOUR PRIVATE MUSEUM',me:'YOUR CREATIVE CORNER',artist:'THE ARTIST UNIVERSE',group:'A PLACE TO BELONG'}[page];if(page==='discover')renderFeed();if(page==='moods')renderMoods();if(page==='search')renderSearch();if(page==='community')renderCommunity();if(page==='saved')renderSaved();if(page==='me')renderMe();if(page==='artist')renderArtist();if(page==='group')renderGroup();const root=$('#page-'+page);if(root)root.scrollTop=0;updateAccountUI();setTimeout(()=>{observePostViews();observeArtworkViews()},90)}
function openArtist(id){state.lastPage=state.page;state.artist=id;state.artistTab='overview';markPage('artist')}
function openGroup(id){state.lastPage='community';state.group=id;state.groupTab='posts';markPage('group')}
function switchFeed(feed){state.feed=feed;markPage('discover')}
function imageMarkup(w,cl=''){if(!w)return '';return w.image?`<img class="${cl}" src="${clean(w.image)}" alt="${clean(w.title+' — '+artists[w.artist].name)}" loading="lazy" onerror="this.style.display='none'">`:`<div class="mini-art-placeholder ${cl}">Museum image<br>loading</div>`}
function renderFeed(){
 const c=$('#swipe-feed'); $$('[data-feed].channel').forEach(b=>b.classList.toggle('active',b.dataset.feed===state.feed));
 const f=state.feed;
 if(['new','trending','local'].includes(f)){
  const content={new:['Be one of the first artists here.','Founding artists will appear as their genuine profiles go live.'],trending:['We are growing into our trends.','Trending artists will be ranked by authentic activity, never manufactured popularity.'],local:['Your local scene is coming.','Browse by city, style and tags when independent artists in your area join.']}[f];
  c.innerHTML=`<div class="empty-feed"><div class="empty-card"><span class="eyebrow rose">A NEW CREATIVE HOME</span><h2>${content[0]}</h2><p>${content[1]}</p><button class="pill coral" data-action="join">Create an artist profile ${icon('arrow')}</button></div></div>`;return;
 }
 const releases=works.filter(w=>!!w.releasedAt&&!artists[w.artist]?.archive).sort((a,b)=>b.releasedAt.localeCompare(a.releasedAt));
 let items=[];
 if(f==='releases')items=releases.map(w=>({artist:artists[w.artist],release:w}));
 else{
  let artistSet=f==='archives'?Object.values(artists).filter(a=>a.archive):[artists.nia,artists.oren,...Object.values(artists).filter(a=>a.archive)];
  items=artistSet.map(artist=>({artist,release:null}));
  if(f==='all')releases.forEach((w,i)=>items.splice(Math.min(2+i*2,items.length),0,{artist:artists[w.artist],release:w}));
 }
 items=items.filter(({artist})=>!state.showLess.includes(artist.id)&&artistWorks(artist.id).length>0);
 if(state.mood)items=items.filter(({artist,release})=>artist.mood.some(m=>m.toLowerCase()===state.mood.toLowerCase())||release?.tags.includes(state.mood.toLowerCase()));
 if(!items.length){c.innerHTML='<div class="empty-feed"><div class="empty-card"><h2>Nothing to show just yet.</h2><p>Try another category or reset your preferences.</p><button class="pill coral" data-action="reset-less">Reset discovery</button></div></div>';return;}
 c.innerHTML=items.map(({artist:a,release},cardIndex)=>{
  const aw=artistWorks(a.id);
  const galleryKey=release?`${a.id}:${release.id}`:a.id;
  const defaultIndex=release?Math.max(0,aw.indexOf(release)):0;
  const n=Math.max(0,Math.min(aw.length-1,state.slideIndexes[galleryKey]??defaultIndex));
  const w=aw[n];if(!w)return '';
  const activeLike=state.liked.includes(w.id),activeFav=state.favorites.includes(w.id);
  const image=w.image?`<img class="slide-backdrop" src="${clean(w.image)}" alt="" aria-hidden="true" loading="${cardIndex>2?'lazy':'eager'}"><img class="slide-image" src="${clean(w.image)}" alt="${clean(w.title)}" draggable="false" loading="${cardIndex>2?'lazy':'eager'}" onerror="this.style.display='none'">`:'<div class="slide-image" style="background:radial-gradient(circle at 30% 27%,#7f647a,#424653 65%,#24242c)"></div>';
  const label=release?`NEW RELEASE · ${dateCaption(w.releasedAt||release.releasedAt)}`:(a.archive?'HISTORIC ARTIST':'INDEPENDENT ARTIST');
  return `<article class="swipe-slide ${feedOverlay.activeKey===galleryKey&&feedOverlay.mode==='compact'?'is-compact':''}" data-slide="${a.id}" data-gallery-key="${galleryKey}" data-work="${w.id}" data-work-impression="${w.id}" data-release="${release?'yes':'no'}" aria-label="${clean(a.name)} artwork ${n+1} of ${aw.length}">${image}<div class="slide-shade"></div>
    <div class="slide-top"><span class="slide-tag">${label} · ${clean(a.style)}</span><span class="slide-progress">${n+1} / ${aw.length}</span></div>
    <div class="slide-meta"><div class="slide-micro">${clean(a.tagline.toUpperCase())}</div>
     <h2><button class="artist-name-link" data-artist="${a.id}" aria-label="Open ${clean(a.name)}'s artist profile">${clean(a.name)} ${icon('arrow')}</button></h2>
     <div class="slide-place">${clean(a.location)}</div><div class="slide-description">${clean(a.bio)}</div>
     <div class="work-title"><span class="work-name">${clean(w.title)} · ${clean(w.year)}</span>${askingLabel(w)?`<span class="work-price">${askingLabel(w)}</span>`:''}</div>
     <div class="slide-arrows"><button class="gallery-arrow" data-prev="${galleryKey}" aria-label="Previous artwork">${icon('left')}</button><span>Swipe to explore works</span><button class="gallery-arrow" data-next="${galleryKey}" aria-label="Next artwork">${icon('right')}</button></div>
    </div>
    <div class="slide-compact-bar" aria-hidden="${feedOverlay.activeKey===galleryKey&&feedOverlay.mode==='compact'?'false':'true'}">
      <button class="slide-compact-trigger" data-overlay-expand="${galleryKey}" type="button" aria-label="Show full details for ${clean(w.title)} by ${clean(a.name)}">
        <span class="compact-artist">${clean(a.name)}</span><strong class="compact-work">${clean(w.title)}</strong><span class="compact-more">View details ${icon('arrow')}</span>
      </button>
      <div class="slide-compact-nav"><button class="gallery-arrow" data-prev="${galleryKey}" aria-label="Previous artwork">${icon('left')}</button><button class="gallery-arrow" data-next="${galleryKey}" aria-label="Next artwork">${icon('right')}</button></div>
    </div>
    <div class="slide-actions" aria-hidden="${feedOverlay.activeKey===galleryKey&&feedOverlay.mode==='compact'?'true':'false'}"><button class="slide-action ${activeLike?'on':''}" data-like="${w.id}" aria-label="Like artwork"><span class="round-action">${icon('heart')}</span><span>Like</span></button>
     <button class="slide-action ${activeFav?'on':''}" data-favorite="${w.id}" aria-label="Add to favorites or collection"><span class="round-action">${icon('bookmark')}</span><span>Favorites</span></button>
     <button class="slide-action" data-comments="${w.id}" aria-label="Read comments"><span class="round-action">${icon('comments')}</span><span>Comment</span></button>
     <button class="slide-action" data-less="${a.id}" aria-label="Show less of this artist"><span class="round-action">${icon('close')}</span><span>Less</span></button></div>
    </article>`;
 }).join('');
 setTimeout(observeArtworkViews,100);
 scheduleFocusedSlide();
}
function refreshFeedInPlace(){const feed=$('#swipe-feed');const top=feed.scrollTop;renderFeed();feed.scrollTop=top;}
function moveArtwork(key,by){
 const [artistId,releaseId]=key.split(':');const ws=artistWorks(artistId);if(ws.length<2)return;
 const defaultIndex=releaseId?Math.max(0,ws.findIndex(w=>w.id===releaseId)):0;
 const idx=state.slideIndexes[key]??defaultIndex;
 // Clicking an arrow can briefly trigger browser scroll-snap while it receives focus.
 // Keep the selected artist in focus and retain the intentionally compact caption.
 clearTimeout(feedOverlay.timer);feedOverlay.timer=null;
 feedOverlay.activeKey=key;feedOverlay.activeArtist=artistId;feedOverlay.mode='compact';
 suspendOverlaySync();
 state.slideIndexes[key]=(idx+by+ws.length)%ws.length;
 const feed=$('#swipe-feed'),current=feed.querySelector(`[data-gallery-key="${CSS.escape(key)}"]`);
 const targetScroll=current?feed.scrollTop+current.getBoundingClientRect().top-feed.getBoundingClientRect().top:feed.scrollTop;
 renderFeed();feed.scrollTop=targetScroll;
 const updated=feed.querySelector(`[data-gallery-key="${CSS.escape(key)}"]`);
 if(updated)setSlideDetailMode(updated,'compact');
}

function toggleLike(id){const i=state.liked.indexOf(id);i>=0?state.liked.splice(i,1):state.liked.push(id);save('liked');toast(i>=0?'Like removed':'Liked');if(state.page==='discover')refreshFeedInPlace();if(state.page==='saved')renderSaved();if(state.page==='artist')renderArtist()}
function toggleFollowing(id){const i=state.following.indexOf(id);i>=0?state.following.splice(i,1):state.following.push(id);save('following');toast(i>=0?'Unfollowed (local demo)':'Following (local demo)');if(state.page==='artist')renderArtist()}
function setModal(html){$('#modal-content').innerHTML=html;const modal=$('#modal-cover .modal');modal.classList.toggle('modal-wide',!!$('#modal-content .auth-layout, #modal-content .editor-workspace'));modal.scrollTop=0;$('#modal-cover').classList.add('open');$('#modal-cover').setAttribute('aria-hidden','false')}
function closeModal(){$('#modal-cover').classList.remove('open');$('#modal-cover').setAttribute('aria-hidden','true')}
function favoritesModal(id){const w=byId(id);if(!w)return;const opts=Object.keys(state.collections).map(n=>`<button data-add-collection="${clean(n)}" data-item="${id}"><span>${clean(n)}</span><small>${state.collections[n].includes(id)?'Added ':'Add +'}</small></button>`).join('');setModal(`<span class="eyebrow rose">KEEP SOMETHING GOOD</span><h2>Save to favorites<br>or a collection.</h2><p><strong>${clean(w.title)}</strong> by ${clean(artists[w.artist].name)}. Build little museums of the things you love.</p><div class="modal-list">${opts}<button data-action="new-collection" data-item="${id}"><span>+ &nbsp;Create a new collection</span><small>New</small></button></div><p class="quiet" style="margin-top:15px">Saved in this browser for the concept preview.</p>`)}
function addToCollection(name,id){if(!state.collections[name])state.collections[name]=[];const i=state.collections[name].indexOf(id);if(i>=0){state.collections[name].splice(i,1);toast('Removed from '+name)}else{state.collections[name].push(id);toast('Added to '+name+' Like')}state.favorites=[...new Set(Object.values(state.collections).flat())];save('collections');save('favorites');closeModal();if(state.page==='saved')renderSaved();if(state.page==='discover')refreshFeedInPlace();if(state.page==='artist')renderArtist()}
function newCollectionModal(id=''){setModal(`<span class="eyebrow rose">YOUR PERSONAL MUSEUM</span><h2>Make a new collection.</h2><p>Something for your favorite colors, your next apartment, art you want to remember — anything.</p><form id="new-collection-form"><label>Collection name<input name="name" required maxlength="45" placeholder="e.g. A little surrealism"></label><button class="submit-btn" type="submit">Create collection →</button></form>`);$('#new-collection-form').addEventListener('submit',e=>{e.preventDefault();const n=new FormData(e.target).get('name').trim();if(!n)return;if(state.collections[n])return toast('That collection already exists');state.collections[n]=id?[id]:[];state.favorites=[...new Set(Object.values(state.collections).flat())];save('collections');save('favorites');closeModal();toast('Collection created Like');if(state.page==='saved')renderSaved();if(state.page==='discover')refreshFeedInPlace();})}
function renderMoods(){
 const visuals={Dreamlike:'violet.jpg',Vibrant:'sunroom.jpg',Calm:'soft-blue.jpg',Nature:'flowers.jpg',Intimate:'portrait-original.jpg',Melancholic:'landscape.jpg'};
 $('#moods-grid').innerHTML=moods.map((m,i)=>`<button class="mood-tile" data-mood="${m.name}" aria-label="Explore ${m.name} art"><img class="mood-art" src="${asset(visuals[m.name])}" alt="" loading="lazy"><span class="mood-number">${String(i+1).padStart(2,'0')} / MOOD</span><div class="mood-tile-copy"><h3>${m.name}</h3><p>${m.hint} ${icon('right')}</p></div></button>`).join('');
 $('#movement-grid').innerHTML=archiveMovements.map((m,i)=>{const term=normArtText(m.name),matches=Object.values(artists).filter(a=>a.archive&&[a.style,a.practice,...(a.discoveryTags||[])].some(t=>normArtText(t).includes(term)));return `<button class="movement-card tint-${m.tint}" data-category="${clean(m.name)}" aria-label="Discover ${clean(m.name)}"><span class="movement-no">${String(i+1).padStart(2,'0')} / MOVEMENT</span><strong>${clean(m.name)}</strong><span class="movement-description">${clean(m.desc)}</span><span class="movement-count">${matches.length} ${matches.length===1?'artist':'artists'} ${icon('arrow')}</span></button>`}).join('');
 $('#archive-tag-cloud').innerHTML=archiveTags.map(t=>`<button class="archive-tag" data-tag="${clean(t)}">#${clean(t.replace(/ /g,''))} ${icon('arrow')}</button>`).join('');
 $('#archive-list').innerHTML=Object.values(artists).filter(a=>a.archive).map(a=>smallArtist(a)).join('');
}

function smallArtist(a){let w=artistWorks(a.id)[0];return `<button class="mini-artist" data-artist="${a.id}">${w?.image?imageMarkup(w):`<div class="mini-art-placeholder">${a.archive?'ARCHIVE':clean(a.name.slice(0,1))}</div>`}<div class="mini-copy"><h3>${clean(a.name)}</h3><p>${clean(a.style)} · ${a.archive?clean(a.era||'Historic artist'):'Artist'}</p>${a.archive?`<span class="mini-archive-topic">${clean(a.discoveryTags?.slice(0,3).join(' · ')||'Museum archive')}</span>`:''}</div></button>`}
function renderSearch(){const term=normArtText($('#search-term').value),location=normArtText($('#search-location').value),style=normArtText($('#search-style').value),medium=normArtText($('#search-medium').value),mood=normArtText($('#search-mood').value);const set=Object.values(artists).filter(a=>{const aw=artistWorks(a.id);const hay=normArtText([a.name,a.location,a.style,a.bio,a.practice,...(a.discoveryTags||[]),...aw.flatMap(w=>[w.title,w.medium,w.style,...w.tags])].join(' '));return(!term||hay.includes(term))&&(!location||normArtText(a.location).includes(location))&&(!style||hay.includes(style))&&(!medium||aw.some(w=>normArtText(w.medium).includes(medium))||normArtText(a.practice).includes(medium))&&(!mood||hay.includes(mood)||a.mood.some(m=>normArtText(m)===mood))});$('#search-results').innerHTML=set.length?set.map(smallArtist).join(''):`<div class="saved-empty"><strong>No matches yet.</strong>Try a different city or medium. Independent artists are just starting to join the community.</div>`;$('#search-count').textContent=set.length+' artist profiles';
 $('#search-discovery-tags').innerHTML=archiveTags.slice(0,12).map(t=>`<button class="search-discovery-tag ${term===t?'selected':''}" data-tag="${clean(t)}">#${clean(t.replace(/ /g,''))}</button>`).join('');}
function postHTML(post){const own=post.user==='you'||post.artistId==='nia';const liked=state.liked.includes('post:'+post.id);return `<article class="post-card" data-post="${clean(post.id)}"><div class="dash-post-context"><span>POSTED IN</span><button data-group="${clean(post.group)}">${clean(byGroup(post.group)?.name||"community")} <span>→</span></button></div><div class="post-top"><div class="user-avatar ${clean(post.tone||'')}">${clean(post.avatar)}</div><div><strong>${clean(post.name)}</strong><span>@${clean(post.user)} · ${clean(post.when)} ${!own?'· community preview':''}</span></div><span class="post-dots">···</span></div>${post.title?`<h3>${clean(post.title)}</h3>`:''}${post.reblog?`<div class="reblog-nest"><strong>Repost Reblogged from ${clean(post.reblog.name)}</strong><p>${clean(post.reblog.text)}</p></div>`:''}<p>${clean(post.body)}</p>${post.image?`<img class="post-photo" src="${clean(post.image)}" alt="Illustrative post image" loading="lazy">`:''}<div class="post-tags">${post.tags.map(t=>`<button data-tag="${clean(t)}">#${clean(t.replace(/ /g,''))}</button>`).join('')}</div><div class="post-footer"><span class="demo-note">${own?'Created in your browser':'Community preview'}</span><div class="post-buttons"><button data-post-comments="${post.id}" aria-label="Comments">${icon('comments')}</button><button data-reblog="${post.id}" aria-label="Reblog post">${icon('repeat')}</button><button class="${liked?'on':''}" data-like-post="${post.id}" aria-label="Like post">${icon('heart')}</button></div></div></article>`}
function toggleCommunityJoin(id){
 const g=byGroup(id);if(!g)return;
 const i=state.joined.indexOf(id),joined=i<0;
 if(joined)state.joined.push(id);else state.joined.splice(i,1);
 save('joined');
 if(!joined&&state.communityTab==='space'&&state.communityFocus===id){state.communityFocus='';state.communityTab='following'}
 if(state.page==='group')renderGroup();else if(state.page==='community')renderCommunity();
 toast(joined?`Joined ${g.name} (local preview)`:`Left ${g.name}`);
}
function communityCard(g){
 const joined=state.joined.includes(g.id);
 return `<article class="dash-space-card"><button class="dash-space-art" data-group="${g.id}" aria-label="Open ${clean(g.name)}" style="--space-cover:${g.cover}"><span>${clean(g.symbol||g.name.slice(0,2).toUpperCase())}</span><i>OFFFRAME COMMUNITY</i></button><div class="dash-space-copy"><button data-group="${g.id}" class="dash-space-name">${clean(g.name)} →</button><p>${clean(g.tagline)}</p><div class="dash-space-footer"><span>#${clean(g.topic)}</span><button class="dash-join ${joined?'is-joined':''}" data-community-join="${g.id}">${joined?' Joined':'+ Join'}</button></div></div></article>`;
}
function mixedPosts(){
 const own=[...state.posts].reverse(),samples=[...demoPosts];
 // Interleave different creative spaces. Shuffle cycles through the demo posts;
 // no implied live recommendation metrics or fabricated engagement.
 const offset=state.communityShuffle%samples.length;
 const rotated=samples.slice(offset).concat(samples.slice(0,offset));
 return [...own,...rotated];
}
function renderCommunity(){
 const content=$('#community-main');let tab=state.communityTab;
 const joined=groups.filter(g=>state.joined.includes(g.id));
 if(tab==='space'&&!joined.some(g=>g.id===state.communityFocus)){tab=state.communityTab='following';state.communityFocus=''}
 const selected=joined.find(g=>g.id===state.communityFocus);
 let feed=mixedPosts();
 if(tab==='following')feed=feed.filter(p=>state.joined.includes(p.group));
 if(tab==='space')feed=feed.filter(p=>p.group===state.communityFocus);
 const suggestions=[...groups].sort((a,b)=>Number(state.joined.includes(a.id))-Number(state.joined.includes(b.id)));
 const navCards=joined.length?joined.map(g=>`<button class="dash-joined-pill ${selected?.id===g.id?'is-active':''}" data-community-space="${g.id}"><span class="dash-joined-icon" style="background:${g.cover}">${clean(g.symbol||g.name.slice(0,2).toUpperCase())}</span>${clean(g.name)} →</button>`).join(''):'<div class="dash-joined-empty">Your joined communities will live here. Find one below and make it yours.</div>';
 const modeHeading=tab==='for-you'?'Across the creative universe':tab==='following'?'From your communities':`Inside ${clean(selected?.name||'your community')}`;
 const selectedOptions=`<option value="">Choose a joined community…</option>${joined.map(g=>`<option value="${g.id}" ${selected?.id===g.id?'selected':''}>${clean(g.name)}</option>`).join('')}`;
 content.innerHTML=`<div class="dash-hero"><div class="dash-hero-copy"><span class="eyebrow rose">YOUR OFFFRAME DASHBOARD</span><h1>Find your people.<br><em>Keep your weird.</em></h1><p>Art, thoughts, experiments and beautiful rabbit holes. A home feed from every corner of the creative world.</p><div class="dash-hero-actions"><button data-action="compose" class="dash-new-post">Write a post →</button><button data-action="shuffle-community" class="dash-shuffle">Repost Surprise me</button></div></div><div class="dash-hero-art"><div class="dash-sticker dash-sticker-a">we make<br>things </div><div class="dash-sticker dash-sticker-b"></div><div class="dash-sticker dash-sticker-c">collect<br>what moves you</div></div></div>
 <section class="dash-section dash-recommend"><div class="dash-section-head"><div><span class="eyebrow rose">A PLACE FOR EVERY OBSESSION</span><h2>Suggested communities</h2></div><span class="dash-section-hint">Find a corner to call yours →</span></div><div class="dash-space-scroll">${suggestions.map(communityCard).join('')}</div></section>
 <section class="dash-follow-section"><div class="dash-section-head"><div><span class="eyebrow rose">YOUR PEOPLE</span><h2>Communities you follow <span>(${joined.length})</span></h2></div></div><div class="dash-joined-strip">${navCards}</div></section>
 <div class="dash-toolbar"><div class="dash-feed-tabs"><button class="${tab==='for-you'?'active':''}" data-community-tab="for-you"> For you</button><button class="${tab==='following'?'active':''}" data-community-tab="following">Like Following</button></div><label class="dash-community-select"><span>VIEW A COMMUNITY</span><select id="community-selector" aria-label="Select a community you follow" ${joined.length?'':'disabled'}>${selectedOptions}</select></label></div>
 <div class="dash-content-grid"><section class="dash-posts-section"><div class="dash-feed-heading"><div><span class="eyebrow">YOUR CREATIVE DASHBOARD</span><h2>${modeHeading}</h2></div>${tab==='space'?`<button data-group="${selected.id}" class="dash-visit">Visit community →</button>`:`<span class="dash-sample-tag">Community sample posts</span>`}</div><div class="dash-compose-inline"><div class="user-avatar sun"></div><span>A sketch, a thought, something you're making…</span><button data-action="compose">Create →</button></div><div class="posts-column">${feed.length?feed.map(postHTML).join(''):`<div class="dash-empty-feed"><span></span><h3>Every good community starts somewhere.</h3><p>${tab==='following'?'Join a community above to bring its posts into your Following feed.':'This space has no posts yet. Be the first to share something.'}</p><button data-community-tab="for-you">Explore all posts →</button></div>`}</div></section><aside class="dash-right"><div class="dash-right-box"><span class="eyebrow rose">YOUR CREATIVE CIRCLES</span><h3>Places worth getting lost in</h3><p>Once you join a group, you can browse its posts here or go into its own customizable space.</p><div class="dash-side-spaces">${(joined.length?joined:groups.slice(0,3)).map(g=>`<button data-group="${g.id}"><span class="dash-side-avatar" style="background:${g.cover}">${clean(g.symbol||g.name.slice(0,2).toUpperCase())}</span><span>${clean(g.name)}<small>${joined.some(x=>x.id===g.id)?'Joined community':'Suggested community'}</small></span>→</button>`).join('')}</div></div><div class="dash-right-box"><span class="eyebrow rose">TAGS TO FALL INTO</span><h3>Follow your curiosity.</h3><div class="dash-hashtags">${['dreamlike','studio notes','zines','painting','color'].map(t=>`<button data-tag="${clean(t)}">#${clean(t.replace(/ /g,''))} →</button>`).join('')}</div></div></aside></div>
 <div class="notice-panel dash-disclaimer">These example communities and posts are design samples. The feed does not represent real members or activity. Your joins, posts and interactions stay in this browser.</div>`;
}

/* WYSIWYG identity styling. This is an in-place editor of the public page, not a form next to a simulation. */
const designPresets={
 atelier:{name:'Atelier',bg:'#18171c',surface:'#29232d',text:'#f8eee8',accent:'#efb8a5',cover:'#553946',font:'sans',heading:'editorial',pattern:'glow',radius:16,coverHeight:245},
 paper:{name:'Paper',bg:'#f6f1e7',surface:'#fff9ef',text:'#302922',accent:'#9c5f45',cover:'#bca08f',font:'serif',heading:'editorial',pattern:'dots',radius:5,coverHeight:245},
 midnight:{name:'After dark',bg:'#111424',surface:'#212746',text:'#f9f8f0',accent:'#a3baff',cover:'#403b6d',font:'sans',heading:'bold',pattern:'grid',radius:24,coverHeight:280},
 garden:{name:'Wildflower',bg:'#e5e8d7',surface:'#f4f4e9',text:'#243b2f',accent:'#527b5f',cover:'#628570',font:'serif',heading:'editorial',pattern:'dots',radius:22,coverHeight:260},
 electric:{name:'Electric',bg:'#19111e',surface:'#30203d',text:'#fff4ef',accent:'#ff77b9',cover:'#54248b',font:'mono',heading:'bold',pattern:'grid',radius:2,coverHeight:280},
};
const defaultsFor=kind=>({...designPresets.atelier, coverImage:'',backgroundImage:'',avatarImage:''});
function validDesign(obj){const defaults=defaultsFor();const raw={...defaults,...(obj||{})};const validHex=x=>typeof x==='string'&&/^#[\da-fA-F]{6}$/.test(x);for(const key of ['bg','surface','text','accent','cover'])if(!validHex(raw[key]))raw[key]=defaults[key];for(const [key,values] of Object.entries({font:['sans','serif','mono','grotesk'],heading:['editorial','sans','bold','mono'],pattern:['none','dots','grid','glow']}))if(!values.includes(raw[key]))raw[key]=defaults[key];raw.radius=Math.min(36,Math.max(0,parseInt(raw.radius,10)||0));raw.coverHeight=Math.min(410,Math.max(145,parseInt(raw.coverHeight,10)||245));for(const key of ['coverImage','backgroundImage','avatarImage']){if(typeof raw[key]!=='string'||(!raw[key].startsWith('data:image/')&&!/^assets\/[\w.-]+$/.test(raw[key]))||raw[key].length>800000)raw[key]=''}return raw;}
function savedStyle(kind,id){const d=defaultsFor(kind);if(kind==='artist'&&id==='nia')d.coverImage=asset('portrait-original.jpg');if(kind==='artist'&&id==='oren')d.coverImage=asset('violet.jpg');return validDesign((kind==='artist'?state.artistStyles:state.groupStyles)[id]||d)}
function currentDesign(kind,id){const ds=state.designSession;return ds&&ds.kind===kind&&ds.id===id?ds.style:savedStyle(kind,id)}
function activeEdit(kind,id){return !!(state.designSession&&state.designSession.kind===kind&&state.designSession.id===id)}
function designFields(kind,id){const ss=state.designSession;return ss&&ss.kind===kind&&ss.id===id?ss.fields:kind==='artist'?artists[id]:byGroup(id)}
function editable(field,limit=260){return `contenteditable="true" role="textbox" spellcheck="true" tabindex="0" data-edit-field="${field}" data-max="${limit}" aria-label="Edit ${field}" title="Click to edit ${field}"`}
const fontMap={sans:"'DM Sans',sans-serif",serif:"Georgia, 'Times New Roman',serif",mono:"'IBM Plex Mono',monospace",grotesk:"'Space Grotesk',sans-serif"};
const headMap={editorial:"'Cormorant Garamond',Georgia,serif",sans:"'DM Sans',sans-serif",bold:"'Space Grotesk',sans-serif",mono:"'IBM Plex Mono',monospace"};
const safeImage=i=>String(i||'').startsWith('data:image/')||String(i||'').startsWith('assets/')?String(i):'';
function applyDesign(kind,id){const el=$(kind==='artist'?'#artist-main':'#group-main');if(!el)return;const style=currentDesign(kind,id);el.classList.add('identity-space');el.classList.toggle('identity-editing',activeEdit(kind,id));el.style.setProperty('--identity-bg',style.bg);el.style.setProperty('--identity-surface',style.surface);el.style.setProperty('--identity-ink',style.text);el.style.setProperty('--identity-accent',style.accent);el.style.setProperty('--identity-font',fontMap[style.font]);el.style.setProperty('--identity-heading',headMap[style.heading]);el.style.setProperty('--identity-radius',style.radius+'px');el.style.setProperty('--identity-cover-height',style.coverHeight+'px');el.dataset.identityPattern=style.pattern;
 const bg=safeImage(style.backgroundImage);el.style.backgroundImage=bg?`linear-gradient(to bottom,${style.bg}bb,${style.bg}de),url("${bg}")`:'';
 const banner=$(kind==='artist'?'#artist-main .profile-banner':'#group-main .group-cover');if(banner){const cover=safeImage(style.coverImage);banner.style.backgroundImage=cover?`linear-gradient(180deg,transparent 70%,#0005),url("${cover}")`:kind==='group'&&!state.groupStyles[id]&&!activeEdit(kind,id)?byGroup(id).cover:`linear-gradient(135deg,${style.cover},${style.bg})`;banner.style.backgroundColor=style.cover}
 const avatar=$(kind==='artist'?'#artist-main .profile-avatar':'#group-main .group-big-avatar');if(avatar){const img=safeImage(style.avatarImage);avatar.classList.toggle('identity-avatar-image',!!img);avatar.style.backgroundImage=img?`url("${img}")`:'';}
 const badge=$('#contrast-readout');if(badge){const ratio=contrastRatio(style.text,style.bg);badge.textContent=ratio>=4.5?' Readable contrast':' Low contrast — adjust text/background';badge.classList.toggle('contrast-warning',ratio<4.5)}
}
function brightness(hex){const vals=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return vals[0]*.2126+vals[1]*.7152+vals[2]*.0722}
function contrastRatio(a,b){const x=brightness(a),y=brightness(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function designToolbar(kind,id){if(!activeEdit(kind,id))return '';const d=currentDesign(kind,id);const title=kind==='artist'?'Artist page':'Community space';return `<div class="live-design-toolbar ${state.designSession?.panelOpen?'controls-open':''}" aria-label="Live page designer">
 <div class="live-design-header"><div><span class="live-edit-overline"> OFFFRAME STUDIO / LIVE EDITOR</span><h2>Make this space <em>your own.</em></h2><p>You're editing the actual ${kind==='artist'?'artist profile':'community page'}. Tap highlighted text to change it. Everything updates here, in place.</p></div><div class="design-header-actions"><span class="draft-pill">● LOCAL DRAFT</span><button class="design-toggle" data-action="design-toggle" aria-expanded="${state.designSession?.panelOpen?'true':'false'}" aria-controls="design-controls-${kind}">${state.designSession?.panelOpen?' Hide design tools ↑':' Customize appearance ↓'}</button><button class="design-cancel" data-action="design-cancel">Discard</button><button class="design-save" data-action="design-save"> Save changes</button></div></div>
 <div class="design-controls-shell" id="design-controls-${kind}"><div class="design-section-header"><strong>01 &nbsp; AESTHETIC</strong><span>Choose a starting point, then make it yours</span></div><div class="design-presets">${Object.entries(designPresets).map(([key,p])=>`<button type="button" data-design-preset="${key}" class="design-preset"><span style="--p-bg:${p.bg};--p-accent:${p.accent};--p-cover:${p.cover}"></span>${p.name}</button>`).join('')}</div>
 <div class="design-controls-grid">
 <fieldset class="design-group"><legend>COLORS</legend><div class="design-color-row">${[['bg','Page'],['surface','Panels'],['text','Text'],['accent','Accent'],['cover','Banner']].map(([k,label])=>`<label class="design-color-control"><input type="color" name="${k}" data-design-color="${k}" value="${d[k]}"><span>${label}</span></label>`).join('')}</div><small id="contrast-readout" aria-live="polite"></small></fieldset>
 <fieldset class="design-group"><legend>TYPOGRAPHY & SHAPE</legend><div class="design-double"><label>Body font<select data-design-choice="font"><option value="sans" ${d.font==='sans'?'selected':''}>Clean sans</option><option value="serif" ${d.font==='serif'?'selected':''}>Literary serif</option><option value="grotesk" ${d.font==='grotesk'?'selected':''}>Modern / graphic</option><option value="mono" ${d.font==='mono'?'selected':''}>Typewriter</option></select></label><label>Headlines<select data-design-choice="heading"><option value="editorial" ${d.heading==='editorial'?'selected':''}>Editorial serif</option><option value="sans" ${d.heading==='sans'?'selected':''}>Minimal</option><option value="bold" ${d.heading==='bold'?'selected':''}>Bold display</option><option value="mono" ${d.heading==='mono'?'selected':''}>Typewriter</option></select></label></div><div class="design-double"><label>Background texture<select data-design-choice="pattern"><option value="none" ${d.pattern==='none'?'selected':''}>Solid</option><option value="dots" ${d.pattern==='dots'?'selected':''}>Paper dots</option><option value="grid" ${d.pattern==='grid'?'selected':''}>Graphic grid</option><option value="glow" ${d.pattern==='glow'?'selected':''}>Soft light</option></select></label><label>Corner shape<select data-design-choice="radius"><option value="0" ${d.radius===0?'selected':''}>Sharp edges</option><option value="5" ${d.radius===5?'selected':''}>Subtle</option><option value="16" ${d.radius===16?'selected':''}>Soft corners</option><option value="24" ${d.radius===24?'selected':''}>Rounded</option><option value="36" ${d.radius===36?'selected':''}>Very round</option></select></label></div></fieldset>
 <fieldset class="design-group design-media"><legend>IMAGE BACKGROUNDS</legend><div class="design-media-buttons"><label class="design-upload">↥ Cover image<input type="file" accept="image/png,image/jpeg,image/webp" data-design-upload="coverImage"></label><label class="design-upload">↥ Page background<input type="file" accept="image/png,image/jpeg,image/webp" data-design-upload="backgroundImage"></label><label class="design-upload">↥ Profile icon<input type="file" accept="image/png,image/jpeg,image/webp" data-design-upload="avatarImage"></label></div><div class="design-media-buttons"><button data-design-clear="coverImage">Clear cover</button><button data-design-clear="backgroundImage">Clear background</button><button data-design-clear="avatarImage">Clear icon</button></div><label class="design-height">Banner size <input type="range" min="145" max="410" value="${d.coverHeight}" data-design-choice="coverHeight"></label><small>Upload your own images, or use the color palettes. Images in this preview are resized and kept only in this browser.</small></fieldset></div></div><div class="live-designer-tip"> Click on the outlined name, description, location, or About text below to edit it directly. &nbsp; <strong>${title} · Live preview</strong></div></div>`}
function startDesignEdit(kind){const id=kind==='artist'?state.artist:state.group;if(kind==='artist'&&!ownerOf(id))return toast('Sign in to your artist demo to customize this page');if(kind==='group'&&!ownerOfGroup(id))return toast('Use a community admin preview to customize this community');if(state.designSession)discardDesignEdit(true);const raw=kind==='artist'?artists[id]:byGroup(id);state.designSession={kind,id,fields:structuredClone({name:raw.name,location:raw.location,style:raw.style,bio:raw.bio,about:raw.about,links:raw.links,story:raw.story,description:raw.description,tagline:raw.tagline,topic:raw.topic,symbol:raw.symbol,rules:raw.rules}),style:{...savedStyle(kind,id)}};closeModal();if(kind==='artist')renderArtist();else renderGroup();toast('Live editor enabled — tap any outlined text');}
function discardDesignEdit(silent=false){if(!state.designSession)return;const ds=state.designSession;state.designSession=null;if(ds.kind==='artist')renderArtist();else renderGroup();if(!silent)toast('Changes discarded');}
function saveDesignEdit(){const ds=state.designSession;if(!ds)return;const raw=ds.kind==='artist'?artists[ds.id]:byGroup(ds.id);const fields=ds.kind==='artist'?['name','location','style','bio','about','links','story']:['name','description','tagline','topic','symbol','rules'];for(const key of fields){if(key==='rules'){if(Array.isArray(ds.fields.rules))raw.rules=ds.fields.rules.slice(0,6);continue}const txt=String(ds.fields[key]??'').trim();if(txt)raw[key]=txt;}if(ds.kind==='artist'){state.artistEdits[ds.id]={...(state.artistEdits[ds.id]||{}),...Object.fromEntries(fields.filter(k=>k!=='rules').map(k=>[k,raw[k]]))};save('artistEdits');state.artistStyles[ds.id]=validDesign(ds.style);save('artistStyles');}else{state.groupEdits[ds.id]=Object.fromEntries(fields.map(k=>[k,raw[k]]));save('groupEdits');state.groupStyles[ds.id]=validDesign(ds.style);save('groupStyles');}state.designSession=null;if(ds.kind==='artist'){renderArtist();renderFeed();renderSearch()}else{renderGroup();renderCommunity()}toast('Your design has been saved in this browser');}
async function imageData(file,role){if(!file)return null;if(!/^image\/(png|jpeg|webp)$/.test(file.type))throw new Error('Use a PNG, JPEG, or WebP image');if(file.size>12*1024*1024)throw new Error('Image must be under 12 MB');const bitmap=await createImageBitmap(file);const max=role==='avatarImage'?320:role==='backgroundImage'?1100:1400;const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();const data=canvas.toDataURL('image/jpeg',.75);if(data.length>700000)throw new Error('Image is still too large after compression; choose a smaller image');return data;}
function changeDesignValue(key,value){const ds=state.designSession;if(!ds)return;ds.style[key]=value;ds.style=validDesign(ds.style);applyDesign(ds.kind,ds.id)}
function onInlineInput(e){const editable=e.target.closest('[data-edit-field]');if(!editable||!state.designSession)return;const ds=state.designSession;const key=editable.dataset.editField;let txt=editable.innerText.replace(/\r/g,'').trim();const max=Number(editable.dataset.max)||260;if(txt.length>max){txt=txt.slice(0,max);editable.innerText=txt;}if(key==='rule0'||key==='rule1'||key==='rule2'){const n=Number(key.slice(-1));ds.fields.rules=ds.fields.rules||[];ds.fields.rules[n]=txt;}else ds.fields[key]=txt;}
function pasteInlinePlain(e){if(!e.target.closest('[data-edit-field]'))return;e.preventDefault();const txt=e.clipboardData.getData('text/plain').slice(0,800);document.execCommand('insertText',false,txt)}
function renderGroup(){const raw=byGroup(state.group);if(!raw)return;const g=designFields('group',state.group),editing=activeEdit('group',state.group),isAdmin=ownerOfGroup(raw.id),joined=state.joined.includes(raw.id),tab=state.groupTab;const posts=[...state.posts,...demoPosts].filter(p=>p.group===raw.id);$('#group-main').innerHTML=`${designToolbar('group',raw.id)}<button class="group-back" data-page="community">← Back to communities</button><div class="group-cover" style="--cover:${raw.cover}"><div class="group-cover-label">A CREATIVE SPACE · DEMO COMMUNITY</div></div><div class="group-heading"><div class="group-big-avatar"><span ${editing?editable('symbol',2):''}>${clean(g.symbol||g.name.slice(0,2).toUpperCase())}</span></div><div class="group-heading-main"><h1 ${editing?editable('name',70):''}>${clean(g.name)}</h1><span class="group-user-tag">${clean(raw.handle)}</span><div class="group-tags">#<span ${editing?editable('topic',40):''}>${clean(g.topic)}</span></div><p class="group-tagline" ${editing?editable('tagline',170):''}>${clean(g.tagline)}</p><p ${editing?editable('description',450):''}>${clean(g.description)}</p></div><div class="group-top-buttons">${isAdmin&&!editing?'<button class="mini-button featured" data-action="edit-group"> Customize community</button><button class="mini-button" data-action="account-menu"> Account</button>':''}<button class="mini-button featured" data-join-group="${raw.id}">${joined?' Joined':'+ Join community'}</button><button class="mini-button" data-action="compose">+ Post</button></div></div><div class="group-tabs"><button class="${tab==='posts'?'active':''}" data-group-tab="posts">Posts</button><button class="${tab==='about'?'active':''}" data-group-tab="about">About</button><button class="${tab==='guidelines'?'active':''}" data-group-tab="guidelines">Guidelines</button></div><div class="group-content">${tab==='posts'?`<div class="pinned-note"> Pinned welcome · Introduce yourself, share what you're making, and credit the people behind the art you post.</div><div class="posts-column">${posts.map(postHTML).join('')}</div>`:tab==='about'?`<div class="group-guidelines"><h3>A home for ${clean(g.topic.toLowerCase())} art.</h3><p ${editing?editable('description',450):''}>${clean(g.description)}</p><p>Make this space your own. Community layouts, visuals and typography belong to their organizers.</p><p><em>Prototype note:</em> No actual members or posts from other people.</p></div>`:`<div class="group-guidelines"><h3>Community guidelines</h3>${(g.rules||[]).map((r,i)=>`<p>${i+1}. <span ${editing&&i<3?editable('rule'+i,170):''}>${clean(r)}</span></p>`).join('')}<p>Copyright reporting, counter-notice review, and moderator controls will be part of the production release.</p></div>`}</div>`;applyDesign('group',raw.id)}
function renderArtist(){
 const raw=artists[state.artist];if(!raw)return;const a=designFields('artist',state.artist),editing=activeEdit('artist',state.artist);
 const aw=artistWorks(raw.id),theme=state.themes[raw.id]||raw.theme,isOwner=ownerOf(raw.id);
 let tab=state.artistTab;if(tab==='market'&&!marketReady(a))tab='overview';if(tab==='insights'&&!isOwner)tab='overview';state.artistTab=tab;
 const isFollow=state.following.includes(a.id);
 const priceMarkup=w=>askingLabel(w)?`<strong class="art-price">${askingLabel(w)}</strong>`:'';
 const archiveLead=a.archive?`<section class="archive-dossier"><div class="archive-dossier-top"><span class="eyebrow rose">THE HISTORICAL COLLECTION</span><span class="archive-dossier-index">CURATED ARCHIVE · NOT AN ARTIST-RUN ACCOUNT</span></div><div class="archive-dossier-grid"><div><span>PERIOD</span><strong>${clean(a.era||'Historical')}</strong></div><div><span>MOVEMENT</span><strong>${clean(a.style)}</strong></div><div><span>PRACTICE</span><strong>${clean(a.practice||'Visual art')}</strong></div><div><span>REGION</span><strong>${clean(a.region||a.location)}</strong></div></div><div class="archive-dossier-tags">${(a.discoveryTags||[]).slice(0,9).map(t=>`<button data-tag="${clean(t)}">#${clean(t.replace(/ /g,''))}</button>`).join('')}</div><p>Artwork below is drawn from public-domain museum catalog records where available. These pages are for discovering art history, not selling, representing or speaking for the artists.</p></section>`:'';
 const gallery=`<div class="artist-section-lead"><h2>${tab==='overview'?'Selected works':'All works'}</h2><span>${aw.length} ${aw.length===1?'work':'works'}</span></div>
 <div class="art-grid">${aw.map(w=>`<div class="art-tile" data-work-impression="${w.id}">${w.image?imageMarkup(w):'<div class="mini-art-placeholder archive-image">Museum image loading</div>'}
 <div class="tile-body"><strong>${clean(w.title)}</strong><span>${clean(w.year)} · ${clean(w.medium)}</span>${priceMarkup(w)}${a.archive&&w.museumId?`<a class="archive-source-link" target="_blank" rel="noopener noreferrer" href="https://www.artic.edu/artworks/${Number(w.museumId)}">View museum record ${icon('arrow')}</a>`:''}${isOwner?`<div class="private-view-chip" aria-label="Private views for ${clean(w.title)}"> ${state.artworkViews[w.id]||0} viewed <span>· only you</span></div>`:''}
 <div class="tile-actions"><span>${a.archive?'Museum collection':soldPreview(w)?'Sold · preview':canBuy(w)?'Available to purchase':'Artwork'}</span><button data-favorite="${w.id}">+ Save</button></div>${canBuy(w)?`<button class="buy-art-button" data-buy="${w.id}">Buy artwork <span>→</span></button>`:''}</div></div>`).join('')}${a.archive&&!aw.length?`<div class="archive-awaiting"><span class="eyebrow rose">ARCHIVE IN PROGRESS</span><h3>The museum shelf is being filled.</h3><p>Verified, public-domain artworks for ${clean(a.name)} will appear here when the Art Institute of Chicago catalog responds. This is an intentionally gradual collection, not a generated gallery.</p><a href="https://www.artic.edu/search?q=${encodeURIComponent(a.name)}" target="_blank" rel="noopener noreferrer">Explore museum collection ${icon('arrow')}</a></div>`:''}</div>`;
 let content='';
 if(tab==='overview')content=`${archiveLead}${!a.archive?`<div class="feature-story"><img src="${clean(aw[0]?.image||'')}" alt="Artwork by ${clean(a.name)}"><div><span class="eyebrow">FROM THE STUDIO</span><h3 ${editing?editable('story',150):''}>${clean(a.story||a.tagline)}</h3><p>${clean(a.bio)}</p></div></div>`:''}${gallery}`;
 if(tab==='works')content=`${archiveLead}${gallery}`;
 if(tab==='collections')content=a.archive?`<div class="market-empty"><h3>Museum records</h3><p>Explore the artwork archive to view works attributed to ${clean(a.name)}.</p></div>`:
 `<div class="artist-section-lead"><h2>Artist collections</h2><span>Series and creative projects</span></div><div class="collection-grid">${[['Faces & fragments',aw[0]],['Quiet corners',aw[1]||aw[0]],['Color experiments',aw[2]||aw[0]]].map(([title,w])=>`<button class="collection-card" data-artist-tab="works"><div class="collection-cover">${w?.image?imageMarkup(w):''}</div><div class="collection-info"><strong>${title}</strong><span>Explore series →</span></div></button>`).join('')}</div>`;
 if(tab==='market'&&marketReady(a)){
 const verified=Array.isArray(a.verifiedSales)?a.verifiedSales:[];
 const demos=demoSalesFor(a.id).slice().reverse();
 content=`<div class="artist-section-lead"><h2>Market history</h2><span>Completed sales and documented prices</span></div>
 ${verified.length?`<div class="market-history"><div class="market-section-head">Verified transactions</div>${verified.map(s=>`<div class="market-row"><span>${clean(s.title)}</span><strong>${money(s.amount)}</strong><small>${clean(s.date)}</small></div>`).join('')}</div>`:''}
 ${demos.length?`<div class="market-history demo-market"><div class="market-section-head">Checkout preview · not verified sales</div><p class="market-disclaimer">These entries are created only by clicking through this browser's simulated checkout. They are NOT actual purchases, public sales data, or evidence of market value. A real sale would appear only after payment is confirmed by the payment provider.</p>${demos.map(o=>{const w=byId(o.workId);return `<div class="market-row"><span>${clean(w?.title||o.workId)} <small>· demo transaction</small></span><strong>${money(o.amount)}</strong><small>${new Date(o.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</small></div>`}).join('')}</div>`:''}`;
 }
 if(tab==='posts'){
  const posts=state.posts.filter(p=>p.user===a.handle.replace(/^@/,'')||p.artistId===a.id).reverse();
  content=posts.length?`<div class="artist-posts"><div class="artist-section-lead"><h2>From the studio</h2><span>${posts.length} posts</span></div><div class="posts-column">${posts.map(postHTML).join('')}</div></div>`:`<div class="artist-about"><h3>Notes from ${clean(a.name)}</h3><p>${a.archive?'This historic artist has no social posts.':'Studio updates, ideas and conversations will appear here.'}</p>${isOwner?'<button class="pill coral" data-action="compose">+ Write a post</button>':''}</div>`;
 }
 if(tab==='about')content=`${archiveLead}<div class="artist-about"><h3>Behind the work</h3><p ${editing?editable('about',800):''}>${clean(a.about)}</p><p><strong>Practice:</strong> ${clean(a.style)} &nbsp; · &nbsp; <strong>Based in:</strong> ${clean(a.location)}</p></div>`;
 if(tab==='insights'&&isOwner){
  const posts=state.posts.filter(p=>p.artistId===a.id||p.user===a.handle.replace(/^@/,'')),views=posts.reduce((n,p)=>n+(state.postViews[p.id]||0),0),postLikes=posts.reduce((n,p)=>n+(state.liked.includes('post:'+p.id)?1:0),0);
  const artViews=aw.reduce((n,w)=>n+(state.artworkViews[w.id]||0),0);
  content=`<div class="artist-section-lead"><h2>Studio insights</h2><span class="insights-private-pill">Only visible to you</span></div>
  <div class="insights-grid"><div class="insights-spotlight"><strong>${artViews}</strong><span>Artwork views · preview</span></div><div><strong>${aw.length}</strong><span>Artworks</span></div><div><strong>${views}</strong><span>Post views</span></div><div><strong>${countLikes(a.id)}</strong><span>Artwork likes</span></div><div><strong>${countFans(a.id)}</strong><span>Followers</span></div><div><strong>${demoSalesFor(a.id).length}</strong><span>Demo checkouts</span></div></div>
  <div class="insight-explainer">Artwork views are counted when a work becomes visible in Explore or an artwork gallery, at most once per work per browser session. Your own previews do not count. <strong>These are local test views, not real visitors or unique people.</strong> Production analytics will use privacy-respecting server-side events.</div>
  <div class="insight-list-heading"><h3>Artwork · views by work</h3><span>Private</span></div>
  <div class="insight-list">${aw.slice().sort((x,y)=>(state.artworkViews[y.id]||0)-(state.artworkViews[x.id]||0)).map(w=>`<div class="insight-row artwork-insight-row"><div class="insight-art-thumb">${imageMarkup(w)}</div><div class="insight-art-meta"><strong>${clean(w.title)}</strong><span>${clean(w.medium)} · ${clean(w.year)}</span></div><div class="insight-metric"><strong>${state.artworkViews[w.id]||0}</strong><span>viewed</span></div></div>`).join('')}</div>
  <div class="insight-list-heading"><h3>Your posts</h3><span>${posts.length} posts · ${postLikes} likes</span></div><div class="insight-list">${posts.length?posts.map(p=>`<div class="insight-row"><div><strong>${clean((p.title||p.body).slice(0,95))}</strong><span>${clean(p.when||'Draft')}</span></div><strong>${state.postViews[p.id]||0} views</strong></div>`).join(''):'<div class="saved-empty">No posts yet. Create a post from your studio to start collecting demo post views.</div>'}</div><button class="pill coral" data-action="compose">+ Create a post</button>`;
 }
 const followers=countFans(a.id),likes=countLikes(a.id),commission=commissionFor(a.id);
 const commissionActive=!a.archive&&commission.enabled&&commission.options.length>0;
 const mn=commissionMin(a.id);
 const followButton=isOwner?`<button class="profile-main-btn primary owner-edit-main" data-action="edit-profile">${icon('pencil')} Edit profile</button>`:
 `<button class="profile-main-btn primary" data-follow="${a.id}">${a.archive?(isFollow?'Archive saved':'Follow archive'):(isFollow?'Following':'Follow artist')}</button>`;
 const commTop=commissionActive?`<div class="profile-commission-row"><button class="commission-button" data-commission="${a.id}" aria-label="Request a commission from ${clean(a.name)}"><span class="commission-label"> Commission a work</span><span class="commission-aside">${mn?`From ${money(mn)}`:'Request details'} <span aria-hidden="true">→</span></span></button></div>`:'';
 const editor=isOwner&&!editing?`<div class="profile-owner-bar"><span>YOUR STUDIO</span><button class="mini-button" data-action="edit-profile">${icon('pencil')} Edit profile</button><button class="mini-button" data-action="edit-listings">◫ Listings</button><button class="mini-button" data-action="edit-commissions"> Commissions</button><button class="mini-button" data-artist-tab="insights"> Artwork views</button><button class="mini-button" data-action="account-menu"> Account</button></div>`:'';
 $('#artist-main').innerHTML=`${designToolbar('artist',raw.id)}<button class="artist-back" data-page="${state.lastPage==='artist'?'discover':clean(state.lastPage)}">← Back</button>
 <div class="profile-banner theme-${clean(theme)} ${a.archive?'archive-cover':''}" ${a.archive&&aw.find(w=>w.image)?`style="--archive-art:url('${clean(aw.find(w=>w.image).image)}')"`:''}>${a.archive?`<div class="archive-cover-type"><span>OFFFRAME / ART HISTORY</span><strong>${clean(a.style)}</strong><small>${clean(a.era||'HISTORIC ARTIST')} · ${clean(a.region||'')}</small></div>`:''}</div>
 <div class="profile-heading"><div class="profile-avatar">${clean(a.name.split(' ').map(x=>x[0]).join('').slice(0,2))}</div>
 <div class="profile-title"><h1><span ${editing?editable('name',75):''}>${clean(a.name)}</span> ${a.archive?'<span class="historical-badge">HISTORIC ARTIST</span>':''}</h1>
 <div class="handle">${clean(a.handle)} · <span ${editing?editable('style',80):''}>${clean(a.style)}</span></div>
 <div class="profile-intro" ${editing?editable('bio',260):''}>${clean(a.bio)}</div>
 ${a.archive?`<div class="profile-archive-facts"><div><strong>${clean(a.era||'Historic')}</strong><span>Artist's lifetime</span></div><div><strong>${aw.length}</strong><span>Museum records indexed</span></div></div>`:`<div class="profile-social-stats"><div><strong>${followers}</strong><span>Followers</span></div><div><strong>${likes}</strong><span>Likes</span></div></div>`}
 <div class="profile-main-actions">${followButton}<button class="profile-main-btn secondary" data-action="share-profile">${icon('share')} Share</button></div>
 ${commTop}${editor}</div></div>
 <div class="profile-meta"><span> <span ${editing?editable('location',90):''}>${clean(a.location)}</span></span><span>${a.archive?'Museum archive':clean(a.links||'Artist profile')}</span><span>${aw.length} works</span></div>
 <div class="profile-tabs"><button class="${tab==='overview'?'active':''}" data-artist-tab="overview">Overview</button><button class="${tab==='works'?'active':''}" data-artist-tab="works">Works (${aw.length})</button><button class="${tab==='collections'?'active':''}" data-artist-tab="collections">Collections</button>${marketReady(a)?`<button class="${tab==='market'?'active':''}" data-artist-tab="market">Market${demoSalesFor(a.id).length?' · preview':''}</button>`:''}${a.archive?'':`<button class="${tab==='posts'?'active':''}" data-artist-tab="posts">Posts</button>`}<button class="${tab==='about'?'active':''}" data-artist-tab="about">About</button>${isOwner?`<button class="${tab==='insights'?'active':''}" data-artist-tab="insights">Insights</button>`:''}</div>
 <div class="profile-tab-content">${content}</div>`;
 applyDesign('artist',raw.id);
 setTimeout(()=>{observePostViews();observeArtworkViews()},80);
}
function renderSaved(){let tab=state.savedTab;const inFav=state.favorites.filter(x=>byId(x));let likeWorks=state.liked.filter(x=>byId(x));let favMarkup=inFav.length?`<div class="art-grid">${inFav.map(id=>savedTile(byId(id))).join('')}</div>`:`<div class="saved-empty"><strong>Nothing saved yet.</strong>Find a piece that stays with you and tap Favorites to add it to this space or a collection.</div>`;
 const collectionCards=Object.entries(state.collections).map(([name,ids])=>`<button class="collection-card" data-collection-view="${clean(name)}"><div class="collection-cover">${ids.length&&byId(ids[0])?.image?`<img style="height:100%;width:100%;object-fit:cover" src="${clean(byId(ids[0]).image)}" alt="">`:''}</div><div class="collection-info"><strong>${clean(name)}</strong><span>${ids.length} saved works →</span></div></button>`).join('');
 $('#saved-main').innerHTML=`<div class="saved-hero"><span class="eyebrow rose">THE THINGS THAT STAY WITH YOU</span><h1>Your own little <em>museum.</em></h1><p>Favorites, visual rabbit holes, and galleries only you could have made.</p></div><div class="saved-header"><div class="saved-tabs"><button class="${tab==='favorites'?'active':''}" data-saved-tab="favorites">Favorites (${inFav.length})</button><button class="${tab==='collections'?'active':''}" data-saved-tab="collections">Collections</button><button class="${tab==='likes'?'active':''}" data-saved-tab="likes">Likes (${likeWorks.length})</button></div><button class="pill outline" data-action="new-collection">+ New collection</button></div>${tab==='favorites'?favMarkup:tab==='collections'?`<div class="collection-grid">${collectionCards}</div>`:likeWorks.length?`<div class="art-grid">${likeWorks.map(id=>savedTile(byId(id))).join('')}</div>`:`<div class="saved-empty"><strong>No liked artworks yet.</strong>Explore artists and tap the heart on work that catches your eye.</div>`}`;}
function savedTile(w){return `<div class="art-tile" data-work-impression="${w.id}">${imageMarkup(w)}<div class="tile-body"><strong>${clean(w.title)}</strong><span>${clean(artists[w.artist].name)}</span><div class="tile-actions"><button data-artist="${w.artist}">View artist →</button><button data-favorite="${w.id}">+ Collect</button></div>${canBuy(w)?`<button class="buy-art-button" data-buy="${w.id}">Buy · ${money(w.askingPrice)} →</button>`:''}</div></div>`}
function viewCollection(name){const ids=state.collections[name]||[];setModal(`<span class="eyebrow rose">YOUR COLLECTION</span><h2>${clean(name)}</h2><p>${ids.length} saved artwork${ids.length===1?'':'s'}. Your little corner of the museum.</p><div class="modal-list">${ids.length?ids.map(id=>{const w=byId(id);return w?`<button data-artist="${w.artist}"><span>${clean(w.title)}</span><small>${clean(artists[w.artist].name)}</small></button>`:''}).join(''):'<p>No artworks in this collection yet.</p>'}</div>`)}
function openComments(id,post=false){
 const sheet=$('#comment-sheet'),target=$('#comment-sheet-content');
 if(!sheet||!target)return;
 const item=post?[...state.posts,...demoPosts].find(x=>x.id===id):byId(id);
 const key=(post?'p:':'w:')+id;
 const comments=state.comments[key]||[];
 const name=post?(item?.name||'Community post'):(artists[item?.artist]?.name||'Artist');
 const artwork=post?(item?.title||'Community conversation'):(item?.title||'Artwork');
 target.innerHTML=`<div class="comment-handle" aria-hidden="true"></div><header class="comment-sheet-header"><div><span class="eyebrow">THE CONVERSATION</span><h2>${comments.length} ${comments.length===1?'comment':'comments'}</h2></div><button type="button" data-action="close-comments" class="comment-close" aria-label="Close comments">${icon('close')}</button></header>
 <div class="comment-context"><strong>${clean(artwork)}</strong><span>by ${clean(name)}</span></div>
 <div class="comment-list" id="comment-list">${comments.length?comments.map(x=>`<div class="comment-item"><div class="comment-avatar">Y</div><div><strong>You <small>local preview</small></strong><p>${clean(x)}</p></div></div>`).join(''):'<div class="comment-empty"><h3>Start the conversation.</h3><p>What does this work make you feel?</p></div>'}</div>
 <form id="inline-comment-form" class="comment-compose"><label class="sr-only" for="comment-message">Add a comment</label><input id="comment-message" name="body" maxlength="600" autocomplete="off" placeholder="Add a comment…" required><button type="submit">Post ${icon('arrow')}</button></form><p class="comment-disclaimer">Comments are saved only in your browser for this preview.</p>`;
 sheet.classList.add('open');sheet.setAttribute('aria-hidden','false');
 $('#inline-comment-form').addEventListener('submit',e=>{
  e.preventDefault();let body=new FormData(e.target).get('body').trim();if(!body)return;
  state.comments[key]=[...(state.comments[key]||[]),body];save('comments');openComments(id,post);
  const list=$('#comment-list');list.scrollTop=list.scrollHeight;$('#comment-message').focus();
 });
}
function closeComments(){const sheet=$('#comment-sheet');sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');}

function composeModal(group=state.page==='group'?state.group:'soft',prefill=''){setModal(`<span class="eyebrow rose">POST TO YOUR CORNER OF THE INTERNET</span><h2>Share something.</h2><p>Notes, art, work in progress, or the thing you can't stop thinking about. Reposts should credit the original creator.</p><form id="compose-form"><label>Community<select name="group" style="display:block;background:#17171d;color:white;width:100%;padding:12px;border:1px solid #554b59;border-radius:10px;margin:8px 0">${groups.map(g=>`<option value="${g.id}" ${g.id===group?'selected':''}>${g.name}</option>`).join('')}</select></label><label>Your post<textarea name="text" maxlength="900" required placeholder="Something you want to share...">${clean(prefill)}</textarea></label><button class="submit-btn">Save local draft →</button></form><p class="callout" style="margin-top:16px">This is a concept demo. Posts are only visible in this browser, not published to other people.</p>`);$('#compose-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),body=f.get('text').trim();if(!body)return;const creator=state.account?.role==='creator';const artist=creator?artists[state.account.artistId]:null;state.posts.push({id:'my'+Date.now(),group:f.get('group'),artistId:artist?.id||null,name:artist?.name||'You',user:artist?artist.handle.replace(/^@/,''):'you',avatar:artist?artist.name.slice(0,1).toUpperCase():'Y',tone:'sun',when:'just now',title:'',body,image:'',tags:['my post'],reblog:null});save('posts');closeModal();toast('Draft saved on this device');if(state.page==='group')renderGroup();else if(state.page==='artist')renderArtist();else{state.communityTab='for-you';markPage('community')}})}
function joinModal(){setModal(`<span class="eyebrow rose">BE HERE FROM THE BEGINNING</span><h2>Artists will make this place.</h2><p>Get a personalized page with artwork collections, your story, and eventually a verified market and community presence.</p><form id="join-form"><label>Artist name<input name="name" required maxlength="80" placeholder="How should your profile appear?"></label><label>Your city<input name="city" placeholder="City or region"></label><label>Portfolio or social link<input name="link" placeholder="https://..."></label><button class="submit-btn">Save profile draft →</button></form><p class="callout" style="margin-top:16px">This demo saves a draft in local storage. It does not submit an application.</p>`);$('#join-form').addEventListener('submit',e=>{e.preventDefault();put('artistDraft',Object.fromEntries(new FormData(e.target)));closeModal();toast('Artist draft saved locally — not submitted')})}
function shareProfile(){
 const a=artists[state.artist];const url=new URL(window.location.href);url.hash='artist/'+encodeURIComponent(a.id);
 setModal(`<span class="eyebrow rose">SHARE AN ARTIST</span><h2>Send someone a good discovery.</h2><p>Share ${clean(a.name)}'s artist profile with another art lover. The link points to this prototype until the website is published.</p><label>Artist profile link<input id="share-profile-url" readonly value="${clean(url.href)}"></label><button class="submit-btn" data-action="copy-profile-link">Copy profile link →</button><p class="callout" style="margin-top:18px">A local file link will only open on a device that already has this prototype. Once published, this becomes a regular shareable artist URL.</p>`);
} 
let authMode='signin';
function renderAuthModal(){
 const signingUp=authMode==='signup';
 setModal(`<div class="auth-layout">
   <div class="auth-art-panel">
    <div class="auth-art-top"><span class="auth-brand">◒ &nbsp;offframe<span>.</span></span><span class="auth-art-tag">ART FOR THE CURIOUS</span></div>
    <div class="auth-art-img"><img src="${asset('portrait-original.jpg')}" alt="Expressive contemporary portrait painting"></div>
    <div class="auth-art-copy"><span class="eyebrow">COME FOR THE ART. STAY FOR THE PEOPLE.</span><h3>Find art that<br><em>feels like you.</em></h3><p>Discover artists, build a collection and make a home for your creativity.</p></div>
   </div>
   <div class="auth-main-panel">
    <div class="auth-eyebrow">YOUR CREATIVE UNIVERSE <span class="auth-preview-chip">CONCEPT PREVIEW</span></div>
    <h2>${signingUp?'Find your people.':'Welcome back.'}</h2>
    <p class="auth-subtitle">${signingUp?'Create a home for your favorites, collections, and work.':'Good to have you here. Your next favorite artist is waiting.'}</p>
    <div class="auth-oauth-row"><button class="auth-provider" data-action="auth-provider"><span class="auth-provider-icon">G</span> Continue with Google</button><button class="auth-provider" data-action="auth-provider"><span class="auth-provider-icon apple-mark">●</span> Continue with Apple</button></div>
    <div class="auth-divider"><span>OR WITH EMAIL</span></div>
    <form id="auth-form" class="auth-form"><label>Email address<input type="email" placeholder="you@example.com" name="email" autocomplete="email" required></label><button class="auth-submit" type="submit">${signingUp?'Create account':'Continue with email'} <span>→</span></button></form>
    <p class="auth-toggle">${signingUp?'Already have an account?':'New to Offframe?'} <button data-action="auth-switch">${signingUp?'Sign in':'Create an account'}</button></p>
    <div class="auth-demo-strip"><div><span class="auth-demo-dot"></span><strong>Take a look around</strong><small>Use a preview account — no password needed.</small></div><div class="auth-demo-actions"><button data-action="demo-creator">Try artist studio →</button><button data-action="demo-collector">Try collector view</button><button data-action="demo-community">Try community studio</button></div></div>
    <p class="auth-disclaimer">Design preview only. Email and social sign-in aren't connected. Preview accounts save changes on this device, not to a server.</p>
   </div>
 </div>`);
 const form=$('#auth-form');form.addEventListener('submit',e=>{e.preventDefault();toast('Email sign-in is not connected yet — try a preview account below.');});
}
function accountModal(){
 if(!state.account){renderAuthModal();return}
 if(state.account.role==='community'){setModal(`<span class="eyebrow rose">MY COMMUNITY</span><h2>Community studio</h2><p>Customize this Tumblr-inspired creative space, from its banner to its body typography.</p><div class="modal-list"><button data-action="my-community">Open community →</button><button data-action="open-community-editor"> Customize community →</button><button data-action="sign-out">Sign out of preview →</button></div>`);return}
 const creator=state.account.role==='creator';setModal(`<span class="eyebrow rose">MY ACCOUNT</span><h2>${creator?clean(artists[state.account.artistId].name):'Collector account'}</h2><p>${creator?'Manage your public studio, edit your presentation and see private post analytics.':'Your favorites, collections and the artists you follow.'}</p><div class="modal-list">${creator?`<button data-action="my-studio"><span> My studio</span><small>Profile →</small></button><button data-action="account-edit"><span> Edit my profile</span><small>Edit →</small></button><button data-action="account-insights"><span> Private artwork & post views</span><small>Views →</small></button><button data-action="edit-listings"><span> Manage artwork listings</span><small>Prices →</small></button><button data-action="edit-commissions"><span> Commission offerings</span><small>Set rates →</small></button><button data-action="orders"><span> Sales and orders</span><small>Preview →</small></button>`:`<button data-page="saved"><span>Like &nbsp; My collections</span><small>Open →</small></button><button data-action="orders"><span> My purchases</span><small>Preview →</small></button>`}<button data-action="sign-out"><span>↩ &nbsp; Sign out of preview</span><small>Local only</small></button></div><p class="callout" style="margin-top:16px">This is a role preview. Data is saved to this browser, not to a server.</p>`)
}
function previewSignIn(role){state.account=role==='creator'?{role:'creator',artistId:'nia'}:role==='community'?{role:'community',groupId:'soft'}:{role:'collector'};save('account');closeModal();updateAccountUI();if(role==='creator'){openArtist('nia');toast('Your studio is ready to edit')}else if(role==='community'){openGroup('soft');toast('Open Customize community to design this page')}else{markPage('me');toast('Your collector profile is ready')}}
// MARKETPLACE: this preview never takes real money. A server-signed paid event must
// create the production sale/price record; clicks in this browser are demo-only.
function checkoutModal(id){
 const w=byId(id);if(!canBuy(w))return toast('This artwork is not currently available to buy');
 const artist=artists[w.artist];
 setModal(`<span class="eyebrow rose">BUY ORIGINAL ART</span><h2>Make it yours.</h2><div class="checkout-art">${imageMarkup(w)}<div><strong>${clean(w.title)}</strong><span>${clean(artist.name)}</span><span>${clean(w.medium)} · ${clean(w.year)}</span><strong class="checkout-price">${money(w.askingPrice)}</strong></div></div>
 <div class="checkout-rows"><div><span>Artwork</span><strong>${money(w.askingPrice)}</strong></div><div><span>Shipping and taxes</span><strong>Calculated at live checkout</strong></div><div class="total"><span>Artwork subtotal</span><strong>${money(w.askingPrice)}</strong></div></div>
 <div class="checkout-note"><strong>Checkout preview — no payment is collected.</strong><p>This artist and listing are illustrative. The next step simulates an order on this device so you can test sold inventory and market history. Real purchasing will use Stripe Checkout and verified seller onboarding.</p></div>
 <form id="demo-checkout"><label class="demo-confirm"><input type="checkbox" name="confirm" required> I understand this is a simulated purchase, not an actual order.</label><button class="submit-btn">Complete demo purchase →</button></form>`);
 $('#demo-checkout').addEventListener('submit',e=>{e.preventDefault();if(!canBuy(w))return toast('Already sold in this browser');
  const order={id:'demo_'+Date.now().toString(36),workId:w.id,artistId:w.artist,amount:w.askingPrice,currency:'USD',createdAt:new Date().toISOString(),status:'demo_complete'};
  state.demoOrders.push(order);save('demoOrders');renderArtist();renderFeed();
  setModal(`<span class="eyebrow rose">CHECKOUT PREVIEW COMPLETE</span><h2>Artwork reserved — in this demo.</h2><p><strong>${clean(w.title)}</strong> is now shown as sold in this browser. No money moved and no real order was placed.</p><div class="checkout-receipt"><span>DEMO ORDER</span><strong>${clean(order.id)}</strong><div>Artwork price <b>${money(order.amount)}</b></div><div>Payment <b>Simulated only</b></div></div><div class="modal-list"><button data-action="show-purchase-market" data-item="${w.artist}"><span>View market history</span><small>Demo →</small></button><button data-action="orders"><span>My purchases and sales</span><small>Preview →</small></button></div>`);
  toast('Demo purchase recorded — not a real sale');
 });
}
function ordersModal(){
 const orders=[...state.demoOrders].reverse();setModal(`<span class="eyebrow rose">ORDER ACTIVITY · LOCAL PREVIEW</span><h2>Purchases and sales.</h2><p>These are simulated checkouts saved on this device. They do not involve real buyers, money, shipping or verified transactions.</p><div class="modal-list">${orders.length?orders.map(o=>{const w=byId(o.workId);return `<button data-artist="${o.artistId}"><span>${clean(w?.title||'Artwork')}<br><small>${clean(artists[o.artistId]?.name||'Artist')} · ${clean(o.id)}</small></span><small>${money(o.amount)} · Demo →</small></button>`}).join(''):'<div class="callout">No demo purchases yet. Open an available artwork and select Buy to try the checkout.</div>'}</div>`)
}
function editListingsModal(){
 if(state.account?.role!=='creator')return toast('Sign in as the artist to manage listings');
 const id=state.account.artistId,ws=artistWorks(id).filter(w=>!artists[w.artist].archive);
 setModal(`<span class="eyebrow rose">MY STUDIO · STORE FRONT</span><h2>Artwork listings.</h2><p>Choose which works can be bought and set asking prices. A real purchase would require a verified seller account and server-managed inventory.</p><form id="listings-form" class="profile-form listings-form">${ws.map(w=>`<div class="listing-editor-row"><div>${imageMarkup(w)}<div><strong>${clean(w.title)}</strong><small>${soldPreview(w)?'Sold in this demo · cannot relist':''}</small></div></div><label>Asking price (USD)<input type="number" step="1" min="1" max="10000000" name="price_${w.id}" value="${Number.isFinite(w.askingPrice)?w.askingPrice:''}" ${soldPreview(w)?'disabled':''} placeholder="Not for sale"></label><label class="check-line"><input type="checkbox" name="available_${w.id}" ${w.available&&!soldPreview(w)?'checked':''} ${soldPreview(w)?'disabled':''}> Available for purchase</label></div>`).join('')}<button class="submit-btn">Save artwork listings →</button></form>`);
 $('#listings-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);for(const w of ws){if(soldPreview(w))continue;const raw=f.get('price_'+w.id),amount=raw===''||raw===null?null:Number(raw);if(amount!==null&&(!Number.isInteger(amount)||amount<1||amount>10000000))return toast('Use whole-dollar prices from $1 to $10,000,000');const active=f.has('available_'+w.id);if(active&&amount===null)return toast('Add a price to any artwork offered for sale');state.listingOverrides[w.id]={askingPrice:amount,available:active};w.askingPrice=amount;w.available=active;}save('listingOverrides');closeModal();renderArtist();toast('Listings saved locally')});
}
function editCommissionsModal(){
 if(state.account?.role!=='creator')return toast('Sign in as the artist to manage commissions');
 const a=artists[state.account.artistId],existing=commissionFor(a.id),options=[...existing.options];while(options.length<3)options.push({type:'',min:'',max:'',medium:'',style:'',timeline:''});
 setModal(`<span class="eyebrow rose">MY STUDIO · CUSTOM ORDERS</span><h2>Commission settings.</h2><p>Decide whether you accept requests, what you make, your indicative rates and how long the work usually takes. Customers will contact you through their own email client.</p><form id="commissions-form" class="profile-form commission-form"><label class="check-line"><input type="checkbox" name="enabled" ${existing.enabled?'checked':''}> Accept commission inquiries on my profile</label><label>Contact email (artist only)<input name="email" type="email" autocomplete="email" maxlength="150" value="${clean(existing.email||'')}" placeholder="you@studio.com"><small>This email will be visible in a requester's mailto draft. It is not sent to a server in the preview.</small></label><div class="commission-editor-intro">COMMISSION OFFERINGS · UP TO THREE</div>${options.map((o,i)=>`<fieldset class="commission-editor-option"><legend>Offering ${i+1}</legend><label>Type / project name<input name="type_${i}" maxlength="80" value="${clean(o.type||'')}" placeholder="e.g. Portrait painting"></label><div class="comm-form-two"><label>Starting price ($)<input name="min_${i}" type="number" min="1" max="10000000" step="1" value="${o.min||''}" placeholder="350"></label><label>Up to ($)<input name="max_${i}" type="number" min="1" max="10000000" step="1" value="${o.max||''}" placeholder="1200"></label></div><label>Style<input name="style_${i}" maxlength="100" value="${clean(o.style||'')}" placeholder="Expressive portraiture"></label><label>Medium / material<input name="medium_${i}" maxlength="100" value="${clean(o.medium||'')}" placeholder="Oil on canvas"></label><label>Estimated timeline<input name="timeline_${i}" maxlength="80" value="${clean(o.timeline||'')}" placeholder="4–6 weeks"></label></fieldset>`).join('')}<button class="submit-btn">Save commission offerings →</button></form>`);
 $('#commissions-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),email=String(f.get('email')||'').trim();if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return toast('Enter a valid contact email');const opts=[];
  for(let i=0;i<3;i++){const type=String(f.get('type_'+i)||'').trim();if(!type)continue;const min=Number(f.get('min_'+i)),max=Number(f.get('max_'+i));if(!Number.isInteger(min)||!Number.isInteger(max)||min<1||max<min||max>10000000)return toast('Check the price range for offering '+(i+1));const timeline=String(f.get('timeline_'+i)||'').trim();if(!timeline)return toast('Add an expected timeline for offering '+(i+1));opts.push({id:'c'+i,type,min,max,style:String(f.get('style_'+i)||'').trim(),medium:String(f.get('medium_'+i)||'').trim(),timeline})}
  if(f.has('enabled')&&!opts.length)return toast('Add at least one commission type before enabling');state.commissionSettings[a.id]={enabled:f.has('enabled'),email,options:opts};save('commissionSettings');closeModal();openArtist(a.id);toast('Commission preferences saved locally');
 });
}
function commissionModal(id){
 const a=artists[id],setting=commissionFor(id);if(!a||a.archive||!setting.enabled||!setting.options.length)return toast('Commission inquiries are not available for this artist');
 setModal(`<span class="eyebrow rose">CREATE SOMETHING TOGETHER</span><h2>Commission ${clean(a.name)}.</h2><p>Choose the type of work that interests you. Prices and timeframes are estimates set by the artist, not guaranteed quotes.</p><div class="commission-offerings">${setting.options.map((o,i)=>`<label class="commission-offer"><input type="radio" name="commission-choice" value="${i}" ${i===0?'checked':''}><div><strong>${clean(o.type)}</strong><span>${clean(o.style)} · ${clean(o.medium)}</span><small>Typical timeline: ${clean(o.timeline)}</small></div><b>${money(o.min)}–${money(o.max)}</b></label>`).join('')}</div><form id="commission-inquiry-form" class="commission-inquiry-form"><div class="comm-form-two"><label>Your name<input name="name" maxlength="90" required placeholder="Name"></label><label>Your email<input name="email" type="email" maxlength="150" required placeholder="you@example.com"></label></div><label>Describe what you have in mind<textarea name="brief" maxlength="1200" required placeholder="Subject, size, inspiration, colors, and anything important..." style="min-height:78px"></textarea></label><div class="comm-form-two"><label>Your budget ($)<input name="budget" type="number" min="1" max="10000000" placeholder="Optional"></label><label>Desired completion date<input name="due" type="date"></label></div><button class="submit-btn">${setting.email?'Prepare email inquiry':'Prepare inquiry draft'} →</button></form><p class="callout">No requests are sent by Offframe in this prototype. ${setting.email?'You can open a prefilled email to the artist after reviewing the draft.':'This artist has not added a contact email, so you can copy your inquiry to send elsewhere.'}</p>`);
 $('#commission-inquiry-form').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),i=Number($('input[name="commission-choice"]:checked').value),o=setting.options[i];if(!o)return;
  const body=`Hi ${a.name},\n\nI'd love to ask about commissioning a work.\n\nProject type: ${o.type}\nStyle: ${o.style}\nMedium: ${o.medium}\nIndicative price range: ${money(o.min)}–${money(o.max)}\nTypical timeline: ${o.timeline}\n\nMy idea:\n${f.get('brief')}\n\nMy budget: ${f.get('budget')?money(f.get('budget')):'Open to discussion'}\nTarget completion: ${f.get('due')||'Flexible'}\n\nMy name: ${f.get('name')}\nReply to: ${f.get('email')}\n\nThanks!`;
  const subject=`Offframe commission inquiry — ${o.type}`;
  const href=setting.email?'mailto:'+encodeURIComponent(setting.email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body):'';
  const draft=subject+'\n\n'+body;
  setModal(`<span class="eyebrow rose">YOUR COMMISSION INQUIRY</span><h2>Ready when you are.</h2><p>Review your draft before contacting ${clean(a.name)}. Offframe has not sent anything and will not store this inquiry.</p><textarea class="inquiry-draft" readonly>${clean(draft)}</textarea><div class="inquiry-actions">${href?`<a class="submit-btn" href="${clean(href)}">Open email draft →</a>`:''}<button class="profile-main-btn secondary" data-action="copy-inquiry">Copy message</button></div><div class="callout">${href?'Your email app will open with a prefilled draft; sending is your choice.':'To email the artist directly, they must first add a contact email in their commission settings.'}</div>`);
  window.offframeLastInquiry=draft;
 });
}
function openStudio(tab='overview'){if(state.account?.role!=='creator')return accountModal();closeModal();state.artist=state.account.artistId;state.lastPage='discover';state.artistTab=tab;markPage('artist')}
function observeArtworkViews(){
 if(typeof IntersectionObserver==='undefined')return;
 if(observeArtworkViews.io)observeArtworkViews.io.disconnect();
 const cards=$$('.page.is-active [data-work-impression]');
 if(!cards.length)return;
 observeArtworkViews.io=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting || entry.intersectionRatio<.52)continue;
   const id=entry.target.dataset.workImpression,w=byId(id);
   if(!w||artists[w.artist]?.archive||ownerOf(w.artist)){observeArtworkViews.io.unobserve(entry.target);continue}
   const key='offframe_v6_viewed_'+id;
   if(!observeArtworkViews.seen)observeArtworkViews.seen=new Set();
   let already=observeArtworkViews.seen.has(key);
   try{already=already||sessionStorage.getItem(key)==='1'}catch{}
   if(!already){
    observeArtworkViews.seen.add(key);try{sessionStorage.setItem(key,'1')}catch{}
    state.artworkViews[id]=(state.artworkViews[id]||0)+1;save('artworkViews');
   }
   observeArtworkViews.io.unobserve(entry.target);
  }
 },{threshold:[.52,.75]});
 cards.forEach(card=>observeArtworkViews.io.observe(card));
}
function myProfile(){
 if(!state.account){renderAuthModal();return}
 closeModal();
 if(state.account.role==='creator'){state.artist=state.account.artistId;state.artistTab='overview';state.lastPage='me';markPage('artist');return}
 if(state.account.role==='community'){openGroup(state.account.groupId);return}
 markPage('me');
}
function editCollectorModal(){
 if(state.account?.role!=='collector')return;
 const p=state.collectorProfile;
 setModal(`<span class="eyebrow rose">MAKE IT YOURS</span><h2>Edit your collector profile.</h2><p>Tell other people about the art you love. This design preview only saves your changes locally.</p><form id="collector-edit-form"><label>Display name<input name="name" maxlength="70" value="${clean(p.name)}" required></label><label>Your handle<input name="handle" maxlength="34" value="${clean(p.handle)}" required></label><label>About you<textarea name="bio" maxlength="350">${clean(p.bio)}</textarea></label><button class="submit-btn" type="submit">Save profile →</button></form>`);
 $('#collector-edit-form').addEventListener('submit',e=>{
  e.preventDefault();const f=new FormData(e.currentTarget),name=String(f.get('name')||'').trim(),handle=String(f.get('handle')||'').trim().replace(/^@*/,''),bio=String(f.get('bio')||'').trim();
  if(!name||!handle||!/^[-_a-zA-Z0-9]{2,32}$/.test(handle))return toast('Use a name and a handle with 2–32 letters, numbers, dashes or underscores');
  state.collectorProfile={name,handle:'@'+handle,bio};save('collectorProfile');closeModal();renderMe();toast('Profile saved locally');
 });
}
function renderMe(){
 if(state.account?.role!=='collector'){myProfile();return}
 const p=state.collectorProfile,favorites=state.favorites.filter(id=>byId(id));
 const follows=state.following.filter(id=>artists[id]&&!artists[id].archive);
 const gallery=favorites.slice(-6).reverse().map(id=>{const w=byId(id);return `<button class="me-art" data-artist="${w.artist}">${imageMarkup(w)}<span>${clean(w.title)}</span></button>`}).join('');
 $('#me-main').innerHTML=`<div class="me-cover"><div class="me-cover-orbit"></div><span>OFFFRAME · YOUR PERSONAL SPACE</span></div>
 <div class="me-identity"><div class="me-avatar">${clean(p.name.slice(0,1).toUpperCase())}</div><div class="me-copy"><span class="eyebrow rose">YOUR PROFILE · COLLECTOR</span><h1>${clean(p.name)}</h1><span>${clean(p.handle)}</span><p>${clean(p.bio||'A corner for the art you love.')}</p></div></div>
 <div class="me-metrics"><div><strong>${favorites.length}</strong><span>Saved artworks</span></div><div><strong>${follows.length}</strong><span>Followed artists</span></div><div><strong>${Object.keys(state.collections).length}</strong><span>Collections</span></div></div>
 <div class="me-actions"><button data-action="edit-collector" class="profile-main-btn primary">${icon('pencil')} Edit profile</button><button data-action="account-menu" class="profile-main-btn secondary"> Account & sign out</button></div>
 <div class="me-section"><div class="artist-section-lead"><h2>Your art collection</h2><button class="pill outline" data-page="saved">See all favorites →</button></div>${gallery?`<div class="me-gallery">${gallery}</div>`:'<div class="saved-empty"><strong>A beautiful blank canvas.</strong>Save artwork from Explore to start building your collection.</div>'}</div>
 <div class="me-section"><div class="artist-section-lead"><h2>Artists you follow</h2></div>${follows.length?`<div class="me-following">${follows.map(id=>`<button data-artist="${id}">${clean(artists[id].name)} <span>→</span></button>`).join('')}</div>`:'<div class="saved-empty">Discover and follow artists to see them here.</div>'}</div><div class="notice-panel">This is your local collector profile preview, not a published account.</div>`;
}
function observePostViews(){
 if(typeof IntersectionObserver==='undefined')return;
 if(observePostViews.io)observePostViews.io.disconnect();
 observePostViews.io=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const id=entry.target.dataset.post;
  const post=state.posts.find(p=>p.id===id);if(!post?.artistId||ownerOf(post.artistId))continue;
  const key='offframe_v3_view_'+id;
  if(!observePostViews.seen)observePostViews.seen=new Set();
  let wasSeen=observePostViews.seen.has(key);
  try{wasSeen=wasSeen||sessionStorage.getItem(key)==='1'}catch{}
  if(wasSeen)continue;observePostViews.seen.add(key);try{sessionStorage.setItem(key,'1')}catch{}
  state.postViews[id]=(state.postViews[id]||0)+1;save('postViews');
  observePostViews.io.unobserve(entry.target);
 }},{threshold:.45});
 $$('.page.is-active .post-card[data-post]').forEach(el=>observePostViews.io.observe(el));
}
function openInfo(){setModal(`<span class="eyebrow rose">AN OPEN CREATIVE UNIVERSE</span><h2>Art should travel. Artists shouldn't disappear.</h2><p>Offframe is an art-first social network concept with vertical discovery, personal collections, persistent communities, creator attribution, and a future verified market. Artwork buying is a simulated local flow in this version.</p><p>General posts remain open; special verification is for authorship claims and selling. Museum artists are archived records, not claimed accounts.</p><p>This interactive demo uses illustrative images and local browser storage. No real social membership or sales are operating.</p>`)}
function handleClick(e){
 const detailButton=e.target.closest('[data-overlay-expand]');
 if(detailButton){expandFeedDetails(detailButton.dataset.overlayExpand);return;}
 const touchedSlide=e.target.closest('.swipe-slide');
 if(touchedSlide&&!e.target.closest('button,a,input,select,textarea,[role=button]')){
  if(Date.now()>=feedOverlay.suppressClickUntil&&touchedSlide.dataset.galleryKey===feedOverlay.activeKey)collapseFeedDetails();
  return;
 }
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.page){closeModal();markPage(d.page);return}
 if(d.feed){closeModal();switchFeed(d.feed);return}
 if(d.artist){closeModal();openArtist(d.artist);return}
 if(d.group){closeModal();openGroup(d.group);return}
 if(d.mood){state.mood=d.mood;switchFeed('all');toast('Exploring '+d.mood+' art');return}
 if(d.like){toggleLike(d.like);return}
 if(d.favorite){favoritesModal(d.favorite);return}
 if(d.comments){openComments(d.comments);return}
 if(d.postComments){openComments(d.postComments,true);return}
 if(d.likePost){const key='post:'+d.likePost;const idx=state.liked.indexOf(key);idx>=0?state.liked.splice(idx,1):state.liked.push(key);save('liked');if(state.page==='group')renderGroup();else renderCommunity();toast(idx>=0?'Post unliked':'Post liked');return}
 if(d.reblog){const post=[...demoPosts,...state.posts].find(p=>p.id===d.reblog);composeModal(post?.group||'soft',post?`Repost From @${post.user}: ${post.title||post.body.slice(0,80)}\n\n`:'' );return}
 if(d.less){state.showLess.push(d.less);save('showLess');renderFeed();toast('Showing less of this artist');return}
 if(d.prev||d.next){moveArtwork(d.prev||d.next,d.next?1:-1);return}
 if(d.follow){toggleFollowing(d.follow);return}
 if(d.buy){checkoutModal(d.buy);return}
 if(d.commission){commissionModal(d.commission);return}
 if(d.previewTheme){const field=$('#edit-profile-form [name=theme]');if(field){field.value=d.previewTheme;updateProfilePreview()}return}
 if(d.theme){if(!ownerOf(state.artist))return;state.themes[state.artist]=d.theme;save('themes');renderArtist();return}
 if(d.artistTab){if(d.artistTab==='insights'&&!ownerOf(state.artist))return;state.artistTab=d.artistTab;renderArtist();return}
 if(d.communityTab){state.communityTab=d.communityTab;if(d.communityTab!=='space')state.communityFocus='';renderCommunity();return}
 if(d.communitySpace){state.communityTab='space';state.communityFocus=d.communitySpace;renderCommunity();return}
 if(d.communityJoin){toggleCommunityJoin(d.communityJoin);return}
 if(d.groupTab){state.groupTab=d.groupTab;renderGroup();return}
 if(d.savedTab){state.savedTab=d.savedTab;renderSaved();return}
 if(d.collectionView){viewCollection(d.collectionView);return}
 if(d.addCollection){addToCollection(d.addCollection,d.item);return}
 if(d.joinGroup){toggleCommunityJoin(d.joinGroup);return}
 if(d.category){markPage('search');$('#search-term').value='';$('#search-style').value=archiveMovements.find(x=>x.name===d.category)?.name||'';$('#search-medium').value='';$('#search-mood').value='';renderSearch();return}
 if(d.tag){markPage('search');$('#search-style').value='';$('#search-medium').value='';$('#search-mood').value='';$('#search-term').value=d.tag;renderSearch();return}
 const act=d.action;
 if(act==='close'){closeModal();return}
 if(act==='account'){accountModal();return}
 if(act==='go-profile'){myProfile();return}
 if(act==='account-menu'){accountModal();return}
 if(act==='edit-collector'){editCollectorModal();return}
 if(act==='shuffle-community'){state.communityShuffle++;renderCommunity();return}
 if(act==='auth-switch'){authMode=authMode==='signin'?'signup':'signin';renderAuthModal();return}
 if(act==='auth-provider'){toast('Social sign-in is not connected in this concept preview. Use a demo account.');return}
 if(act==='demo-creator'){previewSignIn('creator');return}
 if(act==='demo-collector'){previewSignIn('collector');return}
 if(act==='demo-community'){previewSignIn('community');return}
 if(act==='my-community'){closeModal();openGroup('soft');return}
 if(act==='open-community-editor'){closeModal();openGroup('soft');startDesignEdit('group');return}
 if(act==='my-studio'){openStudio();return}
 if(act==='account-edit'){openStudio();startDesignEdit('artist');return}
 if(act==='account-insights'){openStudio('insights');return}
 if(act==='edit-listings'){editListingsModal();return}
 if(act==='edit-commissions'){editCommissionsModal();return}
 if(act==='orders'){ordersModal();return}
 if(act==='owner-profile-note'){toast('This is your public-facing artist profile');return}
 if(act==='show-purchase-market'){closeModal();state.artist=d.item;state.artistTab='market';markPage('artist');return}
 if(act==='copy-inquiry'){const txt=window.offframeLastInquiry||'';if(!txt)return;const el=$('.inquiry-draft');if(el){el.focus();el.select();}if(navigator.clipboard?.writeText)navigator.clipboard.writeText(txt).then(()=>toast('Commission inquiry copied')).catch(()=>toast('Select the draft text to copy'));else toast('Select the draft text to copy');return}
 if(act==='edit-profile'){startDesignEdit('artist');return}
 if(act==='edit-group'){startDesignEdit('group');return}
 if(act==='design-toggle'){const panel=b.closest('.live-design-toolbar');const open=panel.classList.toggle('controls-open');if(state.designSession)state.designSession.panelOpen=open;b.setAttribute('aria-expanded',String(open));b.textContent=open?' Hide design tools ↑':' Customize appearance ↓';return}
 if(act==='design-save'){saveDesignEdit();return}
 if(act==='design-cancel'){discardDesignEdit();return}
 if(d.designPreset){const preset=designPresets[d.designPreset];if(preset&&state.designSession){state.designSession.style={...state.designSession.style,...preset};state.designSession.style=validDesign(state.designSession.style);if(state.designSession.kind==='artist')renderArtist();else renderGroup();}return}
 if(d.designClear){changeDesignValue(d.designClear,'');return}
 if(act==='sign-out'){if(state.designSession)discardDesignEdit(true);state.account=null;save('account');closeModal();if(state.page==='me')markPage('discover');else{updateAccountUI();if(state.page==='artist')renderArtist();if(state.page==='group')renderGroup();}toast('Signed out of account preview');return}
 if(act==='archive-info'){setModal('<span class="eyebrow rose">HISTORIC ARTIST</span><h2>A museum archive, not an account.</h2><p>This profile shares historic artwork and artist information. It is not managed by the artist and is not a storefront.</p>');return}
 if(act==='join'){joinModal();return}
 if(act==='mood-picker'){setModal(`<span class="eyebrow rose">TUNE YOUR TASTE</span><h2>What are you in the mood for?</h2><div class="modal-list">${moods.map(m=>`<button data-mood="${m.name}"><span>${m.symbol} &nbsp; ${m.name}</span><small>${m.hint} →</small></button>`).join('')}<button data-action="all-moods">All moods <small>Reset</small></button></div>`);return}
 if(act==='all-moods'){state.mood='';closeModal();switchFeed('all');return}
 if(act==='compose'){composeModal();return}
 if(act==='new-collection'){newCollectionModal(d.item||'');return}
 if(act==='share-profile'){shareProfile();return}
 if(act==='copy-profile-link'){const field=$('#share-profile-url');if(!field)return;field.select();if(navigator.clipboard?.writeText)navigator.clipboard.writeText(field.value).then(()=>toast('Artist profile link copied')).catch(()=>toast('Select the link to copy'));else toast('Select the link to copy');return}
 if(act==='reset-less'){state.showLess=[];save('showLess');state.mood='';renderFeed();return}
 if(act==='info'){openInfo();return}
 if(act==='close-comments'){closeComments();return}
}
document.addEventListener('input',e=>{if(e.target.matches('[data-design-color]'))changeDesignValue(e.target.dataset.designColor,e.target.value);if(e.target.matches('[data-design-choice]'))changeDesignValue(e.target.dataset.designChoice,e.target.value);onInlineInput(e)});
document.addEventListener('change',async e=>{const input=e.target;if(input.id==='community-selector'){if(input.value&&state.joined.includes(input.value)){state.communityFocus=input.value;state.communityTab='space'}else{state.communityFocus='';state.communityTab='for-you'}renderCommunity();return}if(!input.matches('[data-design-upload]'))return;const ds=state.designSession;if(!ds||!input.files?.[0])return;const kind=ds.kind,id=ds.id,role=input.dataset.designUpload;try{const img=await imageData(input.files[0],role);if(!state.designSession||state.designSession.id!==id||state.designSession.kind!==kind)return;changeDesignValue(role,img);toast('Image loaded into your live design')}catch(err){toast(err.message||'Unable to process this image')}finally{input.value=''}});
document.addEventListener('paste',pasteInlinePlain);

// Horizontal image swipes within each vertical artist card; buttons and vertical scrolling are unaffected.
const swipeFeed=$('#swipe-feed');let gesture=null;swipeFeed.addEventListener('scroll',scheduleFocusedSlide,{passive:true});
function suspendOverlaySync(){
 feedOverlay.suspendUntil=performance.now()+500;
 clearTimeout(feedOverlay.suspendTimer);
 feedOverlay.suspendTimer=setTimeout(()=>{feedOverlay.suspendUntil=0;syncFocusedSlide();},540);
}
swipeFeed.addEventListener('pointerdown',e=>{
 if(e.target.closest('[data-prev],[data-next],[data-overlay-expand]'))suspendOverlaySync();
},{passive:true});
swipeFeed.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
 if(e.target.closest('button,input,a,textarea'))return;
 const slide=e.target.closest('.swipe-slide');if(!slide)return;
 gesture={id:e.pointerId,x:e.clientX,y:e.clientY,key:slide.dataset.galleryKey};
},{passive:true});
swipeFeed.addEventListener('pointerup',e=>{
 if(!gesture||gesture.id!==e.pointerId)return;
 const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,key=gesture.key;gesture=null;
 if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.2){feedOverlay.suppressClickUntil=Date.now()+550;moveArtwork(key,dx<0?1:-1);}
},{passive:true});
swipeFeed.addEventListener('pointercancel',()=>{gesture=null},{passive:true});
swipeFeed.addEventListener('touchmove',e=>{if(e.touches.length>1){e.preventDefault()}},{passive:false});
$('#comment-sheet-backdrop').addEventListener('click',closeComments);

document.addEventListener('click',handleClick);document.addEventListener('click',()=>setTimeout(observePostViews,100));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeComments();closeModal();return}if(e.target.matches('textarea,input,select'))return;if(state.page!=='discover'||!['all','archives','releases'].includes(state.feed))return;if($('#modal-cover').classList.contains('open')||$('#comment-sheet').classList.contains('open'))return;if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();$('#swipe-feed').scrollBy({top:$('#swipe-feed').clientHeight*(e.key==='ArrowDown'?1:-1),behavior:'smooth'})}if(['ArrowLeft','ArrowRight'].includes(e.key)){let feed=$('#swipe-feed');const el=$$('.swipe-slide').find(x=>Math.abs(x.getBoundingClientRect().top-feed.getBoundingClientRect().top)<feed.clientHeight/2);if(el)moveArtwork(el.dataset.galleryKey,e.key==='ArrowRight'?1:-1)}});
['search-term','search-location'].forEach(id=>$('#'+id).addEventListener('input',renderSearch));['search-style','search-medium','search-mood'].forEach(id=>$('#'+id).addEventListener('change',renderSearch));
/* Archive images and records are populated from an authoritative public-domain catalog.
   Search by artist attribution and verify each result. No synthetic or fake works. */
async function museumData(){
 const cached=get('museum_v9',null);
 const useCatalog=data=>{
  for(const w of works){if(w.museumId&&data.base?.[w.museumId]?.image)w.image=data.base[w.museumId].image;}
  for(const w of data.additional||[]){if(!works.some(older=>older.id===w.id||older.museumId===w.museumId))works.push(w);}
  if(state.page==='discover'){const feed=$('#swipe-feed'),offset=feed.scrollTop;renderFeed();feed.scrollTop=offset;}
  renderMoods();renderSearch();if(state.page==='artist')renderArtist();
 };
 if(cached&&cached.expires>Date.now()&&cached.additional?.length){useCatalog(cached);if(cached.complete)return;}
 const fields='id,title,artist_title,image_id,is_public_domain,date_display,style_title,medium_display';
 const idList=[27992,28560,24645];
 const queries=[
  ['monet','Monet'],['vangogh','Van Gogh'],['hokusai','Hokusai'],['seurat','Seurat'],
  ['cassatt','Cassatt'],['caillebotte','Caillebotte'],['cezanne','Cézanne'],['renoir','Renoir'],
  ['morisot','Morisot'],['hiroshige','Hiroshige'],['homer','Winslow Homer'],['redon','Redon'],
  ['kollwitz','Kollwitz'],['lautrec','Toulouse-Lautrec'],['pissarro','Pissarro'],['klimt','Klimt']
 ];
 const result={expires:Date.now()+86400000,base:{...(cached?.base||{})},additional:[...(cached?.additional||[])],complete:false};
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),30000);
 const fetchJson=async url=>{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error('Museum returned '+r.status);return r.json();};
 const valid=x=>x?.is_public_domain===true&&!!x.image_id;
 const image=x=>'https://www.artic.edu/iiif/2/'+encodeURIComponent(x.image_id)+'/full/843,/0/default.jpg';
 const addWorks=(key,query,rows)=>{
  let added=0;
  for(const item of rows||[]){
   if(!valid(item)||!normArtText(item.artist_title).includes(normArtText(query)))continue;
   if(idList.includes(item.id)||result.additional.some(w=>w.museumId===item.id)||works.some(w=>w.museumId===item.id))continue;
   result.additional.push({id:'aic'+item.id,museumId:item.id,artist:key,title:item.title||'Untitled',year:item.date_display||'',image:image(item),style:artists[key].style,medium:item.medium_display||'Visual art',tags:catalogDiscoveryTags(item,key),source:'Art Institute of Chicago'});
   if(++added>=6)break;
  }
 };
 try{
  const baseResult=await fetchJson('https://api.artic.edu/api/v1/artworks?ids='+idList.join(',')+'&fields='+fields);
  for(const x of baseResult.data||[]){if(valid(x))result.base[x.id]={image:image(x)};}
  useCatalog(result);
 }catch{ /* A catalogue can be temporarily unavailable. */ }
 // Limit concurrency: fetch smaller artist batches so slower or rate-limited
 // museum requests do not block other profile content.
 let allLoaded=true;
 for(let offset=0;offset<queries.length;offset+=4){
  if(controller.signal.aborted){allLoaded=false;break;}
  const batch=queries.slice(offset,offset+4);
  const responses=await Promise.allSettled(batch.map(([key,q])=>fetchJson('https://api.artic.edu/api/v1/artworks/search?q='+encodeURIComponent(q)+'&query%5Bterm%5D%5Bis_public_domain%5D=true&limit=35&fields='+fields)));
  for(let i=0;i<batch.length;i++){if(responses[i].status==='fulfilled')addWorks(batch[i][0],batch[i][1],responses[i].value.data);}
  if(responses.some(r=>r.status==='rejected'))allLoaded=false;
  if(result.additional.length){useCatalog(result);put('museum_v9',result);}
 }
 clearTimeout(timeout);
 result.complete=allLoaded;
 if(result.additional.length)put('museum_v9',result);
}
const deepLinkMatch=window.location.hash.match(/^#artist\/([a-z0-9_-]+)$/i);
if(deepLinkMatch&&artists[deepLinkMatch[1]])openArtist(deepLinkMatch[1]);else markPage('discover');
$$('[data-of-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.ofIcon)});
renderMoods();renderSearch();renderCommunity();renderSaved();museumData();
