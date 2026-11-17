/* OFFFRAME V11 — discoverable events + creator artwork uploads + photo posts.
   Browser-only preview. No content is uploaded to a server. */
'use strict';
(() => {
  const uKey = 'uploadedWorks';
  const allowedUpload = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;
  const validStoredWork = w => w && /^user-work-\d+-[a-z0-9]+$/.test(w.id) &&
    typeof w.artist === 'string' && !!artists[w.artist] && !artists[w.artist].archive &&
    typeof w.image === 'string' && w.image.length < 380000 && allowedUpload.test(w.image) &&
    typeof w.title === 'string' && w.title.length <= 100;
  const uploaded = (Array.isArray(get(uKey, [])) ? get(uKey, []) : []).filter(validStoredWork).slice(-12);
  // New artworks become ordinary discoverable works, not a detached illustration gallery.
  uploaded.forEach(w => { if (!byId(w.id)) works.unshift(w); });

  const submitPhotoStyle = 'style="font-size:12px;color:#d9c1cf;display:block;margin-top:12px"';
  let activePreviewUrl = '';
  function revokePreview(){if(activePreviewUrl){URL.revokeObjectURL(activePreviewUrl);activePreviewUrl='';}}
  function renderPhotoPreview(input, id) {
    const img=document.getElementById(id);
    if(!img)return;
    revokePreview();
    if(input.files?.[0] && /^image\/(jpeg|png|webp)$/.test(input.files[0].type)){
      activePreviewUrl=URL.createObjectURL(input.files[0]);img.src=activePreviewUrl;img.hidden=false;
    }else{img.hidden=true;img.removeAttribute('src');}
  }
  // Cap file size and compression so this remains a reliable lightweight offline prototype.
  async function compressedPhoto(file){
    if(!file || !/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('Choose a JPG, PNG or WebP image.');
    if(file.size>12*1024*1024)throw Error('Choose an image under 12 MB.');
    const bmp=await createImageBitmap(file);
    try {
      for(const edge of [1100,950,800,650]){
        const scale=Math.min(1,edge/Math.max(bmp.width,bmp.height));
        const canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(bmp.width*scale));canvas.height=Math.max(1,Math.round(bmp.height*scale));
        canvas.getContext('2d',{alpha:false}).drawImage(bmp,0,0,canvas.width,canvas.height);
        const data=canvas.toDataURL('image/jpeg',edge>=950?.72:.64);
        if(data.length<=280000)return data;
      }
      throw Error('This image is too complex to store locally. Please choose a smaller file.');
    } finally {bmp.close?.();}
  }
  function persistUploads(arr){
    try{localStorage.setItem('offframe_v2_'+uKey,JSON.stringify(arr));return true}
    catch{toast('Browser image storage is full. Remove an older image or try a smaller file.');return false}
  }
  function uploadArtworkModal(){
    const id=state.account?.artistId;
    if(state.account?.role!=='creator'||!id||!artists[id]||artists[id].archive){toast('Sign in with an artist profile to add artwork.');return;}
    if(uploaded.filter(w=>w.artist===id).length>=10){toast('This preview stores up to 10 images per artist. Remove an older work first.');return;}
    setModal(`<span class="eyebrow rose">YOUR STUDIO / NEW WORK</span><h2>Add artwork.</h2>
      <p>Choose an image and describe your work. It will appear in your portfolio and in artwork discovery <strong>on this device</strong>.</p>
      <form id="of-upload-work-form">
        <label>Artwork image <small>(JPG, PNG or WebP)</small><input id="of-work-file" type="file" name="image" accept="image/png,image/jpeg,image/webp" required></label>
        <img id="of-art-preview" class="of-upload-preview" alt="Selected artwork preview" hidden>
        <label>Title <input name="title" required maxlength="90" placeholder="Name of your artwork"></label>
        <div class="of-upload-fields"><label>Year <input name="year" maxlength="20" value="${new Date().getFullYear()}" required></label>
        <label>Medium <select name="medium"><option>Painting</option><option>Photography</option><option>Digital art</option><option>Drawing</option><option>Printmaking</option><option>Sculpture</option><option>Mixed media</option><option>Other</option></select></label></div>
        <label>Tags <input name="tags" maxlength="140" placeholder="landscape, abstract, color (comma-separated)"></label>
        <p class="of-upload-note">Your image is compressed and saved to this browser only. This is not a public upload, and it won't appear on another device.</p>
        <button class="submit-btn" type="submit">Add to my portfolio →</button>
      </form>`);
    $('#of-work-file')?.addEventListener('change',e=>renderPhotoPreview(e.currentTarget,'of-art-preview'));
    $('#of-upload-work-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const form=e.currentTarget,file=form.elements.image.files?.[0];
      const title=String(form.elements.title.value||'').trim(),year=String(form.elements.year.value||'').trim();
      if(!title||title.length>90||!year||year.length>20)return toast('Enter an artwork title and year.');
      const btn=form.querySelector('[type=submit]');btn.disabled=true;btn.textContent='Adding artwork…';
      try{
        const image=await compressedPhoto(file);
        const tags=String(form.elements.tags.value||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).slice(0,8);
        const fresh={id:'user-work-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),artist:id,title,year,medium:form.elements.medium.value,style:artists[id].style||'Contemporary',tags,image,releasedAt:new Date().toISOString().slice(0,10),available:false,localOnly:true};
        if(!persistUploads([...uploaded,fresh]))return;
        uploaded.push(fresh);works.unshift(fresh);revokePreview();closeModal();state.artist=id;state.artistTab='works';markPage('artist');toast('Artwork added to your portfolio in this browser.');
      }catch(err){toast(err.message||'Could not read that image.');}finally{btn.disabled=false;btn.textContent='Add to my portfolio →';}
    });
  }
  function removeArtwork(id){
    const work=uploaded.find(w=>w.id===id);
    if(!work||!ownerOf(work.artist))return;
    if(!confirm('Remove this locally saved artwork from your Offframe preview?'))return;
    const next=uploaded.filter(w=>w.id!==id);
    if(!persistUploads(next))return;
    uploaded.splice(0,uploaded.length,...next);
    const index=works.findIndex(w=>w.id===id);if(index>=0)works.splice(index,1);
    state.liked=state.liked.filter(x=>x!==id);save('liked');
    state.favorites=state.favorites.filter(x=>x!==id);save('favorites');
    for(const collection of Object.keys(state.collections))state.collections[collection]=state.collections[collection].filter(x=>x!==id);
    save('collections');renderArtist();renderFeed();toast('Artwork removed from this device.');
  }

  function addCreatorButtons(){
    if(state.page!=='artist'||!ownerOf(state.artist))return;
    const root=$('#artist-main');if(!root)return;
    const primary=$('.profile-main-actions',root);
    if(primary&&!primary.querySelector('[data-of-upload-art]')){
      primary.insertAdjacentHTML('afterbegin',`<button type="button" class="profile-main-btn primary of-add-artwork" data-of-upload-art>${icon('plus')} Add artwork</button>`);
    }
    const bar=$('.profile-owner-bar',root);
    if(bar&&!bar.querySelector('[data-of-upload-art]'))bar.insertAdjacentHTML('afterbegin','<button type="button" class="mini-button of-bar-upload" data-of-upload-art>+ Add artwork</button>');
    const header=$('.profile-tab-content .artist-section-lead',root);
    if(header&&!header.querySelector('[data-of-upload-art]')&&['overview','works'].includes(state.artistTab))header.insertAdjacentHTML('beforeend','<button type="button" class="of-gallery-upload" data-of-upload-art>+ Add artwork</button>');
    for(const w of uploaded.filter(w=>w.artist===state.artist)){
      const card=[...$$('.art-tile',root)].find(el=>el.dataset.workImpression===w.id);
      if(card&&!card.querySelector('[data-of-remove-art]'))card.querySelector('.tile-body')?.insertAdjacentHTML('beforeend',`<button class="of-remove-work" data-of-remove-art="${w.id}">Remove this uploaded work</button>`);
    }
  }
  const baseRenderArtist=renderArtist;
  renderArtist=function(...args){baseRenderArtist(...args);addCreatorButtons();};
  // Keep a quick-upload action available in the signed-in artist's navigation.
  const baseUpdateAccountUI=updateAccountUI;
  updateAccountUI=function(...args){baseUpdateAccountUI(...args);
    const bar=$('.topbar-actions');if(!bar)return;
    let b=$('#of-quick-upload');
    const creator=state.account?.role==='creator';
    if(!creator){b?.remove();return;}
    if(!b){b=document.createElement('button');b.type='button';b.id='of-quick-upload';b.className='topbar-button of-quick-upload';b.dataset.ofUploadArt='';b.innerHTML=`${icon('plus')} <span>Add artwork</span>`;bar.insertBefore(b,$('#account-button'));}
  };
  const baseAccountModal=accountModal;
  accountModal=function(...args){baseAccountModal(...args);
    const list=$('#modal-content .modal-list');if(!list)return;
    if(state.account?.role==='creator')list.insertAdjacentHTML('afterbegin','<button type="button" data-of-upload-art><span>Add artwork to my portfolio</span><small>Upload →</small></button>');
    list.insertAdjacentHTML('beforeend','<button type="button" data-v10="explain-taste"><span>Recommendation settings</span><small>Manage →</small></button>');
  };
  // Event discovery deserves a clear path from the artwork feed itself.
  const channels=$('.discover-channels');
  if(channels&&!$('.of-events-shortcut',channels))channels.insertAdjacentHTML('beforeend','<button class="of-events-shortcut" type="button" data-page="events" aria-label="Explore local art events">Art events <span aria-hidden="true">↗</span></button>');
  // The recommendation system keeps working, but the top-of-feed notice is gone.
  const baseRenderFeed=renderFeed;
  renderFeed=function(...args){baseRenderFeed(...args);$('#taste-control-strip')?.remove();};
  $('#taste-control-strip')?.remove();

  function photoPostModal(){
    setModal(`<span class="eyebrow rose">SHARE YOUR VISION</span><h2>Post an image.</h2><p>Share artwork, a sketch, or a studio photograph with a community. This stays on your device.</p>
      <form id="of-photo-post-form"><label>Community<select name="group">${groups.map(g=>`<option value="${clean(g.id)}" ${g.id===state.group?'selected':''}>${clean(g.name)}</option>`).join('')}</select></label>
        <label>Image<input type="file" name="image" id="of-post-file" accept="image/png,image/jpeg,image/webp" required></label><img id="of-post-preview" class="of-upload-preview" hidden alt="Image post preview">
        <label>Caption<textarea name="caption" required maxlength="500" placeholder="Tell us a little about this image…"></textarea></label>
        <p class="of-upload-note">Only post images you own or have permission to share. Local preview only; other visitors won't see this post.</p>
        <button class="submit-btn" type="submit">Add image post →</button></form>`);
    $('#of-post-file')?.addEventListener('change',e=>renderPhotoPreview(e.currentTarget,'of-post-preview'));
    $('#of-photo-post-form')?.addEventListener('submit',async e=>{
      e.preventDefault();const form=e.currentTarget,caption=String(form.elements.caption.value||'').trim();
      if(!caption)return toast('Write a short caption first.');
      const btn=form.querySelector('[type=submit]');btn.disabled=true;
      try{
        const image=await compressedPhoto(form.elements.image.files?.[0]);
        const artist=state.account?.role==='creator'?artists[state.account.artistId]:null;
        const item={id:'myphoto'+Date.now(),group:form.elements.group.value,artistId:artist?.id||null,name:artist?.name||state.collectorProfile?.name||'You',user:artist?artist.handle.replace(/^@/,''):'you',avatar:artist?artist.name.slice(0,1).toUpperCase():'Y',tone:'sun',when:'just now',title:'',body:caption,image,tags:['image post'],reblog:null};
        state.posts.push(item);
        try{localStorage.setItem('offframe_v2_posts',JSON.stringify(state.posts));}catch{state.posts.pop();throw Error('Your browser has no space for another picture.');}
        revokePreview();closeModal();state.communityTab='for-you';markPage('community');toast('Image post saved on this device.');
      }catch(err){toast(err.message||'Could not post this image.');}finally{btn.disabled=false;}
    });
  }
  const baseRenderCommunity=renderCommunity;
  renderCommunity=function(...args){baseRenderCommunity(...args);
    const actions=$('.dash-hero-actions');
    if(actions&&!$('.of-post-image',actions))actions.insertAdjacentHTML('beforeend','<button class="of-post-image" data-of-photo-post type="button">+ Share an image</button>');
    const compose=$('.dash-compose-inline');
    if(compose&&!$('.of-post-image',compose))compose.insertAdjacentHTML('beforeend','<button class="of-post-image" data-of-photo-post type="button">Add image</button>');
  };
  const baseRenderGroup=renderGroup;
  renderGroup=function(...args){baseRenderGroup(...args);
    const buttons=$('.group-top-buttons');
    if(buttons&&!$('.of-post-image',buttons))buttons.insertAdjacentHTML('beforeend','<button class="mini-button of-post-image" data-of-photo-post type="button">+ Photo</button>');
  };
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;
    if(btn.hasAttribute('data-of-upload-art')){e.preventDefault();uploadArtworkModal();return;}
    if(btn.hasAttribute('data-of-photo-post')){e.preventDefault();photoPostModal();return;}
    if(btn.hasAttribute('data-of-remove-art')){e.preventDefault();removeArtwork(btn.dataset.ofRemoveArt);return;}
  });
  // After installing render wrappers, paint the currently open state.
  updateAccountUI();
  if(state.page==='artist')renderArtist();
  if(state.page==='community')renderCommunity();
  if(state.page==='group')renderGroup();
})();
