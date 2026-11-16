(function(){
'use strict';
var reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
var fine=window.matchMedia('(pointer:fine)').matches;
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}

/* ---------- 开屏 ---------- */
var boot=$('#boot');
function closeBoot(){
  if(!boot||boot.classList.contains('gone'))return;
  boot.classList.add('gone');
  setTimeout(function(){boot.style.display='none'},850);
  try{sessionStorage.setItem('nebulaBoot','1')}catch(e){}
}
if(boot){
  var seen=false; try{seen=sessionStorage.getItem('nebulaBoot')==='1'}catch(e){}
  if(seen||reduced){boot.style.display='none'}
  else{
    $$('#boot .bmark span').forEach(function(s,i){s.style.animationDelay=(0.12+i*0.075)+'s'});
    setTimeout(closeBoot,1750);
    boot.addEventListener('click',closeBoot);
  }
  $('#bootSkip').addEventListener('click',function(e){e.stopPropagation();closeBoot()});
}

/* ---------- 路由 ---------- */
var pages=$$('.page'), routes=$$('[data-route]'), gtop=$('#gtop');
var current='home';
function setTopMode(){
  if(!gtop)return;
  var light = current!=='home' || window.scrollY>window.innerHeight*0.72;
  gtop.classList.toggle('light',light);
}
function go(name,push){
  var parts=(name||'home').split('/'),slug=parts[1]||'';name=parts[0];
  if(!pages.some(function(p){return p.dataset.page===name}))name='home';
  window.__slug=slug;
  current=name;
  pages.forEach(function(p){
    var on=p.dataset.page===name;
    p.classList.toggle('on',on);
    if(on){p.classList.remove('page-enter');void p.offsetWidth;p.classList.add('page-enter')}
  });
  routes.forEach(function(a){a.classList.toggle('on',a.dataset.route===name)});
  closeDrawer();
  if(window.__lenis)window.__lenis.scrollTo(0,{immediate:true});
  else window.scrollTo({top:0,behavior:'auto'});
  setTopMode();
  var st=$('#wrail');
  if(st&&name==='works'){
    st.classList.remove('play');
    $$('#wrail > *').forEach(function(el,i){el.style.animationDelay=(0.08+i*0.09)+'s'});
    requestAnimationFrame(function(){st.classList.add('play')});
    setTimeout(function(){st.dispatchEvent(new Event('scroll'))},60);
  }
  revealAll();
  if(name==='journal'&&window.__journalRoute)window.__journalRoute(slug);
  var bk=document.getElementById('backBtn');
  if(bk){var sub=name!=='home';bk.classList.toggle('show',sub);
    bk.onclick=function(){location.hash='#/home'};}
}
function routeFromHash(){
  var h=location.hash||'';
  if(h.indexOf('#/')===0)return h.slice(2).split('?')[0]||'home';
  return null;
}
window.addEventListener('hashchange',function(){
  var r=routeFromHash(); if(r)go(r);
});
window.addEventListener('scroll',setTopMode,{passive:true});

/* ---------- 抽屉 ---------- */
var drawer=$('#drawer'),scrim=$('#scrim'),burger=$('#burger');
function openDrawer(){
  if(!drawer)return;
  drawer.classList.add('open');scrim.classList.add('open');
  burger.setAttribute('aria-expanded','true');drawer.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closeDrawer(){
  if(!drawer)return;
  drawer.classList.remove('open');scrim.classList.remove('open');
  burger.setAttribute('aria-expanded','false');drawer.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
if(burger)burger.addEventListener('click',function(){
  drawer.classList.contains('open')?closeDrawer():openDrawer();
});
if(scrim)scrim.addEventListener('click',closeDrawer);
var dx=$('#drawerX'); if(dx)dx.addEventListener('click',closeDrawer);
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){closeDrawer();closeLb()}
});
$$('.drawer-nav a').forEach(function(a){a.addEventListener('click',closeDrawer)});

/* ---------- 音乐 ---------- */
var au=$('#au'),player=$('#player'),plToggle=$('#plToggle'),plProg=$('#plProg');
if(au&&player){
  setTimeout(function(){player.classList.add('show')},2100);
  plToggle.addEventListener('click',function(){
    if(au.paused){
      var pr=au.play();
      if(pr&&pr.catch)pr.catch(function(){});
    }else au.pause();
  });
  au.addEventListener('play',function(){player.classList.add('playing');plToggle.setAttribute('aria-label','暂停音乐')});
  au.addEventListener('pause',function(){player.classList.remove('playing');plToggle.setAttribute('aria-label','播放音乐')});
  au.addEventListener('timeupdate',function(){
    if(au.duration)plProg.style.width=(au.currentTime/au.duration*100)+'%';
  });
  au.volume=0.55;
}

/* ---------- 滚动 reveal ---------- */
var io=null;
if('IntersectionObserver' in window){
  io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
}
function revealAll(){
  $$('[data-rv]').forEach(function(el){
    if(el.classList.contains('in'))return;
    var sib=el.parentElement?$$('[data-rv]',el.parentElement).length:0;
    if(!el.dataset.d&&sib>1){el.dataset.d=[].indexOf.call(el.parentElement.children,el)%8}
    var r=el.getBoundingClientRect();
    if(r.top<window.innerHeight&&r.bottom>0){el.style.transitionDelay=(el.dataset.d*90)+'ms';el.classList.add('in')}
    else if(io)io.observe(el);
    else el.classList.add('in');
  });
  countUp();
}
var counted=false;
function countUp(){
  if(counted)return;
  var els=$$('[data-count]');if(!els.length)return;
  var r=els[0].getBoundingClientRect();
  if(r.top>window.innerHeight)return;
  counted=true;
  els.forEach(function(el){
    var target=parseFloat(el.dataset.count),t0=null;
    if(reduced){el.textContent=target;return}
    function tick(ts){
      if(!t0)t0=ts;
      var p=Math.min(1,(ts-t0)/1100);
      el.textContent=Math.round(target*(1-Math.pow(1-p,3)));
      if(p<1)requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ---------- 入场编排 + 逐字 ---------- */
$$('[data-it]').forEach(function(el,i){
  if(reduced){el.classList.add('in');return}
  el.style.animationDelay=(70+i*95)+'ms';
  requestAnimationFrame(function(){el.classList.add('in')});
});
$$('h1 .solid,h1 .out').forEach(function(line,li){
  var txt=line.textContent;line.textContent='';
  txt.split('').forEach(function(c,i){
    var s=document.createElement('span');s.className='ch';s.textContent=c===' '?'\u00a0':c;
    s.style.animationDelay=(120+li*220+i*16)+'ms';line.appendChild(s);
  });
});

/* ---------- 打字机（慢速 + 逐字回删） ---------- */
(function(){
  var spn=document.createElement('span'),cur=document.createElement('span');
  var sub=$('.subline');if(!sub)return;
  var txt=sub.textContent.trim();sub.textContent='';
  sub.appendChild(spn);cur.className='caret';sub.appendChild(cur);
  if(reduced){spn.textContent=txt;cur.style.display='none';return}
  function typing(){
    var k=0;cur.className='caret';
    (function tick(){
      if(k<txt.length){
        var ch=txt.charAt(k);spn.textContent+=ch;k++;
        setTimeout(tick,ch===' '?120:82);
      }else{
        setTimeout(function(){
          cur.className='caret done';
          setTimeout(function(){
            cur.className='caret';
            (function del(){
              var n=spn.textContent.length;
              if(n>0){spn.textContent=spn.textContent.slice(0,-1);setTimeout(del,34)}
              else setTimeout(typing,1000);
            })();
          },2400);
        },420);
      }
    })();
  }
  setTimeout(typing,900);
})();

/* ---------- 人物视差（A 版阻尼） ---------- */
if(fine&&!reduced){
  var art=$('.art');
  if(art){
    var tx=0,ty=0,cx=0,cy=0;
    window.addEventListener('mousemove',function(e){
      tx=(e.clientX/window.innerWidth-.5)*2;
      ty=(e.clientY/window.innerHeight-.5)*2;
    },{passive:true});
    (function loop(){
      cx+=(tx-cx)*0.075;cy+=(ty-cy)*0.075;
      art.style.transform='translate3d('+(-cx*22).toFixed(2)+'px,'+(-cy*15).toFixed(2)+'px,0)';
      requestAnimationFrame(loop);
    })();
  }
}

/* ---------- 木偶：弹簧驱动发束 ---------- */
(function(){
  var pup=$('.pup');if(!pup||reduced)return;
  var L=$('.pleft',pup),R=$('.rtop',pup),R2=$('.rbot',pup),B=$('.pbody',pup),F=$('.pbangs',pup);
  if(!L||!R||!B)return;
  var sL={x:0,v:0},sR={x:0,v:0},sR2={x:0,v:0},sH={x:0,v:0},sF={x:0,v:0};
  var mv=0,lastX=null;
  if(fine)window.addEventListener('mousemove',function(e){
    if(lastX!==null)mv+=(e.clientX-lastX)*0.018;
    lastX=e.clientX;
  },{passive:true});
  function spring(s,target,k,d,dt){
    var a=(target-s.x)*k-s.v*d;
    s.v+=a*dt;s.x+=s.v*dt;return s.x;
  }
  var t=Math.random()*10,last=performance.now();
  function frame(now){
    var dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;
    mv*=0.93;
    var windL=Math.sin(t*0.85)*2.4+Math.sin(t*1.9+1.1)*0.85;
    var windR=Math.sin(t*0.72+0.6)*2.6+Math.sin(t*1.55)*0.9;
    var aL=spring(sL,windL+mv*2.2,26,5.2,dt);
    var aR=spring(sR,windR-mv*1.8,22,7.5,dt);
    L.style.transform='rotate('+Math.max(-9,Math.min(9,aL)).toFixed(3)+'deg)';
    R.style.transform='rotate('+Math.max(-9,Math.min(9,aR)).toFixed(3)+'deg)';
    if(R2){
      var w2=Math.sin((t-0.42)*0.72+0.6)*1.5+Math.sin((t-0.42)*1.55)*0.6;
      var target2=w2-aR*0.55;
      var aR2=spring(sR2,target2,26,8.0,dt);
      R2.style.transform='rotate('+Math.max(-4,Math.min(4,aR2)).toFixed(3)+'deg)';
    }
    if(F){
      var wf=Math.sin((t-0.3)*0.6)*0.55+Math.sin((t-0.3)*1.4)*0.22;
      var aF=spring(sF,wf+mv*0.45,14,6.0,dt);
      F.style.transform='rotate('+Math.max(-1.6,Math.min(1.6,aF)).toFixed(3)+'deg)';
    }
    var tilt=spring(sH,Math.sin(t*0.55)*0.55+mv*0.08,18,6.0,dt);
    B.style.transform='translateY('+(Math.sin(t*0.9)*4.8).toFixed(2)+'px) rotate('+tilt.toFixed(3)+'deg)';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- 相册 Lightbox ---------- */
var lb=$('#lightbox'),lbImg=$('#lbImg'),lbCap=$('#lbCap');
function closeLb(){if(lb)lb.classList.remove('on')}
$$('.work').forEach(function(w){
  w.addEventListener('click',function(){
    if(!lb)return;
    lbImg.src=w.dataset.full;lbCap.textContent=w.dataset.cap||'';
    lb.classList.add('on');
  });
});
if(lb)lb.addEventListener('click',function(e){if(e.target===lb)closeLb()});
var lc=$('#lbClose');if(lc)lc.addEventListener('click',closeLb);
/* 关于页快门相册：点击开灯箱 */
$$('.psp').forEach(function(img){
  img.addEventListener('click',function(){
    if(!lb)return;
    lbImg.src=img.dataset.full||img.src;
    lbCap.textContent=img.dataset.cap||img.alt||'';
    lb.classList.add('on');
  });
});

/* 据点页：卡片磁吸（借鉴 cyber-relic-scanner 文字吸附） */
$$('.site').forEach(function(card){
  if(!fine)return;
  var fr=$('.frame',card),meta=$('.smeta',card);
  if(!fr||!meta)return;
  card.addEventListener('pointermove',function(e){
    var r=card.getBoundingClientRect();
    var dx=(e.clientX-r.left)/r.width-.5, dy=(e.clientY-r.top)/r.height-.5;
    fr.style.transform='translate('+(dx*7).toFixed(1)+'px,'+(dy*5-3).toFixed(1)+'px)';
    meta.style.transform='translate('+(dx*4).toFixed(1)+'px,'+(dy*3).toFixed(1)+'px)';
  });
  card.addEventListener('pointerleave',function(){
    fr.style.transform='';meta.style.transform='';
  });
});

/* ---------- 笔记展开 ---------- */
$$('.post').forEach(function(p){
  var hd=$('.post-hd',p);
  hd.addEventListener('click',function(){
    var target='#/journal/'+p.dataset.slug;
    if(location.hash===target){location.hash='#/journal';return}
    location.hash=target;
  });
});

/* ---------- 启动 ---------- */
var first=routeFromHash();
go(first||'home');
if(!location.hash)history.replaceState(null,'','#/home');
setTimeout(revealAll,400);
})();

/* ---------- 眨眼 ---------- */
(function(){
  var reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var open=document.querySelector('.eopen'),closed=document.querySelector('.eclosed');
  if(!open||!closed||reduced)return;
  function blink(times){
    open.style.opacity='0';closed.style.opacity='1';
    setTimeout(function(){
      open.style.opacity='1';closed.style.opacity='0';
      if(times>1)setTimeout(function(){blink(times-1)},240);
    },320);
  }
  function loop(){
    blink(Math.random()<0.22?2:1);
    setTimeout(loop,3200+Math.random()*4200);
  }
  setTimeout(loop,2200);
})();

/* ---------- 灵感生成器 ---------- */
(function(){
  var reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var btn=document.getElementById('sparkBtn');if(!btn)return;
  var out=document.getElementById('sparkText'),copy=document.getElementById('sparkCopy');
  var subjects=['一家独立咖啡店','一张后摇专辑','一个开源文档站','城市夜跑社团','独立游戏工作室','线上读书会','手作陶器品牌','胶片摄影展','山间民宿','街角唱片店'];
  var styles=['日式极简','瑞士网格','复古丝网印刷','编辑杂志感','孟菲斯几何','新粗野主义','东方留白','蓝色线稿'];
  var asks=['一张竖版海报','三页落地页','一组社媒封面','一张专辑封面','一套活动主视觉','一个品牌首页'];
  var rules=['只用两种颜色','留白优先','标题必须超大','不要任何渐变','线条保留手绘感','必须中英混排','不要圆角卡片'];
  var last='',timer=null;
  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function gen(){
    var t;
    do{t='为'+pick(subjects)+'做'+pick(asks)+'，'+pick(styles)+'，'+pick(rules)+'。'}while(t===last);
    last=t;
    if(timer)clearInterval(timer);
    if(reduced){out.textContent=t;return}
    var i=0;out.textContent='';
    timer=setInterval(function(){
      out.textContent=t.slice(0,++i);
      if(i>=t.length){clearInterval(timer);timer=null}
    },26);
  }
  btn.addEventListener('click',gen);
  copy.addEventListener('click',function(){
    var t=out.textContent;
    function done(){copy.textContent='已复制';setTimeout(function(){copy.textContent='复制'},1600)}
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(done).catch(function(){fallback()});
    }else fallback();
    function fallback(){
      var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);
      ta.select();try{document.execCommand('copy');done()}catch(e){}
      document.body.removeChild(ta);
    }
  });
})();

/* ---------- 横滑相册与筛选 ---------- */
(function(){
  var rail=document.getElementById('wrail');if(!rail)return;
  var prev=document.getElementById('wPrev'),next=document.getElementById('wNext'),idx=document.getElementById('wIdx');
  function visible(){return Array.prototype.filter.call(rail.querySelectorAll('.work'),function(w){return !w.classList.contains('hide')})}
  function stepWidth(){
    var v=visible();if(!v.length)return 300;
    if(v.length>1)return v[1].offsetLeft-v[0].offsetLeft;
    return v[0].getBoundingClientRect().width+24;
  }
  function update(){
    var total=visible().length;
    var d=stepWidth();if(!d||!isFinite(d))d=300;
    var i=Math.round(rail.scrollLeft/d);
    i=Math.max(0,Math.min(i,total-1));
    idx.textContent=String(i+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');
    prev.disabled=i<=0;next.disabled=i>=total-1;
  }
  prev.addEventListener('click',function(){rail.scrollBy({left:-stepWidth(),behavior:'smooth'})});
  next.addEventListener('click',function(){rail.scrollBy({left:stepWidth(),behavior:'smooth'})});
  rail.addEventListener('scroll',update,{passive:true});
  document.addEventListener('keydown',function(e){
    if(document.querySelector('.page[data-page="works"]').classList.contains('on')){
      if(e.key==='ArrowLeft')prev.click();
      if(e.key==='ArrowRight')next.click();
    }
  });
  var down=false,startX=0,startL=0,moved=false;
  rail.addEventListener('pointerdown',function(e){
    down=true;moved=false;startX=e.clientX;startL=rail.scrollLeft;rail.classList.add('drag');
  });
  window.addEventListener('pointermove',function(e){
    if(!down)return;
    var dx=e.clientX-startX;
    if(Math.abs(dx)>7)moved=true;
    rail.scrollLeft=startL-dx;
  });
  window.addEventListener('pointerup',function(){down=false;rail.classList.remove('drag')});
  rail.addEventListener('click',function(e){if(moved){e.stopPropagation();e.preventDefault();moved=false}},true);
  document.querySelectorAll('#wfilter button').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('#wfilter button').forEach(function(x){x.classList.remove('on')});
      b.classList.add('on');
      var f=b.dataset.f;
      rail.querySelectorAll('.work').forEach(function(w){
        w.classList.toggle('hide',f!=='all'&&w.dataset.cat!==f);
      });
      rail.scrollTo({left:0,behavior:'auto'});
      update();
    });
  });
  update();
})();


/* ---------- Lenis 平滑滚动 ---------- */
(function(){
  var reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(!window.Lenis||reduced)return;
  try{
    var lenis=new Lenis({lerp:0.085,smoothWheel:true,wheelMultiplier:1.2});
    window.__lenis=lenis;
    function raf(t){lenis.raf(t);requestAnimationFrame(raf)}
    requestAnimationFrame(raf);
  }catch(e){}
})();

/* ---------- 阅读进度条 ---------- */
(function(){
  var bar=document.getElementById('readbar');if(!bar)return;
  function upd(){
    var h=document.body.scrollHeight-window.innerHeight;
    bar.style.width=(h>0?Math.min(100,window.scrollY/h*100):0)+'%';
  }
  window.addEventListener('scroll',upd,{passive:true});
  window.addEventListener('hashchange',function(){setTimeout(upd,80)});
  upd();
})();

/* ---------- 磁吸按钮 ---------- */
(function(){
  var fine=window.matchMedia('(pointer:fine)').matches;
  var reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(!fine||reduced)return;
  document.querySelectorAll('.btn,.wctrl button,.pl-toggle,.pl-next').forEach(function(el){
    el.classList.add('mag');
    el.addEventListener('mousemove',function(e){
      var r=el.getBoundingClientRect();
      var x=(e.clientX-r.left-r.width/2)/r.width,y=(e.clientY-r.top-r.height/2)/r.height;
      el.style.transform='translate('+(x*9).toFixed(1)+'px,'+(y*7).toFixed(1)+'px)';
    });
    el.addEventListener('mouseleave',function(){el.style.transform=''});
  });
})();

/* scramble 已移除：中文导航字符宽度不等，hover 解码会造成布局跳动 */

/* ---------- 笔记筛选与单篇路由 ---------- */
(function(){
  var back=document.createElement('button');
  back.className='jback';back.textContent='← 返回笔记列表';
  back.addEventListener('click',function(){location.hash='#/journal'});
  var posts=document.querySelector('.posts');
  if(posts)posts.parentNode.insertBefore(back,posts);
  window.__journalRoute=function(slug){
    var filt=document.getElementById('jfilter');
    if(filt)filt.style.display=slug?'none':'flex';
    back.classList.toggle('show',!!slug);
    document.querySelectorAll('.post').forEach(function(p){
      var bd=p.querySelector('.post-bd');
      if(slug){
        var match=p.dataset.slug===slug;
        p.classList.toggle('hide',!match);
        if(match){p.classList.add('open');bd.style.maxHeight=(bd.scrollHeight+40)+'px'}
      }else{
        p.classList.remove('open');bd.style.maxHeight='0px';
        p.classList.remove('hide');
        var on=document.querySelector('#jfilter button.on');
        var t=on?on.dataset.t:'all';
        if(t!=='all'&&p.dataset.tags.indexOf(t)<0)p.classList.add('hide');
      }
    });
  };
  document.querySelectorAll('#jfilter button').forEach(function(b){
    b.addEventListener('click',function(){
      document.querySelectorAll('#jfilter button').forEach(function(x){x.classList.remove('on')});
      b.classList.add('on');
      window.__journalRoute('');
    });
  });
})();

/* ---------- Lightbox 左右切换 ---------- */
(function(){
  var lb=document.getElementById('lightbox');if(!lb)return;
  var img=document.getElementById('lbImg'),cap=document.getElementById('lbCap');
  var items=[],cur=0;
  function visible(){
    return Array.prototype.filter.call(document.querySelectorAll('.work'),function(w){return !w.classList.contains('hide')});
  }
  function show(i){
    items=visible();if(!items.length)return;
    cur=(i+items.length)%items.length;
    var w=items[cur];
    img.src=w.dataset.full;cap.textContent=w.dataset.cap||'';
  }
  ['prev','next'].forEach(function(d){
    var b=document.createElement('button');
    b.className='lb-nav lb-'+d;b.textContent=d==='prev'?'‹':'›';
    b.setAttribute('aria-label',d==='prev'?'上一张':'下一张');
    b.addEventListener('click',function(e){e.stopPropagation();show(cur+(d==='prev'?-1:1))});
    lb.appendChild(b);
  });
  document.querySelectorAll('.work').forEach(function(w){
    w.addEventListener('click',function(){
      items=visible();show(items.indexOf(w));lb.classList.add('on');
    });
  });
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('on'))return;
    if(e.key==='ArrowLeft')show(cur-1);
    if(e.key==='ArrowRight')show(cur+1);
  });
  var sx=null;
  lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
  lb.addEventListener('touchend',function(e){
    if(sx===null)return;
    var dx=e.changedTouches[0].clientX-sx;
    if(Math.abs(dx)>45)show(cur+(dx<0?1:-1));
    sx=null;
  },{passive:true});
})();

/* ---------- 播放器：列表 + 进度 + 时间 ---------- */
(function(){
  var au=document.getElementById('au'),player=document.getElementById('player');
  if(!au||!player)return;
  var nameEl=document.querySelector('.pl-name'),panel=document.getElementById('plPanel');
  var seek=document.getElementById('plSeek'),seekIn=document.getElementById('plSeekIn');
  var timeEl=document.getElementById('plTime'),nextBtn=document.getElementById('plNext');
  var buf=document.getElementById('plBuf'),tip=document.getElementById('plTip'),vol=document.getElementById('plVol');
  var tracks=[
    {name:'Deliberate Thought',src:au.src},
    {name:'Meditation Impromptu 02',src:'data:audio/mp3;base64,__MUSIC2__'}
  ];
  var cur=0;
  function fmt(t){if(!isFinite(t))return'00:00';var m=Math.floor(t/60),s=Math.floor(t%60);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
  function setTrack(i,autoplay){
    cur=(i+tracks.length)%tracks.length;
    var resume=autoplay!==undefined?autoplay:!au.paused;
    au.src=tracks[cur].src;au.load();
    nameEl.textContent=tracks[cur].name;
    document.querySelectorAll('.pl-track').forEach(function(t){t.classList.toggle('on',+t.dataset.i===cur)});
    if(resume){var pr=au.play();if(pr&&pr.catch)pr.catch(function(){})}
  }
  if(nextBtn)nextBtn.addEventListener('click',function(){setTrack(cur+1)});
  document.querySelectorAll('.pl-track').forEach(function(t){
    t.addEventListener('click',function(){setTrack(+t.dataset.i,true)});
  });
  var meta=document.getElementById('plMeta');
  if(meta)meta.addEventListener('click',function(){player.classList.toggle('list')});
  document.addEventListener('click',function(e){
    if(!player.contains(e.target))player.classList.remove('list');
  });
  var plToggle=document.getElementById('plToggle');
  var iconPlay='<svg viewBox="0 0 12 12" width="11" height="11"><path d="M2.5 1.5 10.5 6 2.5 10.5z" fill="currentColor"/></svg>';
  var iconPause='<svg viewBox="0 0 12 12" width="11" height="11"><rect x="2" y="1.5" width="3" height="9" fill="currentColor"/><rect x="7" y="1.5" width="3" height="9" fill="currentColor"/></svg>';
  function syncIcon(){if(plToggle)plToggle.innerHTML=au.paused?iconPlay:iconPause}
  au.addEventListener('play',syncIcon);au.addEventListener('pause',syncIcon);
  au.addEventListener('progress',function(){
    if(buf&&au.duration&&au.buffered.length){
      var e=au.buffered.end(au.buffered.length-1);
      buf.style.width=(e/au.duration*100)+'%';
    }
  });
  au.addEventListener('timeupdate',function(){
    if(au.duration){
      seekIn.style.width=(au.currentTime/au.duration*100)+'%';
      timeEl.textContent=fmt(au.currentTime)+' / '+fmt(au.duration);
    }
  });
  function ratio(e){
    var r=seek.getBoundingClientRect();
    return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
  }
  function seekTo(e){
    if(au.duration){au.currentTime=ratio(e)*au.duration;seekTo.preview=true}
  }
  var dragging=false;
  seek.addEventListener('pointerdown',function(e){dragging=true;seek.setPointerCapture(e.pointerId);seekTo(e)});
  seek.addEventListener('pointermove',function(e){
    if(tip){tip.textContent=au.duration?fmt(ratio(e)*au.duration):'--:--';
      tip.style.left=(ratio(e)*100).toFixed(1)+'%';tip.classList.add('on')}
    if(dragging)seekTo(e);
  });
  seek.addEventListener('pointerleave',function(){if(tip)tip.classList.remove('on')});
  seek.addEventListener('pointerup',function(){dragging=false});
  if(vol){
    au.volume=0.8;
    vol.addEventListener('input',function(){au.volume=vol.value/100});
  }
  syncIcon();
})();

/* ---------- 时段问候 / 今日一句 / 时间进度 ---------- */
(function(){
  var h=new Date().getHours();
  var hello=h<6?'夜深了':h<12?'早上好':h<14?'中午好':h<18?'下午好':'晚上好';
  var hero=document.querySelector('.poster-body .wrap');
  if(hero){
    var g=document.createElement('p');
    g.className='greet';g.textContent=hello+' · 欢迎来到 NEBULA';
    hero.appendChild(g);
  }
  var quotes=[
    '把模糊的想法交给结构，把判断留给自己。',
    '版本可以回退，时间不能——所以每次只改一小步。',
    '最好的版式，是让人先看见内容，再看见设计。',
    '动效不是炫技，是告诉眼睛“这里发生了什么”。',
    '留白不是空，是给注意力留的座位。',
    '一句话说不清楚的需求，多半还没想清楚。'
  ];
  var d=document.getElementById('dailyLine');
  if(d){
    var day=Math.floor(Date.now()/864e5);
    d.querySelector('em').textContent='“'+quotes[day%quotes.length]+'”';
  }
  function markLd(){
    document.querySelectorAll('.ph .wimg').forEach(function(i){
      if(i.complete)i.classList.add('ld');
      else i.addEventListener('load',function(){i.classList.add('ld')},{once:true});
    });
  }
  markLd();window.addEventListener('hashchange',function(){setTimeout(markLd,120)});
  var tl=document.getElementById('timeLine');
  if(tl){
    var now=new Date(),y=new Date(now.getFullYear(),0,1),
      ye=new Date(now.getFullYear()+1,0,1),
      yp=(now-y)/(ye-y)*100,
      m0=new Date(now.getFullYear(),now.getMonth(),1),
      m1=new Date(now.getFullYear(),now.getMonth()+1,1),
      mp=(now-m0)/(m1-m0)*100;
    tl.textContent='TIME · 本年已过 '+yp.toFixed(1)+'% / 本月已过 '+mp.toFixed(0)+'%';
  }
})();

/* ---------- 磁性十字光标（借 ayeezblog，蓝主题适配） ---------- */
(function(){
  if(!window.matchMedia('(pointer:fine)').matches)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var el=document.querySelector('.mcur'),dot=document.querySelector('.mdot');
  if(!el||!dot)return;
  var mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my,raf=null,tgt=null,tr=null;
  var EPS=0.35;
  var SEL=['a[href]','button','[data-mc]','.work','.chip','.nav-link','#burger','#plMeta','#plToggle','#backBtn','#sparkBtn','.thumb','[role="button"]','input','label'].join(',');
  function rect(){if(!tgt){tr=null;return}
    var r=tgt.getBoundingClientRect();tr={cx:r.left+r.width/2,cy:r.top+r.height/2,
      w:r.width+Math.max(10,round(innerWidth/80)),h:r.height+Math.max(10,round(innerWidth/80))};
    el.style.setProperty('--mw',tr.w+'px');el.style.setProperty('--mh',tr.h+'px')}
  function round(n){return Math.round(n)}
  function tick(){raf=null;
    var tx=mx,ty=my;
    if(tgt&&tr){tx=tr.cx;ty=tr.cy}
    var e=tgt?0.22:0.28;
    rx+=(tx-rx)*e;ry+=(ty-ry)*e;
    el.style.transform='translate3d('+rx+'px,'+ry+'px,0)';
    var dx=tx-rx,dy=ty-ry;
    if(dx*dx+dy*dy>EPS*EPS)raf=requestAnimationFrame(tick)}
  function sched(){if(raf==null)raf=requestAnimationFrame(tick)}
  function lock(t){if(tgt===t)return;tgt=t;
    if(tgt){rect();el.style.opacity=1}else{el.style.opacity=.85;
      el.style.setProperty('--mw','34px');el.style.setProperty('--mh','34px');tr=null}
    sched()}
  addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY;
    dot.style.transform='translate3d('+mx+'px,'+my+'px,0)';sched()},{passive:true});
  addEventListener('pointerover',function(e){var t=e.target&&e.target.closest&&e.target.closest(SEL);
    if(t)lock(t)},true);
  addEventListener('pointerout',function(e){if(!tgt)return;
    if(e.relatedTarget&&tgt.contains(e.relatedTarget))return;lock(null)},true);
  addEventListener('scroll',function(){rect();if(tgt)sched()},{passive:true});
  addEventListener('resize',function(){rect();if(tgt)sched()});
})();

/* ---------- 站内搜索 / 访客计数 / giscus 懒加载 ---------- */
(function(){
  var SIDX=window.NEBULA_SIDX||[];
  /* 站内搜索（journal 页） */
  var inp=document.getElementById('jsrchIn'),res=document.getElementById('jsrchRes');
  if(inp&&res){
    var tmr=null;
    function esc(t){return t.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    inp.addEventListener('input',function(){
      clearTimeout(tmr);
      tmr=setTimeout(function(){
        var q=inp.value.trim().toLowerCase();
        if(q.length<1){res.hidden=true;res.innerHTML='';return}
        var hits=SIDX.filter(function(it){
          return it.t.toLowerCase().indexOf(q)>-1||it.b.toLowerCase().indexOf(q)>-1
        }).slice(0,8);
        res.hidden=false;
        res.innerHTML=hits.length?hits.map(function(it){
          var i=it.b.toLowerCase().indexOf(q);
          var snip=i>-1?it.b.slice(Math.max(0,i-24),i+46):it.b.slice(0,60);
          return '<a href="#/'+it.p+(it.s?'/'+it.s:'')+'"><span class="r-s">'+it.k+'</span><span class="r-t">'+esc(it.t)+'</span><div class="r-b">'+esc(snip)+'…</div></a>'
        }).join(''):'<div class="r-empty">没有匹配的结果 · NO MATCH</div>';
      },140);
    });
    inp.addEventListener('keydown',function(e){
      if(e.key==='Enter'){var f=res.querySelector('a');if(f)f.click()}
      if(e.key==='Escape'){res.hidden=true}
    });
    document.addEventListener('click',function(e){
      if(!res.contains(e.target)&&e.target!==inp)res.hidden=true;
    });
  }
  /* 不蒜子访客计数（about 页，懒加载） */
  var line=document.getElementById('visitLine');
  var bzsLoaded=false;
  function loadBzs(){
    if(bzsLoaded)return;bzsLoaded=true;
    var sc=document.createElement('script');
    sc.src='https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    sc.async=true;
    sc.onload=function(){
      // busuanzi 直接渲染到 span#busuanzi_value_*，这里桥接到我们的元素
      var pv=document.getElementById('busuanzi_value_site_pv'),
          uv=document.getElementById('busuanzi_value_site_uv');
      var tries=0;
      var iv=setInterval(function(){
        pv=pv||document.getElementById('busuanzi_value_site_pv');
        uv=uv||document.getElementById('busuanzi_value_site_uv');
        tries++;
        if(pv&&uv&&parseInt(pv.textContent)>=0){
          clearInterval(iv);
          document.getElementById('bzPv').textContent=pv.textContent;
          document.getElementById('bzUv').textContent=uv.textContent;
          line.hidden=false;
        }else if(tries>20){clearInterval(iv)}
      },300);
      var hidden1=document.createElement('span');
      hidden1.style.display='none';
      hidden1.innerHTML='<span id="busuanzi_container_site_pv"><span id="busuanzi_value_site_pv"></span></span><span id="busuanzi_container_site_uv"><span id="busuanzi_value_site_uv"></span></span>';
      document.body.appendChild(hidden1);
    };
    sc.onerror=function(){bzsLoaded=false};
    document.head.appendChild(sc);
  }
  window.addEventListener('hashchange',function(){
    if((location.hash||'').indexOf('#/about')===0)loadBzs();
  });
  if((location.hash||'').indexOf('#/about')===0)loadBzs();
  /* giscus 懒加载 */
  var G=window.NEBULA_GISCUS||{};
  var gLoaded=false;
  function mountG(box){
    if(!G.repoId||!G.categoryId){
      box.innerHTML='<p class="g-hint">COMMENTS · 留言区即将开放（GitHub Discussions）</p>';
      return;
    }
    if(box.dataset.done)return;box.dataset.done='1';
    var io=new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(!en.isIntersecting||gLoaded&&box.querySelector('.gsc'))return;
        gLoaded=true;
        var s=document.createElement('script');
        s.src='https://giscus.app/client.js';
        s.setAttribute('data-repo',G.repo);
        s.setAttribute('data-repo-id',G.repoId);
        s.setAttribute('data-category',G.category);
        s.setAttribute('data-category-id',G.categoryId);
        s.setAttribute('data-mapping','pathname');
        s.setAttribute('data-strict','0');
        s.setAttribute('data-reactions-enabled','1');
        s.setAttribute('data-emit-metadata','0');
        s.setAttribute('data-theme','light');
        s.setAttribute('data-lang','zh-CN');
        s.setAttribute('crossorigin','anonymous');
        s.async=true;
        box.appendChild(s);
        io.disconnect();
      });
    },{rootMargin:'300px'});
    io.observe(box);
  }
  document.querySelectorAll('[data-gb]').forEach(mountG);
})();
