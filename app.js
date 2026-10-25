/* =====================================================================
   CubeLab – app.js
   Quick map (search for these headings):
   DATA ........ beginner notation text and the algorithm lists (variable M)
   cube simulator + diagrams ... how the case pictures are drawn
   fastest-cross finder ........ the "Show fastest cross" button
   edit / add your own algs .... ✎ Edit and ＋ Add another way
   scramble library ............ Scrambles page
   interactive 3D cube ......... drag-to-rotate cube and the ▶ Watch player
   beginner lessons ............ the LS array = the 7 beginner steps
   advanced sets ............... OLLS (57 OLL), PLL list, F2L list (F2)
   STATE / NAV / LEARN / ALGS / TIMER / TRAINER / EVENTS ... the pages
   ===================================================================== */
const $=s=>document.querySelector(s);
const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const chip=a=>`<code class="alg" data-c="${a}" title="Tap to copy">${a}</code>`;
const A=(n,a,t="")=>({n,a,t});

/* ---------- DATA ---------- */
const NOT=`<div class="card"><h3>Notation</h3><p class="mu">U D L R F B = turn that face clockwise (as you look at it). ' = counter-clockwise, 2 = half turn. M = middle slice (turns like L). f = F plus the middle slice behind it. Tap any algorithm to copy it.</p></div>`;
const SUNE=A("Sune","R U R' U R U2 R'","One corner twisted, yellow on the front-left"),ANTI=A("Anti-Sune","R U2 R' U' R U' R'","Mirror of Sune"),
HC=A("H","F R U R' U' R U R' U' R U R' U' F'","No corner oriented, two on each side"),
UA=A("Ua","R U' R U R U R U' R' U' R2","3-edge cycle, solved edge at the back"),UB=A("Ub","R2 U R U R' U' R' U' R' U R'","3-edge cycle the other way"),
HP=A("H perm","M2 U M2 U2 M2 U M2","Swaps opposite edge pairs"),ZP=A("Z perm","M' U M2 U M2 U M' U2 M2","Swaps adjacent edge pairs");
const M={
CFOP:{d:"Cross → F2L → OLL → PLL. The most popular speedsolving method. Start with the 2-look versions of OLL and PLL below, then expand.",sets:{
F2L:[A("Easy insert (right)","U R U' R'","Paired corner + edge on top, slot at front-right"),A("Easy insert (left)","U' F' U F","Mirror case for the front-left slot"),A("Sledgehammer","R' F R F'","Corner in slot, edge above it"),A("Pop out the corner","R U R'","Lift a corner out of its slot to re-pair it"),A("Pop out (left)","F' U' F","Mirror of the above")],
OLL:[A("Dot → line","F R U R' U' F' f R U R' U' f'","Dot edge case, 2-look"),A("Line","F R U R' U' F'","Line horizontal"),A("L-shape","f R U R' U' f'","L-shape, edges at back and left"),SUNE,ANTI,A("T-shape","R U R' U' R' F R F'","Top cross made, T-shaped corners")],
PLL:[A("Aa","x R' U R' D2 R U' R' D2 R2","Corner 3-cycle"),A("Ab","x R2 D2 R U R' D2 R U' R","Corner 3-cycle the other way"),UA,UB,HP,ZP,A("T","R U R' U' R' F R2 U' R' U' R U R' F'","Swaps two corners and two edges"),A("Y","F R U' R' U' R U R' F' R U R' U' R' F R F'","Swaps diagonal corners"),A("Jb","R U R' F' R U R' U' R' F R2 U' R'","Swaps two corners and adjacent edges"),A("Na","R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'","Swaps two corners and two edges"),A("Nb","R' U R U' R' F' U' F R U R' F R' F' R U' R","Mirror of Na")]}},
Roux:{d:"First block → second block → CMLL → LSE. Few moves, mostly M and U turns. Blocks are intuitive; below are the last-two-step algs.",sets:{
CMLL:[SUNE,ANTI,HC],
LSE:[A("Ua (M-slice)","M2 U M U2 M' U M2","3-edge cycle"),A("Ub (M-slice)","M2 U' M U2 M' U' M2","3-edge cycle the other way"),HP,ZP]}},
ZZ:{d:"EOLine → F2L with R, U, L only → last layer. No cube rotations needed. Edge orientation is intuitive; below are common last-layer algs.",sets:{
COLL:[SUNE,ANTI,HC],
EPLL:[UA,UB,HP,ZP]}}
};
/* ---- tiny cube simulator + case diagrams ---- */
const MV={U:[1,[1],-1],D:[1,[-1],1],R:[0,[1],-1],L:[0,[-1],1],F:[2,[1],-1],B:[2,[-1],1],M:[0,[0],1],E:[1,[0],1],S:[2,[0],-1],r:[0,[0,1],-1],l:[0,[-1,0],1],u:[1,[0,1],-1],d:[1,[-1,0],1],f:[2,[0,1],-1],b:[2,[-1,0],1],x:[0,[-1,0,1],-1],y:[1,[-1,0,1],-1],z:[2,[-1,0,1],-1]};
const rv=(v,a,k)=>{for(;k>0;k--){const[x,y,z]=v;v=a==0?[x,-z,y]:a==1?[z,y,-x]:[-y,x,z]}return v};
function mv(S,t){const[a,L,k0]=MV[t[0]];let k=t.endsWith("'")?-k0:k0;if(t.endsWith("2"))k=2;const n=((k%4)+4)%4;S.forEach(s=>{if(L.includes(s.p[a])){s.p=rv(s.p,a,n);s.n=rv(s.n,a,n)}})}
function cube(){const S=[];for(let x=-1;x<2;x++)for(let y=-1;y<2;y++)for(let z=-1;z<2;z++)for(const[n,c]of[[[1,0,0],"R"],[[-1,0,0],"L"],[[0,1,0],"U"],[[0,-1,0],"D"],[[0,0,1],"F"],[[0,0,-1],"B"]])if(x*n[0]+y*n[1]+z*n[2]==1)S.push({p:[x,y,z],n:[...n],c,o:[x,y,z]});return S}
function caseState(a){const S=cube();a.split(" ").filter(t=>"xyz".includes(t[0])).forEach(t=>mv(S,t));inv(a).split(" ").forEach(t=>mv(S,t));return S}
const GM={OLL:1,OCLL:1,CMLL:1,PLL:2,LSE:2,F2L:3};
function iso(a){const S=caseState(a),C={U:"#f5c518",D:"#f2f2f2",F:"#22a55a",B:"#2f6df0",R:"#e03a3a",L:"#f58220"},pr=(x,y,z)=>[(50+(x-z)*12.2).toFixed(1),(50-(-x+2*y-z)*7.1).toFixed(1)];let o="";
for(const s of S){const[nx,ny,nz]=s.n;if(nx<1&&ny<1&&nz<1)continue;const[x,y,z]=s.p,t=ny?[[1,0,0],[0,0,1]]:nx?[[0,1,0],[0,0,1]]:[[1,0,0],[0,1,0]],c=[x+nx/2,y+ny/2,z+nz/2],q=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>pr(...c.map((v,k)=>v+.44*(i*t[0][k]+j*t[1][k]))));
const k=s.o.join(),pair=k=="1,-1,1"||k=="1,0,1";
o+=`<polygon points="${q.map(p=>p.join()).join(" ")}" fill="${pair||s.o[1]<1?C[s.c]:"#8d8d94"}" stroke="#1b1b1d" stroke-width="1.3"/>`}
return `<svg class="dg" viewBox="0 0 100 100" aria-hidden="true">${o}</svg>`}
function dia(a,set){const m=GM[set];if(!m)return"";if(m==3)return iso(a);const S=caseState(a),C={U:"#f5c518",D:"#f2f2f2",F:"#22a55a",B:"#2f6df0",R:"#e03a3a",L:"#f58220"};let o="";
for(const s of S){if(s.p[1]!=1)continue;const[x,,z]=s.p,[nx,ny,nz]=s.n;let X,Y,w=20,h=20;
if(ny==1){X=17+(x+1)*22;Y=17+(z+1)*22}else if(nz==1){X=17+(x+1)*22;Y=87;h=7}else if(nz==-1){X=17+(x+1)*22;Y=6;h=7}else if(nx==1){X=87;Y=17+(z+1)*22;w=7}else if(nx==-1){X=6;Y=17+(z+1)*22;w=7}else continue;
o+=`<rect x="${X}" y="${Y}" width="${w}" height="${h}" rx="3" fill="${m==1?(s.c=="U"?C.U:"#8d8d94"):C[s.c]}"/>`}
return `<svg class="dg" viewBox="0 0 100 100" aria-hidden="true"><rect x="14" y="14" width="72" height="72" rx="6" fill="#1b1b1d"/>${o}</svg>`}
/* ---- fastest-cross finder: tables are built lazily on the first click, then cached ---- */
const EM=["U","U'","U2","D","D'","D2","L","L'","L2","R","R'","R2","F","F'","F2","B","B'","B2"],CN={U:"White",D:"Yellow",F:"Green",B:"Blue",R:"Red",L:"Orange"},FN={U:"top",D:"bottom",F:"front",B:"back",R:"right",L:"left"};
let ES,EP,EI,CT={};
const isE=v=>v.filter(x=>x).length==2,ky=a=>((a[0]*24+a[1])*24+a[2])*24+a[3];
function eInit(){if(ES)return;ES=cube().filter(s=>isE(s.p));EI={};ES.forEach((s,i)=>EI[s.p+"|"+s.n]=i);EP=EM.map(t=>ES.map(s=>{const c={p:[...s.p],n:[...s.n]};mv([c],t);return EI[c.p+"|"+c.n]}))}
function cTab(X){if(CT[X])return CT[X];eInit();const d=new Int8Array(331776).fill(-1),g=[];ES.forEach((s,i)=>{if(s.c==X)g.push(i)});const k0=ky(g);d[k0]=0;let fr=[k0];
for(let k=0;fr.length;k++){const nx=[];for(const q of fr){const a=q/13824|0,b=(q/576|0)%24,c=(q/24|0)%24,e=q%24;for(let m=0;m<18;m++){const P=EP[m],r=((P[a]*24+P[b])*24+P[c])*24+P[e];if(d[r]<0){d[r]=k+1;nx.push(r)}}}fr=nx}return CT[X]=d}
function csol(X,S){const d=cTab(X);let q=ky(S.filter(s=>s.c==X&&isE(s.o)).map(s=>EI[s.p+"|"+s.n])),seq=[];const n=d[q];
while(d[q]>0){for(let m=0;m<18;m++){const a=q/13824|0,b=(q/576|0)%24,c=(q/24|0)%24,e=q%24,P=EP[m],r=((P[a]*24+P[b])*24+P[c])*24+P[e];if(d[r]==d[q]-1){seq.push(EM[m]);q=r;break}}}return{X,n,s:seq.join(" ")}}
async function cx(){const e=$("#cx");if(!e.hidden){e.hidden=true;return}e.hidden=false;e.textContent="Calculating…";const S=cube();T.scr.split(" ").forEach(t=>mv(S,t));const r=[];
for(const X of "UDFBRL"){await new Promise(f=>setTimeout(f));r.push(csol(X,S))}r.sort((a,b)=>a.n-b.n);const b=r[0];
e.innerHTML=`<h3>Fastest cross: ${CN[b.X]} (${b.n} moves)</h3><p class="mu">Hold white on top and green in front, the same way you scramble. The ${CN[b.X].toLowerCase()} cross ends on the ${FN[b.X]} face.</p>${b.s?chip(b.s):"<p>Already solved!</p>"}<p class="mu" style="margin-top:8px">All colors:</p>`+r.map(x=>`<div class="mu">${CN[x.X]} cross on ${FN[x.X]} · ${x.n} moves${x.s?chip(x.s):""}</div>`).join("")}
/* ---- edit / add your own algorithms (saved in this browser) ---- */
let ED=null;
function nrm(s){s=s.replace(/[’‘]/g,"'").replace(/[()]/g," ").replace(/([UDLRFB])w/g,(m,c)=>c.toLowerCase()).replace(/2'/g,"2").replace(/\s+/g," ").trim();return s&&s.split(" ").every(t=>/^[UDLRFBMESudlrfbxyz](2|')?$/.test(t))?s:null}
function chk(orig,alt,set){const S=caseState(orig),R=[];alt.split(" ").forEach(t=>{if("xyz".includes(t[0]))R.push(t);mv(S,t)});R.reverse().forEach(t=>mv(S,t.endsWith("'")?t.slice(0,-1):t.endsWith("2")?t:t+"'"));
const NM={U:"0,1,0",D:"0,-1,0",F:"0,0,1",B:"0,0,-1",R:"1,0,0",L:"-1,0,0"},ok=s=>s.p.join()==s.o.join()&&s.n.join()==NM[s.c];
if(set=="F2L")return S.every(s=>s.o[1]==1||ok(s));if(GM[set]==1)return S.every(s=>s.n.join()!="0,1,0"||s.c=="U");
for(let k=0;k<4;k++){if(S.every(ok))return true;mv(S,"U")}return false}
function setMain(id,v){for(const m in M)for(const s in M[m].sets)M[m].sets[s].forEach(c=>{if(c.id==id)c.a=v});ALL.forEach(x=>{if(x.id==id)x.a=v})}
function alts(c,s){const id=c.id,L=UX[id]||[],
ed=(i,v)=>ED&&ED.id==id&&ED.i==i?`<div class="row"><input id="ei" value="${(ED.v??v).replace(/"/g,"&quot;")}" placeholder="R U R' U'"><button class="btn pr" data-e="sv">${ED.w?"Save anyway":"Save"}</button><button class="btn" data-e="cn">Cancel</button></div><div class="bad" style="font-size:.85rem">${ED.m||""}</div>`:"",
mb=(a,i,l)=>`<button class="mb" data-e="${a}" data-id="${id}" data-i="${i}" data-s="${s}">${l}</button>`,
ok=x=>chk(id,x,s)?`<span class="ok">✓ same case</span>`:`<span class="bad">✗ different case</span>`,here=i=>ED&&ED.id==id&&ED.i==i;
return (here(-2)?ed(-2,c.a):`<div class="ar">${c.a!=id?`<span class="mu">Edited</span> ${ok(c.a)} `:""}${mb("wt",-2,"▶ Watch")}${mb("ed",-2,"✎ Edit")}${c.a!=id?mb("rs",-2,"Reset to original"):""}</div>`)+
L.map((x,i)=>here(i)?ed(i,x):`<div class="ar">${chip(x)}${ok(x)} ${mb("wt",i,"▶")}${mb("ed",i,"✎")}${mb("dl",i,"🗑")}</div>`).join("")+(here(-1)?ed(-1,""):`<div class="ar">${mb("ad",-1,"＋ Add another way")}</div>`)}
function edAct(t){const a=t.dataset.e,id=t.dataset.id,i=+t.dataset.i,s=t.dataset.s;
if(a=="wt"){const c=ALL.find(x=>x.id==id)||{a:id,n:"Algorithm"},al=i>=0?UX[id][i]:c.a;watch(al,caseState(c.a),(c.n||"Algorithm")+(i>=0?" (your way)":""));return}
if(a=="ed"||a=="ad"){ED={id,i,s};fill();const x=$("#ei");if(x){x.focus();x.select()}return}
if(a=="cn"){ED=null;return fill()}
if(a=="dl"){UX[id].splice(i,1);if(!UX[id].length)delete UX[id];ls.set("cl_ua",UX);return fill()}
if(a=="rs"){delete UO[id];ls.set("cl_uo",UO);setMain(id,id);return fill()}
if(a=="sv"){const raw=$("#ei").value,v=nrm(raw);ED.v=v||raw;
if(!v){ED.m="Use space-separated moves, e.g. R U R' U'. Allowed: U D L R F B, M E S, r l u d f b, x y z.";return fill()}
if(!ED.w&&!chk(ED.id,v,ED.s)){ED.w=1;ED.m="This doesn’t seem to solve this case. Check the moves, or press Save anyway.";return fill()}
if(ED.i==-2){if(v==id)delete UO[id];else UO[id]=v;ls.set("cl_uo",UO);setMain(id,v)}
else{const L=UX[id]=UX[id]||[];if(ED.i==-1){if(!L.includes(v))L.push(v)}else L[ED.i]=v;ls.set("cl_ua",UX)}
ED=null;fill()}}
/* ---- scramble library: saved + most-used scrambles ---- */
const IC={timer:"⏱",scr:"🔀",learn:"🎓",cfop:"🧩",roux:"🧱",zz:"⚡",trainer:"🎯"};
function scInfo(){const u=$("#su");if(!u)return;const r=times.filter(x=>x.s==T.scr).map(x=>x.t);u.textContent=r.length?`used ${r.length}× · best ${fmt(Math.min(...r))}`:"new scramble";const b=$("#sv");if(b)b.textContent=PIN.includes(T.scr)?"★ Saved":"☆ Save"}
const sst=s=>{const r=times.filter(x=>x.s==s).map(x=>x.t);return r.length?`used ${r.length}× · best ${fmt(Math.min(...r))} · avg ${fmt(r.reduce((a,b)=>a+b,0)/r.length)}`:"not solved yet"};
const srow=s=>`<div class="card"><code class="alg" data-c="${s}" title="Tap to copy">${s}</code><div class="row"><span class="mu">${sst(s)}</span><span style="flex:1"></span><button class="mb" data-x="use" data-s="${s}">▶ Use</button><button class="mb" data-x="pin" data-s="${s}">${PIN.includes(s)?"★ Saved":"☆ Save"}</button></div></div>`;
function vScr(){const c={};times.forEach(x=>c[x.s]=(c[x.s]||0)+1);const many=Object.keys(c).filter(s=>c[s]>1).sort((a,b)=>c[b]-c[a]).slice(0,20);
return `<div class="card"><h2>Scramble library</h2><p class="mu">Save scrambles you want to practice, or add your own. Anything you solve more than once shows up under “Used many times”.</p><div class="row"><input id="ai" placeholder="Paste a scramble, e.g. R U R' F2 D…"><button class="btn pr" data-x="add">Add</button></div><div class="bad" id="ae" style="font-size:.85rem"></div></div><h3 style="margin:16px 4px 8px">★ Saved (${PIN.length})</h3>${PIN.map(srow).join("")||`<p class="mu">Nothing saved yet. Tap ☆ Save under a scramble on the Timer page.</p>`}<h3 style="margin:16px 4px 8px">🔁 Used many times</h3>${many.map(srow).join("")||`<p class="mu">No repeats yet. Press “Do it again” on the Timer page to practice the same scramble.</p>`}`}
function scAct(t){const x=t.dataset.x,s=t.dataset.s;
if(x=="use"){go("timer");newScr(s);return}
if(x=="pin"){const i=PIN.indexOf(s);i<0?PIN.push(s):PIN.splice(i,1);ls.set("cl_pin",PIN);return render()}
if(x=="add"){const v=nrm($("#ai").value);if(!v){$("#ae").textContent="Use space-separated moves, e.g. R U R' F2.";return}if(!PIN.includes(v)){PIN.unshift(v);ls.set("cl_pin",PIN)}render()}}
/* ---- interactive 3D cube + animation player ---- */
const CC={U:"#f5c518",D:"#f2f2f2",F:"#22a55a",B:"#2f6df0",R:"#e03a3a",L:"#f58220"},iv=t=>t.endsWith("'")?t.slice(0,-1):t.endsWith("2")?t:t+"'";
const rot=(v,a,t)=>{const c=Math.cos(t),s=Math.sin(t),[x,y,z]=v;return a==0?[x,y*c-z*s,y*s+z*c]:a==1?[x*c+z*s,y,-x*s+z*c]:[x*c-y*s,x*s+y*c,z]};
const cp=s=>({p:[...s.p],n:[...s.n],c:s.c,o:s.o}),stOf=m=>{const S=cube();m.split(" ").filter(x=>x).forEach(t=>mv(S,t));return S};
function cube3d(cv,S0){const x=cv.getContext("2d"),W=cv.width;let S=S0.map(cp),yw=-.65,pt=.5,an=null,dn=0;
const api={sp:1,get:()=>S,set(s){S=s.map(cp);draw()},view(a,b){yw=a;pt=b;draw()},go(t,fast){return new Promise(r=>{const[a,L,k0]=MV[t[0]];let k=t.endsWith("'")?-k0:k0;if(t.endsWith("2"))k=2;if(fast){mv(S,t);draw();return r()}
an={a,L,to:k*Math.PI/2,th:0,t0:0,d:(k==2?520:340)/api.sp,t,r};requestAnimationFrame(fr)})}};
function fr(ts){if(!an)return;if(!an.t0)an.t0=ts;const q=Math.min(1,(ts-an.t0)/an.d);an.th=an.to*q*q*(3-2*q);draw();if(q<1)requestAnimationFrame(fr);else{mv(S,an.t);const r=an.r;an=null;draw();r()}}
function draw(){x.clearRect(0,0,W,W);const cs=Math.cos(yw),sn=Math.sin(yw),cq=Math.cos(pt),sq=Math.sin(pt),sc=W/6.3,V=v=>{const X=v[0]*cs+v[2]*sn,Z=v[2]*cs-v[0]*sn;return[X,v[1]*cq-Z*sq,v[1]*sq+Z*cq]},L=[];
for(const s of S){const m=an&&an.L.includes(s.p[an.a]),R=v=>m?rot(v,an.a,an.th):v,vis=V(R(s.n))[2]>0;if(!vis&&!an)continue;
const[nx,ny,nz]=s.n,t=ny?[[1,0,0],[0,0,1]]:nx?[[0,1,0],[0,0,1]]:[[1,0,0],[0,1,0]],c=[s.p[0]+nx/2,s.p[1]+ny/2,s.p[2]+nz/2],
q=h=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>V(R(c.map((v,k)=>v+h*(i*t[0][k]+j*t[1][k])))));L.push({z:V(R(c))[2],vis,o:q(.5),i:q(.43),c:s.c})}
L.sort((a,b)=>a.z-b.z);const P=(a,fl)=>{x.beginPath();a.forEach((p,i)=>x[i?"lineTo":"moveTo"](W/2+p[0]*sc,W/2-p[1]*sc));x.closePath();x.fillStyle=fl;x.fill()};
for(const l of L){P(l.o,"#16161a");if(l.vis)P(l.i,CC[l.c])}}
cv.onpointerdown=e=>{dn=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId)};
cv.onpointermove=e=>{if(!dn)return;yw+=(e.clientX-dn[0])*.012;pt=Math.max(-1.45,Math.min(1.45,pt+(e.clientY-dn[1])*.012));dn=[e.clientX,e.clientY];draw()};
cv.onpointerup=cv.onpointercancel=()=>dn=0;draw();return api}
/* watch-an-algorithm player */
const VW={tk:[],pos:0,pl:0,bz:0,st:null,api:null,top:0},wait=ms=>new Promise(r=>setTimeout(r,ms));
function watch(alg,st,title){$("#vw").hidden=false;$("#vt").textContent=title||"Watch";VW.tk=alg.split(" ").filter(x=>x);VW.pos=0;VW.pl=0;VW.st=st;VW.top=0;$("#vtop").textContent="Top view";if(!VW.api)VW.api=cube3d($("#vcv"),st);VW.api.set(st);VW.api.view(-.65,.5);
$("#vk").innerHTML=VW.tk.map((t,i)=>`<span id="k${i}">${t}</span>`).join("")||"<span>Drag to look around</span>";vmark();vupd();setTimeout(()=>{if(VW.tk.length)vplay()},350)}
function vmark(){VW.tk.forEach((t,i)=>{const e=$("#k"+i);if(e)e.className=i<VW.pos-1?"dn":i==VW.pos-1?"cur":""})}
function vupd(){$("#vp").textContent=VW.pl?"⏸ Pause":"▶ Play"}
async function vstep(d){if(VW.bz)return;VW.bz=1;if(d>0&&VW.pos<VW.tk.length){const t=VW.tk[VW.pos++];vmark();await VW.api.go(t)}else if(d<0&&VW.pos>0){const t=VW.tk[--VW.pos];vmark();await VW.api.go(iv(t))}VW.bz=0}
async function vplay(){if(VW.pl){VW.pl=0;vupd();return}if(VW.pos>=VW.tk.length){await vrs()}VW.pl=1;vupd();while(VW.pl&&VW.pos<VW.tk.length){await vstep(1);await wait(120)}VW.pl=0;vupd()}
async function vrs(){VW.pl=0;while(VW.bz)await wait(30);VW.api.set(VW.st);VW.pos=0;vmark();vupd()}
$("#vx").onclick=()=>{VW.pl=0;$("#vw").hidden=true};$("#v0").onclick=vrs;$("#vb").onclick=()=>{VW.pl=0;vupd();vstep(-1)};$("#vf").onclick=()=>{VW.pl=0;vupd();vstep(1)};$("#vp").onclick=vplay;
$("#vs").onchange=e=>{VW.api&&(VW.api.sp=+e.target.value)};$("#vtop").onclick=e=>{VW.top=!VW.top;VW.api.view(VW.top?0:-.65,VW.top?1.45:.5);e.target.textContent=VW.top?"3D view":"Top view"};
/* ---- beginner lessons ---- */
let PR,CH=Promise.resolve(),LD=ls.get("cl_done",[]);const qq=f=>CH=CH.then(f);
const LS=[
["1. Daisy, then white cross","Goal: a white cross on the bottom. First make a “daisy”: the 4 white edge pieces around the yellow center, white facing up. Then match each petal with its side color and flip it down. Stuck? Press “Show me the white cross” on the practice cube.",[],[["White piece at the bottom → turn that side twice","","F2"],["White piece in the middle layer → turn the side that lifts it","R","R"],["White piece on top but sideways → go down one, then lift","L' F","F' L'"],["Match the side color, then turn that side twice","F2 R2 B2 L2 U","U' L2 B2 R2 F2"],["What a finished daisy looks like","F2 R2 B2 L2",""]]],
["2. White corners","Find a white corner on the top. Turn the top until it sits right above its spot (between its two side colors). Repeat the trick until it drops in with white facing down.",[["Corner trick – repeat until white is down","R U R' U'",3]],[]],
["3. Middle layer","Find a top edge with no yellow. Turn the top until its front color matches the center below it. Then send it right or left.",[["Edge goes right","U R U' R' U' F' U F"],["Edge goes left","U' L' U L U F U' F'"]],[]],
["4. Yellow cross","Look at the yellow stickers on top: a dot, an L or a line. Do the moves until you see a yellow cross.",[["Make the yellow cross","F R U R' U' F'"]],[]],
["5. Match the yellow edges","Turn the top until at least one edge matches its center. Do the moves (holding the matched edge at the back) until all four match.",[["Match the edges","R U R' U R U2 R' U"]],[]],
["6. Place the yellow corners","Find a corner that already sits between its three right colors (it may be twisted). Hold it at the front-right and do the moves until all four are in place.",[["Move corners to the right spot","U R U' L' U R' U' L"]],[]],
["7. Twist the last corners","Hold an unsolved corner at the front-right-top. Repeat the short moves until its yellow faces up, then turn only the top to bring the next one. The cube looks messy in between – it’s normal!",[["Twist a corner (repeat)","R' D' R D",2]],[]]];
function vLearn2(){return `<div class="card"><h2>Try it yourself</h2><p class="mu">Drag the cube to look around. Tap a move to see it happen. White is the bottom, yellow is the top.</p><canvas id="pc" class="cb" width="600" height="600"></canvas><div class="row tb" style="margin-top:10px">${["U","U'","D","D'","L","L'","R","R'","F","F'","B","B'"].map(m=>`<button class="mb" data-p="${m}">${m}</button>`).join("")}</div><div class="row tb" style="margin-top:10px"><button class="btn" data-p="sc">🔀 Scramble</button><button class="btn" data-p="rs">↺ Solved</button><button class="btn pr" data-p="hint">💡 Show me the white cross</button></div><p class="mu" id="pm" style="text-align:center">R = right face, L = left, U = up, D = down, F = front, B = back. A ′ means turn it the other way.</p></div>`+
LS.map(([t,d,al,dm],i)=>`<div class="card"><div class="sch"><h3>${t}</h3><button class="mb" data-d="${i}">${LD.includes(i)?"✓ Done":"Mark done"}</button></div><p>${d}</p>`+dm.map(([l],k)=>`<div class="ar"><button class="mb" data-l="${i}.d.${k}">▶ Watch</button>${l}</div>`).join("")+al.map(([n,a,r],j)=>`<div class="ar"><span class="mu">${n}</span>${chip(a)}<button class="mb" data-l="${i}.${j}">▶ Watch${r?" (×"+r+")":""}</button></div>`).join("")+`</div>`).join("")+NOT}
function lnAct(t){const[i,j,k]=t.dataset.l.split("."),L=LS[+i];if(j=="d"){const[l,pre,play]=L[3][+k];watch(play,stOf(pre),l);return}
const[n,a,r]=L[2][+j],alg=Array(r||1).fill(a).join(" ");watch(alg,stOf(inv(alg)),n)}
function prAct(t){const p=t.dataset.p;if(p=="rs")qq(()=>PR.set(cube()));else if(p=="sc"){const S=cube();scr(10).split(" ").forEach(m=>mv(S,m));qq(()=>PR.set(S))}
else if(p=="hint")qq(async()=>{const r=csol("D",PR.get());$("#pm").textContent=r.n?`Fastest white cross: ${r.s} (${r.n} moves)`:"The white cross is already done! ✓";for(const m of r.s?r.s.split(" "):[])await PR.go(m)});else qq(()=>PR.go(p))}
/* ---- advanced sets: full OLL (57), full PLL (21), OCLL ---- */
const OLLS=["R U2 R2 F R F' U2 R' F R F'","r U r' U2 R U2 R' U2 r U' r'","r' R2 U R' U r U2 r' U M'","M U' r U2 r' U' R U' R' M'","l' U2 L U L' U l","r U2 R' U' R U' r'","r U R' U R U2 r'","l' U' L U' L' U2 l","R U R' U' R' F R2 U R' U' F'","R U R' U R' F R F' R U2 R'","r U R' U R' F R F' R U2 r'","F R U R' U' F' U F R U R' U' F'","F U R U2 R' U' R U R' F'","R' F R U R' F' R F U' F'","r' U' r R' U' R U r' U r","r U r' R U R' U' r U' r'","R U R' U R' F R F' U2 R' F R F'","r U R' U R U2 r2 U' R U' R' U2 r","M U R U R' U' M' R' F R F'","r U R' U' M2 U R U' R' U' M'","R U2 R' U' R U R' U' R U' R'","R U2 R2 U' R2 U' R2 U2 R","R2 D R' U2 R D' R' U2 R'","r U R' U' r' F R F'","F' r U R' U' r' F R","R U2 R' U' R U' R'","R U R' U R U2 R'","r U R' U' r' R U R U' R'","R U R' U' R U' R' F' U' F R U R'","F R' F R2 U' R' U' R U R' F2","R' U' F U R U' R' F' R","R U B' U' R' U R B R'","R U R' U' R' F R F'","R U R2 U' R' F R U R U2 R'","R U2 R2 F R F' R U2 R'","R' U' R U' R' U R U R B' R' B","F R' F' R U R U' R'","R U R' U R U' R' U' R' F R F'","L F' L' U' L U F U' L'","R' F R U R' U' F' U R","R U R' U R U2 R' F R U R' U' F'","R' U' R U' R' U2 R F R U R' U' F'","R' U' F' U F R","f R U R' U' f'","F R U R' U' F'","R' U' R' F R F' U R","R' U' R' F R F' R' F R F' U R","F R U R' U' R U R' U' F'","r U' r2 U r2 U r2 U' r","r' U r2 U' r2 U' r2 U r'","f R U R' U' R U R' U' f'","R U R' U R d' R U' R' F'","r' U' R U' R' U R U' R' U2 r","r U R' U R U' R' U R U2 r'","R U2 R2 U' R U' R' U2 F R F'","r U r' U R U' R' U R U' R' r U' r'","R U R' U' M' U R U' r'"];
M.CFOP.sets.OLL=OLLS.map((a,i)=>A("OLL "+(i+1),a,i<4||(i>=16&&i<20)?"Dot":i>=20&&i<=26?"Cross (all edges oriented)":""));
M.CFOP.sets.PLL=[["Aa","x R' U R' D2 R U' R' D2 R2"],["Ab","x R2 D2 R U R' D2 R U' R"],["E","x' R U' R' D R U R' D' R U R' D R U' R' D'"],["F","R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"],["Ga","R2 U R' U R' U' R U' R2 U' D R' U R D'"],["Gb","R' U' R U D' R2 U R' U R U' R U' R2 D"],["Gc","R2 U' R U' R U R' U R2 D' U R U' R' D"],["Gd","R U R' U' D R2 U' R U' R' U R' U R2 D'"],["H","M2 U M2 U2 M2 U M2"],["Ja","x R2 F R F' R U2 r' U r U2"],["Jb","R U R' F' R U R' U' R' F R2 U' R' U'"],["Na","R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],["Nb","R' U R U' R' F' U' F R U R' F R' F' R U' R"],["Ra","R U' R' U' R U R D R' U' R D' R' U2 R'"],["Rb","R' U2 R U2 R' F R U R' U' R' F' R2 U'"],["T","R U R' U' R' F R2 U' R' U' R U R' F'"],["Ua","R U' R U R U R U' R' U' R2"],["Ub","R2 U R U R' U' R' U' R' U R'"],["V","R' U R' U' y R' F' R2 U' R' U R' F R F"],["Y","F R U' R' U' R U R' F' R U R' U' R' F R F'"],["Z","M' U M2 U M2 U M' U2 M2"]].map(([n,a])=>A(n+" perm",a));
const OC=[["H",20],["Pi",21],["U",22],["T",23],["L",24],["Anti-Sune",25],["Sune",26]].map(([n,i])=>A(n,OLLS[i],"Orients all four corners (edges already oriented)"));
M.Roux.sets.CMLL=OC;M.ZZ.sets={OCLL:OC,PLL:M.CFOP.sets.PLL};
const F2=[["R U R'",0],["R U' R'",0],["F' U F",0],["F' U' F",0],["F' U' F R U R'",0],["R U R' F' U' F",0],["R U2 R2 F R F'",0],["F' U2 F2 R' F' R",0],["R U R' U2 R U' R'",0],["R U' R' U R U R'",0],["R U' R' U' R U R'",0],["R U2 R' U' R U R'",0],["R U2 R' U2 R U' R'",0],["R' U2 R2 U R2 U R",0],["R2 U2 R' U' R U' R2",0],["F' U F U2 R U R'",0],["R U' R' U F' U' F",0],["R U' R' U2 F' U' F",0],["R U2 R' U F' U' F",0],["R2 U2 F R2 F' U2 R2",0],["F2 U2 R' F R U2 F2",0],["F2 U2 R' F' R U2 F2",0],["F' U F U' F' U' F",0],["F2 U2 F U F' U F2",0],["F' U F R U R'",1],["F' U2 F R U2 R'",1],["R U' R' F' U' F",1],["R U2 R' F' U2 F",1],["F' U F U R U' R'",1],["R U' R' F R' F' R",1],["F' U2 F R U R'",2],["R U' R' U2 R U' R'",2],["R U2 R' U R U R'",2],["R2 U2 R2 U' R2 U' R2",2],["F' U' F U R U' R'",2],["R U R' F R' F' R",2],["R U2 R U R' U R U2 R2",3],["R2 U2 R' U' R U' R' U2 R'",3],["R F U R U' R' F' U' R'",3],["R U F R U R' U' F' R'",3],["R2 U2 F R2 F' U2 R' U R'",3]];
M.CFOP.sets.F2L=F2.map(([a,g],i)=>A("F2L "+(i+1),a,["Corner and edge both in the top layer","Corner in slot, edge on top","Edge in slot, corner on top","Both pieces in the slot"][g]));
const UO=ls.get("cl_uo",{}),UX=ls.get("cl_ua",{});for(const m in M)for(const s in M[m].sets)M[m].sets[s].forEach(c=>{c.id=c.id||c.a;if(UO[c.id])c.a=UO[c.id]});
const ALL=[];for(const m in M)for(const s in M[m].sets)M[m].sets[s].forEach(c=>ALL.some(x=>x.a==c.a&&x.s==s)||ALL.push({...c,m,s,k:m+s+c.n}));
const inv=a=>a.split(" ").reverse().map(x=>x.endsWith("'")?x.slice(0,-1):x.endsWith("2")?x:x+"'").join(" ");

/* ---------- STATE ---------- */
const TABS=[["timer","Timer"],["scr","Scrambles"],["learn","Beginner method"],["cfop","CFOP"],["roux","Roux"],["zz","ZZ"],["trainer","Trainer"]],MT={cfop:"CFOP",roux:"Roux",zz:"ZZ"};
let tab="timer",curM="CFOP",PIN=ls.get("cl_pin",[]),times=ls.get("cl_t",[]),W=ls.get("cl_w",{}),T={s:"idle",t0:0,hold:0,scr:""};

/* ---------- NAV ---------- */
function nav(){$("#ht").textContent="CubeLab · "+TABS.find(x=>x[0]==tab)[1];$("#nav").innerHTML=TABS.map(([k,l])=>`<button data-t="${k}" class="${k==tab?"on":""}"><span class="ic">${IC[k]||""}</span> ${l}</button>`).join("")}
function go(t){clearTimeout(T.hold);if(T.s=="run")T.s="idle";tab=t;if(MT[t])curM=MT[t];$("#nav").hidden=true;nav();render();try{location.hash=t}catch(e){}scrollTo(0,0)}
function render(){$("#app").innerHTML=({cfop:vAlgs,roux:vAlgs,zz:vAlgs,scr:vScr,learn:vLearn2,timer:vTimer,trainer:vTrainer})[tab]();if(MT[tab])fill();if(tab=="learn")PR=cube3d($("#pc"),cube());if(tab=="timer"){newScr();stats()}if(tab=="trainer")nextCase()}

/* ---------- LEARN ---------- */
/* ---------- ALGS ---------- */
function vAlgs(){return `<div class="card"><h2>${curM}</h2><p>${M[curM].d}</p><p class="mu">Each picture shows the top layer from above before you run the algorithm: yellow on top, front of the cube at the bottom of the picture. Grey means “not yellow” (OLL / CMLL); PLL pictures show the real side colors. F2L pictures show the cube from the top-front-right corner; the pair goes into the front-right slot and grey pieces can be anything.</p></div><input id="q" type="search" placeholder="Search name or moves…"><div id="al"></div>`+NOT}
function fill(){const op=[...document.querySelectorAll("#al details[open]")].map(d=>d.dataset.s),q=($("#q").value||"").toLowerCase(),S=M[curM].sets;
$("#al").innerHTML=Object.keys(S).map(s=>{const r=S[s].filter(c=>(c.n+c.a+c.t).toLowerCase().includes(q));return r.length?`<details data-s="${s}" ${q||r.length<12||op.includes(s)?"open":""} class="card"><summary>${s} <span class="mu">(${r.length})</span></summary>${r.map(c=>`<div class="case cs">${dia(c.a,s)}<div><b>${c.n}</b> <span class="mu">${c.t}</span>${chip(c.a)}${alts(c,s)}</div></div>`).join("")}</details>`:""}).join("")||`<p class="mu">No matches.</p>`}

/* ---------- TIMER ---------- */
const fmt=ms=>{if(ms==null)return"–";const s=ms/1000;if(s<60)return s.toFixed(2);return Math.floor(s/60)+":"+(s%60).toFixed(2).padStart(5,"0")};
const avg=n=>{if(times.length<n)return null;const a=times.slice(-n).map(x=>x.t).sort((x,y)=>x-y).slice(1,-1);return a.reduce((x,y)=>x+y,0)/a.length};
function scr(n=20){const F="UDLRFB",ax={U:0,D:0,L:1,R:1,F:2,B:2};let r=[],l="";while(r.length<n){const f=F[Math.random()*6|0];if(l&&ax[f]==ax[l])continue;l=f;r.push(f+["","'","2"][Math.random()*3|0])}return r.join(" ")}
function newScr(s){T.scr=s||scr();const e=$("#sc");if(e)e.textContent=T.scr;const c=$("#cx");if(c)c.hidden=true;scInfo()}
function vTimer(){return `<div class="card" id="scc"><div class="sch"><b>Scramble</b><span class="mu" id="su"></span></div><p id="sc"></p><div class="row tb"><button class="btn" id="ns">🔀 New</button><button class="btn" id="rp">↻ Do it again</button><button class="btn" id="sv">☆ Save</button><button class="btn" id="cb">🎯 Fastest cross</button></div></div><div id="cx" class="card" hidden></div><div id="tz"><div id="tm">0.00</div><div class="mu" id="hint">Hold Space (or press and hold here), release when green</div></div>
<div class="grid" id="stg"></div><div class="row"><button class="btn" id="dl">Delete last</button><button class="btn" id="ca">Clear all</button></div><div class="card" style="margin-top:12px"><h3>Recent solves</h3><table id="hist"></table></div>`}
function stats(){const e=$("#stg");if(!e)return;const b=times.length?Math.min(...times.map(x=>x.t)):null,m=times.length?times.reduce((x,y)=>x+y.t,0)/times.length:null;
e.innerHTML=[["Best",fmt(b)],["Mean",fmt(m)],["Ao5",fmt(avg(5))],["Ao12",fmt(avg(12))],["Solves",times.length]].map(([l,v])=>`<div class="st"><span class="mu">${l}</span><b>${v}</b></div>`).join("");
$("#hist").innerHTML=times.slice(-12).reverse().map((x,i)=>`<tr><td class="mu">${times.length-i}</td><td><b>${fmt(x.t)}</b></td><td class="mu" style="font-family:ui-monospace,monospace;font-size:.8rem">${x.s}</td></tr>`).join("")||`<tr><td class="mu">No solves yet.</td></tr>`}
const tz=()=>$("#tz");
function tdown(){if(tab!="timer"||!tz())return;if(T.s=="run"){tstop();return}if(T.s=="idle"){T.s="hold";tz().className="hold";T.hold=setTimeout(()=>{if(T.s=="hold"){T.s="ready";tz().className="ready"}},300)}}
function tup(){if(tab!="timer"||!tz())return;if(T.s=="ready"){T.s="run";tz().className="";T.t0=performance.now();$("#hint").textContent="Press any key or tap to stop";(function l(){if(T.s=="run"){$("#tm").textContent=fmt(performance.now()-T.t0);requestAnimationFrame(l)}})()}else if(T.s=="hold"){clearTimeout(T.hold);T.s="idle";tz().className=""}else if(T.s=="wait")T.s="idle"}
function tstop(){const t=performance.now()-T.t0;T.s="wait";$("#tm").textContent=fmt(t);$("#hint").textContent="Hold Space (or press and hold here), release when green";times.push({t,s:T.scr});ls.set("cl_t",times);T.last=T.scr;newScr();stats()}

/* ---------- TRAINER ---------- */
let TR={set:"All",cur:null,ok:0,n:0,rev:false,t0:0,run:false};
const SETS=["All","F2L","OLL","PLL","CMLL","OCLL","LSE"];
function vTrainer(){return `<div class="card"><div class="row"><label for="ts"><b>Train:</b></label><select id="ts">${SETS.map(s=>`<option ${s==TR.set?"selected":""}>${s}</option>`).join("")}</select><span class="mu" id="tst"></span></div></div><div class="card" id="tc"></div><p class="mu">Apply the setup moves to a solved cube, then solve the case. Missed cases come up more often.</p>`}
function nextCase(){const pool=ALL.filter(c=>TR.set=="All"||c.s==TR.set);let tot=pool.reduce((x,c)=>x+(W[c.k]||1),0),r=Math.random()*tot,c=pool[0];for(const p of pool){r-=W[p.k]||1;if(r<=0){c=p;break}}
if(pool.length>1&&TR.cur&&c.k==TR.cur.k)return nextCase();TR.cur=c;TR.rev=false;TR.run=false;trShow()}
function trShow(){const c=TR.cur,e=$("#tc");if(!e)return;$("#tst").textContent=TR.n?`${TR.ok}/${TR.n} correct`:"";
e.innerHTML=`<div class="mu">${c.m} · ${c.s}</div><div class="cs">${dia(c.a,c.s)}<div><h2>${c.n}</h2><p class="mu">Setup moves:</p>${chip(inv(c.a))}</div></div><div class="row"><button class="btn" data-a="sw">${TR.run?"■ Stop":"⏱ Start timer"}</button><span id="trt" style="font:700 1.2rem ui-monospace,monospace"></span></div>
${TR.rev?`<p class="mu" style="margin-top:12px">Solution — ${c.t}</p>${chip(c.a)}${(UX[c.id]||[]).length?`<p class="mu">Your alternatives:</p>${UX[c.id].map(x=>chip(x)).join("")}`:""}<div class="row"><button class="btn" data-a="wt">▶ Watch</button><button class="btn pr" data-a="ok">✓ Got it</button><button class="btn" data-a="no">✗ Missed</button></div>`:`<div class="row" style="margin-top:12px"><button class="btn pr" data-a="rv">Reveal algorithm</button></div>`}`}
function trTick(){if(TR.run){const e=$("#trt");if(e)e.textContent=fmt(performance.now()-TR.t0);requestAnimationFrame(trTick)}}
function trAns(good){const k=TR.cur.k;TR.n++;if(good){TR.ok++;W[k]=Math.max(1,(W[k]||1)-1)}else W[k]=(W[k]||1)+2;ls.set("cl_w",W);nextCase()}

/* ---------- EVENTS ---------- */
document.addEventListener("click",e=>{const t=e.target.closest("[data-t],[data-m],[data-c],[data-a],[data-e],[data-x],[data-l],[data-d],[data-p],#ns,#dl,#ca,#cb,#rp,#sv");if(!t)return;
if(t.dataset.t)return go(t.dataset.t);
if(t.dataset.m){curM=t.dataset.m;return render()}
if(t.dataset.c){try{navigator.clipboard.writeText(t.dataset.c)}catch(x){}const o=t.textContent;t.textContent="Copied ✓";setTimeout(()=>t.textContent=o,700);return}
if(t.dataset.l)return lnAct(t);if(t.dataset.p)return prAct(t);if(t.dataset.d){const i=+t.dataset.d;LD.includes(i)?LD.splice(LD.indexOf(i),1):LD.push(i);ls.set("cl_done",LD);t.textContent=LD.includes(i)?"✓ Done":"Mark done";return}if(t.dataset.x)return scAct(t);if(t.dataset.e)return edAct(t);const a=t.dataset.a;if(a=="wt")return watch(TR.cur.a,caseState(TR.cur.a),TR.cur.n);if(a=="rv"){TR.rev=true;return trShow()}if(a=="ok")return trAns(true);if(a=="no")return trAns(false);
if(a=="sw"){if(TR.run){TR.run=false;const d=performance.now()-TR.t0;trShow();$("#trt").textContent=fmt(d)}else{TR.run=true;TR.t0=performance.now();trShow();trTick()}return}
if(t.id=="cb")return cx();if(t.id=="rp")return newScr(T.last||T.scr);if(t.id=="sv"){const i=PIN.indexOf(T.scr);i<0?PIN.unshift(T.scr):PIN.splice(i,1);ls.set("cl_pin",PIN);return scInfo()}if(t.id=="ns")return newScr();
if(t.id=="dl"){times.pop();ls.set("cl_t",times);return stats()}
if(t.id=="ca"){if(t.dataset.s){times=[];ls.set("cl_t",times);t.textContent="Clear all";delete t.dataset.s;return stats()}t.dataset.s=1;t.textContent="Sure? Tap again"}});
document.addEventListener("input",e=>{if(e.target.id=="q")fill()});
document.addEventListener("change",e=>{if(e.target.id=="ts"){TR.set=e.target.value;nextCase()}});
document.addEventListener("keydown",e=>{if(tab!="timer")return;if(e.code=="Space"){e.preventDefault();if(!e.repeat)tdown()}else if(T.s=="run")tstop()});
document.addEventListener("keyup",e=>{if(tab=="timer"&&e.code=="Space"){e.preventDefault();tup()}});
document.addEventListener("pointerdown",e=>{if(e.target.closest("#tz"))tdown()});
document.addEventListener("pointerup",()=>tup());
addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(TABS.some(t=>t[0]==h)&&h!=tab)go(h)});
{const h=location.hash.slice(1);if(TABS.some(t=>t[0]==h))tab=h;if(MT[tab])curM=MT[tab]}
nav();render();
$("#mb").onclick=()=>{$("#nav").hidden=!$("#nav").hidden};
document.addEventListener("click",e=>{if(!e.target.closest("#nav,#mb"))$("#nav").hidden=true});
