(() => {
  const mount = document.getElementById('game');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const altitudeEl = document.getElementById('altitude');
  const speedEl = document.getElementById('speed');
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

  const groundMaterial=mat(0x568b4b,0,.98);
  const ground=mesh(new THREE.PlaneGeometry(1800,1800),groundMaterial,scene,[0,-42,0]);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
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
  const rings=[];
  const ringGeo=new THREE.TorusGeometry(3.1,.14,10,36);
  const ringMaterials=[new THREE.MeshStandardMaterial({color:0xfff000,emissive:0xb5a900,emissiveIntensity:1.35,metalness:.25,roughness:.24}),new THREE.MeshStandardMaterial({color:0xff3aca,emissive:0xad0874,emissiveIntensity:1.2,metalness:.2,roughness:.25}),new THREE.MeshStandardMaterial({color:0x00ffd2,emissive:0x007e64,emissiveIntensity:1.1,metalness:.2,roughness:.25})];
  function makeRing(z){const r=new THREE.Mesh(ringGeo,ringMaterials[Math.floor(Math.random()*ringMaterials.length)]);r.material=r.material.clone();r.material.emissiveIntensity+=.5;r.scale.setScalar(1.1);r.position.set((Math.random()-.5)*15,(Math.random()-.5)*10,-z);r.rotation.z=(Math.random()-.5)*.26;r.userData.passed=false;scene.add(r);rings.push(r);return r;}
  for(let i=0;i<7;i++)makeRing(45+i*38);

  const keys={};const touchPresses=new Map();const drag={x:0,y:0};let dragPointer=null,dragOrigin=null;
  const touchButtons=document.querySelectorAll('.touch-key');
  function releaseTouch(e){touchPresses.delete(e.pointerId);e.currentTarget.classList.remove('is-pressed');}
  touchButtons.forEach(button=>{
    button.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();touchPresses.set(e.pointerId,button.dataset.control);button.classList.add('is-pressed');button.setPointerCapture(e.pointerId);});
    button.addEventListener('pointerup',e=>{e.stopPropagation();releaseTouch(e);});
    button.addEventListener('pointercancel',releaseTouch);
    button.addEventListener('lostpointercapture',releaseTouch);
  });
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{if(!running||e.target!==canvas)return;dragPointer=e.pointerId;dragOrigin={x:e.clientX,y:e.clientY};drag.x=drag.y=0;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==dragPointer||!dragOrigin)return;drag.x=THREE.MathUtils.clamp((e.clientX-dragOrigin.x)/48,-1,1);drag.y=THREE.MathUtils.clamp((dragOrigin.y-e.clientY)/48,-1,1);});
  function releaseDrag(e){if(e.pointerId===dragPointer){dragPointer=null;dragOrigin=null;drag.x=drag.y=0;}}
  canvas.addEventListener('pointerup',releaseDrag);canvas.addEventListener('pointercancel',releaseDrag);canvas.addEventListener('lostpointercapture',releaseDrag);
  addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);touchPresses.clear();drag.x=drag.y=0;});
  let running=false,paused=false,score=0,best=Number(localStorage.getItem('skybound-best')||0),elapsed=0,spawnZ=330;
  bestEl.textContent=String(best).padStart(4,'0');
  const state={x:0,y:0,vx:0,vy:0};
  function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();plane.scale.setScalar(camera.aspect<.72?.43:.88);}
  addEventListener('resize',resize);resize();
  addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(e.code==='Space'&&running){paused=!paused;if(paused){overlay.classList.remove('hidden');title.innerHTML='잠시 <em>정지</em>';message.innerHTML='준비가 되면 계속 비행하세요.';startButton.innerHTML='계속 비행 <span>→</span>';}}});
  addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  function begin(){if(!running){running=true;score=0;elapsed=0;state.x=state.y=state.vx=state.vy=0;scoreEl.textContent='0000';}paused=false;overlay.classList.add('hidden');}
  startButton.addEventListener('click',begin);
  function endGame(){running=false;overlay.classList.remove('hidden');title.innerHTML='비행 <em>종료</em>';message.innerHTML=`최종 점수는 <b>${String(score).padStart(4,'0')}</b>점입니다.<br>다시 출격해 기록에 도전하세요!`;startButton.innerHTML='다시 도전 <span>→</span>';}
  let previous=performance.now();
  function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.04);previous=now;if(plane.userData.exhausts)plane.userData.exhausts.forEach((flame,i)=>{flame.material.emissiveIntensity=.55+Math.sin(now*.014+i)*.28;flame.scale.y=.82+Math.sin(now*.017+i)*.12;});
    if(running&&!paused){elapsed+=dt;const speed=32+Math.min(elapsed*1.2,30);const pressed=direction=>Array.from(touchPresses.values()).includes(direction);const steerX=THREE.MathUtils.clamp(Number(!!(keys.d||keys.arrowright||pressed('right')))-Number(!!(keys.a||keys.arrowleft||pressed('left')))+drag.x,-1,1);const steerY=THREE.MathUtils.clamp(Number(!!(keys.w||keys.arrowup||pressed('up')))-Number(!!(keys.s||keys.arrowdown||pressed('down')))+drag.y,-1,1);state.vx+=steerX*dt*18;state.vy+=steerY*dt*14;state.vx*=Math.pow(.12,dt);state.vy*=Math.pow(.12,dt);state.x=THREE.MathUtils.clamp(state.x+state.vx*dt,-15,15);state.y=THREE.MathUtils.clamp(state.y+state.vy*dt,-9,9);plane.position.set(state.x,state.y,1.3);plane.rotation.z=THREE.MathUtils.lerp(plane.rotation.z,-state.vx*.035,.09);plane.rotation.x=THREE.MathUtils.lerp(plane.rotation.x,state.vy*.016,.08);camera.position.x+=(state.x*.22-camera.position.x)*.025;camera.position.y+=(2.3+state.y*.12-camera.position.y)*.025;camera.lookAt(state.x*.16,state.y*.12,-24);speedEl.textContent=Math.round(speed*3.6);altitudeEl.textContent=(1200+Math.round(state.y*13)).toLocaleString();score+=Math.round(dt*10);scoreEl.textContent=String(score).padStart(4,'0');
      rings.forEach(r=>{r.position.z+=speed*dt;if(!r.userData.passed&&r.position.z>plane.position.z){r.userData.passed=true;if(Math.hypot(r.position.x-state.x,r.position.y-state.y)<3.25){score+=100;scoreEl.textContent=String(score).padStart(4,'0');if(score>best){best=score;bestEl.textContent=String(best).padStart(4,'0');localStorage.setItem('skybound-best',best);}}else if(Math.hypot(r.position.x-state.x,r.position.y-state.y)>5.4){endGame();}}if(r.position.z>plane.position.z+12){r.position.set((Math.random()-.5)*15,(Math.random()-.5)*10,-spawnZ);r.rotation.z=(Math.random()-.5)*.26;r.userData.passed=false;spawnZ+=36;}});
      clouds.forEach(c=>{c.position.z+=speed*dt*c.userData.speed;if(c.position.z>30){c.position.z=-290-Math.random()*90;c.position.x=(Math.random()-.5)*115;c.position.y=(Math.random()-.5)*29-10;}});
      landscapes.forEach(g=>{g.position.z+=speed*dt;if(g.position.z>80){const farthest=Math.min(...landscapes.filter(other=>other!==g).map(other=>other.position.z));g.position.z=farthest-395;}});
      birds.forEach(bird=>{bird.position.z+=speed*dt*bird.userData.speed;bird.position.x+=Math.sin(elapsed*bird.userData.drift+bird.userData.phase)*dt*(bird.userData.eagle?2.1:3.1);bird.position.y+=(Math.cos(elapsed*1.5+bird.userData.phase)-.4)*dt*.65;const flap=Math.sin(elapsed*bird.userData.flap+bird.userData.phase)*.62;bird.userData.right.rotation.z=flap;bird.userData.left.rotation.z=-flap;if(bird.position.z>30){bird.position.set((Math.random()-.5)*68,5+Math.random()*13,-230-Math.random()*180);bird.userData.phase=Math.random()*Math.PI*2;}});
    }
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
})();
