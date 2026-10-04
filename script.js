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
  scene.background = new THREE.Color(0x8ec6e5);
  scene.fog = new THREE.Fog(0x8ec6e5, 80, 330);
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
  const hemi = new THREE.HemisphereLight(0xd9f4ff, 0x637d68, 1.35); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3d6, 2.2); sun.position.set(-30, 45, 25); sun.castShadow = true; scene.add(sun);

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

  const ground=mesh(new THREE.PlaneGeometry(1800,1800),mat(0x688a60,0,.95),scene,[0,-42,0]);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
  const clouds=[];
  for(let i=0;i<27;i++){ const g=new THREE.Group(); const n=4+Math.floor(Math.random()*5); for(let j=0;j<n;j++){let s=.7+Math.random()*1.7;mesh(new THREE.SphereGeometry(s,10,8),new THREE.MeshLambertMaterial({color:0xf4fbff,transparent:true,opacity:.83}),g,[(Math.random()-.5)*5,(Math.random()-.5)*1.6,(Math.random()-.5)*3],[1,.6,1]);}g.position.set((Math.random()-.5)*115,(Math.random()-.5)*29-10,-20-Math.random()*270);g.userData.speed=.65+Math.random()*.7;scene.add(g);clouds.push(g); }
  const mountains=[];
  const mountainMat=[mat(0x8aa8a2),mat(0x789995),mat(0x9bb8ae)];
  for(let i=0;i<26;i++){const h=14+Math.random()*30;const m=mesh(new THREE.ConeGeometry(12+Math.random()*14,h,5),mountainMat[i%3],scene,[((i%2)*2-1)*(50+Math.random()*48),-26,-90-Math.random()*150]);m.rotation.y=Math.random()*3;mountains.push(m);}
  const rings=[];
  const ringGeo=new THREE.TorusGeometry(3.1,.14,10,36);
  const ringMat=new THREE.MeshStandardMaterial({color:0xffc768,emissive:0x754016,emissiveIntensity:.5,metalness:.42,roughness:.3});
  const goodMat=new THREE.MeshStandardMaterial({color:0x7df0dc,emissive:0x167e74,emissiveIntensity:.6,metalness:.35,roughness:.28});
  function makeRing(z){const r=new THREE.Mesh(ringGeo,Math.random()<.24?goodMat:ringMat);r.position.set((Math.random()-.5)*15,(Math.random()-.5)*10,-z);r.rotation.z=(Math.random()-.5)*.26;r.userData.passed=false;scene.add(r);rings.push(r);return r;}
  for(let i=0;i<7;i++)makeRing(45+i*38);

  const keys={};let running=false,paused=false,score=0,best=Number(localStorage.getItem('skybound-best')||0),elapsed=0,spawnZ=330;
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
    if(running&&!paused){elapsed+=dt;const speed=32+Math.min(elapsed*1.2,30);state.vx+=(Number(!!(keys.d||keys.arrowright))-Number(!!(keys.a||keys.arrowleft)))*dt*18;state.vy+=(Number(!!(keys.w||keys.arrowup))-Number(!!(keys.s||keys.arrowdown)))*dt*14;state.vx*=Math.pow(.12,dt);state.vy*=Math.pow(.12,dt);state.x=THREE.MathUtils.clamp(state.x+state.vx*dt,-15,15);state.y=THREE.MathUtils.clamp(state.y+state.vy*dt,-9,9);plane.position.set(state.x,state.y,0);plane.rotation.z=THREE.MathUtils.lerp(plane.rotation.z,-state.vx*.035,.09);plane.rotation.x=THREE.MathUtils.lerp(plane.rotation.x,state.vy*.016,.08);camera.position.x+=(state.x*.22-camera.position.x)*.025;camera.position.y+=(2.3+state.y*.12-camera.position.y)*.025;camera.lookAt(state.x*.16,state.y*.12,-24);speedEl.textContent=Math.round(speed*3.6);altitudeEl.textContent=(1200+Math.round(state.y*13)).toLocaleString();score+=Math.round(dt*10);scoreEl.textContent=String(score).padStart(4,'0');
      rings.forEach(r=>{r.position.z+=speed*dt;if(!r.userData.passed&&r.position.z>0){r.userData.passed=true;if(Math.hypot(r.position.x-state.x,r.position.y-state.y)<3.25){score+=100;scoreEl.textContent=String(score).padStart(4,'0');if(score>best){best=score;bestEl.textContent=String(best).padStart(4,'0');localStorage.setItem('skybound-best',best);}}else if(Math.hypot(r.position.x-state.x,r.position.y-state.y)>5.4){endGame();}}if(r.position.z>12){r.position.set((Math.random()-.5)*15,(Math.random()-.5)*10,-spawnZ);r.rotation.z=(Math.random()-.5)*.26;r.userData.passed=false;spawnZ+=36;}});
      clouds.forEach(c=>{c.position.z+=speed*dt*c.userData.speed;if(c.position.z>30){c.position.z=-290-Math.random()*90;c.position.x=(Math.random()-.5)*115;c.position.y=(Math.random()-.5)*29-10;}});
      mountains.forEach(m=>{m.position.z+=speed*dt*.18;if(m.position.z>30)m.position.z=-240-Math.random()*90;});
    }
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
})();
