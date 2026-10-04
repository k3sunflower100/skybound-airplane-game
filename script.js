(() => {
  const mount = document.getElementById('game');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const altitudeEl = document.getElementById('altitude');
  const speedEl = document.getElementById('speed');
  const scorePopEl = document.getElementById('score-pop');
  const routeFillEl = document.getElementById('route-fill');
  const routePlaneEl = document.getElementById('route-plane');
  const routePercentEl = document.getElementById('route-percent');
  const audioToggle = document.getElementById('audio-toggle');
  const speedStageButtons = document.querySelectorAll('[data-speed-stage]');
  let speedStage = 2;
  const overlay = document.getElementById('overlay');
  const title = document.getElementById('title');
  const message = document.getElementById('message');
  const startButton = document.getElementById('start-button');
  if (!window.THREE) { title.textContent = '게임을 불러오지 못했어요'; message.textContent = '인터넷 연결을 확인한 뒤 페이지를 새로고침해 주세요.'; startButton.hidden = true; return; }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa9d9ed);
  scene.fog = new THREE.Fog(0xa9d9ed, 95, 390);
  const camera = new THREE.PerspectiveCamera(68, 1, .1, 500);
  camera.position.set(0, 2.3, 8);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  mount.appendChild(renderer.domElement);
  const hemi = new THREE.HemisphereLight(0xeafaff, 0x55734a, 1.55); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d1, 2.25); sun.position.set(-30, 45, 25); sun.castShadow = true; scene.add(sun);

  const plane = new THREE.Group(); scene.add(plane);
  const mat = (color, metalness=0, roughness=.55) => new THREE.MeshStandardMaterial({color,metalness,roughness});
  const bodyMat=mat(0xaeb9c2,.5,.38), glass=mat(0x112b41,.72,.16), dark=mat(0x202b35,.25,.42);
  function mesh(geometry, material, parent=plane, pos=[0,0,0], scale=null) { const o=new THREE.Mesh(geometry,material); o.position.set(...pos); if(scale)o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o; }
  const fuselageStations=[[-3.75,.035,.045],[-3.1,.12,.13],[-2.25,.23,.22],[-1.15,.38,.34],[-.25,.55,.42],[.8,.58,.43],[1.65,.48,.38],[2.45,.39,.31],[3.05,.3,.26],[3.35,.2,.2]];
  const fuselageGeometry=new THREE.BufferGeometry(),fuselageVertices=[],fuselageIndices=[],sides=20;
  fuselageStations.forEach(([z,rx,ry])=>{for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2;fuselageVertices.push(Math.cos(a)*rx,Math.sin(a)*ry,z);}});
  for(let ring=0;ring<fuselageStations.length-1;ring++)for(let i=0;i<sides;i++){const a=ring*sides+i,b=ring*sides+(i+1)%sides,c=(ring+1)*sides+(i+1)%sides,d=(ring+1)*sides+i;fuselageIndices.push(a,b,d,b,c,d);}
  fuselageGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fuselageVertices,3));fuselageGeometry.setIndex(fuselageIndices);fuselageGeometry.computeVertexNormals();bodyMat.side=THREE.DoubleSide;mesh(fuselageGeometry,bodyMat);
  function aircraftSurface(points,material,y=0){const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)shape.lineTo(points[i][0],points[i][1]);shape.closePath();const geometry=new THREE.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.055,bevelThickness:.035});const wing=mesh(geometry,material,plane,[0,y,0]);wing.rotation.x=Math.PI/2;return wing;}
  const wingMat=mat(0x9da9b2,.48,.4);wingMat.side=THREE.DoubleSide;
  aircraftSurface([[-1.35,-1.75],[-4.65,-.55],[-4.25,.32],[-1.85,1.2],[-1.15,2.0],[1.15,2.0],[1.85,1.2],[4.25,.32],[4.65,-.55],[1.35,-1.75]],wingMat,.12);
  aircraftSurface([[-.55,1.35],[-1.8,2.15],[-1.65,2.75],[-.55,2.45],[.55,2.45],[1.65,2.75],[1.8,2.15],[.55,1.35]],wingMat,.12);
  mesh(new THREE.SphereGeometry(.34,24,18),glass,plane,[0,.35,-1.65],[.77,.68,2.05]);
  for(const side of [-1,1]){
    const inlet=mesh(new THREE.BoxGeometry(.16,.52,.66),dark,plane,[side*.66,-.08,-.62]);inlet.rotation.z=side*.12;
    const engine=mesh(new THREE.CylinderGeometry(.27,.33,2.05,18,1),bodyMat,plane,[side*.48,-.2,1.62]);engine.rotation.x=Math.PI/2;
    const nozzle=mesh(new THREE.CylinderGeometry(.31,.35,.34,18,1,true),dark,plane,[side*.48,-.2,2.82]);nozzle.rotation.x=Math.PI/2;
    const exhaustMat=new THREE.MeshStandardMaterial({color:0x78ddff,emissive:0x2299ff,emissiveIntensity:.85,transparent:true,opacity:.85});
    const exhaust=mesh(new THREE.ConeGeometry(.2,.72,12),exhaustMat,plane,[side*.48,-.2,3.28]);exhaust.rotation.x=Math.PI/2;exhaust.userData.base=.85;plane.userData.exhausts??=[];plane.userData.exhausts.push(exhaust);
    const finShape=new THREE.Shape();finShape.moveTo(-.9,0);finShape.lineTo(-2.8,.08);finShape.lineTo(-2.08,1.2);finShape.lineTo(-1.14,1.0);finShape.closePath();const fin=new THREE.Mesh(new THREE.ShapeGeometry(finShape),bodyMat);fin.position.set(side*.68,.2,0);fin.rotation.y=Math.PI/2;fin.material.side=THREE.DoubleSide;fin.castShadow=true;plane.add(fin);fin.rotation.z=side*.15;
    mesh(new THREE.CylinderGeometry(.23,.23,.035,24),mat(0x285b99,.18,.5),plane,[side*2.7,.15,.15]);
    mesh(new THREE.CylinderGeometry(.095,.095,.04,20),mat(0xc84c4c,.1,.5),plane,[side*2.7,.18,.15]);
    mesh(new THREE.BoxGeometry(.12,.1,.42),mat(side<0?0x4fe2a0:0xff5555,.1,.35),plane,[side*4.42,.17,-.35]);
  }

  function makeGrassTexture(){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
    const base=ctx.createLinearGradient(0,0,512,512);base.addColorStop(0,'#78985a');base.addColorStop(.48,'#64894e');base.addColorStop(1,'#8aa365');ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
    for(let i=0;i<2400;i++){const x=Math.random()*512,y=Math.random()*512,r=2+Math.random()*14;ctx.fillStyle=['rgba(39,83,43,.14)','rgba(160,164,91,.14)','rgba(188,174,111,.10)','rgba(75,119,61,.18)'][Math.floor(Math.random()*4)];ctx.beginPath();ctx.ellipse(x,y,r,r*(.25+Math.random()*.45),Math.random(),0,Math.PI*2);ctx.fill();}
    for(let i=0;i<6500;i++){const x=Math.random()*512,y=Math.random()*512;ctx.strokeStyle=['rgba(196,198,125,.48)','rgba(36,82,42,.48)','rgba(116,151,76,.58)','rgba(218,198,129,.3)'][Math.floor(Math.random()*4)];ctx.lineWidth=.6+Math.random()*1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(Math.random()-.5)*3,y-1-Math.random()*7);ctx.stroke();}
    const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(64,64);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();return texture;
  }
  const groundMaterial=mat(0xffffff,0,.98);groundMaterial.map=makeGrassTexture();
  const groundGeometry=new THREE.PlaneGeometry(1800,1800,110,110),groundVertices=groundGeometry.attributes.position;
  for(let i=0;i<groundVertices.count;i++){const x=groundVertices.getX(i),z=groundVertices.getY(i);const hill=Math.sin(x*.008)*1.1+Math.cos(z*.01)*.8+Math.sin((x-z)*.004)*1.25;groundVertices.setZ(i,hill);}
  groundGeometry.computeVertexNormals();const ground=mesh(groundGeometry,groundMaterial,scene,[0,-42,0]);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
  const clouds=[];
  for(let i=0;i<27;i++){ const g=new THREE.Group(); const n=4+Math.floor(Math.random()*5); for(let j=0;j<n;j++){let s=.7+Math.random()*1.7;mesh(new THREE.SphereGeometry(s,10,8),new THREE.MeshLambertMaterial({color:0xf4fbff,transparent:true,opacity:.83}),g,[(Math.random()-.5)*5,(Math.random()-.5)*1.6,(Math.random()-.5)*3],[1,.6,1]);}g.position.set((Math.random()-.5)*115,(Math.random()-.5)*29-10,-20-Math.random()*270);g.userData.speed=.65+Math.random()*.7;scene.add(g);clouds.push(g); }
  const landscapes=[];
  const rockPalette={uluru:[0xb65f3c,0xc7774a,0x9f5036],canyon:[0xc88350,0xd49a62,0xa95d3e]};
  function createUluru(parent,x,z,scale=1){
    const geometry=new THREE.SphereGeometry(1,48,32);const position=geometry.attributes.position;
    for(let i=0;i<position.count;i++){const px=position.getX(i),py=position.getY(i),pz=position.getZ(i);const ridge=Math.sin(py*15+px*4)*.025+Math.sin(px*18+pz*8)*.018;position.setXYZ(i,px*(1+ridge),py*(1+ridge*.7),pz*(1+ridge));}geometry.computeVertexNormals();
    const rock=mesh(geometry,mat(rockPalette.uluru[0],0,.96),parent,[x,-24,z],[19*scale,13*scale,10*scale]);rock.rotation.y=-.12;
    const shoulder=mesh(new THREE.SphereGeometry(1,32,20),mat(rockPalette.uluru[1],0,.98),parent,[x-12*scale,-29,z-1],[8*scale,6*scale,7*scale]);shoulder.rotation.z=-.22;
    for(let i=0;i<8;i++){const band=mesh(new THREE.TorusGeometry(1,.012,3,80),mat(0x85452f,0,.95),parent,[x,-24+(i-4)*1.8*scale,z+8.8*scale*Math.sqrt(Math.max(.08,1-Math.pow((i-4)*.13,2)))],[15*scale,8.1*scale,1]);band.rotation.x=Math.PI/2;}
  }
  function createButte(parent,x,y,z,w,h,d,color){
    const rock=mesh(new THREE.CylinderGeometry(w*.55,w,h,9,1),mat(color,0,.98),parent,[x,y,z]);rock.rotation.y=Math.random()*.6;
    const cap=mesh(new THREE.CylinderGeometry(w*.62,w*.52,h*.08,9,1),mat(color===rockPalette.canyon[0]?rockPalette.canyon[1]:rockPalette.canyon[0],0,.98),parent,[x,y+h*.42,z]);cap.rotation.y=rock.rotation.y;
    for(let i=0;i<4;i++){const stratum=mesh(new THREE.CylinderGeometry(w*(.86-i*.08),w*(.9-i*.08),.36,9,1),mat(i%2?rockPalette.canyon[2]:rockPalette.canyon[0],0,1),parent,[x,y-h*.34+i*h*.17,z]);stratum.rotation.y=rock.rotation.y;}
  }
  function makeLandscape(kind,z){
    const group=new THREE.Group();group.position.z=z;group.userData.kind=kind;scene.add(group);
    if(kind==='uluru'){
      createUluru(group,0,-42,1.22);createUluru(group,-49,-100,.47);createUluru(group,56,-125,.55);
      for(let i=0;i<13;i++){const x=(Math.random()-.5)*180;const ridge=mesh(new THREE.ConeGeometry(9+Math.random()*15,5+Math.random()*11,5),mat(i%2?0xa75f3c:0xc18251,0,1),group,[x,-39,-20-Math.random()*125]);ridge.scale.z=2.5;}
    } else {
      for(let i=0;i<9;i++){const side=i%2?-1:1;const x=side*(38+Math.random()*47);const y=-19+Math.random()*4;createButte(group,x,y,-25-Math.random()*160,13+Math.random()*15,26+Math.random()*34,13+Math.random()*12,rockPalette.canyon[i%3]);}
      for(const side of [-1,1]){const wall=mesh(new THREE.BoxGeometry(20,24,190),mat(0xb66c45,0,.99),group,[side*31,-31,-95]);wall.rotation.z=side*.035;}
    }
    landscapes.push(group);return group;
  }
  makeLandscape('uluru',-175);makeLandscape('canyon',-570);makeLandscape('uluru',-1015);makeLandscape('canyon',-1410);
  const birds=[];const birdMaterial=mat(0x423b32,.05,.92);birdMaterial.side=THREE.DoubleSide;
  function makeBird(isEagle,index){
    const bird=new THREE.Group(),size=isEagle?1.25:.58;bird.scale.setScalar(size);
    mesh(new THREE.SphereGeometry(.14,10,8),birdMaterial,bird,[0,0,0],[.72,.68,1.8]);
    mesh(new THREE.ConeGeometry(.075,.34,8),birdMaterial,bird,[0,.015,-.26]).rotation.x=-Math.PI/2;
    const wingShape=new THREE.Shape();wingShape.moveTo(0,0);wingShape.lineTo(.42,.22);wingShape.lineTo(1.1,.27);wingShape.lineTo(1.53,.2);wingShape.lineTo(1.2,.1);wingShape.lineTo(1.55,.015);wingShape.lineTo(1.18,-.04);wingShape.lineTo(1.36,-.2);wingShape.lineTo(.72,-.13);wingShape.lineTo(.18,-.23);wingShape.closePath();
    const wingGeometry=new THREE.ShapeGeometry(wingShape);const left=new THREE.Mesh(wingGeometry,birdMaterial),right=new THREE.Mesh(wingGeometry,birdMaterial);left.position.x=-.07;left.scale.x=-1;right.position.x=.07;left.castShadow=right.castShadow=true;bird.add(left,right);
    bird.position.set((Math.random()-.5)*68,5+Math.random()*13,-65-Math.random()*280);bird.userData={left,right,eagle:isEagle,phase:Math.random()*Math.PI*2,flap:.8+Math.random()*.7,drift:.35+Math.random()*.7,speed:.72+Math.random()*.38,index};scene.add(bird);birds.push(bird);
  }
  for(let i=0;i<4;i++)makeBird(true,i);for(let i=0;i<10;i++)makeBird(false,i+4);
  const cafeItems=[],menuCatalog=[
    {name:'카페라떼',kind:'latte',color:0xc7834d},
    {name:'민트커피',kind:'mint',color:0x4bd4ae},
    {name:'팝콘',kind:'popcorn',color:0xffd45d},
    {name:'갓 구운 빵',kind:'bread',color:0xd99045},
    {name:'민트모카',kind:'mint',color:0x74e2bb},
    {name:'카라멜라떼',kind:'latte',color:0xf2aa48},
    {name:'크루아상',kind:'bread',color:0xe6a34f},
    {name:'카푸치노',kind:'latte',color:0xb88558}
  ];let nextMenuIndex=0;
  function disposeMenuItem(item){item.traverse(object=>{if(object.geometry)object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>{if(material){if(material.map)material.map.dispose();material.dispose();}});});item.clear();}
  function addMenuBadge(item,entry){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');
    ctx.fillStyle='rgba(10,24,30,.9)';ctx.fillRect(8,8,496,112);ctx.strokeStyle=`#${entry.color.toString(16).padStart(6,'0')}`;ctx.lineWidth=7;ctx.strokeRect(8,8,496,112);
    ctx.font='700 48px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=7;ctx.strokeStyle='#101c1d';ctx.strokeText(entry.name,256,66,460);ctx.fillStyle='#fff9e8';ctx.fillText(entry.name,256,66,460);
    const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;const badge=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));badge.position.y=1.75;badge.scale.set(4.15,1.04,1);item.add(badge);
  }
  function addCup(item,entry,mint=false){
    const paper=mat(mint?0xe6fff4:0xfff5e6,0,.36),sleeve=mat(entry.color,0,.58),lid=mat(mint?0x71e0bc:0xfdf3d8,0,.3);
    mesh(new THREE.CylinderGeometry(.61,.45,1.42,24),paper,item,[0,0,0]);
    mesh(new THREE.CylinderGeometry(.62,.47,.48,24,1,true),sleeve,item,[0,-.16,.01]);
    mesh(new THREE.CylinderGeometry(.56,.56,.045,24),mat(mint?0x6ad0a4:0x6f3e25,0,.3),item,[0,.73,0]);
    mesh(new THREE.CylinderGeometry(.68,.65,.14,24),lid,item,[0,.82,0]);
    mesh(new THREE.CylinderGeometry(.58,.58,.035,24),mat(mint?0x6ccfa4:0xf4dfbd,0,.3),item,[0,.905,0]);
    if(mint){const straw=mesh(new THREE.CylinderGeometry(.055,.055,.95,10),mat(0x42b88f,0,.25),item,[.19,1.28,0]);straw.rotation.z=-.13;for(let i=0;i<3;i++){const leaf=mesh(new THREE.SphereGeometry(.22,12,8),mat(0x39b986,0,.36),item,[-.34+i*.27,1.04+Math.sin(i)*.06,.04],[1.6,.38,.35]);leaf.rotation.z=.35-i*.32;}}
    else {for(let i=0;i<3;i++){const art=mesh(new THREE.SphereGeometry(.16,12,8),mat(i===1?0x9c633b:0xfff9e9,0,.36),item,[-.25+i*.25,.94,.035],[.65,.26,.16]);art.rotation.z=(i-1)*.45;}}
  }
  function addPopcorn(item){
    mesh(new THREE.CylinderGeometry(.68,.43,1.25,20),mat(0xf9f2df,0,.54),item,[0,-.15,0]);
    for(let i=0;i<5;i++){const stripe=mesh(new THREE.TorusGeometry(.57-i*.035,.045,6,24),mat(0xe94349,0,.38),item,[0,-.53+i*.2,.01]);stripe.rotation.x=Math.PI/2;}
    const popcorn=mat(0xffe69b,0,.68);for(let i=0;i<13;i++){const a=i*2.4,r=.38*Math.sqrt(i/13);mesh(new THREE.SphereGeometry(.19+Math.random()*.1,9,7),popcorn,item,[Math.cos(a)*r,.58+Math.random()*.2,Math.sin(a)*r]);}
  }
  function addBread(item){
    const crust=mat(0xd88a3c,0,.67),gold=mat(0xf6c16e,0,.58);
    const loaf=mesh(new THREE.SphereGeometry(.75,20,14),crust,item,[0,0,0],[1.38,.68,.78]);loaf.rotation.z=-.08;
    for(let i=-1;i<=1;i++){const cut=mesh(new THREE.SphereGeometry(.12,10,7),gold,item,[i*.49,.5,.31],[1.5,.22,.42]);cut.rotation.z=-.32;}
    for(let side of [-1,1]){const end=mesh(new THREE.SphereGeometry(.36,14,10),gold,item,[side*.78,.04,0],[.5,.72,.73]);}
  }
  function buildMenuItem(item,entry){
    disposeMenuItem(item);item.userData.entry=entry;item.userData.passed=false;item.userData.phase=Math.random()*Math.PI*2;item.userData.accent=entry.color;
    if(entry.kind==='latte')addCup(item,entry,false);else if(entry.kind==='mint')addCup(item,entry,true);else if(entry.kind==='popcorn')addPopcorn(item);else addBread(item);
    addMenuBadge(item,entry);item.scale.setScalar(1.55);
  }
  function makeCafeItem(z){const item=new THREE.Group();buildMenuItem(item,menuCatalog[nextMenuIndex++%menuCatalog.length]);item.position.set((Math.random()-.5)*15,(Math.random()-.5)*10,-z);item.rotation.z=(Math.random()-.5)*.18;item.userData.baseY=item.position.y;scene.add(item);cafeItems.push(item);return item;}
  for(let i=0;i<7;i++)makeCafeItem(45+i*38);
  const ringDebris=[],sparkles=[];const sparkGeometry=new THREE.SphereGeometry(.085,7,6);
  function collectCafeItem(item){
    item.visible=false;const colors=[item.userData.accent,0xffe79b,0xffffff,0xff8ab7];
    for(let i=0;i<30;i++){const material=new THREE.MeshStandardMaterial({color:colors[i%colors.length],emissive:colors[i%colors.length],emissiveIntensity:.2,transparent:true,opacity:1});const geometry=i%3===0?new THREE.TetrahedronGeometry(.19+Math.random()*.12):new THREE.SphereGeometry(.09+Math.random()*.1,7,6);const piece=new THREE.Mesh(geometry,material);piece.position.copy(item.position);scene.add(piece);const direction=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();ringDebris.push({mesh:piece,velocity:direction.multiplyScalar(3+Math.random()*6),spin:new THREE.Vector3(Math.random()*8,Math.random()*8,Math.random()*8),life:.8+Math.random()*.5});}
    const color=item.userData.accent;for(let i=0;i<22;i++){const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:1});const particle=new THREE.Mesh(sparkGeometry,material);particle.position.copy(item.position);particle.position.x+=(Math.random()-.5)*4;particle.position.y+=(Math.random()-.5)*4;scene.add(particle);sparkles.push({mesh:particle,velocity:new THREE.Vector3((Math.random()-.5)*11,(Math.random()-.5)*11,(Math.random()-.5)*8),life:.65+Math.random()*.4});}
  }
  function updateBreakEffects(dt){
    for(let i=ringDebris.length-1;i>=0;i--){const bit=ringDebris[i];bit.life-=dt;bit.velocity.y-=4.5*dt;bit.mesh.position.addScaledVector(bit.velocity,dt);bit.mesh.rotation.x+=bit.spin.x*dt;bit.mesh.rotation.y+=bit.spin.y*dt;bit.mesh.rotation.z+=bit.spin.z*dt;bit.mesh.material.opacity=Math.max(0,bit.life);if(bit.life<=0){scene.remove(bit.mesh);bit.mesh.geometry.dispose();bit.mesh.material.dispose();ringDebris.splice(i,1);}}
    for(let i=sparkles.length-1;i>=0;i--){const spark=sparkles[i];spark.life-=dt;spark.velocity.y-=5*dt;spark.mesh.position.addScaledVector(spark.velocity,dt);spark.mesh.scale.multiplyScalar(Math.max(.9,1-dt*1.3));spark.mesh.material.opacity=Math.max(0,spark.life);if(spark.life<=0){scene.remove(spark.mesh);spark.mesh.material.dispose();sparkles.splice(i,1);}}
  }
  function showScorePop(){scorePopEl.textContent='+100';scorePopEl.classList.remove('show');void scorePopEl.offsetWidth;scorePopEl.classList.add('show');}

  const keys={};const touchPresses=new Map();const drag={x:0,y:0};let dragPointer=null,dragOrigin=null;
  const engineAudio=new Audio('audio/engine-loop.mp3');engineAudio.loop=true;engineAudio.volume=.16;engineAudio.preload='auto';
  const musicAudio=new Audio('audio/flight-music.mp3');musicAudio.loop=true;musicAudio.volume=.11;musicAudio.preload='auto';
  const effectAudio=new Audio('audio/ring-bonus.mp3');effectAudio.volume=.62;effectAudio.preload='auto';
  let soundEnabled=true;
  function playAudio(audio,restart=false){if(!soundEnabled)return;if(restart)audio.currentTime=0;audio.play().catch(()=>{});}
  function stopFlightAudio(){engineAudio.pause();musicAudio.pause();}
  function playTouchEffect(){if(!soundEnabled)return;effectAudio.volume=.2;playAudio(effectAudio,true);}
  audioToggle.addEventListener('click',()=>{soundEnabled=!soundEnabled;audioToggle.setAttribute('aria-pressed',String(soundEnabled));audioToggle.setAttribute('aria-label',soundEnabled?'음악과 효과음 끄기':'음악과 효과음 켜기');audioToggle.textContent=soundEnabled?'♫':'♪';if(!soundEnabled){stopFlightAudio();effectAudio.pause();}else{if(running&&!paused)playAudio(engineAudio);playAudio(musicAudio);}});
  audioToggle.addEventListener('click',()=>{if(!soundEnabled&&'speechSynthesis' in window)speechSynthesis.cancel();});
  speedStageButtons.forEach(button=>button.addEventListener('click',()=>{speedStage=Number(button.dataset.speedStage);speedStageButtons.forEach(option=>option.setAttribute('aria-pressed',String(option===button)));}));
  const touchButtons=document.querySelectorAll('.touch-key');
  function releaseTouch(e){touchPresses.delete(e.pointerId);e.currentTarget.classList.remove('is-pressed');}
  touchButtons.forEach(button=>{
    button.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();touchPresses.set(e.pointerId,button.dataset.control);button.classList.add('is-pressed');button.setPointerCapture(e.pointerId);playTouchEffect();});
    button.addEventListener('pointerup',e=>{e.stopPropagation();releaseTouch(e);});
    button.addEventListener('pointercancel',releaseTouch);
    button.addEventListener('lostpointercapture',releaseTouch);
  });
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{if(!running||e.target!==canvas)return;dragPointer=e.pointerId;dragOrigin={x:e.clientX,y:e.clientY};drag.x=drag.y=0;canvas.setPointerCapture(e.pointerId);playTouchEffect();});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==dragPointer||!dragOrigin)return;drag.x=THREE.MathUtils.clamp((e.clientX-dragOrigin.x)/48,-1,1);drag.y=THREE.MathUtils.clamp((dragOrigin.y-e.clientY)/48,-1,1);});
  function releaseDrag(e){if(e.pointerId===dragPointer){dragPointer=null;dragOrigin=null;drag.x=drag.y=0;}}
  canvas.addEventListener('pointerup',releaseDrag);canvas.addEventListener('pointercancel',releaseDrag);canvas.addEventListener('lostpointercapture',releaseDrag);
  addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);touchPresses.clear();drag.x=drag.y=0;});
  let running=false,paused=false,score=0,best=Number(localStorage.getItem('skybound-best')||0),elapsed=0,spawnZ=330,routeDistance=0,destinationReached=false;
  const routeLength=3200;
  bestEl.textContent=String(best).padStart(4,'0');
  const state={x:0,y:0,vx:0,vy:0};
  function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();plane.scale.setScalar(camera.aspect<.72?.43:.88);}
  addEventListener('resize',resize);resize();
  addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(!e.repeat&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))playTouchEffect();if(e.code==='Space'&&running){paused=!paused;if(paused){stopFlightAudio();overlay.classList.remove('hidden');title.innerHTML='잠시 <em>정지</em>';message.innerHTML='준비가 되면 계속 비행하세요.';startButton.innerHTML='계속 비행 <span>→</span>';}else if(soundEnabled){playAudio(engineAudio);playAudio(musicAudio);}}});
  addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  function begin(){if(!running){running=true;score=0;elapsed=0;routeDistance=0;destinationReached=false;state.x=state.y=state.vx=state.vy=0;scoreEl.textContent='0000';routeFillEl.style.height='0%';routePlaneEl.style.top='0%';routePercentEl.textContent='0%';document.querySelector('.flight-route').classList.remove('arrived');}paused=false;overlay.classList.remove('celebration');overlay.classList.add('hidden');playAudio(engineAudio);playAudio(musicAudio);}
  startButton.addEventListener('click',begin);
  function launchFireworks(){
    const canvas=document.createElement('canvas');canvas.className='fireworks';canvas.setAttribute('aria-hidden','true');overlay.prepend(canvas);
    const ctx=canvas.getContext('2d'),shell=document.querySelector('.game-shell'),particles=[];let last=performance.now(),elapsed=0,nextBurst=0;
    const resize=()=>{const rect=shell.getBoundingClientRect();canvas.width=rect.width*devicePixelRatio;canvas.height=rect.height*devicePixelRatio;canvas.style.width=`${rect.width}px`;canvas.style.height=`${rect.height}px`;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);};resize();
    const frame=now=>{const dt=Math.min((now-last)/1000,.04);last=now;elapsed+=dt;const w=shell.clientWidth,h=shell.clientHeight;
      if(elapsed>=nextBurst&&elapsed<4.5){const ox=w*(.16+Math.random()*.68),oy=h*(.12+Math.random()*.48),hue=Math.random()*360;for(let i=0;i<58;i++){const a=Math.PI*2*i/58+Math.random()*.08,s=55+Math.random()*125;particles.push({x:ox,y:oy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.8+Math.random()*.65,hue});}playFireworkBoom();nextBurst+=.38+Math.random()*.28;}
      ctx.clearRect(0,0,w,h);for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.55,dt);p.vy=p.vy*Math.pow(.55,dt)+34*dt;p.life-=dt;if(p.life<=0){particles.splice(i,1);continue;}ctx.globalAlpha=Math.min(1,p.life/.28);ctx.fillStyle=`hsl(${p.hue},100%,70%)`;ctx.shadowBlur=13;ctx.shadowColor=ctx.fillStyle;ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.shadowBlur=0;
      if(elapsed<5.8||particles.length)requestAnimationFrame(frame);else canvas.remove();
    };requestAnimationFrame(frame);
  }
  function playFireworkBoom(){
    if(!soundEnabled)return;
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return;
    const context=new AudioContextClass(),now=context.currentTime,master=context.createGain();master.gain.value=.9;master.connect(context.destination);
    const boom=context.createOscillator(),boomGain=context.createGain();boom.type='sine';boom.frequency.setValueAtTime(115,now);boom.frequency.exponentialRampToValueAtTime(38,now+.48);boomGain.gain.setValueAtTime(.0001,now);boomGain.gain.exponentialRampToValueAtTime(.85,now+.025);boomGain.gain.exponentialRampToValueAtTime(.0001,now+.62);boom.connect(boomGain);boomGain.connect(master);boom.start(now);boom.stop(now+.64);
    const buffer=context.createBuffer(1,Math.floor(context.sampleRate*.38),context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
    const crackle=context.createBufferSource(),filter=context.createBiquadFilter(),crackleGain=context.createGain();crackle.buffer=buffer;filter.type='highpass';filter.frequency.value=900;crackleGain.gain.setValueAtTime(.55,now);crackleGain.gain.exponentialRampToValueAtTime(.0001,now+.38);crackle.connect(filter);filter.connect(crackleGain);crackleGain.connect(master);crackle.start(now);crackle.stop(now+.4);boom.onended=()=>context.close().catch(()=>{});
  }
  function speakCheer(){
    if(!soundEnabled||!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return;
    speechSynthesis.cancel();const cheer=new SpeechSynthesisUtterance('당신은 꿈을 성취했어요. 민재 파이팅!');cheer.lang='ko-KR';cheer.volume=1;cheer.rate=.9;cheer.pitch=1.12;speechSynthesis.speak(cheer);
  }
  function finishAtDestination(){destinationReached=true;running=false;stopFlightAudio();overlay.classList.remove('hidden');overlay.classList.add('celebration');title.innerHTML='당신은<br><em class="firework-title">꿈을 성취했어요.</em><br><strong class="cheer-title">민재 파이팅!</strong>';message.innerHTML=`목적지에 도착했습니다!<br>최종 점수는 <b>${String(score).padStart(4,'0')}</b>점입니다.`;startButton.innerHTML='다시 출격 <span>→</span>';effectAudio.volume=1;playAudio(effectAudio,true);setTimeout(speakCheer,350);launchFireworks();}
  let previous=performance.now();
  function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.04);previous=now;updateBreakEffects(dt);if(plane.userData.exhausts)plane.userData.exhausts.forEach((flame,i)=>{flame.material.emissiveIntensity=.55+Math.sin(now*.014+i)*.28;flame.scale.y=.82+Math.sin(now*.017+i)*.12;});
    if(running&&!paused){elapsed+=dt;const [baseSpeed,acceleration,maxAcceleration]=[[24,.9,22],[32,1.2,30],[42,1.5,36]][speedStage-1];const speed=baseSpeed+Math.min(elapsed*acceleration,maxAcceleration);routeDistance=Math.min(routeDistance+speed*dt,routeLength);const progress=routeDistance/routeLength*100;routeFillEl.style.height=`${progress}%`;routePlaneEl.style.top=`${progress}%`;routePercentEl.textContent=`${Math.round(progress)}%`;if(progress>=100){document.querySelector('.flight-route').classList.add('arrived');if(!destinationReached)finishAtDestination();}const pressed=direction=>Array.from(touchPresses.values()).includes(direction);const steerX=THREE.MathUtils.clamp(Number(!!(keys.d||keys.arrowright||pressed('right')))-Number(!!(keys.a||keys.arrowleft||pressed('left')))+drag.x,-1,1);const steerY=THREE.MathUtils.clamp(Number(!!(keys.w||keys.arrowup||pressed('up')))-Number(!!(keys.s||keys.arrowdown||pressed('down')))+drag.y,-1,1);engineAudio.volume=soundEnabled?Math.min(.36,.12+Math.min(Math.abs(steerX)+Math.abs(steerY),1)*.2):0;state.vx+=steerX*dt*18;state.vy+=steerY*dt*14;state.vx*=Math.pow(.12,dt);state.vy*=Math.pow(.12,dt);state.x=THREE.MathUtils.clamp(state.x+state.vx*dt,-15,15);state.y=THREE.MathUtils.clamp(state.y+state.vy*dt,-9,9);plane.position.set(state.x,state.y,1.3);plane.rotation.z=THREE.MathUtils.lerp(plane.rotation.z,-state.vx*.035,.09);plane.rotation.x=THREE.MathUtils.lerp(plane.rotation.x,state.vy*.016,.08);camera.position.x+=(state.x*.22-camera.position.x)*.025;camera.position.y+=(2.3+state.y*.12-camera.position.y)*.025;camera.lookAt(state.x*.16,state.y*.12,-24);speedEl.textContent=Math.round(speed*3.6);altitudeEl.textContent=(1200+Math.round(state.y*13)).toLocaleString();score+=Math.round(dt*10);scoreEl.textContent=String(score).padStart(4,'0');
      cafeItems.forEach(r=>{r.position.z+=speed*dt;r.position.y=r.userData.baseY+Math.sin(elapsed*1.7+r.userData.phase)*.2;r.rotation.y=Math.sin(elapsed*1.3+r.userData.phase)*.2;if(!r.userData.passed&&r.position.z>plane.position.z){r.userData.passed=true;if(Math.hypot(r.position.x-state.x,r.position.y-state.y)<3.25){score+=100;scoreEl.textContent=String(score).padStart(4,'0');showScorePop();collectCafeItem(r);effectAudio.volume=.62;playAudio(effectAudio,true);if(score>best){best=score;bestEl.textContent=String(best).padStart(4,'0');localStorage.setItem('skybound-best',best);}}}if(r.position.z>plane.position.z+12){buildMenuItem(r,menuCatalog[nextMenuIndex++%menuCatalog.length]);r.position.set((Math.random()-.5)*15,(Math.random()-.5)*10,-spawnZ);r.userData.baseY=r.position.y;r.rotation.set(0,0,(Math.random()-.5)*.18);r.visible=true;spawnZ+=36;}});
      clouds.forEach(c=>{c.position.z+=speed*dt*c.userData.speed;if(c.position.z>30){c.position.z=-290-Math.random()*90;c.position.x=(Math.random()-.5)*115;c.position.y=(Math.random()-.5)*29-10;}});
      landscapes.forEach(g=>{g.position.z+=speed*dt;if(g.position.z>80){const farthest=Math.min(...landscapes.filter(other=>other!==g).map(other=>other.position.z));g.position.z=farthest-395;}});
      birds.forEach(bird=>{bird.position.z+=speed*dt*bird.userData.speed;bird.position.x+=Math.sin(elapsed*bird.userData.drift+bird.userData.phase)*dt*(bird.userData.eagle?2.1:3.1);bird.position.y+=(Math.cos(elapsed*1.5+bird.userData.phase)-.4)*dt*.65;const flap=Math.sin(elapsed*bird.userData.flap+bird.userData.phase)*.62;bird.userData.right.rotation.z=flap;bird.userData.left.rotation.z=-flap;if(bird.position.z>30){bird.position.set((Math.random()-.5)*68,5+Math.random()*13,-230-Math.random()*180);bird.userData.phase=Math.random()*Math.PI*2;}});
    }
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
})();
