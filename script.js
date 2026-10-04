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
  scene.background = new THREE.Color(0xd8ae87);
  scene.fog = new THREE.Fog(0xd8ae87, 80, 360);
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
  const hemi = new THREE.HemisphereLight(0xffe6c7, 0x875638, 1.45); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffdfac, 2.35); sun.position.set(-30, 45, 25); sun.castShadow = true; scene.add(sun);

  const plane = new THREE.Group(); scene.add(plane);
  const mat = (color, metalness=0, roughness=.55) => new THREE.MeshStandardMaterial({color,metalness,roughness});
  const bodyMat=mat(0xf4f5ec,.36,.29), navy=mat(0x173454,.25,.38), glass=mat(0x183a55,.65,.2), orange=mat(0xff8b3d,.12,.35), dark=mat(0x202b35,.25,.42);
  function mesh(geometry, material, parent=plane, pos=[0,0,0], scale=null) { const o=new THREE.Mesh(geometry,material); o.position.set(...pos); if(scale)o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o; }
  mesh(new THREE.CylinderGeometry(.16,.28,3.25,12),bodyMat,plane,[0,0,0],[1,1,1]).rotation.x=Math.PI/2;
  mesh(new THREE.ConeGeometry(.16,.7,12),orange,plane,[0,0,-1.95]).rotation.x=-Math.PI/2;
  mesh(new THREE.ConeGeometry(.15,.6,12),bodyMat,plane,[0,0,1.7]).rotation.x=Math.PI/2;
  mesh(new THREE.SphereGeometry(.21,16,12),glass,plane,[0,.2,-.25],[.85,.56,1.45]);
  mesh(new THREE.BoxGeometry(7.4,.13,1.05),bodyMat,plane,[0,-.03,-.03]);
  mesh(new THREE.BoxGeometry(1.7,.1,.55),navy,plane,[0,-.105,-.04]);
  mesh(new THREE.BoxGeometry(2.15,.1,.57),bodyMat,plane,[0,.02,1.17]);
  mesh(new THREE.BoxGeometry(1.45,.1,.12),orange,plane,[0,.02,1.18]);
  mesh(new THREE.BoxGeometry(.16,1.15,.65),bodyMat,plane,[0,.47,1.18]);
  mesh(new THREE.BoxGeometry(.18,.65,.36),orange,plane,[0,.92,1.18]);
  for(const x of [-1.5,1.5]) { mesh(new THREE.CylinderGeometry(.065,.065,.55,10),dark,plane,[x,-.29,.1]); mesh(new THREE.SphereGeometry(.11,10,8),dark,plane,[x,-.54,.1],[1,.55,1]); }
  const prop=new THREE.Group();prop.position.set(0,0,-2.34);plane.add(prop);
  const hub=mesh(new THREE.CylinderGeometry(.09,.09,.15,10),dark,prop,[0,0,0]);hub.rotation.x=Math.PI/2;
  const bladeMat=mat(0x263746,.3,.3); mesh(new THREE.BoxGeometry(.09,1.25,.06),bladeMat,prop,[0,0,0]);

  const groundMaterial=mat(0xb9774b,0,.95);
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
  const rings=[];
  const ringGeo=new THREE.TorusGeometry(3.1,.14,10,36);
  const ringMat=new THREE.MeshStandardMaterial({color:0xffc768,emissive:0x754016,emissiveIntensity:.5,metalness:.42,roughness:.3});
  const goodMat=new THREE.MeshStandardMaterial({color:0x7df0dc,emissive:0x167e74,emissiveIntensity:.6,metalness:.35,roughness:.28});
  function makeRing(z){const r=new THREE.Mesh(ringGeo,Math.random()<.24?goodMat:ringMat);r.position.set((Math.random()-.5)*15,(Math.random()-.5)*10,-z);r.rotation.z=(Math.random()-.5)*.26;r.userData.passed=false;scene.add(r);rings.push(r);return r;}
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
  function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();
  addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(e.code==='Space'&&running){paused=!paused;if(paused){overlay.classList.remove('hidden');title.innerHTML='잠시 <em>정지</em>';message.innerHTML='준비가 되면 계속 비행하세요.';startButton.innerHTML='계속 비행 <span>→</span>';}}});
  addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  function begin(){if(!running){running=true;score=0;elapsed=0;state.x=state.y=state.vx=state.vy=0;scoreEl.textContent='0000';}paused=false;overlay.classList.add('hidden');}
  startButton.addEventListener('click',begin);
  function endGame(){running=false;overlay.classList.remove('hidden');title.innerHTML='비행 <em>종료</em>';message.innerHTML=`최종 점수는 <b>${String(score).padStart(4,'0')}</b>점입니다.<br>다시 출격해 기록에 도전하세요!`;startButton.innerHTML='다시 도전 <span>→</span>';}
  let previous=performance.now();
  function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.04);previous=now;prop.rotation.z-=dt*22;
    if(running&&!paused){elapsed+=dt;const speed=32+Math.min(elapsed*1.2,30);const pressed=direction=>Array.from(touchPresses.values()).includes(direction);const steerX=THREE.MathUtils.clamp(Number(!!(keys.d||keys.arrowright||pressed('right')))-Number(!!(keys.a||keys.arrowleft||pressed('left')))+drag.x,-1,1);const steerY=THREE.MathUtils.clamp(Number(!!(keys.w||keys.arrowup||pressed('up')))-Number(!!(keys.s||keys.arrowdown||pressed('down')))+drag.y,-1,1);state.vx+=steerX*dt*18;state.vy+=steerY*dt*14;state.vx*=Math.pow(.12,dt);state.vy*=Math.pow(.12,dt);state.x=THREE.MathUtils.clamp(state.x+state.vx*dt,-15,15);state.y=THREE.MathUtils.clamp(state.y+state.vy*dt,-9,9);plane.position.set(state.x,state.y,0);plane.rotation.z=THREE.MathUtils.lerp(plane.rotation.z,-state.vx*.035,.09);plane.rotation.x=THREE.MathUtils.lerp(plane.rotation.x,state.vy*.016,.08);camera.position.x+=(state.x*.22-camera.position.x)*.025;camera.position.y+=(2.3+state.y*.12-camera.position.y)*.025;camera.lookAt(state.x*.16,state.y*.12,-24);speedEl.textContent=Math.round(speed*3.6);altitudeEl.textContent=(1200+Math.round(state.y*13)).toLocaleString();score+=Math.round(dt*10);scoreEl.textContent=String(score).padStart(4,'0');
      rings.forEach(r=>{r.position.z+=speed*dt;if(!r.userData.passed&&r.position.z>0){r.userData.passed=true;if(Math.hypot(r.position.x-state.x,r.position.y-state.y)<3.25){score+=100;scoreEl.textContent=String(score).padStart(4,'0');if(score>best){best=score;bestEl.textContent=String(best).padStart(4,'0');localStorage.setItem('skybound-best',best);}}else if(Math.hypot(r.position.x-state.x,r.position.y-state.y)>5.4){endGame();}}if(r.position.z>12){r.position.set((Math.random()-.5)*15,(Math.random()-.5)*10,-spawnZ);r.rotation.z=(Math.random()-.5)*.26;r.userData.passed=false;spawnZ+=36;}});
      clouds.forEach(c=>{c.position.z+=speed*dt*c.userData.speed;if(c.position.z>30){c.position.z=-290-Math.random()*90;c.position.x=(Math.random()-.5)*115;c.position.y=(Math.random()-.5)*29-10;}});
      landscapes.forEach(g=>{g.position.z+=speed*dt;if(g.position.z>80){const farthest=Math.min(...landscapes.filter(other=>other!==g).map(other=>other.position.z));g.position.z=farthest-395;}});
    }
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
})();
