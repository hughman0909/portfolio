'use strict';
(async function openArticle() {
  const params=new URLSearchParams(location.search);
  const name=params.get('collection') || 'writeups';
  const id=params.get('id');
  lang=params.get('lang')==='en'?'en':'ja';
  document.documentElement.lang=lang;
  const english=lang==='en';
  const article=$('#article-body');
  const content=$('#reader-content');
  $('#reader-top').textContent=english?'↑ Back to top':'↑ ページの先頭へ';
  $('.reader-skip').textContent=english?'Skip to article':'本文へ移動';
  try {
    if(!Object.hasOwn(collections,name) || !id) throw new Error('missing');
    const back=name==='writeups'?'writeups.html':'index.html#'+name+'/'+encodeURIComponent(id);
    $('#reader-back').href=back;
    $('#reader-back').textContent=english?'← Back to portfolio':'← ポートフォリオへ';
    const {files}=await listMarkdownFiles(name);
    const versions=[id+(english?'.en.md':'.md'),id+(english?'.md':'.en.md')];
    const file=versions.find(file=>files.includes(file));
    if(!file) throw new Error('missing');
    const response=await fetch(name+'/'+file);
    if(!response.ok) throw new Error('load');
    const {meta,body}=parseFrontMatter(await response.text());
    // Merge Japanese metadata when the translation omits fields.
    let fallback={};
    if(file.endsWith('.en.md') && files.includes(id+'.md')) {
      const original=await fetch(name+'/'+id+'.md');
      if(original.ok) fallback=parseFrontMatter(await original.text()).meta;
    }
    const data={...fallback,...meta};
    const title=data.title || id;
    $('#reader-title').textContent=title;
    document.title=title+' / Hinata’s room';
    const summary=data.summary || data.subtitle || '';
    $('#reader-summary').textContent=summary;
    $('meta[name=description]').content=summary || title;
    $('.reader-kicker').textContent=name.toUpperCase()+' / '+(data.label || data.event || 'FIELD NOTES');
    const rendered=renderMarkdown(body,new URL(name+'/'+file,location.href).href);
    content.replaceChildren(...rendered.childNodes);
    const minutes=Math.max(1,Math.ceil(content.textContent.length/ (english?1000:500)));
    $('#reader-meta').textContent=[data.date,english?`${minutes} min read`:`約${minutes}分で読めます`,file.endsWith('.en.md')?'EN':'JA'].filter(Boolean).join('  /  ');
    const toc=$('#reader-toc');
    const headings=$$('h1,h2,h3',content);
    if(headings.length) {
      toc.append(node('p','reader-aside-label',english?'ON THIS PAGE':'目次 / ON THIS PAGE'));
      headings.forEach((heading,index)=>{
        heading.id='section-'+(index+1);
        const link=node('a',heading.tagName==='H3'?'toc-sub':'',heading.textContent);
        link.href='#'+heading.id; toc.append(link);
      });
    }
    const related=$('#reader-related');
    related.append(node('p','reader-aside-label',english?'EXPLORE':'ほかの記事'));
    const collectionLink=node('a','',english?'← Browse '+name:'← '+name+' の一覧へ');
    collectionLink.href=name==='writeups'?'writeups.html':'index.html#'+name; related.append(collectionLink);
    const source=linkRow([[english?'Original article':'元記事を読む',data.url],['Source repository',data.repo],['Live demo',data.demo]],false);
    if(source.children.length) content.append(source);
    if(location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch {
    $('#reader-title').textContent=english?'Article unavailable':'記事を表示できませんでした';
    content.textContent=english?'Return to the portfolio and choose an article.':'ポートフォリオに戻って記事を選択してください。';
    document.title=(english?'Article unavailable':'記事を表示できません')+' / Hinata’s room';
  } finally { article.setAttribute('aria-busy','false'); }
})();
