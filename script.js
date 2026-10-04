(() => {
  const mount = document.getElementById('game');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const altitudeEl = document.getElementById('altitude');
  const speedEl = document.getElementById('speed');
  const headingEl = document.getElementById('heading-value');
  const scorePopEl = document.getElementById('score-pop');
  const routeFillEl = document.getElementById('route-fill');
  const routePlaneEl = document.getElementById('route-plane');
  const routePercentEl = document.getElementById('route-percent');
  const mapAircraftEl = document.getElementById('map-aircraft');
  const audioToggle = document.getElementById('audio-toggle');
  const speedStageButtons = document.querySelectorAll('[data-speed-stage]');
  const aircraftChoices = document.querySelectorAll('[data-aircraft]');
  let speedStage = 2;
  const overlay = document.getElementById('overlay');
  const title = document.getElementById('title');
  const message = document.getElementById('message');
  const startButton = document.getElementById('start-button');
  if (!window.THREE) { title.textContent = 'Three.js could not load'; message.textContent = 'Check the internet connection, then reload this page.'; startButton.hidden = true; return; }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe49a69);
  scene.fog = new THREE.Fog(0xc48d70, 115, 500);
  const camera = new THREE.PerspectiveCamera(68, 1, .1, 500);
  camera.position.set(0, 2.3, 8);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.35 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  mount.appendChild(renderer.domElement);
  const hemi = new THREE.HemisphereLight(0xd8eaff, 0x544238, .86); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffa66c, 4.1); sun.position.set(-38, 26, -62); sun.castShadow = true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-42; sun.shadow.camera.right=42; sun.shadow.camera.top=38; sun.shadow.camera.bottom=-38; sun.shadow.camera.near=.5; sun.shadow.camera.far=150; sun.shadow.bias=-.00022; sun.shadow.normalBias=.035; sun.shadow.radius=5; scene.add(sun);
  const environmentCanvas=document.createElement('canvas');environmentCanvas.width=1024;environmentCanvas.height=512;const envCtx=environmentCanvas.getContext('2d');const envGradient=envCtx.createLinearGradient(0,0,0,512);envGradient.addColorStop(0,'#263954');envGradient.addColorStop(.36,'#627d9a');envGradient.addColorStop(.49,'#ffad74');envGradient.addColorStop(.54,'#ffe0a8');envGradient.addColorStop(.59,'#766153');envGradient.addColorStop(1,'#17221f');envCtx.fillStyle=envGradient;envCtx.fillRect(0,0,1024,512);const sunGlow=envCtx.createRadialGradient(290,278,3,290,278,190);sunGlow.addColorStop(0,'rgba(255,249,211,.98)');sunGlow.addColorStop(.08,'rgba(255,186,112,.83)');sunGlow.addColorStop(1,'rgba(255,121,77,0)');envCtx.fillStyle=sunGlow;envCtx.fillRect(70,70,440,440);const environment=new THREE.CanvasTexture(environmentCanvas);environment.mapping=THREE.EquirectangularReflectionMapping;scene.environment=environment;
  let composer=null,depthOfField=null;try{composer=new THREE.EffectComposer(renderer);composer.addPass(new THREE.RenderPass(scene,camera));depthOfField=new THREE.BokehPass(scene,camera,{focus:36,aperture:.000003,maxblur:.0012,width:mount.clientWidth,height:mount.clientHeight});composer.addPass(depthOfField);composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(mount.clientWidth,mount.clientHeight),.64,.42,.76));}catch(error){console.warn('Post-processing is unavailable; using the standard renderer.',error);composer=null;}

  const plane = new THREE.Group(); scene.add(plane);const jetModel=new THREE.Group();plane.add(jetModel);const helicopterModels=[],rotorGroups=[];
  const mat = (color, metalness=0, roughness=.55) => new THREE.MeshStandardMaterial({color,metalness,roughness});
  const bodyMat=new THREE.MeshPhysicalMaterial({color:0xb6c1c8,metalness:.86,roughness:.58,clearcoat:.2,clearcoatRoughness:.45});const glass=new THREE.MeshPhysicalMaterial({color:0x17374c,metalness:.48,roughness:.12,clearcoat:.9,clearcoatRoughness:.08});const dark=mat(0x202b35,.38,.42);const pilotSkinMaterial=mat(0xd8a27c,.02,.76),pilotSuitMaterial=mat(0x35494a,.12,.78),pilotHelmetMaterial=mat(0x30494a,.18,.45);
  function makeAircraftSurfaceMaps(){
    const size=2048,albedo=document.createElement('canvas'),rough=document.createElement('canvas'),metal=document.createElement('canvas'),bump=document.createElement('canvas');
    [albedo,rough,metal,bump].forEach(canvas=>{canvas.width=canvas.height=size;});
    const a=albedo.getContext('2d'),r=rough.getContext('2d'),m=metal.getContext('2d'),b=bump.getContext('2d');
    a.fillStyle='#748278';a.fillRect(0,0,size,size);r.fillStyle='#b5b5b5';r.fillRect(0,0,size,size);m.fillStyle='#3f3f3f';m.fillRect(0,0,size,size);b.fillStyle='#808080';b.fillRect(0,0,size,size);
    const colors=['#68766e','#899187','#586b66','#9a9b8e','#64747a'];
    for(let patch=0;patch<150;patch++){
      const cx=Math.random()*size,cy=Math.random()*size,rx=45+Math.random()*180,ry=24+Math.random()*110,points=7+Math.floor(Math.random()*6),jagged=[];
      for(let i=0;i<points;i++){const angle=i/points*Math.PI*2,radius=.72+Math.random()*.45;jagged.push([cx+Math.cos(angle)*rx*radius,cy+Math.sin(angle)*ry*radius]);}
      const roughGray=95+Math.floor(Math.random()*100),metalGray=28+Math.floor(Math.random()*70),bumpGray=105+Math.floor(Math.random()*48);
      const gray=value=>`rgb(${value},${value},${value})`;
      for(const [ctx,fill] of [[a,colors[Math.floor(Math.random()*colors.length)]],[r,gray(roughGray)],[m,gray(metalGray)],[b,gray(bumpGray)]]){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(...jagged[0]);jagged.slice(1).forEach(point=>ctx.lineTo(...point));ctx.closePath();ctx.fill();}
    }
    for(let y=30;y<size;y+=128){a.strokeStyle='rgba(37,48,46,.58)';a.lineWidth=2;a.beginPath();a.moveTo(0,y);a.lineTo(size,y);a.stroke();r.strokeStyle='#dedede';r.lineWidth=3;r.beginPath();r.moveTo(0,y);r.lineTo(size,y);r.stroke();m.strokeStyle='#d8d8d8';m.lineWidth=3;m.beginPath();m.moveTo(0,y);m.lineTo(size,y);m.stroke();b.strokeStyle='#aaa';b.lineWidth=3;b.beginPath();b.moveTo(0,y);b.lineTo(size,y);b.stroke();}
    for(let y=18;y<size;y+=64)for(let x=18;x<size;x+=64){a.fillStyle='#46534e';a.beginPath();a.arc(x,y,2,0,Math.PI*2);a.fill();m.fillStyle='#e6e6e6';m.beginPath();m.arc(x,y,2.2,0,Math.PI*2);m.fill();b.fillStyle='#c7c7c7';b.beginPath();b.arc(x,y,2,0,Math.PI*2);b.fill();}
    for(let i=0;i<8000;i++){const x=Math.random()*size,y=Math.random()*size;a.fillStyle=`rgba(28,39,37,${Math.random()*.1})`;a.fillRect(x,y,1+Math.random()*11,1);}
    const map=new THREE.CanvasTexture(albedo),roughnessMap=new THREE.CanvasTexture(rough),metalnessMap=new THREE.CanvasTexture(metal),bumpMap=new THREE.CanvasTexture(bump);
    [map,roughnessMap,metalnessMap,bumpMap].forEach(texture=>{texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();});map.encoding=THREE.sRGBEncoding;
    return {map,roughnessMap,metalnessMap,bumpMap};
  }
  const aircraftMaps=makeAircraftSurfaceMaps();bodyMat.map=aircraftMaps.map;bodyMat.roughnessMap=aircraftMaps.roughnessMap;bodyMat.metalnessMap=aircraftMaps.metalnessMap;bodyMat.bumpMap=aircraftMaps.bumpMap;bodyMat.metalness=.92;bodyMat.roughness=.62;bodyMat.bumpScale=.024;
  const aircraftProfiles=[{name:'KF-21 Boramae',color:0xb6c1c8,wing:1,fin:1,kind:'jet'},{name:'F/A-18E Super Hornet',color:0x7d8a89,wing:.98,fin:.9,kind:'jet'},{name:'F-35C Lightning II',color:0x596c79,wing:.94,fin:.86,kind:'jet'},{name:'F-22 Raptor',color:0x73808b,wing:1.02,fin:.95,kind:'jet'},{name:'F-15E Strike Eagle',color:0x9a927e,wing:1.08,fin:1.14,kind:'jet'},{name:'AH-64 Apache',color:0x53694b,wing:1,fin:1,kind:'helicopter',modelIndex:0},{name:'UH-60 Black Hawk',color:0x566456,wing:1,fin:1,kind:'helicopter',modelIndex:1}];let selectedAircraft=0,selectedPilotGender='male',selectedPilotSkin='asian';
  function mesh(geometry, material, parent=jetModel, pos=[0,0,0], scale=null) { const o=new THREE.Mesh(geometry,material); o.position.set(...pos); if(scale)o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o; }
  const fuselageStations=[[-3.75,.035,.045],[-3.1,.12,.13],[-2.25,.23,.22],[-1.15,.38,.34],[-.25,.55,.42],[.8,.58,.43],[1.65,.48,.38],[2.45,.39,.31],[3.05,.3,.26],[3.35,.2,.2]];
  const fuselageGeometry=new THREE.BufferGeometry(),fuselageVertices=[],fuselageUvs=[],fuselageIndices=[],sides=40;
  fuselageStations.forEach(([z,rx,ry],ring)=>{for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2;fuselageVertices.push(Math.cos(a)*rx,Math.sin(a)*ry,z);fuselageUvs.push(i/sides,ring/(fuselageStations.length-1));}});
  for(let ring=0;ring<fuselageStations.length-1;ring++)for(let i=0;i<sides;i++){const a=ring*sides+i,b=ring*sides+(i+1)%sides,c=(ring+1)*sides+(i+1)%sides,d=(ring+1)*sides+i;fuselageIndices.push(a,b,d,b,c,d);}
  fuselageGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fuselageVertices,3));fuselageGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(fuselageUvs,2));fuselageGeometry.setIndex(fuselageIndices);fuselageGeometry.computeVertexNormals();bodyMat.side=THREE.DoubleSide;mesh(fuselageGeometry,bodyMat);
  function aircraftSurface(points,material,y=0){const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)shape.lineTo(points[i][0],points[i][1]);shape.closePath();const geometry=new THREE.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.055,bevelThickness:.035});const wing=mesh(geometry,material,jetModel,[0,y,0]);wing.rotation.x=Math.PI/2;return wing;}
  const wingMat=mat(0x9da9b2,.92,.62);wingMat.map=aircraftMaps.map;wingMat.roughnessMap=aircraftMaps.roughnessMap;wingMat.metalnessMap=aircraftMaps.metalnessMap;wingMat.bumpMap=aircraftMaps.bumpMap;wingMat.bumpScale=.016;wingMat.side=THREE.DoubleSide;
  const wingSurfaces=[];wingSurfaces.push(aircraftSurface([[-1.35,-1.75],[-4.65,-.55],[-4.25,.32],[-1.85,1.2],[-1.15,2.0],[1.15,2.0],[1.85,1.2],[4.25,.32],[4.65,-.55],[1.35,-1.75]],wingMat,.12));
  wingSurfaces.push(aircraftSurface([[-.55,1.35],[-1.8,2.15],[-1.65,2.75],[-.55,2.45],[.55,2.45],[1.65,2.75],[1.8,2.15],[.55,1.35]],wingMat,.12));
  mesh(new THREE.SphereGeometry(.34,24,18),glass,plane,[0,.35,-1.65],[.77,.68,2.05]);
  const tailFins=[];for(const side of [-1,1]){
    const inlet=mesh(new THREE.BoxGeometry(.16,.52,.66),dark,plane,[side*.66,-.08,-.62]);inlet.rotation.z=side*.12;
    const engine=mesh(new THREE.CylinderGeometry(.27,.33,2.05,18,1),bodyMat,plane,[side*.48,-.2,1.62]);engine.rotation.x=Math.PI/2;
    const nozzle=mesh(new THREE.CylinderGeometry(.31,.35,.34,18,1,true),dark,plane,[side*.48,-.2,2.82]);nozzle.rotation.x=Math.PI/2;
    const exhaustMat=new THREE.MeshBasicMaterial({color:0xff8a31,transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false});
    const coreMat=new THREE.MeshBasicMaterial({color:0xffe5a1,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false});
    const exhaust=mesh(new THREE.ConeGeometry(.32,1.65,16),exhaustMat,plane,[side*.48,-.2,3.55]);exhaust.rotation.x=Math.PI/2;
    const core=mesh(new THREE.ConeGeometry(.16,1.25,14),coreMat,plane,[side*.48,-.2,3.42]);core.rotation.x=Math.PI/2;
    plane.userData.exhausts??=[];plane.userData.exhausts.push(exhaust,core);
    const orangeGlow=new THREE.PointLight(0xff6d25,2.8,14,2);orangeGlow.position.set(side*.48,-.2,3.45);plane.add(orangeGlow);
    const violetGlow=new THREE.PointLight(0xa452ff,.85,8,2);violetGlow.position.set(side*.48,.1,3.2);plane.add(violetGlow);
    plane.userData.afterburnerLights??=[];plane.userData.afterburnerLights.push(orangeGlow,violetGlow);
    const sparkPositions=new Float32Array(84*3);for(let i=0;i<84;i++){sparkPositions[i*3]=side*.48+(Math.random()-.5)*.48;sparkPositions[i*3+1]=-.2+(Math.random()-.5)*.34;sparkPositions[i*3+2]=3.05+Math.random()*2.6;}
    const sparkGeometry=new THREE.BufferGeometry();sparkGeometry.setAttribute('position',new THREE.BufferAttribute(sparkPositions,3));const sparks=new THREE.Points(sparkGeometry,new THREE.PointsMaterial({color:0xffbf58,size:.12,transparent:true,opacity:.82,blending:THREE.AdditiveBlending,depthWrite:false}));plane.add(sparks);plane.userData.afterburnerSparks??=[];plane.userData.afterburnerSparks.push(sparks);
    const finShape=new THREE.Shape();finShape.moveTo(-.9,0);finShape.lineTo(-2.8,.08);finShape.lineTo(-2.08,1.2);finShape.lineTo(-1.14,1.0);finShape.closePath();const fin=new THREE.Mesh(new THREE.ShapeGeometry(finShape),bodyMat);fin.position.set(side*.68,.2,0);fin.rotation.y=Math.PI/2;fin.material.side=THREE.DoubleSide;fin.castShadow=true;plane.add(fin);fin.rotation.z=side*.15;tailFins.push(fin);
    mesh(new THREE.CylinderGeometry(.23,.23,.035,24),mat(0x285b99,.18,.5),plane,[side*2.7,.15,.15]);
    mesh(new THREE.CylinderGeometry(.095,.095,.04,20),mat(0xc84c4c,.1,.5),plane,[side*2.7,.18,.15]);
    mesh(new THREE.BoxGeometry(.12,.1,.42),mat(side<0?0x4fe2a0:0xff5555,.1,.35),plane,[side*4.42,.17,-.35]);
    const pylon=mesh(new THREE.BoxGeometry(.18,.2,1.1),mat(0x87949a,.62,.34),plane,[side*2.65,-.04,-.5]);pylon.rotation.y=side*.05;const missile=mesh(new THREE.ConeGeometry(.09,.92,12),mat(0xd7dce0,.7,.26),plane,[side*2.65,-.12,-.1]);missile.rotation.x=Math.PI/2;
  }
  for(let side of [-1,1]){for(let i=0;i<7;i++){const antenna=mesh(new THREE.BoxGeometry(.07,.045,.42),mat(0x65727b,.48,.48),plane,[side*(1.5+i*.28),.205,.25+i*.17]);antenna.rotation.y=side*.12;}const wingLight=mesh(new THREE.SphereGeometry(.075,12,8),mat(side<0?0x42e5b4:0xff463d,.1,.28),plane,[side*4.35,.21,-.28]);wingLight.material.emissive.setHex(side<0?0x16caa2:0xd7211d);wingLight.material.emissiveIntensity=.8;}

  plane.children.slice().filter(child=>child!==jetModel).forEach(child=>jetModel.add(child));
  function makeHelicopter(apache){
    const model=new THREE.Group(),olive=new THREE.MeshPhysicalMaterial({color:apache?0x526044:0x4d5c4d,metalness:.42,roughness:.68}),windowMat=new THREE.MeshPhysicalMaterial({color:0x183546,metalness:.54,roughness:.16,clearcoat:.8});
    const body=mesh(new THREE.SphereGeometry(1,24,18),olive,model,[0,0,0],[apache?.8:.95,.78,apache?1.75:2.15]);
    mesh(new THREE.SphereGeometry(.72,20,16),windowMat,model,[0,.3,-1.05],[1,.8,1.12]);
    const tail=mesh(new THREE.CylinderGeometry(.22,.35,3.45,12),olive,model,[0,.28,2.35]);tail.rotation.x=Math.PI/2;mesh(new THREE.BoxGeometry(.11,.95,.78),olive,model,[0,.3,4.02]);
    mesh(new THREE.CylinderGeometry(.19,.22,.26,12),dark,model,[0,1.08,.1]);const rotor=new THREE.Group();rotor.position.set(0,1.24,.1);model.add(rotor);
    for(let i=0;i<4;i++){const blade=mesh(new THREE.BoxGeometry(.2,.075,apache?7.2:8),olive,rotor);blade.rotation.y=i*Math.PI/2;}
    const tailRotor=new THREE.Group();tailRotor.position.set(0,.57,4.04);tailRotor.rotation.z=Math.PI/2;model.add(tailRotor);for(let i=0;i<4;i++){const blade=mesh(new THREE.BoxGeometry(.1,1.25,.09),olive,tailRotor);blade.rotation.z=i*Math.PI/2;}rotorGroups.push(rotor,tailRotor);
    for(const side of [-1,1]){const skid=mesh(new THREE.CylinderGeometry(.07,.07,3.5,8),dark,model,[side*.85,-.92,.25]);skid.rotation.x=Math.PI/2;for(const z of [-.65,1.1]){const leg=mesh(new THREE.CylinderGeometry(.055,.055,1.2,8),dark,model,[side*.85,-.58,z]);leg.rotation.x=Math.PI/2;}
      if(apache){mesh(new THREE.BoxGeometry(1.6,.15,.7),olive,model,[side*1.15,-.08,.45]);for(let i=0;i<2;i++){const missile=mesh(new THREE.CylinderGeometry(.09,.09,1.05,10),mat(0xc2b889,.25,.55),model,[side*(1.4+i*.35),-.44,.42]);missile.rotation.x=Math.PI/2;}}
      else for(let i=0;i<3;i++)mesh(new THREE.BoxGeometry(.035,.56,.64),mat(0x294151,.25,.28),model,[side*.91,.31,-.55+i*.72]);
      const light=mesh(new THREE.SphereGeometry(.09,10,8),mat(side<0?0x56ebcf:0xff564d,.1,.26),model,[side*.8,.06,-1.2]);light.material.emissive.setHex(side<0?0x22cfaa:0xff2828);light.material.emissiveIntensity=.8;
    }
    if(apache){mesh(new THREE.SphereGeometry(.22,12,10),dark,model,[0,-.48,-1.8]);const gun=mesh(new THREE.CylinderGeometry(.085,.1,1.1,10),dark,model,[.25,-.61,-2.15]);gun.rotation.x=Math.PI/2;}
    mesh(new THREE.SphereGeometry(.22,14,12),pilotSkinMaterial,model,[0,.55,-1.14],[.7,.9,.7]);mesh(new THREE.SphereGeometry(.28,14,12),pilotHelmetMaterial,model,[0,.68,-1.17],[1.1,.72,1]);model.visible=false;plane.add(model);helicopterModels.push(model);
  }
  makeHelicopter(true);makeHelicopter(false);
  function makeGrassTexture(){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
    const base=ctx.createLinearGradient(0,0,512,512);base.addColorStop(0,'#78985a');base.addColorStop(.48,'#64894e');base.addColorStop(1,'#8aa365');ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
    for(let i=0;i<2400;i++){const x=Math.random()*512,y=Math.random()*512,r=2+Math.random()*14;ctx.fillStyle=['rgba(39,83,43,.14)','rgba(160,164,91,.14)','rgba(188,174,111,.10)','rgba(75,119,61,.18)'][Math.floor(Math.random()*4)];ctx.beginPath();ctx.ellipse(x,y,r,r*(.25+Math.random()*.45),Math.random(),0,Math.PI*2);ctx.fill();}
    for(let i=0;i<6500;i++){const x=Math.random()*512,y=Math.random()*512;ctx.strokeStyle=['rgba(196,198,125,.48)','rgba(36,82,42,.48)','rgba(116,151,76,.58)','rgba(218,198,129,.3)'][Math.floor(Math.random()*4)];ctx.lineWidth=.6+Math.random()*1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(Math.random()-.5)*3,y-1-Math.random()*7);ctx.stroke();}
    const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(64,64);texture.encoding=THREE.sRGBEncoding;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();return texture;
  }
  const groundMaterial=mat(0xffffff,0,.98);groundMaterial.map=makeGrassTexture();
  const terrainPhotoLoader=new THREE.TextureLoader();
  Promise.all(['./textures/grand-canyon-landsat.jpg','./textures/mount-mabu-landsat.jpg'].map(url=>new Promise((resolve,reject)=>terrainPhotoLoader.load(url,resolve,undefined,reject)))).then(([canyon,mabu])=>{
    const atlas=document.createElement('canvas');atlas.width=atlas.height=2048;const ctx=atlas.getContext('2d');
    ctx.drawImage(mabu.image,0,400,1500,1500,0,0,1024,1024);
    ctx.drawImage(mabu.image,1500,0,1500,1500,1024,0,1024,1024);
    ctx.drawImage(mabu.image,250,1500,1500,1500,0,1024,1024,1024);
    ctx.drawImage(canyon.image,0,0,1024,1024,1024,1024,1024,1024);
    const terrain=new THREE.CanvasTexture(atlas);terrain.wrapS=terrain.wrapT=THREE.MirroredRepeatWrapping;terrain.repeat.set(2,2);terrain.encoding=THREE.sRGBEncoding;terrain.anisotropy=renderer.capabilities.getMaxAnisotropy();groundMaterial.map=terrain;groundMaterial.roughness=.96;groundMaterial.needsUpdate=true;
  }).catch(error=>console.warn('Satellite terrain photos could not be loaded; showing the procedural terrain fallback.',error));
  if(THREE.RGBELoader){new THREE.RGBELoader().setDataType(THREE.UnsignedByteType).load('./textures/sunset-fairway-2k.hdr',sky=>{sky.mapping=THREE.EquirectangularReflectionMapping;scene.background=sky;const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();scene.environment=pmrem.fromEquirectangular(sky).texture;pmrem.dispose();},undefined,error=>console.warn('Sunset HDR skybox could not be loaded; showing the procedural sunset fallback.',error));}
  const groundGeometry=new THREE.PlaneGeometry(1800,1800,110,110),groundVertices=groundGeometry.attributes.position;
  for(let i=0;i<groundVertices.count;i++){const x=groundVertices.getX(i),z=groundVertices.getY(i);const hill=Math.sin(x*.008)*1.1+Math.cos(z*.01)*.8+Math.sin((x-z)*.004)*1.25;groundVertices.setZ(i,hill);}
  groundGeometry.computeVertexNormals();const ground=mesh(groundGeometry,groundMaterial,scene,[0,-14,0]);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
  const cloudCanvas=document.createElement('canvas');cloudCanvas.width=512;cloudCanvas.height=256;const cloudCtx=cloudCanvas.getContext('2d');cloudCtx.globalCompositeOperation='lighter';
  for(let i=0;i<180;i++){const x=Math.random()*512,y=34+Math.random()*188,rx=12+Math.random()*56,ry=5+Math.random()*20;cloudCtx.save();cloudCtx.translate(x,y);cloudCtx.scale(rx,ry);const puff=cloudCtx.createRadialGradient(0,0,.02,0,0,1);puff.addColorStop(0,'rgba(255,255,255,.34)');puff.addColorStop(.48,'rgba(255,255,255,.2)');puff.addColorStop(1,'rgba(255,255,255,0)');cloudCtx.fillStyle=puff;cloudCtx.beginPath();cloudCtx.arc(0,0,1,0,Math.PI*2);cloudCtx.fill();cloudCtx.restore();}
  const cloudTexture=new THREE.CanvasTexture(cloudCanvas);cloudTexture.encoding=THREE.sRGBEncoding;cloudTexture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());const clouds=[];
  for(let i=0;i<23;i++){const tint=i%4===0?0xffa77f:i%4===1?0xf4d1b6:i%4===2?0xc1c9d4:0x8fa1bb,material=new THREE.MeshBasicMaterial({map:cloudTexture,color:tint,transparent:true,opacity:.68,depthWrite:false,side:THREE.DoubleSide}),g=new THREE.Mesh(new THREE.PlaneGeometry(48+Math.random()*42,13+Math.random()*13),material);g.position.set((Math.random()-.5)*125,17+Math.random()*30,-55-Math.random()*280);g.rotation.z=(Math.random()-.5)*.08;g.userData.speed=.55+Math.random()*.45;g.renderOrder=1;scene.add(g);clouds.push(g);}
  const landscapes=[];
  const forestGreens=[0x315d39,0x477447,0x567e4a,0x698e50,0x386447,0x778f52,0x4c6840];
  function valleyHeight(distance,z){const rise=THREE.MathUtils.smoothstep(distance,24,137)*43;const rockStep=Math.sin(distance*.31+z*.048)*1.9+Math.sin(z*.073)*2.8+Math.sin(distance*.13-z*.026)*2.2;return -13+rise+rockStep;}
  function createValleyRidge(group,side){
    const rows=40,columns=16,positions=[],uvs=[],colors=[],indices=[];
    for(let row=0;row<=rows;row++){const z=-400+row*10,center=Math.sin(z*.015)*6;for(let col=0;col<=columns;col++){const distance=23+col*7.5,x=center+side*distance,y=valleyHeight(distance,z);positions.push(x,y,z);uvs.push(col/columns*3,row/rows*3);const rock=THREE.MathUtils.smoothstep(y,4,23);const shade=.76+Math.random()*.34;const green=new THREE.Color(0x49794a).multiplyScalar(shade),stone=new THREE.Color(0x777560).multiplyScalar(shade);green.lerp(stone,rock);colors.push(green.r,green.g,green.b);}}
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const a=row*(columns+1)+col,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();const ridge=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.94,vertexColors:true}));ridge.receiveShadow=true;ridge.castShadow=true;group.add(ridge);
  }
  function addForestInstances(group,side){
    const count=74,root=new THREE.Object3D(),trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.32,.72,1,7),new THREE.MeshStandardMaterial({color:0x705440,roughness:1}),count),needles=new THREE.InstancedMesh(new THREE.ConeGeometry(5,14,7),new THREE.MeshStandardMaterial({color:0x4b7946,roughness:1}),Math.floor(count*.58)),crowns=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:0x5f8b50,roughness:1}),count-needles.count);
    for(let i=0;i<count;i++){
      const z=-390+Math.random()*380,distance=26+Math.random()*104,center=Math.sin(z*.015)*6,x=center+side*distance,base=valleyHeight(distance,z)-1.5,trunkHeight=5+Math.random()*8,leafHeight=10+Math.random()*10;
      root.position.set(x,base+trunkHeight*.5,z);root.rotation.set(0,Math.random()*Math.PI*2,0);root.scale.set(.75+Math.random()*.5,trunkHeight,.75+Math.random()*.5);root.updateMatrix();trunks.setMatrixAt(i,root.matrix);trunks.setColorAt(i,new THREE.Color(forestGreens[Math.floor(Math.random()*forestGreens.length)]));
      if(i<needles.count){root.position.set(x,base+trunkHeight+leafHeight*.28,z);root.scale.set(.72+Math.random()*.6,leafHeight/14,.72+Math.random()*.6);root.rotation.y=Math.random()*Math.PI*2;root.updateMatrix();needles.setMatrixAt(i,root.matrix);needles.setColorAt(i,new THREE.Color(forestGreens[Math.floor(Math.random()*forestGreens.length)]));}
      else {const crownIndex=i-needles.count,crownSize=5+Math.random()*5;root.position.set(x,base+trunkHeight+leafHeight*.44,z);root.scale.set(crownSize,crownSize*(.75+Math.random()*.5),crownSize);root.rotation.set(Math.random()*.5,Math.random()*Math.PI*2,Math.random()*.5);root.updateMatrix();crowns.setMatrixAt(crownIndex,root.matrix);crowns.setColorAt(crownIndex,new THREE.Color(forestGreens[Math.floor(Math.random()*forestGreens.length)]));}
    }
    [trunks,needles,crowns].forEach(instances=>{instances.castShadow=true;instances.receiveShadow=true;instances.instanceMatrix.needsUpdate=true;group.add(instances);});
  }
  function makeForestValley(z){
    const group=new THREE.Group();group.position.z=z;group.userData.kind='forest-valley';scene.add(group);
    createValleyRidge(group,-1);createValleyRidge(group,1);addForestInstances(group,-1);addForestInstances(group,1);
    for(const side of [-1,1])for(let i=0;i<7;i++){const distance=30+Math.random()*25,rz=-35-i*52-Math.random()*18,pillar=mesh(new THREE.IcosahedronGeometry(1,1),mat(i%2?0x777766:0x657054,0,.95),group,[side*distance,-1+Math.random()*4,rz],[8+Math.random()*9,13+Math.random()*18,9+Math.random()*12]);pillar.rotation.z=side*(.12+Math.random()*.2);}
    landscapes.push(group);return group;
  }
  makeForestValley(25);makeForestValley(-370);makeForestValley(-765);makeForestValley(-1160);
  const combatAircraft=[];
  function makeCombatJet(index){const group=new THREE.Group(),paint=new THREE.MeshStandardMaterial({color:index%2?0x434a4c:0x5b5145,metalness:.54,roughness:.48}),canopy=new THREE.MeshPhysicalMaterial({color:0x142b39,metalness:.56,roughness:.14,clearcoat:.9});mesh(new THREE.SphereGeometry(1,16,12),paint,group,[0,0,0],[.3,.3,1.75]);const wing=mesh(new THREE.ConeGeometry(1,1,4),paint,group,[0,0,.4],[4.7,.09,1.8]);wing.rotation.x=Math.PI/2;mesh(new THREE.SphereGeometry(.22,12,10),canopy,group,[0,.18,-1.1],[.8,.48,1.3]);for(const side of [-1,1]){const fin=mesh(new THREE.BoxGeometry(.11,.8,1.15),paint,group,[side*.64,.28,1.15]);fin.rotation.z=side*.2;const lamp=mesh(new THREE.SphereGeometry(.07,8,6),mat(side<0?0xff4a38:0x5bffd8,.2,.26),group,[side*4.4,.12,.45]);lamp.material.emissive.setHex(side<0?0xff2116:0x29edbd);lamp.material.emissiveIntensity=.6;}group.position.set(index%2?31:-34,7+index%3*6,-180-index*125);group.rotation.y=index%2?-.2:.2;group.userData={baseX:group.position.x,phase:index*1.7,speed:.8+index*.06};scene.add(group);combatAircraft.push(group);}
  for(let i=0;i<4;i++)makeCombatJet(i);
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
  const missionBeacons=[],beaconCatalog=[
    {name:'WAYPOINT 01 / NAV BEACON',kind:'nav',color:0xe1a065},
    {name:'RADAR RELAY / MARK 02',kind:'radar',color:0xaebd9d},
    {name:'FLIGHT RECORDER / DATA',kind:'data',color:0xd29a60},
    {name:'RESCUE LOCATOR / MARK 04',kind:'nav',color:0xd9b47c},
    {name:'TERRAIN GATE / MARK 05',kind:'radar',color:0x9eae9a},
    {name:'OBJECTIVE TAG / MARK 06',kind:'data',color:0xe1a065},
    {name:'IFF TRANSPONDER / MARK 07',kind:'radar',color:0xaebd9d},
    {name:'WAYPOINT 08 / NAV BEACON',kind:'nav',color:0xd29a60}
  ];let nextBeaconIndex=0;
  function menuMaterial(color,intensity=.18,roughness=.42){return new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness});}
  function disposeMenuItem(item){item.traverse(object=>{if(object.geometry)object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>{if(material){if(material.map)material.map.dispose();material.dispose();}});});item.clear();}
  function addMenuGlow(item,entry){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),hex=entry.color.toString(16).padStart(6,'0'),red=parseInt(hex.slice(0,2),16),green=parseInt(hex.slice(2,4),16),blue=parseInt(hex.slice(4,6),16);
    const gradient=ctx.createRadialGradient(64,64,4,64,64,64);gradient.addColorStop(0,`rgba(${red},${green},${blue},.24)`);gradient.addColorStop(.55,`rgba(${red},${green},${blue},.1)`);gradient.addColorStop(1,`rgba(${red},${green},${blue},0)`);ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
    const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));halo.position.set(0,.18,-.8);halo.scale.set(3.4,3.4,1);item.add(halo);
  }
  function addMenuBadge(item,entry){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');
    ctx.fillStyle='rgba(5,13,15,.94)';ctx.fillRect(5,5,758,118);ctx.fillStyle=`#${entry.color.toString(16).padStart(6,'0')}`;ctx.fillRect(5,5,5,118);ctx.strokeStyle='rgba(174,190,167,.62)';ctx.lineWidth=2;ctx.strokeRect(5,5,758,118);
    ctx.font='600 32px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e3e8dd';ctx.fillText(entry.name,390,64,720);
    const texture=new THREE.CanvasTexture(canvas);texture.encoding=THREE.sRGBEncoding;const badge=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));badge.position.y=1.38;badge.scale.set(5.1,.84,1);item.add(badge);
  }
  function addNavigationBeacon(item,entry){
    const armor=menuMaterial(0x55615b,.08,.48);armor.metalness=.72;const insert=menuMaterial(0x1d2928,.04,.32);insert.metalness=.6;const signal=new THREE.MeshPhysicalMaterial({color:entry.color,metalness:.32,roughness:.22,clearcoat:.8,emissive:entry.color,emissiveIntensity:.32});
    const housing=mesh(new THREE.BoxGeometry(1.18,1.18,.22),armor,item,[0,0,0]);housing.rotation.z=Math.PI/4;
    mesh(new THREE.BoxGeometry(.73,.73,.12),insert,item,[0,0,.14]).rotation.z=Math.PI/4;
    mesh(new THREE.OctahedronGeometry(.34,1),signal,item,[0,0,.3]);
    mesh(new THREE.BoxGeometry(.1,1.72,.12),armor,item,[0,0,-.02]);mesh(new THREE.BoxGeometry(1.72,.1,.12),armor,item,[0,0,-.02]);
    for(const side of [-1,1]){mesh(new THREE.CylinderGeometry(.075,.075,.3,12),signal,item,[side*.83,0,.04]);mesh(new THREE.BoxGeometry(.08,.43,.08),armor,item,[side*.83,0,-.15]);}
    const aerial=mesh(new THREE.CylinderGeometry(.035,.05,.55,8),armor,item,[0,.82,-.02]);aerial.rotation.z=-.12;const pulse=mesh(new THREE.SphereGeometry(.09,12,8),signal,item,[0,1.12,0]);pulse.material.emissiveIntensity=.8;
  }
  function buildBeacon(item,entry){disposeMenuItem(item);item.userData.entry=entry;item.userData.passed=false;item.userData.phase=Math.random()*Math.PI*2;item.userData.accent=entry.color;addMenuGlow(item,entry);addNavigationBeacon(item,entry);addMenuBadge(item,entry);item.scale.setScalar(1.25);}  function makeMissionBeacon(z){const item=new THREE.Group();buildBeacon(item,beaconCatalog[nextBeaconIndex++%beaconCatalog.length]);item.position.set((Math.random()-.5)*15,(Math.random()-.5)*10,-z);item.rotation.z=(Math.random()-.5)*.18;item.userData.baseY=item.position.y;scene.add(item);missionBeacons.push(item);return item;}
  for(let i=0;i<7;i++)makeMissionBeacon(45+i*38);
  const ringDebris=[],sparkles=[];const sparkGeometry=new THREE.SphereGeometry(.085,7,6);
  function collectBeacon(item){
    item.visible=false;const colors=[item.userData.accent,0xe5e8dd,0xd7a16b,0x92a499];
    for(let i=0;i<30;i++){const material=new THREE.MeshStandardMaterial({color:colors[i%colors.length],emissive:colors[i%colors.length],emissiveIntensity:.2,transparent:true,opacity:1});const geometry=i%3===0?new THREE.TetrahedronGeometry(.19+Math.random()*.12):new THREE.SphereGeometry(.09+Math.random()*.1,7,6);const piece=new THREE.Mesh(geometry,material);piece.position.copy(item.position);scene.add(piece);const direction=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();ringDebris.push({mesh:piece,velocity:direction.multiplyScalar(3+Math.random()*6),spin:new THREE.Vector3(Math.random()*8,Math.random()*8,Math.random()*8),life:.8+Math.random()*.5});}
    const color=item.userData.accent;for(let i=0;i<22;i++){const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:1});const particle=new THREE.Mesh(sparkGeometry,material);particle.position.copy(item.position);particle.position.x+=(Math.random()-.5)*4;particle.position.y+=(Math.random()-.5)*4;scene.add(particle);sparkles.push({mesh:particle,velocity:new THREE.Vector3((Math.random()-.5)*11,(Math.random()-.5)*11,(Math.random()-.5)*8),life:.65+Math.random()*.4});}
  }
  function updateBreakEffects(dt){
    for(let i=ringDebris.length-1;i>=0;i--){const bit=ringDebris[i];bit.life-=dt;bit.velocity.y-=4.5*dt;bit.mesh.position.addScaledVector(bit.velocity,dt);bit.mesh.rotation.x+=bit.spin.x*dt;bit.mesh.rotation.y+=bit.spin.y*dt;bit.mesh.rotation.z+=bit.spin.z*dt;bit.mesh.material.opacity=Math.max(0,bit.life);if(bit.life<=0){scene.remove(bit.mesh);bit.mesh.geometry.dispose();bit.mesh.material.dispose();ringDebris.splice(i,1);}}
    for(let i=sparkles.length-1;i>=0;i--){const spark=sparkles[i];spark.life-=dt;spark.velocity.y-=5*dt;spark.mesh.position.addScaledVector(spark.velocity,dt);spark.mesh.scale.multiplyScalar(Math.max(.9,1-dt*1.3));spark.mesh.material.opacity=Math.max(0,spark.life);if(spark.life<=0){scene.remove(spark.mesh);spark.mesh.material.dispose();sparkles.splice(i,1);}}
  }
  function showScorePop(){scorePopEl.textContent='+100';scorePopEl.classList.remove('show');void scorePopEl.offsetWidth;scorePopEl.classList.add('show');}

  const keys={};const touchPresses=new Map();const drag={x:0,y:0};let dragPointer=null,dragOrigin=null;
  const engineAudio=new Audio('audio/engine-loop.mp3');engineAudio.loop=true;engineAudio.volume=.18;engineAudio.playbackRate=1.06;engineAudio.preload='auto';
  const musicAudio=new Audio('audio/flight-music.mp3');musicAudio.loop=true;musicAudio.volume=.11;musicAudio.preload='auto';
  const effectAudio=new Audio('audio/ring-bonus.mp3');effectAudio.volume=.62;effectAudio.preload='auto';
  let soundEnabled=true;
  function playAudio(audio,restart=false){if(!soundEnabled)return;if(restart)audio.currentTime=0;audio.play().catch(()=>{});}
  function stopFlightAudio(){engineAudio.pause();musicAudio.pause();}
  function playTouchEffect(){if(!soundEnabled)return;effectAudio.volume=.2;playAudio(effectAudio,true);}
  audioToggle.addEventListener('click',()=>{soundEnabled=!soundEnabled;audioToggle.setAttribute('aria-pressed',String(soundEnabled));audioToggle.setAttribute('aria-label',soundEnabled?'음악과 효과음 끄기':'음악과 효과음 켜기');audioToggle.textContent=soundEnabled?'♫':'♪';if(!soundEnabled){stopFlightAudio();effectAudio.pause();}else{if(running&&!paused)playAudio(engineAudio);playAudio(musicAudio);}});
  audioToggle.addEventListener('click',()=>{if(!soundEnabled&&'speechSynthesis' in window)speechSynthesis.cancel();});
  speedStageButtons.forEach(button=>button.addEventListener('click',()=>{speedStage=Number(button.dataset.speedStage);engineAudio.playbackRate=[.94,1.06,1.18][speedStage-1];speedStageButtons.forEach(option=>option.setAttribute('aria-pressed',String(option===button)));}));


  function selectAircraft(index){selectedAircraft=index;const profile=aircraftProfiles[index],isHelicopter=profile.kind==='helicopter';jetModel.visible=!isHelicopter;helicopterModels.forEach((model,i)=>model.visible=isHelicopter&&i===profile.modelIndex);bodyMat.color.setHex(profile.color);wingMat.color.setHex(Math.min(0xffffff,profile.color+0x070707));wingSurfaces[0].scale.x=profile.wing;wingSurfaces[1].scale.x=1+(profile.wing-1)*.7;tailFins.forEach((fin,i)=>{fin.scale.y=profile.fin;fin.position.x=(i?1:-1)*(.68+(profile.fin-1)*.22);});aircraftChoices.forEach((button,i)=>{button.classList.toggle('selected',i===index);button.setAttribute('aria-pressed',String(i===index));});document.querySelector('#aircraft-view .selection-body')?.classList.add('collapsed');}
  const pilotRoster=[{id:'MAVERICK',role:'LEAD / VF-81',image:'./assets/pilots/maverick.jpg'},{id:'ROOSTER',role:'WING / VF-113',image:'./assets/pilots/rooster.jpg'},{id:'HANGMAN',role:'WING / VFA-103',image:'./assets/pilots/phoenix.jpg'},{id:'PAYBACK',role:'WING / VFA-82',image:'./assets/pilots/payback.jpg'},{id:'PHOENIX',role:'LEAD / VAQ-34',image:'./assets/pilots/coyote.jpg'}];
  function selectPilot(id=localStorage.getItem('skybound-pilot')||'MAVERICK',collapse=true){const profile=pilotRoster.find(pilot=>pilot.id===id)||pilotRoster[0];localStorage.setItem('skybound-pilot',profile.id);document.querySelectorAll('[data-pilot-id]').forEach(button=>{const active=button.dataset.pilotId===profile.id;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});document.getElementById('selected-pilot-call-sign').textContent=profile.id;document.getElementById('pilot-profile-role').textContent=profile.role;document.getElementById('pilot-profile-image').src=profile.image;document.getElementById('pilot-profile-status').textContent='READY FOR SORTIE';if(collapse)document.getElementById('pilot-body')?.classList.add('collapsed');}
  document.querySelectorAll('[data-pilot-id]').forEach(button=>button.addEventListener('click',()=>selectPilot(button.dataset.pilotId)));selectPilot(undefined,false);
  const selectionPanel=document.getElementById('selection-panel'),selectionToggle=document.getElementById('selection-toggle');
  function setSelectionPanel(open){selectionPanel.classList.toggle('closed',!open);selectionToggle.setAttribute('aria-expanded',String(open));}
  selectionToggle.addEventListener('click',()=>setSelectionPanel(selectionPanel.classList.contains('closed')));document.getElementById('selection-close').addEventListener('click',()=>setSelectionPanel(false));
  document.querySelectorAll('[data-collapse]').forEach(button=>button.addEventListener('click',()=>{const body=document.getElementById(button.dataset.collapse),collapsed=body.classList.toggle('collapsed');button.textContent=collapsed?'+':'−';button.setAttribute('aria-expanded',String(!collapsed));}));
  aircraftChoices.forEach(button=>button.addEventListener('click',()=>selectAircraft(Number(button.dataset.aircraft))));
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
  const routeLength=5200;
  function updateMapAircraft(progress){const points=[[15.6,88],[55.6,60],[38.8,32.8],[83.1,10]],segment=Math.min(2,Math.floor(progress/33.3334)),mix=THREE.MathUtils.clamp((progress-segment*33.3334)/33.3334,0,1),from=points[segment],to=points[segment+1];mapAircraftEl.style.left=`${from[0]+(to[0]-from[0])*mix}%`;mapAircraftEl.style.top=`${from[1]+(to[1]-from[1])*mix}%`;}
  bestEl.textContent=String(best).padStart(4,'0');
  const state={x:0,y:0,vx:0,vy:0};
  function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h,false);if(composer)composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();plane.scale.setScalar(camera.aspect<.72?.43:.88);}
  addEventListener('resize',resize);resize();
  addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(!e.repeat&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))playTouchEffect();if(e.code==='Space'&&running){paused=!paused;if(paused){stopFlightAudio();overlay.classList.remove('hidden');title.innerHTML='FLIGHT <em>PAUSED</em>';message.innerHTML='Press SPACE or select RESUME to continue.';startButton.innerHTML='RESUME SORTIE';}else if(soundEnabled){playAudio(engineAudio);playAudio(musicAudio);}}});
  addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  function begin(){if(!running){running=true;score=0;elapsed=0;routeDistance=0;destinationReached=false;state.x=state.y=state.vx=state.vy=0;scoreEl.textContent='0000';routeFillEl.style.width='0%';routePlaneEl.style.left='0%';routePercentEl.textContent='0%';updateMapAircraft(0);document.querySelector('.flight-route').classList.remove('arrived');}paused=false;document.getElementById('flight-log').textContent='FLIGHT LOG : IN PROGRESS';setSelectionPanel(false);overlay.classList.remove('celebration');overlay.classList.add('hidden');playAudio(engineAudio);playAudio(musicAudio);}
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
    speechSynthesis.cancel();const cheer=new SpeechSynthesisUtterance('\uB2F9\uC2E0\uC740 \uAFC8\uC744 \uC131\uCDE8\uD588\uC5B4\uC694. \uBBFC\uC7AC \uD30C\uC774\uD305!');cheer.lang='ko-KR';cheer.volume=1;cheer.rate=.9;cheer.pitch=1.12;speechSynthesis.speak(cheer);
  }
  function finishAtDestination(){destinationReached=true;running=false;stopFlightAudio();document.getElementById('flight-log').textContent='FLIGHT LOG : SUCCESS';overlay.classList.remove('hidden');overlay.classList.add('celebration');title.innerHTML='MISSION COMPLETE';message.innerHTML='TACTICAL FLIGHT LOG / \uB2F9\uC2E0\uC740 \uAFC8\uC744 \uC131\uCDE8\uD588\uC5B4\uC694. \uBBFC\uC7AC \uD30C\uC774\uD305! <b>'+String(score).padStart(4,'0')+'</b>';startButton.innerHTML='RE-FLY SORTIE';effectAudio.volume=.3;playAudio(effectAudio,true);setTimeout(speakCheer,350);launchFireworks();}
  let previous=performance.now();
  function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.04);previous=now;updateBreakEffects(dt);if(plane.userData.exhausts)plane.userData.exhausts.forEach((flame,i)=>{flame.material.opacity=.74+Math.sin(now*.014+i)*.2;flame.scale.y=.78+Math.sin(now*.017+i)*.22;});if(plane.userData.afterburnerLights)plane.userData.afterburnerLights.forEach((light,i)=>{light.intensity=(i%2?0.75:2.45)+Math.sin(now*.019+i*1.6)*(i%2?.22:.52);});if(plane.userData.afterburnerSparks)plane.userData.afterburnerSparks.forEach((cloud,index)=>{const points=cloud.geometry.attributes.position;for(let i=0;i<points.count;i++){let z=points.getZ(i)+dt*(5+index);if(z>5.8){z=3.05+Math.random()*.3;points.setX(i,(index===0?-.48:.48)+(Math.random()-.5)*.48);points.setY(i,-.2+(Math.random()-.5)*.34);}points.setZ(i,z);}points.needsUpdate=true;});rotorGroups.forEach((rotor,i)=>{rotor.rotation.y+=dt*(i%2?29:-25);});
    if(running&&!paused){elapsed+=dt;const [baseSpeed,acceleration,maxAcceleration]=[[24,.9,22],[32,1.2,30],[42,1.5,36]][speedStage-1];const speed=baseSpeed+Math.min(elapsed*acceleration,maxAcceleration);routeDistance=Math.min(routeDistance+speed*dt,routeLength);const progress=routeDistance/routeLength*100;routeFillEl.style.width=`${progress}%`;routePlaneEl.style.left=`${progress}%`;routePercentEl.textContent=`${String(Math.round(progress)).padStart(2,'0')}%`;updateMapAircraft(progress);if(progress>=100){document.querySelector('.flight-route').classList.add('arrived');if(!destinationReached)finishAtDestination();}const pressed=direction=>Array.from(touchPresses.values()).includes(direction);const steerX=THREE.MathUtils.clamp(Number(!!(keys.d||keys.arrowright||pressed('right')))-Number(!!(keys.a||keys.arrowleft||pressed('left')))+drag.x,-1,1);const steerY=THREE.MathUtils.clamp(Number(!!(keys.w||keys.arrowup||pressed('up')))-Number(!!(keys.s||keys.arrowdown||pressed('down')))+drag.y,-1,1);engineAudio.volume=soundEnabled?Math.min(.38,.09+speedStage*.045+Math.min(Math.abs(steerX)+Math.abs(steerY),1)*.13):0;state.vx+=steerX*dt*18;state.vy+=steerY*dt*14;state.vx*=Math.pow(.12,dt);state.vy*=Math.pow(.12,dt);state.x=THREE.MathUtils.clamp(state.x+state.vx*dt,-15,15);state.y=THREE.MathUtils.clamp(state.y+state.vy*dt,-9,9);plane.position.set(state.x,state.y,1.3);plane.rotation.z=THREE.MathUtils.lerp(plane.rotation.z,-state.vx*.035,.09);plane.rotation.x=THREE.MathUtils.lerp(plane.rotation.x,state.vy*.016,.08);camera.position.x+=(state.x*.22-camera.position.x)*.025;camera.position.y+=(1.4+state.y*.12-camera.position.y)*.025;camera.lookAt(state.x*.16,state.y*.12-5,-42);const heading=((284+Math.round(state.x*1.8+state.vx*1.5))%360+360)%360,knots=Math.round(speed*1.94384),rangeNm=Math.max(0,13*(1-progress/100)),etaSeconds=knots?Math.round(rangeNm/knots*3600):0;headingEl.textContent=`${String(heading).padStart(3,'0')}°`;document.getElementById('map-heading').textContent=headingEl.textContent;speedEl.textContent=knots;altitudeEl.textContent=Math.max(180,575+Math.round(state.y*26)).toLocaleString();document.getElementById('range-nm').textContent=rangeNm.toFixed(1);document.getElementById('eta-minutes').textContent=`${String(Math.floor(etaSeconds/60)).padStart(2,'0')}:${String(etaSeconds%60).padStart(2,'0')}`;document.getElementById('power-readout').textContent=['IDLE','MIL','MAX'][speedStage-1];score+=Math.round(dt*10);scoreEl.textContent=String(score).padStart(4,'0');
      missionBeacons.forEach(r=>{r.position.z+=speed*dt;r.position.y=r.userData.baseY+Math.sin(elapsed*1.7+r.userData.phase)*.2;r.rotation.y=Math.sin(elapsed*1.3+r.userData.phase)*.2;if(!r.userData.passed&&r.position.z>plane.position.z){r.userData.passed=true;if(Math.hypot(r.position.x-state.x,r.position.y-state.y)<3.25){score+=100;scoreEl.textContent=String(score).padStart(4,'0');showScorePop();collectBeacon(r);effectAudio.volume=.12;playAudio(effectAudio,true);if(score>best){best=score;bestEl.textContent=String(best).padStart(4,'0');localStorage.setItem('skybound-best',best);}}}if(r.position.z>plane.position.z+12){buildBeacon(r,beaconCatalog[nextBeaconIndex++%beaconCatalog.length]);r.position.set((Math.random()-.5)*15,(Math.random()-.5)*10,-spawnZ);r.userData.baseY=r.position.y;r.rotation.set(0,0,(Math.random()-.5)*.18);r.visible=true;spawnZ+=36;}});
      clouds.forEach(c=>{c.position.z+=speed*dt*c.userData.speed;if(c.position.z>30){c.position.z=-290-Math.random()*90;c.position.x=(Math.random()-.5)*115;c.position.y=(Math.random()-.5)*29-10;}});
      landscapes.forEach(g=>{g.position.z+=speed*dt;if(g.position.z>80){const farthest=Math.min(...landscapes.filter(other=>other!==g).map(other=>other.position.z));g.position.z=farthest-395;}});
      combatAircraft.forEach((jet,i)=>{jet.position.z+=speed*dt*jet.userData.speed;jet.position.x=jet.userData.baseX+Math.sin(elapsed*.42+jet.userData.phase)*18;jet.position.y=7+Math.sin(elapsed*.8+jet.userData.phase)*2.2;jet.rotation.z=Math.cos(elapsed*.42+jet.userData.phase)*.035;if(jet.position.z>35){jet.position.z=-680-Math.random()*460;jet.userData.baseX=(Math.random()<.5?-1:1)*(27+Math.random()*15);jet.userData.phase=Math.random()*6.28;}});
      birds.forEach(bird=>{bird.position.z+=speed*dt*bird.userData.speed;bird.position.x+=Math.sin(elapsed*bird.userData.drift+bird.userData.phase)*dt*(bird.userData.eagle?2.1:3.1);bird.position.y+=(Math.cos(elapsed*1.5+bird.userData.phase)-.4)*dt*.65;const flap=Math.sin(elapsed*bird.userData.flap+bird.userData.phase)*.62;bird.userData.right.rotation.z=flap;bird.userData.left.rotation.z=-flap;if(bird.position.z>30){bird.position.set((Math.random()-.5)*68,5+Math.random()*13,-230-Math.random()*180);bird.userData.phase=Math.random()*Math.PI*2;}});
    }
    if(composer){depthOfField.uniforms.focus.value=THREE.MathUtils.lerp(depthOfField.uniforms.focus.value,8,Math.min(1,dt*2));composer.render();}else renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
})();
