'use strict';
const config = window.PORTFOLIO_CONTENT || {};
config.contact ||= {};
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
const node = (tag, cls, text) => { const el=document.createElement(tag); if(cls)el.className=cls; if(text!==undefined)el.textContent=text; return el; };
const isValidUrl = (value) => { try { return new URL(value).protocol==='https:'; } catch { return false; } };
const panel = (name) => document.getElementById(name);
let lang = 'ja';

// Japanese originals come from the HTML so they are not duplicated in content.js.
const original = new Map();
$$('[data-i18n]').forEach(el=>original.set(el,el.textContent));
$$('[data-i18n-aria]').forEach(el=>original.set(el,el.getAttribute('aria-label')));

// Markdown collections shared by the portfolio, archive and article reader.
const collections = {
  projects: { items: [], label: p => p.id+'.md', render: renderProject },
  writeups: { items: [] },
};
const active = { projects: undefined, writeups: undefined };
const localized = (item) => ({ ...item, ...item[lang] });

function appendSafeLink(root,label,url,cls='outbound-link') {
  if(!isValidUrl(url)) return false;
  const a=node('a',cls,label); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; root.append(a); return true;
}

// CommonMark rendering with tables/strikethrough, sanitized HTML and local syntax highlighting.
function resolveAsset(src,base) {
  try { const url=new URL(src,base); return ['http:','https:'].includes(url.protocol) && (url.protocol==='https:' || url.origin===location.origin) ? url.href : null; } catch { return null; }
}
const markdown = window.markdownit({ html:true, linkify:true, breaks:false });
// Keep table alignment without allowing arbitrary inline styles from embedded HTML.
['th_open','td_open'].forEach(type=>{
  markdown.renderer.rules[type]=(tokens,index,options,env,renderer)=>{
    const token=tokens[index];
    const alignment=token.attrGet('style')?.match(/^text-align:(left|center|right)$/)?.[1];
    if(alignment) {
      token.attrs=token.attrs.filter(([name])=>name!=='style');
      token.attrSet('align',alignment);
    }
    return renderer.renderToken(tokens,index,options);
  };
});
function renderMarkdown(src,base=location.href) {
  const root=node('div','markdown');
  root.append(window.DOMPurify.sanitize(markdown.render(src), {
    USE_PROFILES: { html:true }, RETURN_DOM_FRAGMENT:true,
    FORBID_TAGS: ['style','form','input','button','textarea','select','iframe','video','audio','source'],
    FORBID_ATTR: ['style','srcset','autofocus']
  }));
  // Resolve paths against the Markdown file, including images in embedded HTML.
  $$('img',root).forEach(img=>{
    const src=resolveAsset(img.getAttribute('src'),base);
    if(src) { img.src=src; img.loading='lazy'; }
    else img.replaceWith(document.createTextNode(img.alt));
  });
  $$('a[href]',root).forEach(link=>{
    const href=link.getAttribute('href');
    if(href.startsWith('#')) {
      // Scroll inside the document without changing the section/file route.
      link.addEventListener('click',event=>{
        event.preventDefault();
        let id; try { id=decodeURIComponent(href.slice(1)); } catch { return; }
        $$('[id]',root).find(el=>el.id===id)?.scrollIntoView({block:'start'});
      });
      return;
    }
    try {
      const url=new URL(href,base);
      if(!['http:','https:','mailto:'].includes(url.protocol)) { link.removeAttribute('href'); return; }
      link.href=url.href; link.target='_blank'; link.rel='noopener noreferrer';
    } catch { link.removeAttribute('href'); }
  });
  // GFM-style task lists are display-only; the source Markdown owns their state.
  $$('li',root).forEach(li=>{
    const container=li.firstElementChild?.tagName==='P' ? li.firstElementChild : li;
    const text=container.firstChild;
    const match=text?.nodeType===Node.TEXT_NODE && text.textContent.match(/^\[([ xX])\]\s+/);
    if(!match) return;
    text.textContent=text.textContent.slice(match[0].length);
    const checkbox=node('input'); checkbox.type='checkbox'; checkbox.disabled=true; checkbox.checked=match[1].toLowerCase()==='x';
    checkbox.setAttribute('aria-label',checkbox.checked?'Completed':'Incomplete');
    container.prepend(checkbox,document.createTextNode(' '));
    li.classList.add('task-list-item'); li.parentElement.classList.add('task-list');
  });
  $$('pre code',root).forEach(code=>{
    // Leave unspecified and unsupported languages as plain text.
    const language=code.className.match(/(?:^|\s)language-([^\s]+)/)?.[1];
    if(language && window.hljs.getLanguage(language)) window.hljs.highlightElement(code);
  });
  $$('table',root).forEach(table=>{
    const scroll=node('div','markdown-table'); scroll.tabIndex=0;
    scroll.setAttribute('role','region'); scroll.setAttribute('aria-label',lang==='en'?'Scrollable table':'横スクロールできる表');
    table.replaceWith(scroll); scroll.append(table);
  });
  return root;
}

function docHeader(eyebrow,title,lede) {
  return [node('div','project-eyebrow',eyebrow), node('h3','',title), node('p','project-lede',lede), node('div','doc-divider')];
}
function section(label,content) { return [node('div','doc-section-label',label), content]; }
function linkRow(links,placeholder=true) {
  const row=node('div','project-links');
  links.forEach(([label,url])=>appendSafeLink(row,label+' ↗',url));
  if(!row.children.length && placeholder) row.append(node('span','muted-placeholder','Links will be added after verification.'));
  return row;
}
function renderProject(p) {
  const out=docHeader([p.number,p.label].filter(Boolean).join(' / '), p.title, p.subtitle);
  if(p.description) out.push(...section('OVERVIEW', node('p','project-description',p.description)));
  if(p.points?.length) { const ul=node('ul','project-points'); p.points.forEach(s=>ul.append(node('li','',s))); out.push(...section('KEY WORK',ul)); }
  if(p.note) out.push(...section('NOTES', node('p','project-note',p.note)));
  if(p.body) out.push(renderMarkdown(p.body,p.base));
  out.push(linkRow([['Source repository',p.repo],['Live demo',p.demo]]));
  return out;
}
function renderTree(name) {
  const { items } = collections[name];
  if(document.body.classList.contains('writeups-page')) {
    const list=$('#writeups-list');
    list.replaceChildren(...items.map(localized).map(item=>{
      const link=node('a','writeup-entry');
      link.href='article.html?'+new URLSearchParams({collection:name,id:item.id,lang});
      link.append(node('span','project-eyebrow',[item.date,item.event].filter(Boolean).join(' / ') || 'FIELD NOTES'),node('h2','',item.title),node('p','',item.summary || ''),node('span','writeup-read',lang==='en'?'Read article →':'記事を読む →'));
      return link;
    }));
    return;
  }
  const children=node('div','tree-children');
  items.map(localized).forEach(item=>{
    const b=node('button','tree-item'); b.type='button'; b.dataset.select=name+'/'+item.id;
    b.append(node('span','tree-glyph','◈'), node('span','tree-label',item.title));
    children.append(b);
  });
  $('[data-tree]',panel(name)).replaceChildren(children);
}
function showItem(name,id) {
  if(document.body.classList.contains('writeups-page')) return;
  const c=collections[name];
  const found=c.items.find(i=>i.id===id) || c.items[0]; if(!found)return;
  active[name]=found.id;
  const item=localized(found), root=panel(name);
  $('[data-doc-label]',root).textContent=c.label(item);
  const doc=$('[data-doc]',root); doc.replaceChildren(...c.render(item)); doc.scrollTop=0;
  $$('[data-select]',root).forEach(b=>{
    const selected=b.dataset.select===name+'/'+found.id;
    b.classList.toggle('selected',selected); b.setAttribute('aria-pressed',String(selected));
  });
  document.dispatchEvent(new CustomEvent('portfolio:project',{detail:{name,id:found.id}}));
}

// ---- Markdown collections: foo.en.md is the English version of foo.md.
function parseFrontMatter(text) {
  const m=text.replace(/\r/g,'').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta={}; if(!m) return { meta, body:text };
  m[1].split('\n').forEach(line=>{
    const kv=line.match(/^(\w+):\s*(.*)$/); if(!kv) return;
    const value=kv[2].trim().replace(/^(['"])(.*)\1$/,'$2');
    meta[kv[1]]=value;
  });
  return { meta, body:m[2] };
}
async function listMarkdownFiles(name) {
  if(location.protocol==='file:') throw new Error('file://');
  // `node dev.mjs` serves a live listing; on GitHub Pages there is none, so ask the GitHub API.
  const local=await fetch(name+'/index.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
  if(local) return local;
  const { owner, repo, branch } = config.contentRepo || {};
  if(!owner) throw new Error('no source');
  const res=await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  if(!res.ok) throw new Error('GitHub API '+res.status);
  const tree=(await res.json()).tree || [];
  return { files: tree.filter(f=>f.type==='blob' && f.path.startsWith(name+'/') && f.path.endsWith('.md')).map(f=>f.path.slice((name+'/').length)) };
}
function showCollectionMessage(name,ja,en) {
  collections[name].message={ja,en};
  if(document.body.classList.contains('writeups-page')) {
    $('#writeups-list').replaceChildren(node('p','archive-message',lang==='en'?en:ja)); return;
  }
  const root=panel(name);
  $('[data-tree]',root).replaceChildren();
  $('[data-doc-label]',root).textContent=name+'/';
  $('[data-doc]',root).replaceChildren(node('p','muted-placeholder',lang==='en'?en:ja));
}
async function loadMarkdownCollection(name) {
  showCollectionMessage(name,'読み込み中…','Loading…');
  try {
    const { files, dev } = await listMarkdownFiles(name);
    // The dev server includes local templates; the published index excludes them.
    const candidates=[...new Set(files)];
    const entries=await Promise.all(candidates.map(async rel=>{
      const res=await fetch(name+'/'+rel,{cache:'no-cache'}).catch(()=>null);
      if(!res?.ok) return null;
      const { meta, body } = parseFrontMatter(await res.text());
      const isEn=rel.endsWith('.en.md');
      return { id: rel.replace(/(\.en)?\.md$/,''), isEn, data: { ...meta, body, base: new URL(name+'/'+rel,location.href).href } };
    }));
    const byId=new Map();
    entries.filter(Boolean).forEach(({ id, isEn, data })=>{
      const item=byId.get(id) || { id };
      item[isEn?'en':'ja']=data; byId.set(id,item);
    });
    const items=[...byId.values()].map(item=>({ title: item.id, ...item.en, ...item.ja, ...item }))
      .sort((a,b)=>name==='projects'
        ? String(a.number||'').localeCompare(String(b.number||''),undefined,{numeric:true}) || a.id.localeCompare(b.id)
        : String(b.date||'').localeCompare(String(a.date||'')) || a.id.localeCompare(b.id));
    collections[name].items.splice(0, Infinity, ...items);
    if(!items.length) return showCollectionMessage(name,'記事は準備中です。','Articles are coming soon.');
    delete collections[name].message;
    renderTree(name); showItem(name,active[name]);
    if(dev && !window.__reloadStream) window.__reloadStream=Object.assign(new EventSource('/__reload'),{ onmessage:()=>location.reload() });
  } catch {
    if(location.protocol==='file:') showCollectionMessage(name,'file:// で開くとMarkdownは読み込めません。`node dev.mjs` を実行して http://localhost:8000 を開いてください。','Markdown cannot load from file://. Run `node dev.mjs` and open http://localhost:8000.');
    else showCollectionMessage(name,name+' を読み込めませんでした。少し時間をおいて再読み込みしてください。','Could not load '+name+'. Please reload in a moment.');
  }
}

function renderContact() {
  const root=$('#contact-list');
  const destinations=[
    ['GitHub','github','Code & repositories','M6 3v12m0-8h8a4 4 0 0 0 4-4m-12 8h8a4 4 0 0 1 4 4'],
    ['X / Twitter','twitter','Updates & thoughts','M16 8v6a2 2 0 0 0 4 0v-2a8 8 0 1 0-3 6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
    ['Qiita','qiita','Technical articles','M7 3h8l3 3v15H6V3h1m2 5h6m-6 4h6m-6 4h4'],
    ['Zenn','zenn','Technical writing','M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2V4'],
    ['Medium','medium','Writing & essays','M14 3H5v18h14v-8M8 8h4M8 12h3m2 7 1-4 6-6 3 3-6 6-4 1']
  ];
  destinations.forEach(([label,key,description,path],index)=>{
    if(!isValidUrl(config.contact[key])) return;
    const link=node('a','contact-link'); link.href=config.contact[key]; link.target='_blank'; link.rel='noopener noreferrer';
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
    icon.setAttribute('viewBox','0 0 24 24'); icon.setAttribute('aria-hidden','true'); icon.setAttribute('fill','none'); icon.setAttribute('stroke','currentColor'); icon.setAttribute('stroke-width','1.5'); icon.setAttribute('stroke-linecap','round'); icon.setAttribute('stroke-linejoin','round');
    const shape=document.createElementNS('http://www.w3.org/2000/svg','path'); shape.setAttribute('d',path); icon.append(shape);
    const text=node('span','contact-link-text'); text.append(node('strong','',label),node('span','',description));
    link.append(node('span','contact-index',String(index+1).padStart(2,'0')),icon,text,node('span','contact-arrow','↗')); root.append(link);
  });
}
function setLanguage(next) {
  lang=next==='en'?'en':'ja';
  const dict=lang==='en'?config.en:{};
  document.documentElement.lang=lang;
  $$('[data-i18n]').forEach(el=>el.textContent=dict[el.dataset.i18n] ?? original.get(el));
  $$('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',dict[el.dataset.i18nAria] ?? original.get(el)));
  $$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  Object.keys(collections).forEach(name=>{
    if(collections[name].items.length){ renderTree(name); showItem(name,active[name]); }
    else if(collections[name].message) { const {ja,en}=collections[name].message; showCollectionMessage(name,ja,en); }
  });
  try { localStorage.setItem('lang',lang); } catch {}
}
function readLocation(event) {
  // A delayed hashchange must read its own URL, not a newer file-selection URL.
  const hash=event?.newURL?new URL(event.newURL).hash:location.hash;
  let route; try { route=decodeURIComponent(hash.slice(1)); } catch { return; }
  const [name,...rest]=route.split('/');
  if(name==='writeups' && rest.length && !document.body.classList.contains('writeups-page')) {
    location.replace('article.html?'+new URLSearchParams({collection:'writeups',id:rest.join('/'),lang}));
    return;
  }
  if(name==='projects' && rest.length) showItem(name,rest.join('/'));
  if(name==='projects' && rest.length) active.projects=rest.join('/');
  // Plain section anchors use native scrolling; only legacy file routes need help.
  if(rest.length) panel(name)?.scrollIntoView({block:'start'});
}

if (!document.body.classList.contains('reader-page')) {
  const archive=document.body.classList.contains('writeups-page');
  if(!archive) renderContact();
  let savedLang=null; try { savedLang=localStorage.getItem('lang'); } catch {}
  setLanguage(savedLang); readLocation();
  loadMarkdownCollection(archive?'writeups':'projects');
  window.addEventListener('hashchange',readLocation);
  document.addEventListener('click',event=>{
    const langButton=event.target.closest('[data-lang]');
    if(langButton) { setLanguage(langButton.dataset.lang); return; }
    const select=event.target.closest('[data-select]');
    if(select) {
      const [name,...rest]=select.dataset.select.split('/');
      showItem(name,rest.join('/'));
      history.replaceState(null,'','#'+name+'/'+rest.map(encodeURIComponent).join('/'));
    }
  });
}
