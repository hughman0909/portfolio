'use strict';
// Progressive enhancement: content is visible unless a finite animation is running.
// No library, pending-opacity class, render delay or animation-dependent navigation.
(() => {
  if(!document.body.classList.contains('portfolio-page')) return;
  const $=selector=>document.querySelector(selector);
  const $$=selector=>Array.from(document.querySelectorAll(selector));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const running=new Map();
  function animate(element,keyframes,options={}) {
    running.get(element)?.cancel();
    if(reduced.matches || !element?.animate) return;
    const animation=element.animate(keyframes,{
      duration:240,easing:'cubic-bezier(.2,.65,.3,1)',fill:'backwards',...options
    });
    running.set(element,animation);
    const release=()=>{ if(running.get(element)===animation)running.delete(element); };
    animation.onfinish=release;
    animation.oncancel=release;
  }
  reduced.addEventListener('change',()=>{
    for(const animation of running.values()) animation.cancel();
    running.clear();
  });

  // Default is document/window scrolling. An explicit container can be supplied
  // through data-scroll-root; all progress, section and reveal measurements share it.
  const rootSelector=document.body.dataset.scrollRoot;
  const root=rootSelector?$(rootSelector):null;
  const scroller=root || document.scrollingElement;
  const scrollTarget=root || window;
  const sections=$$('main > section[id]');
  const nav=$('.section-nav');
  const links=$$('[data-section]');
  const line=$('.nav-active-line');
  const progress=$('.scroll-progress > span');
  const state=$('.status-state');
  const file=$('.status-file');
  let current='';
  let selectedFile=$('[data-select].selected')?.dataset.select.split('/').slice(1).join('/') || '';
  let scheduled=false;

  function setText(element,text) {
    if(element.textContent===text) return;
    element.textContent=text;
    animate(element,[{opacity:.35},{opacity:1}],{duration:180});
  }
  function updateStatus() {
    setText(state,current?'ACTIVE: '+current.toUpperCase():'READY');
    const label=current==='projects' && selectedFile?selectedFile+'.md':'';
    setText(file,label);
    file.title=label;
  }
  function update() {
    scheduled=false;
    const viewport=root?root.clientHeight:window.innerHeight;
    const offset=root?root.getBoundingClientRect().top:0;
    const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    const ratio=max?Math.min(1,Math.max(0,scroller.scrollTop/max)):0;
    progress.style.transform=`scaleX(${ratio})`;
    // A stable reading line handles short sections, fast scrolling and missing IO.
    const readingLine=offset+Math.min(viewport*.3,180);
    let next=sections[0]?.id || '';
    for(const section of sections) {
      if(section.getBoundingClientRect().top<=readingLine) next=section.id;
    }
    if(max>0 && scroller.scrollTop>=max-2) next=sections.at(-1)?.id || next;
    if(next!==current) {
      current=next;
      $('#current-location').textContent=current;
      links.forEach(link=>{
        if(link.dataset.section===current)link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
      updateStatus();
    }
    const active=links.find(link=>link.dataset.section===current);
    if(active) {
      const rect=active.getBoundingClientRect(),parent=nav.getBoundingClientRect();
      line.style.transform=`translateX(${rect.left-parent.left+nav.scrollLeft}px) scaleX(${rect.width})`;
      line.style.opacity='1';
    }
  }
  function schedule() {
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(update);
  }
  scrollTarget.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('load',schedule,{once:true});
  if(typeof ResizeObserver==='function') {
    const resize=new ResizeObserver(schedule);
    resize.observe($('#main'));
    resize.observe(nav);
  }
  document.fonts?.ready.then(schedule);
  update();

  // Observe groups separately, stagger only siblings entering in the same batch.
  // Offscreen content stays visible in CSS, so missing IO/JS never hides the page.
  if(typeof IntersectionObserver==='function') {
    const groups=new Map();
    function group(elements) {
      const visible=elements.filter(Boolean);
      visible.forEach(element=>groups.set(element,visible));
    }
    group([$('.profile-name'),$('.mobile-profile-summary')]);
    $$('#about .readme > .subheading').forEach(heading=>group([heading,heading.nextElementSibling]));
    group($$('.property-row'));
    group([$('.frenchie-card')]);
    $$('.section-heading').forEach(element=>group([element]));
    group([$('.writeups-introduction')]);
    group([$('.contact-title'),$('.contact-description'),$('.contact-email-row')]);
    group($$('.contact-link'));
    const reveal=new IntersectionObserver(entries=>{
      const stagger=new Map();
      for(const entry of entries) {
        if(!entry.isIntersecting) continue;
        reveal.unobserve(entry.target);
        const siblings=groups.get(entry.target);
        const index=stagger.get(siblings) || 0;
        stagger.set(siblings,index+1);
        animate(entry.target,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{
          duration:420,delay:Math.min(index,3)*65
        });
      }
    },{root,threshold:0,rootMargin:'0px 0px -24px 0px'});
    groups.forEach((_,element)=>reveal.observe(element));
  }

  let documentElements=[];
  document.addEventListener('portfolio:project',event=>{
    selectedFile=event.detail.id;
    // Cancel old-document animations before replacing the running set, including
    // rapid clicks and language changes. showItem has already committed the content.
    documentElements.forEach(element=>running.get(element)?.cancel());
    documentElements=Array.from($('[data-doc]').children).filter(element=>element.className!=='doc-divider');
    documentElements.forEach((element,index)=>animate(element,[
      {opacity:.15,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}
    ],{duration:240,delay:Math.min(index,3)*25}));
    updateStatus();
    schedule();
  });

  const copy=$('[data-copy-email]');
  const feedback=$('.copy-feedback');
  let feedbackTimer;
  copy.addEventListener('click',async()=>{
    if(copy.dataset.busy) return;
    copy.dataset.busy='true';
    clearTimeout(feedbackTimer);
    const english=document.documentElement.lang==='en';
    try {
      if(!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(copy.dataset.copyEmail);
      copy.textContent='COPIED';
      feedback.textContent=english?'Email address copied.':'メールアドレスをコピーしました。';
    } catch {
      // Select the displayed address for manual copying without stealing focus.
      const selection=window.getSelection();
      const range=document.createRange();
      $('#contact-email').textContent=copy.dataset.copyEmail;
      range.selectNodeContents($('#contact-email'));
      selection.removeAllRanges(); selection.addRange(range);
      copy.textContent='COPY';
      feedback.textContent=english?'Copy unavailable. Select the address and copy it manually.':'コピーできませんでした。アドレスを選択して手動でコピーしてください。';
    } finally {
      delete copy.dataset.busy;
      feedbackTimer=setTimeout(()=>{copy.textContent='COPY';feedback.textContent='';},3500);
    }
  });
})();
