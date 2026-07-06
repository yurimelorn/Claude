// ---------- utilidades ----------
const SPLASH = (key) => `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${key}_0.jpg`;
const LOADING_ART = (key) => `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${key}_0.jpg`;

const EZREAL_IMG = new Image();
EZREAL_IMG.crossOrigin = 'anonymous';
EZREAL_IMG.src = LOADING_ART('Ezreal') + '?cors=1';

// gera uma textura circular (estilo "ficha de minimapa") a partir do retrato do
// campeão, com um anel colorido e uma seta de direção apontando pra +X.
// Usada como mapa de um THREE.Sprite (o sprite espelha via scale.x pra indicar direção).
function makeTokenCanvas(img, ringColor, size = 256, brightness = 1){
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const r = size/2 - 8;
  const cx = size/2, cy = size/2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.clip();
  if(img.complete && img.naturalWidth > 0){
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - s) / 2;
    const sy = Math.max(0, (img.naturalHeight - s) * 0.2);
    ctx.filter = brightness !== 1 ? `brightness(${brightness}) saturate(1.1)` : 'none';
    ctx.drawImage(img, sx, sy, s, s, cx-r, cy-r, r*2, r*2);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#14141c';
    ctx.fillRect(cx-r, cy-r, r*2, r*2);
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.lineWidth = size*0.035;
  ctx.strokeStyle = ringColor;
  ctx.shadowColor = ringColor;
  ctx.shadowBlur = size*0.06;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.moveTo(cx + r + size*0.05, cy);
  ctx.lineTo(cx + r - size*0.02, cy - size*0.045);
  ctx.lineTo(cx + r - size*0.02, cy + size*0.045);
  ctx.closePath();
  ctx.fillStyle = ringColor;
  ctx.shadowColor = ringColor;
  ctx.shadowBlur = size*0.03;
  ctx.fill();

  return canvas;
}

function makeGroundShadowCanvas(){
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size/2,size/2,0, size/2,size/2,size/2);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,size,size);
  return canvas;
}

// gera uma textura de grama/floresta (chão da selva de Summoner's Rift) —
// tileável, com manchas de musgo e terra pra não parecer um verde chapado
function makeGroundGrassCanvas(){
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3c6b2a';
  ctx.fillRect(0, 0, size, size);

  for(let i = 0; i < 12; i++){
    const x = Math.random()*size, y = Math.random()*size, r = 14 + Math.random()*26;
    ctx.fillStyle = 'rgba(120,90,50,0.2)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fill();
  }
  for(let i = 0; i < 500; i++){
    const x = Math.random()*size, y = Math.random()*size, r = 1 + Math.random()*2.4;
    const g = 110 + Math.random()*80;
    ctx.fillStyle = `rgba(${40+Math.random()*30},${g},${30+Math.random()*20},0.5)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fill();
  }
  // florzinhas espalhadas pra quebrar o verde
  const flowerColors = ['#ffd94b', '#ff86ad', '#cfe8ff', '#ffb35c'];
  for(let i = 0; i < 26; i++){
    const x = Math.random()*size, y = Math.random()*size;
    ctx.fillStyle = flowerColors[Math.floor(Math.random()*flowerColors.length)];
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI*2);
    ctx.fill();
  }
  return canvas;
}

// céu diurno com gradiente, sol e nuvens suaves — vira o background da cena
function makeSkyCanvas(){
  const w = 1024, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#3f8fd4');
  grad.addColorStop(0.45, '#79bce8');
  grad.addColorStop(0.75, '#bfe4ff');
  grad.addColorStop(1, '#e6f4ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const sun = ctx.createRadialGradient(w*0.72, h*0.28, 6, w*0.72, h*0.28, 110);
  sun.addColorStop(0, 'rgba(255,246,214,0.95)');
  sun.addColorStop(0.25, 'rgba(255,240,190,0.5)');
  sun.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  for(let i = 0; i < 14; i++){
    const cx = Math.random()*w;
    const cy = h*0.12 + Math.random()*h*0.45;
    const s = 30 + Math.random()*70;
    const alpha = 0.12 + Math.random()*0.2;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    for(let j = 0; j < 5; j++){
      ctx.beginPath();
      ctx.ellipse(
        cx + (j-2)*s*0.45,
        cy + (Math.random()-0.5)*s*0.2,
        s*(0.55 - Math.abs(j-2)*0.08),
        s*0.28, 0, 0, Math.PI*2
      );
      ctx.fill();
    }
  }
  return canvas;
}

// textura de água com reflexos — o offset horizontal anima a correnteza
function makeWaterCanvas(){
  const w = 256, h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#3f8fc9');
  grad.addColorStop(0.5, '#5db4e0');
  grad.addColorStop(1, '#3f8fc9');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  for(let i = 0; i < 40; i++){
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + Math.random()*0.18})`;
    ctx.lineWidth = 1 + Math.random();
    const y = Math.random()*h;
    const x = Math.random()*w;
    const len = 12 + Math.random()*30;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len/2, y + (Math.random()*4 - 2), x + len, y);
    ctx.stroke();
  }
  return canvas;
}

function addRiver(scene){
  const tex = new THREE.CanvasTexture(makeWaterCanvas());
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(6, 1);
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 3.6),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9 })
  );
  river.rotation.x = -Math.PI/2;
  river.position.set(0, 0.03, -13);
  scene.add(river);
  return river;
}

// morros distantes na linha do horizonte — a névoa faz o resto do trabalho
function addHills(scene){
  const colors = [0x5c8aa8, 0x6b9db5, 0x7fb0c2];
  for(let i = 0; i < 7; i++){
    const r = 6 + Math.random()*7;
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(r, 10, 8),
      new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
    );
    hill.scale.y = 0.32 + Math.random()*0.18;
    hill.position.set(-24 + i*8 + (Math.random()*4 - 2), 0, -21 - Math.random()*6);
    scene.add(hill);
  }
}

function scatterRocks(scene, count, clearing){
  for(let i = 0; i < count; i++){
    let x, z, tries = 0;
    do {
      x = (Math.random()*2 - 1) * 16;
      z = (Math.random()*2 - 1) * 14 - 2;
      tries++;
    } while(
      x > clearing.minX && x < clearing.maxX &&
      z > clearing.minZ && z < clearing.maxZ &&
      tries < 20
    );
    const s = 0.18 + Math.random()*0.4;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(s, 0),
      new THREE.MeshStandardMaterial({ color: 0x8b8f96, roughness: 0.95, flatShading: true })
    );
    rock.position.set(x, s*0.5, z);
    rock.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
    scene.add(rock);
  }
}

// moitas baixas com flores ocasionais, pra clareira não ficar pelada
function makeBush(){
  const group = new THREE.Group();
  const greens = [0x2f7a38, 0x3f9448, 0x2a6a30];
  for(let i = 0; i < 3; i++){
    const r = 0.28 + Math.random()*0.22;
    const blob = new THREE.Mesh(
      new THREE.SphereGeometry(r, 7, 6),
      new THREE.MeshStandardMaterial({ color: greens[i % greens.length], roughness: 0.9, flatShading: true })
    );
    blob.position.set((Math.random()-0.5)*0.5, r*0.7, (Math.random()-0.5)*0.5);
    group.add(blob);
  }
  if(Math.random() < 0.5){
    const flowerColors = [0xffd94b, 0xff6b9d, 0xcfe8ff];
    for(let i = 0; i < 3; i++){
      const f = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 5, 4),
        new THREE.MeshBasicMaterial({ color: flowerColors[Math.floor(Math.random()*flowerColors.length)] })
      );
      f.position.set((Math.random()-0.5)*0.7, 0.45 + Math.random()*0.2, (Math.random()-0.5)*0.7);
      group.add(f);
    }
  }
  return group;
}

function scatterBushes(scene, count, clearing){
  for(let i = 0; i < count; i++){
    let x, z, tries = 0;
    do {
      x = (Math.random()*2 - 1) * 16;
      z = (Math.random()*2 - 1) * 14 - 2;
      tries++;
    } while(
      x > clearing.minX && x < clearing.maxX &&
      z > clearing.minZ && z < clearing.maxZ &&
      tries < 20
    );
    const bush = makeBush();
    bush.position.set(x, 0, z);
    bush.scale.setScalar(0.7 + Math.random()*0.7);
    scene.add(bush);
  }
}

// vagalumes/partículas arcanas flutuando pela clareira
function addFireflies(scene){
  const count = 60;
  const base = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for(let i = 0; i < count; i++){
    base[i*3]   = (Math.random()*2 - 1) * 15;
    base[i*3+1] = 0.4 + Math.random() * 2.6;
    base[i*3+2] = (Math.random()*2 - 1) * 12 - 2;
    phases[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3));
  const mat = new THREE.PointsMaterial({
    color: 0xfff2a8, size: 0.14, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  return {
    update(now){
      const pos = geo.attributes.position.array;
      for(let i = 0; i < count; i++){
        pos[i*3]   = base[i*3]   + Math.sin(now*0.0004 + phases[i]) * 0.8;
        pos[i*3+1] = base[i*3+1] + Math.sin(now*0.0009 + phases[i]*2) * 0.35;
        pos[i*3+2] = base[i*3+2] + Math.cos(now*0.0005 + phases[i]) * 0.8;
      }
      geo.attributes.position.needsUpdate = true;
    }
  };
}

// mancha de terra batida marcando a pista onde os alvos correm
function makeArenaCanvas(){
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size/2, size/2, size*0.1, size/2, size/2, size/2);
  grad.addColorStop(0, 'rgba(140,110,70,0.5)');
  grad.addColorStop(0.7, 'rgba(120,95,60,0.3)');
  grad.addColorStop(1, 'rgba(120,95,60,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function addArenaFloor(scene, z, depth = 4.6){
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(13, depth),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(makeArenaCanvas()), transparent: true, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI/2;
  mesh.position.set(0, 0.015, z);
  scene.add(mesh);
}

// habilidade de fuga de cada campeão do elenco (usada pra desviar dos seus Qs)
const CHAMP_ABILITY = {
  Vayne:      { type: 'dash' },    // Cambalhota: rola pro lado
  Yuumi:      { type: 'dash' },    // dash rápido estilo W
  Urgot:      { type: 'dash' },    // Desdém: arrancada curta
  Aurora:     { type: 'blink' },   // salto espiritual: teleporta
  Akshan:     { type: 'stealth' }, // camuflagem: some e reaparece
  Gnar:       { type: 'hop' },     // Pulo: salta por cima do tiro
  Rell:       { type: 'haste' },   // monta no cavalo e acelera
  Blitzcrank: { type: 'haste' },   // Sobrecarga
  DrMundo:    { type: 'haste' },   // Mundo corre pra onde quiser
  Renata:     { type: 'haste' },   // Bailout corporativo
  Jinx:       { type: 'haste' },   // Empolgada!
  Volibear:   { type: 'haste' },   // investida trovejante
};

// torre no estilo Summoner's Rift: pedra empilhada, anel dourado e cristal flutuante
function makeTurret(crystalColor){
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x9a938a, roughness: 0.9 });
  const stoneDark = new THREE.MeshStandardMaterial({ color: 0x716b62, roughness: 0.95 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 0.65, roughness: 0.35 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.7, 10), stoneDark);
  base.position.y = 0.35; g.add(base);

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.68, 1.9, 10), stone);
  shaft.position.y = 1.65; g.add(shaft);

  const band = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.05, 8, 20), gold);
  band.rotation.x = Math.PI/2; band.position.y = 2.15; g.add(band);

  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.5, 0.55, 10), stone);
  head.position.y = 2.85; g.add(head);

  // ameias no topo
  for(let i = 0; i < 6; i++){
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.18), stoneDark);
    const a = (i / 6) * Math.PI * 2;
    m.position.set(Math.cos(a)*0.62, 3.2, Math.sin(a)*0.62);
    m.rotation.y = -a;
    g.add(m);
  }

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.3, 0),
    new THREE.MeshBasicMaterial({ color: crystalColor })
  );
  crystal.position.y = 3.75;
  g.add(crystal);

  const shell = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.44, 0),
    new THREE.MeshBasicMaterial({ color: crystalColor, transparent: true, opacity: 0.25 })
  );
  shell.position.y = 3.75;
  g.add(shell);
  crystal.userData = { baseY: 3.75, phase: Math.random()*Math.PI*2, shell };

  const light = new THREE.PointLight(crystalColor, 1.4, 9);
  light.position.y = 3.8;
  g.add(light);

  return { group: g, crystal };
}

function addTurrets(scene){
  const crystals = [];
  const ally = makeTurret(0x4fd8ff);   // torre aliada atrás do Ezreal, cristal azul
  ally.group.position.set(5.6, 0, 2.2);
  scene.add(ally.group);
  crystals.push(ally.crystal);

  const enemy = makeTurret(0xff4b5c);  // torre inimiga atrás da pista dos alvos, cristal vermelho
  enemy.group.position.set(-5.2, 0, -10.6);
  enemy.group.scale.setScalar(1.15);
  scene.add(enemy.group);
  crystals.push(enemy.crystal);

  return crystals;
}

function scatterMushrooms(scene, count, clearing){
  for(let i = 0; i < count; i++){
    let x, z, tries = 0;
    do {
      x = (Math.random()*2 - 1) * 15;
      z = (Math.random()*2 - 1) * 13 - 2;
      tries++;
    } while(
      x > clearing.minX && x < clearing.maxX &&
      z > clearing.minZ && z < clearing.maxZ &&
      tries < 20
    );
    const g = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 0.18, 6),
      new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.9 })
    );
    stem.position.y = 0.09; g.add(stem);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 8, 6, 0, Math.PI*2, 0, Math.PI/2),
      new THREE.MeshStandardMaterial({ color: Math.random() < 0.5 ? 0xc0392b : 0x8e6fc0, roughness: 0.8 })
    );
    cap.position.y = 0.18; g.add(cap);
    g.position.set(x, 0, z);
    g.scale.setScalar(0.8 + Math.random()*0.8);
    scene.add(g);
  }
}

// projéteis temáticos: cada campeão do elenco joga algo com a cara do próprio kit.
// Os modelos apontam pra +X; o spawn gira o grupo na direção do tiro.
function makeChampProjectile(key, ownerColor){
  const g = new THREE.Group();
  const out = { group: g, spin: 0, wobble: 0, speedMul: 1 };
  const glow = (color, r = 0.24, op = 0.3) => new THREE.Mesh(
    new THREE.SphereGeometry(r, 8, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op })
  );

  switch(key){
    case 'Jinx': { // foguete do Fishbones
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x8f3ea8, roughness: 0.55 }));
      body.rotation.z = Math.PI/2; g.add(body);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 8), new THREE.MeshBasicMaterial({ color: 0xff5f8a }));
      tip.rotation.z = -Math.PI/2; tip.position.x = 0.24; g.add(tip);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.2), new THREE.MeshStandardMaterial({ color: 0x5b2a70 }));
      fin.position.x = -0.12; g.add(fin);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.2, 6), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.9 }));
      flame.rotation.z = Math.PI/2; flame.position.x = -0.28; g.add(flame);
      break;
    }
    case 'Yuumi': { // Q serpenteante (Míssil Errante)
      const dart = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), new THREE.MeshBasicMaterial({ color: 0x8ecbff }));
      dart.scale.set(2.1, 1, 1); g.add(dart);
      g.add(glow(0x4e9fff, 0.3, 0.35));
      out.wobble = 0.55;
      break;
    }
    case 'Blitzcrank': { // a mão do gancho
      const metal = new THREE.MeshStandardMaterial({ color: 0xd8a027, metalness: 0.7, roughness: 0.35 });
      const fist = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), metal);
      g.add(fist);
      [-0.07, 0, 0.07].forEach(z => {
        const k = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), metal);
        k.position.set(0.15, 0.05, z); g.add(k);
      });
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x9a7a1e, metalness: 0.6, roughness: 0.4 }));
      arm.rotation.z = Math.PI/2; arm.position.x = -0.3; g.add(arm);
      break;
    }
    case 'Urgot': { // projétil de canhão químico
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.26, 8), new THREE.MeshStandardMaterial({ color: 0x4a4f57, metalness: 0.5, roughness: 0.5 }));
      shell.rotation.z = Math.PI/2; g.add(shell);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0x2e3238, metalness: 0.6, roughness: 0.4 }));
      tip.rotation.z = -Math.PI/2; tip.position.x = 0.2; g.add(tip);
      g.add(glow(0xff7043, 0.2, 0.25));
      break;
    }
    case 'DrMundo': { // cutelo girando
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.03), new THREE.MeshStandardMaterial({ color: 0xb8bfc7, metalness: 0.65, roughness: 0.3 }));
      blade.position.x = 0.1; g.add(blade);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 6), new THREE.MeshStandardMaterial({ color: 0x5b3a1e, roughness: 0.9 }));
      handle.rotation.z = Math.PI/2; handle.position.x = -0.2; g.add(handle);
      out.spin = 0.3;
      break;
    }
    case 'Rell': { // lança de ferromancia
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x3d3f46, metalness: 0.75, roughness: 0.35 }));
      shaft.rotation.z = Math.PI/2; g.add(shaft);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0xc9a24b, metalness: 0.7, roughness: 0.3 }));
      tip.rotation.z = -Math.PI/2; tip.position.x = 0.34; g.add(tip);
      break;
    }
    case 'Aurora': { // orbe espiritual
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshBasicMaterial({ color: 0xf3ecff }));
      g.add(orb);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 20), new THREE.MeshBasicMaterial({ color: 0xb98cff, transparent: true, opacity: 0.8 }));
      g.add(ring);
      g.add(glow(0xd6c2ff, 0.3, 0.3));
      out.spin = 0.12;
      out.wobble = 0.3;
      break;
    }
    case 'Vayne': { // virote de besta (rápido!)
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 6), new THREE.MeshStandardMaterial({ color: 0xcfd6dd, metalness: 0.7, roughness: 0.3 }));
      shaft.rotation.z = Math.PI/2; g.add(shaft);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 6), new THREE.MeshBasicMaterial({ color: 0xe8f4ff }));
      tip.rotation.z = -Math.PI/2; tip.position.x = 0.26; g.add(tip);
      out.speedMul = 1.3;
      break;
    }
    case 'Akshan': { // bumerangue do Q
      const mat = new THREE.MeshStandardMaterial({ color: 0xc98f4b, metalness: 0.5, roughness: 0.5 });
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.09), mat));
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.4), mat));
      out.spin = 0.45;
      break;
    }
    case 'Gnar': { // bumerangue de osso
      const mat = new THREE.MeshStandardMaterial({ color: 0xe8ddc4, roughness: 0.8 });
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.1), mat);
      a.position.x = 0.08; g.add(a);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.42), mat);
      b.position.z = 0.08; g.add(b);
      out.spin = 0.4;
      break;
    }
    case 'Renata': { // míssil corporativo químico
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.28, 8), new THREE.MeshStandardMaterial({ color: 0x2e6e62, metalness: 0.5, roughness: 0.4 }));
      body.rotation.z = Math.PI/2; g.add(body);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 8), new THREE.MeshBasicMaterial({ color: 0x5ef2c8 }));
      tip.rotation.z = -Math.PI/2; tip.position.x = 0.2; g.add(tip);
      g.add(glow(0x5ef2c8, 0.22, 0.3));
      break;
    }
    case 'Volibear': { // esfera de tempestade com raios
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshBasicMaterial({ color: 0xbfe4ff }));
      g.add(orb);
      const zap = new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.9 });
      const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.02), zap);
      s1.rotation.z = 0.6; g.add(s1);
      const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.34, 0.02), zap);
      s2.rotation.z = -0.4; g.add(s2);
      g.add(glow(0x7fd4ff, 0.3, 0.35));
      out.spin = 0.2;
      out.wobble = 0.25;
      break;
    }
    default: { // fallback: esfera de energia na cor do dono
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshBasicMaterial({ color: ownerColor }));
      g.add(core);
      g.add(glow(ownerColor, 0.26, 0.35));
    }
  }
  return out;
}

// pinheiro estilizado low-poly (tronco + camadas de folhagem) pra decorar
// a clareira na selva ao redor da arena
function makeTree(){
  const group = new THREE.Group();
  const trunkH = 1.1 + Math.random()*0.7;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.15, trunkH, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 1 })
  );
  trunk.position.y = trunkH/2;
  group.add(trunk);

  const foliageColors = [0x2f6a34, 0x3c8a3f, 0x255c2c];
  for(let i = 0; i < 3; i++){
    const r = 0.95 - i*0.24;
    const h = 1.15 - i*0.18;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(r, h, 7),
      new THREE.MeshStandardMaterial({ color: foliageColors[i], roughness: 0.9 })
    );
    cone.position.y = trunkH + i*0.5 + h/2 - 0.15;
    group.add(cone);
  }
  return group;
}

// espalha árvores ao redor da clareira central, sem invadir a área de jogo
function scatterTrees(scene, count, clearing){
  for(let i = 0; i < count; i++){
    let x, z, tries = 0;
    do {
      x = (Math.random()*2 - 1) * 17;
      z = (Math.random()*2 - 1) * 17 - 2;
      tries++;
    } while(
      x > clearing.minX && x < clearing.maxX &&
      z > clearing.minZ && z < clearing.maxZ &&
      tries < 20
    );
    const tree = makeTree();
    tree.position.set(x, 0, z);
    tree.scale.setScalar(0.8 + Math.random()*0.7);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
  }
}

// cria um THREE.Sprite (billboard sempre de frente pra câmera) usando o token
function createCharacterToken(img, ringColor, brightness = 1){
  const texture = new THREE.CanvasTexture(makeTokenCanvas(img, ringColor, 256, brightness));
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  if(!img.complete){
    img.addEventListener('load', () => {
      texture.image = makeTokenCanvas(img, ringColor, 256, brightness);
      texture.needsUpdate = true;
    }, { once: true });
  }
  return sprite;
}

function todayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function avatarFallback(name, color){
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
    <rect width='100%' height='100%' fill='#14141c'/>
    <circle cx='100' cy='100' r='96' fill='none' stroke='${color}' stroke-width='4'/>
    <text x='50%' y='54%' font-family='Cinzel, serif' font-size='64' fill='${color}' text-anchor='middle'>${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ---------- dados do elenco ----------
const PLAYERS = [
  {
    id: 'yuri', name: 'Yuri', color: '#ff3d78', photoExt: 'jpeg',
    title: 'A Rainha do Caos de Zaun (e das Rendições)',
    champs: [{ key:'Jinx', label:'Jinx' }],
    lore: [
      `Dizem que nas ruínas de Piltover ainda ecoa um grito de "PERDEMOS" soando segundos antes dos 10 minutos de jogo. Yuri não escolheu Jinx — Jinx o escolheu, no dia em que ele decidiu que "flanco" era só uma sugestão e que foguetes deveriam ser disparados na direção geral da esperança.`,
      `Ele não teme a morte, porque já morreu mais vezes hoje do que o placar consegue contar. Seu grito de guerra, "É POR ISSO QUE EU TENHO ARMAS!", ecoa poucos segundos antes de doar o first blood do dia.`
    ],
    diag: 'Instalocker crônico. Embriagado de adrenalina e pólvora. Sem cura conhecida.'
  },
  {
    id: 'rudri', name: 'Rudri', color: '#8ecbff', photoExt: 'jpeg',
    title: 'A Gata que Nunca Sai do Colo (e Nunca Sai da Base Também)',
    champs: [{ key:'Yuumi', label:'Yuumi' }],
    lore: [
      `Em algum lugar entre Bandle City e o próximo teamfight existe uma gatinha azul flutuante que jurou nunca mais tocar o chão. Rudri, portador do espírito de Yuumi, encontrou a forma definitiva de jogar suporte: não jogar.`,
      `Grudado no ADC como uma sanguessuga fofa, ele acredita piamente que "estar vivo" já é contribuição suficiente para o time. Quando questionado sobre seu dano, apenas ronrona e responde: "eu dei o buff de movimento, calma".`
    ],
    diag: 'Parasitismo competitivo em nível de doutorado. Sintoma principal: 0/0/2 aos 35 minutos.'
  },
  {
    id: 'jotinha', name: 'Jotinha', color: '#4ee6a0', photoExt: 'jpeg',
    title: 'O Colecionador de Ganchos Que Erram e Corpos Que Sobrevivem ao Óbvio',
    champs: [{ key:'Blitzcrank', label:'Blitzcrank' }, { key:'Urgot', label:'Urgot' }, { key:'DrMundo', label:'Dr. Mundo' }],
    lore: [
      `Jotinha é uma anomalia: um homem, três monstros, um destino trágico em comum — o gancho que passa raspando, a engrenagem que atravessa reto por onde o inimigo já não está mais.`,
      `Quando se cansa de errar como Blitzcrank, veste as lâminas de Urgot "pra garantir dano" — e mesmo sem depender de skillshot, encontra um jeito de morrer sozinho na base inimiga. Nos dias de raiva pura, vira Mundo e berra "MUNDO NÃO SE IMPORTA!", enquanto o time inteiro, visivelmente, se importa muito.`
    ],
    diag: 'Trindade impossível da linha de frente furada. Prognóstico: recall precoce recorrente.'
  },
  {
    id: 'abilio', name: 'Abílio', color: '#c9a24b',
    title: 'A Cavaleira Sem Cavalo e a Feiticeira Sem Rumo',
    champs: [{ key:'Rell', label:'Rell' }, { key:'Aurora', label:'Aurora' }],
    lore: [
      `Abílio vive entre duas lendas: Rell, que desmonta bem na hora errada do all-in e vira alvo de treino ambulante; e Aurora, a caminhante entre o mundo dos vivos e dos espíritos, que Abílio usa principalmente pra passear pelo mapa sem propósito claro, visitando os mortos — ou seja, o próprio time, cinco minutos depois de cada engajada.`,
      `Em ambas as formas, seu talento raro é iniciar a luta sozinho, virar de costas, e assistir o resto da equipe de longe, como quem assiste a um pôr do sol.`
    ],
    diag: 'Iniciativa suicida crônica. Nenhum aliado presente foi encontrado nas últimas 40 partidas.'
  },
  {
    id: 'jack', name: 'Jeck', color: '#b98cff',
    title: 'O Caçador Invisível (Inclusive pros Próprios Alvos)',
    champs: [{ key:'Vayne', label:'Vayne' }, { key:'Akshan', label:'Akshan' }],
    lore: [
      `Jack acredita ser uma sombra letal, um fantasma da noite que ninguém vê chegar. Só que ninguém vê mesmo — nem ele os alvos. Como Vayne, esconde-se nas sombras esperando o momento perfeito, que nunca chega.`,
      `Como Akshan, rouba o ouro dos inimigos mortos, mas raramente é o motivo de alguém estar morto. Sua invisibilidade é tão eficiente que o próprio time esquece que ele existe até o pós-jogo.`
    ],
    diag: 'Camuflagem tática 100% funcional. Efeito colateral: dano também invisível.'
  },
  {
    id: 'falconi', name: 'Falconi', color: '#f2e14b', photoExt: 'jpeg',
    title: 'O Yordle Que Vira Fúria (Bem na Hora Errada)',
    champs: [{ key:'Gnar', label:'Gnar' }],
    lore: [
      `Pequeno, fofo, feito de energia acumulada — e explosivo do jeito errado. Falconi transforma em Mega Gnar exatamente no instante em que o time decide recuar, e recua exatamente no instante em que deveria transformar.`,
      `É uma bomba-relógio que ninguém consegue sincronizar, nem ele mesmo. A lenda diz que sua fúria dura sempre 2 segundos a menos ou 2 segundos a mais do que o necessário.`
    ],
    diag: 'Ritmo interno dessincronizado com a realidade da partida.'
  },
  {
    id: 'enzo', name: 'Enzo "Míssil Moreno"', color: '#e0b3ff', photoExt: 'jpeg',
    title: 'A Chairwoman de Zaun (Manda Bem, Executa Mal)',
    champs: [{ key:'Renata', label:'Renata Glasc' }],
    lore: [
      `Enzo comanda como Renata Glasc: rico, poderoso, capaz de virar até o próprio aliado contra o time com um ult mal mirado. Apelidado "Míssil Moreno" pela velocidade com que corre direto para o meio de cinco inimigos, tomado por confiança industrial e zero plano de fuga.`,
      `Seu legado é uma corporação inteira de decisões questionáveis, financiada com vidas doadas em nome do lucro — leia-se, kills de graça pro time adversário.`
    ],
    diag: 'Overextend classificado como estratégia corporativa. Ações em queda livre constante.'
  },
  {
    id: 'targino', name: 'Targino', color: '#e0b3ff', photoExt: 'jpeg',
    title: 'O Aprendiz Que Virou o Próprio Mestre (Sem Perguntar)',
    champs: [],
    specialPhoto: 'enzo',
    specialPhotoExt: 'jpeg',
    specialCaption: 'Main: Enzo "Míssil Moreno"',
    lore: [
      `Targino não escolheu um campeão. Ele escolheu virar o Enzo. Estudou cada movimento, cada engajada suicida, cada "confia" dito segundos antes de morrer — até que a linha entre imitação e possessão desaparecesse de vez.`,
      `Hoje, quando entra numa call, ninguém mais pergunta "quem você tá jogando" — só "Enzo, é você de novo?". Alguns dizem que ele nem carrega mais campeão próprio: carrega o do mestre, com a mesma reverência de um discípulo e a mesma taxa de erro.`
    ],
    diag: 'Transferência de personalidade completa. Tratamento: nenhum previsto, nenhum solicitado.'
  },
  {
    id: 'giacommo', name: 'Giacomo', color: '#5da9ff', photoExt: 'jpeg',
    title: 'O Deus-Urso Primordial Que Cabeceia a Parede',
    champs: [{ key:'Volibear', label:'Volibear' }],
    lore: [
      `Vindo de eras esquecidas, Volibear é fúria pura, trovão e garras. Giacommo canaliza esse primata ursino em todo all-in que não deveria acontecer, avançando com a mesma lógica de quem cabeceia uma porta fechada esperando que ela abra.`,
      `Machuca mais a própria cabeça do que o inimigo — mas a lenda garante que ele nunca aprende, e essa é a única constante confiável do universo.`
    ],
    diag: 'Reflexo primordial de engajar sem visão. Cura: inexistente há eras.'
  },
];

// ---------- alvos do treino de mira: os campeões do elenco R.G. ----------
const MIRA_TARGETS = [];
PLAYERS.forEach(p => {
  const owner = p.name.split(' ')[0].replace(/"/g, '');
  p.champs.forEach(c => MIRA_TARGETS.push({ key: c.key, label: c.label, owner, color: p.color }));
});

const MIRA_IMGS = {};
function targetImg(key){
  if(!MIRA_IMGS[key]){
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = LOADING_ART(key) + '?cors=1';
    MIRA_IMGS[key] = img;
  }
  return MIRA_IMGS[key];
}

// ---------- render ----------
const contentEl = document.getElementById('content');
const tabsEl = document.getElementById('tabs');
const creditsEl = document.getElementById('credits');

// nav de cima: só os joguinhos/recursos (nada de perfis de integrante aqui)
function buildTabs(){
  tabsEl.innerHTML = '';
  const miraBtn = document.createElement('button');
  miraBtn.className = 'tab-btn game';
  miraBtn.textContent = 'Treino de Mira';
  miraBtn.dataset.tab = 'mira';
  miraBtn.onclick = () => selectTab('mira');
  tabsEl.appendChild(miraBtn);

  const heimerBtn = document.createElement('button');
  heimerBtn.className = 'tab-btn quiz';
  heimerBtn.textContent = 'Quiz do Heimerdinger';
  heimerBtn.dataset.tab = 'heimer';
  heimerBtn.onclick = () => selectTab('heimer');
  tabsEl.appendChild(heimerBtn);

  const rekBtn = document.createElement('button');
  rekBtn.className = 'tab-btn reksai';
  rekBtn.textContent = "Caça à Rek'Sai";
  rekBtn.dataset.tab = 'reksai';
  rekBtn.onclick = () => selectTab('reksai');
  tabsEl.appendChild(rekBtn);

  const hojeBtn = document.createElement('button');
  hojeBtn.className = 'tab-btn special';
  hojeBtn.textContent = 'Quem vai jogar hoje?';
  hojeBtn.dataset.tab = 'hoje';
  hojeBtn.onclick = () => selectTab('hoje');
  tabsEl.appendChild(hojeBtn);
}

// rodapé de baixo: os "donos" do site — nomes do elenco
function buildCredits(){
  creditsEl.innerHTML = '';
  PLAYERS.forEach(p=>{
    const link = document.createElement('button');
    link.className = 'credit-link';
    link.textContent = p.name;
    link.dataset.tab = p.id;
    link.type = 'button';
    link.onclick = () => selectTab(p.id);
    creditsEl.appendChild(link);
  });
}

function playerPhotoTag(p){
  const photoId = p.id;
  const ext = p.photoExt || 'jpg';
  const fallback = avatarFallback(p.name.replace(/"[^"]*"/,'').trim(), p.color);
  return `<img class="player-photo" style="--accent-color:${p.color}; --accent-glow:${p.color}55"
            src="assets/players/${photoId}.${ext}"
            onerror="this.onerror=null;this.src='${fallback}';">`;
}

function renderPlayer(p){
  const champTags = p.champs.map(c=>`<span class="champ-tag">${c.label}</span>`).join('');
  const splashCards = p.champs.map(c=>`
    <div class="splash-card">
      <img src="${SPLASH(c.key)}" alt="${c.label}" loading="lazy">
      <div class="cap">${c.label}</div>
    </div>`).join('');

  const specialCard = p.specialCaption ? `
    <div class="splash-card special">
      <img src="assets/players/${p.specialPhoto}.${p.specialPhotoExt || 'jpg'}" alt="${p.specialCaption}"
           onerror="this.onerror=null;this.src='${avatarFallback('Enzo', p.color)}';">
      <div class="cap">${p.specialCaption}</div>
    </div>` : '';

  contentEl.innerHTML = `
    <section class="player-panel" style="--accent-color:${p.color}">
      <div class="player-head">
        ${playerPhotoTag(p)}
        <div class="player-id">
          <h2 class="player-name">${p.name}</h2>
          <div class="player-title">"${p.title}"</div>
          <div class="champ-tags">${champTags}</div>
        </div>
      </div>

      <div class="lore-box">
        <h3>Lore</h3>
        ${p.lore.map(par=>`<p>${par}</p>`).join('')}
        <div class="diag">Diagnóstico clínico: <b>${p.diag}</b></div>
      </div>

      <div class="splash-grid">${splashCards}${specialCard}</div>
    </section>
  `;
}

function loadRoster(){
  const raw = localStorage.getItem(`rg_roster_${todayKey()}`);
  return raw ? JSON.parse(raw) : [];
}
function saveRoster(list){
  localStorage.setItem(`rg_roster_${todayKey()}`, JSON.stringify(list));
}
function addToRoster(name){
  const list = loadRoster();
  if(!list.some(e => e.name.toLowerCase() === name.toLowerCase())){
    list.push({ name, time: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) });
    saveRoster(list);
  }
}

function renderHoje(){
  const list = loadRoster();
  const items = list.length
    ? `<ul class="roster">${list.map(e=>`<li><span class="n">${e.name}</span><span class="t">chegou às ${e.time}</span></li>`).join('')}</ul>`
    : `<p class="empty-roster">Ninguém confirmou presença ainda. O Rift espera... e espera... e vocês seguem no "bora ver depois".</p>`;

  contentEl.innerHTML = `
    <section class="player-panel hoje-panel">
      <div class="lore-box">
        <h3>Convocação do dia</h3>
        <p>Todo dia é o mesmo ritual: alguém pergunta "vamos jogar?", ninguém responde por 40 minutos, e de repente estão todos na call às 23h decidindo instalockar. Registre sua presença abaixo antes que seja tarde demais.</p>
      </div>

      <form class="hoje-form" id="hoje-form">
        <input type="text" id="hoje-name" placeholder="Adicionar outro nome à lista..." maxlength="30">
        <button type="submit">Confirmar presença</button>
      </form>

      <h3 style="font-family:'Cinzel',serif; letter-spacing:2px; color:var(--text-dim); font-size:.9rem; text-transform:uppercase;">
        Escalação de hoje (${list.length})
      </h3>
      ${items}
    </section>
  `;

  document.getElementById('hoje-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const input = document.getElementById('hoje-name');
    const val = input.value.trim();
    if(val){ addToRoster(val); renderHoje(); }
  });
}

// ---------- treino de mira (skillshot) ----------
function miraVerdict(acc){
  if(acc === 0) return 'Perfeito. Nem uma vez. Bem-vindo oficialmente ao time.';
  if(acc <= 30) return 'Realista. Isso aí é o seu KDA de todo santo dia.';
  if(acc <= 60) return 'Ihh, melhorou. Cuidado que ele pode virar carry.';
  if(acc <= 90) return 'Suspeito. Isso não parece coisa de R.G.';
  return 'ALERTA DE SMURF. Reportem esse jogador imediatamente.';
}

function renderMira(){
  contentEl.innerHTML = `
    <section class="player-panel mira-panel">
      <div class="lore-box">
        <h3>Treino de Mira — Arena 3D</h3>
        <p>Temporada de caça oficial da R.G.: os campeões do elenco invadem a clareira um por vez — e agora eles <b>revidam e fogem de verdade</b>. Correm em todas as direções (inclusive pra frente e pra trás), jogam os próprios poderes no Ezreal e usam habilidades pra escapar do seu Q: a Vayne rola a Cambalhota, o Akshan some na camuflagem, a Rell monta no cavalo, o Gnar pula por cima do tiro, a Aurora teleporta... Clique no chão pra disparar e use <b>A</b> e <b>D</b> (ou as setas) pra desviar. Três poderes na cara e o Ezreal cai. São <b>10 tiros</b> por rodada.</p>
      </div>
      <div class="mira-hud">
        <span>Tiros: <b id="mira-shots">0</b>/10</span>
        <span>Acertos: <b id="mira-hits">0</b></span>
        <span>Precisão: <b id="mira-acc">0%</b></span>
        <span>Vida: <b id="mira-hp">❤❤❤</b></span>
        <span>E (Deslocamento Arcano): <b id="mira-e">PRONTO</b></span>
        <span>Alvo da vez: <b id="mira-target">—</b></span>
        <button id="mira-reset-btn" class="mira-reset-btn" type="button">Reiniciar</button>
      </div>
      <canvas id="mira-canvas" width="700" height="380"></canvas>
      <p class="mira-hint">Clique pra disparar o Q. Segure <b>A</b>/<b>D</b> (ou ←/→) pra desviar dos poderes inimigos. Sem mira automática, sem desculpa.</p>
      <div id="mira-result" class="mira-result hidden"></div>
    </section>
  `;
  MIRA_TARGETS.forEach(t => targetImg(t.key)); // pré-carrega os retratos do elenco
  initMiraGame();
}

function initMiraGame(){
  const canvas = document.getElementById('mira-canvas');
  const shotsEl = document.getElementById('mira-shots');
  const hitsEl = document.getElementById('mira-hits');
  const accEl = document.getElementById('mira-acc');
  const hpEl = document.getElementById('mira-hp');
  const targetNameEl = document.getElementById('mira-target');
  const resultEl = document.getElementById('mira-result');
  const resetBtn = document.getElementById('mira-reset-btn');

  const MAX_SHOTS = 10;
  const LANE = { minX: -4.2, maxX: 4.2, minZ: -8.8, maxZ: -3.2 }; // agora com profundidade
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const SHOOTER_POS = new THREE.Vector3(0, 1.1, 5.5); // o x muda com A/D
  const TARGET_Y = 1.1;
  const HIT_DIST = 1.15;
  const MAX_HP = 3;
  const EZ_LIMIT = 2.75;    // limite lateral: mantém o Ezreal sempre visível na tela
  const EZ_SPEED = 0.13;    // velocidade do desvio
  const EZ_HIT_DIST = 0.95; // raio de colisão dos poderes inimigos

  // controles de desvio: A/D (ou setas) movem o Ezreal
  const keys = { left: false, right: false };
  function onKeyDown(e){
    if(e.code === 'KeyA' || e.code === 'ArrowLeft'){ keys.left = true; e.preventDefault(); }
    else if(e.code === 'KeyD' || e.code === 'ArrowRight'){ keys.right = true; e.preventDefault(); }
  }
  function onKeyUp(e){
    if(e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    else if(e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // ---------- cena 3D ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.width, canvas.height, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.CanvasTexture(makeSkyCanvas());
  scene.fog = new THREE.Fog(0xbfe4ff, 16, 55);

  const camera = new THREE.PerspectiveCamera(48, canvas.width / canvas.height, 0.1, 100);
  camera.position.set(0, 4.2, 9.5);
  camera.lookAt(0, 1.1, -3.5);

  scene.add(new THREE.HemisphereLight(0xbfe4ff, 0x4a7a3c, 0.9));
  const sun = new THREE.DirectionalLight(0xfff3d6, 1.15);
  sun.position.set(8, 14, 6);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  const groundTexture = new THREE.CanvasTexture(makeGroundGrassCanvas());
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(14, 14);
  groundTexture.anisotropy = 4;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ map: groundTexture, roughness: 0.97, metalness: 0.02 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const CLEARING = { minX: -6, maxX: 6, minZ: -10, maxZ: 7.5 };
  scatterTrees(scene, 30, CLEARING);
  scatterRocks(scene, 12, CLEARING);
  scatterBushes(scene, 16, CLEARING);
  addHills(scene);
  const river = addRiver(scene);
  const fireflies = addFireflies(scene);
  addArenaFloor(scene, (LANE.minZ + LANE.maxZ) / 2, 7); // arena dos alvos, agora mais funda
  addArenaFloor(scene, SHOOTER_POS.z, 3.6);             // trilha onde o Ezreal desvia
  scatterMushrooms(scene, 10, CLEARING);
  const turretCrystals = addTurrets(scene);

  const shadowTex = new THREE.CanvasTexture(makeGroundShadowCanvas());
  function makeShadow(scale){
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(scale, scale),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;
    scene.add(mesh);
    return mesh;
  }
  const targetShadow = makeShadow(1.7);
  const ezrealShadow = makeShadow(1.9);

  // anel de velocidade: aparece sob o alvo enquanto a habilidade de correr está ativa
  const speedRing = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.62, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  speedRing.rotation.x = -Math.PI/2;
  speedRing.position.y = 0.04;
  scene.add(speedRing);

  const TARGET_SCALE = 1.7;
  const EZREAL_SCALE = 1.9;

  // o alvo é sempre um campeão do elenco; o sprite troca a cada abate
  let targetSprite = null;
  let currentTarget = null;
  function spawnTargetSprite(entry){
    if(targetSprite) scene.remove(targetSprite);
    targetSprite = createCharacterToken(targetImg(entry.key), entry.color, 1.25);
    targetSprite.scale.set(TARGET_SCALE, TARGET_SCALE, 1);
    scene.add(targetSprite);
    if(targetNameEl){
      targetNameEl.textContent = `${entry.label} (${entry.owner})`;
      targetNameEl.style.color = entry.color;
    }
  }

  const ezrealToken = createCharacterToken(EZREAL_IMG, '#4fd8ff');
  ezrealToken.scale.set(EZREAL_SCALE, EZREAL_SCALE, 1);
  ezrealToken.position.copy(SHOOTER_POS);
  ezrealShadow.position.set(SHOOTER_POS.x, 0.02, SHOOTER_POS.z);
  scene.add(ezrealToken);

  // plano de mira na MESMA altura em que o alvo e o tiro viajam (não o chão!).
  // Se a mira raycastasse contra o chão (y=0), o ponto clicado sofreria
  // paralaxe em relação ao que o jogador vê na tela — por isso o tiro parecia
  // sair torto em relação ao mouse.
  const aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SHOOTER_POS.y);
  const raycaster = new THREE.Raycaster();

  let state;
  let lastTargetIdx = -1;
  function freshTarget(hits = 0){
    let idx = Math.floor(Math.random() * MIRA_TARGETS.length);
    if(MIRA_TARGETS.length > 1 && idx === lastTargetIdx) idx = (idx + 1) % MIRA_TARGETS.length;
    lastTargetIdx = idx;
    currentTarget = MIRA_TARGETS[idx];
    spawnTargetSprite(currentTarget);
    return {
      x: LANE.minX + Math.random() * (LANE.maxX - LANE.minX),
      z: LANE.minZ + Math.random() * (LANE.maxZ - LANE.minZ),
      vx: (Math.random() < 0.5 ? -1 : 1) * Math.min(0.04 + Math.random()*0.015 + hits * 0.008, 0.115),
      vz: (Math.random() < 0.5 ? -1 : 1) * (0.015 + Math.random()*0.03),
      bobPhase: Math.random() * Math.PI * 2,
      // estado das habilidades de fuga
      dashVx: 0, dashVz: 0,
      hasteUntil: 0,
      stealthUntil: 0,
      hopT: -1,
      abilityReadyAt: performance.now() + 1200 + Math.random()*1500
    };
  }

  // usa a habilidade característica do campeão pra tentar escapar do Q
  function useEvadeAbility(t){
    const ab = CHAMP_ABILITY[currentTarget.key] || { type: 'dash' };
    const dirSign = Math.random() < 0.5 ? -1 : 1;
    const nowMs = performance.now();
    if(ab.type === 'dash'){
      t.dashVx = dirSign * (0.18 + Math.random()*0.08);
      t.dashVz = (Math.random()*2 - 1) * 0.1;
    } else if(ab.type === 'blink'){
      spawnHitBurst(t.x, TARGET_Y, t.z, currentTarget.color);
      t.x = clamp(t.x + dirSign * (2 + Math.random()*1.5), LANE.minX, LANE.maxX);
      t.z = clamp(t.z + (Math.random()*2 - 1) * 2, LANE.minZ, LANE.maxZ);
      spawnHitBurst(t.x, TARGET_Y, t.z, currentTarget.color);
    } else if(ab.type === 'stealth'){
      t.stealthUntil = nowMs + 1300;
      t.hasteUntil = nowMs + 1300; // corre enquanto está sumido
    } else if(ab.type === 'hop'){
      t.hopT = 0;
      t.dashVx = dirSign * 0.14;
      t.dashVz = (Math.random()*2 - 1) * 0.08;
    } else {
      t.hasteUntil = nowMs + 1900;
    }
  }
  function freshState(){
    return {
      shots: 0, hits: 0, projectiles: [], enemyShots: [],
      target: freshTarget(), over: false,
      hp: MAX_HP,
      nextEnemyShotAt: performance.now() + 1800,
      ezHitFlashUntil: 0
    };
  }
  state = freshState();

  function updateHud(){
    shotsEl.textContent = state.shots;
    hitsEl.textContent = state.hits;
    accEl.textContent = state.shots ? Math.round((state.hits / state.shots) * 100) + '%' : '0%';
    hpEl.textContent = '❤'.repeat(state.hp) + '🖤'.repeat(MAX_HP - state.hp);
  }

  function endGameIfNeeded(){
    if(state.over) return;
    if(state.shots >= MAX_SHOTS && state.projectiles.length === 0){
      state.over = true;
      const acc = Math.round((state.hits / MAX_SHOTS) * 100);
      resultEl.innerHTML = `<b>${state.hits}/${MAX_SHOTS} acertos (${acc}%)</b><br>${miraVerdict(acc)}`;
      resultEl.classList.remove('hidden');
    }
  }

  // bolt no estilo do Q do Ezreal (Mystic Shot): ponta afiada de energia
  // clara, um corpo fino translúcido e um rastro de faíscas arcanas atrás
  function spawnBolt(dir){
    const group = new THREE.Group();

    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.24, 8),
      new THREE.MeshBasicMaterial({ color: 0xf3fbff })
    );
    tip.position.y = 0.42;
    group.add(tip);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.05, 0.55, 8),
      new THREE.MeshBasicMaterial({ color: 0x6fd8ff, transparent: true, opacity: 0.8 })
    );
    shaft.position.y = 0.05;
    group.add(shaft);

    const trailColors = [0x6fd8ff, 0x4fb8e8, 0x2f8fc4];
    trailColors.forEach((color, i) => {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 - i*0.014, 6, 6),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 - i*0.14 })
      );
      s.position.y = -0.28 - i*0.2;
      group.add(s);
    });

    const light = new THREE.PointLight(0x6fe0ff, 1.6, 4.5);
    light.position.y = 0.2;
    group.add(light);

    group.position.copy(SHOOTER_POS);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    scene.add(group);
    return group;
  }

  // anel de impacto + clarão na cor do dono do campeão abatido
  const effects = [];
  function spawnHitBurst(x, y, z, color){
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.4, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.position.set(x, 0.05, z);
    ring.rotation.x = -Math.PI/2;
    scene.add(ring);
    const flash = new THREE.PointLight(color, 2.2, 6);
    flash.position.set(x, y, z);
    scene.add(flash);
    effects.push({ ring, flash, life: 0 });
  }

  // poder inimigo: projétil temático do campeão da vez, mirado no Ezreal
  function spawnEnemyBolt(){
    const t = state.target;
    const proj = makeChampProjectile(currentTarget.key, currentTarget.color);
    const dir = new THREE.Vector3(SHOOTER_POS.x - t.x, 0, SHOOTER_POS.z - t.z).normalize();
    proj.group.position.set(t.x, TARGET_Y, t.z);
    proj.group.rotation.y = Math.atan2(-dir.z, dir.x); // aponta o modelo (+X) pro Ezreal
    const light = new THREE.PointLight(new THREE.Color(currentTarget.color), 1.0, 3.5);
    proj.group.add(light);
    scene.add(proj.group);
    state.enemyShots.push({
      mesh: proj.group, dir,
      speed: (0.16 + Math.random()*0.05 + state.hits*0.007) * proj.speedMul,
      spin: proj.spin,
      wobble: proj.wobble,
      base: proj.group.position.clone(),
      perp: new THREE.Vector3(-dir.z, 0, dir.x),
      phase: Math.random()*Math.PI*2
    });
  }

  function endByDeath(){
    state.over = true;
    const acc = state.shots ? Math.round((state.hits / state.shots) * 100) : 0;
    resultEl.innerHTML = `<b>EZREAL CAIU! ${state.hits} acerto(s) em ${state.shots} tiro(s) (${acc}%)</b><br>` +
      `${currentTarget.label} (${currentTarget.owner}) devolveu o flame em forma de dano. Morrer pro alvo do próprio treino de mira é a coisa mais R.G. que existe.`;
    resultEl.classList.remove('hidden');
  }

  canvas.addEventListener('click', (e) => {
    if(state.over || state.shots >= MAX_SHOTS) return;
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera({ x: nx, y: ny }, camera);
    const hitPoint = new THREE.Vector3();
    if(!raycaster.ray.intersectPlane(aimPlane, hitPoint)) return;

    const dir = new THREE.Vector3(hitPoint.x - SHOOTER_POS.x, 0, hitPoint.z - SHOOTER_POS.z).normalize();
    const bolt = spawnBolt(dir);
    state.projectiles.push({ mesh: bolt, dir, speed: 0.46 });
    state.shots++;
    updateHud();
  });

  resetBtn.addEventListener('click', () => {
    state.projectiles.forEach(p => scene.remove(p.mesh));
    state.enemyShots.forEach(p => scene.remove(p.mesh));
    SHOOTER_POS.x = 0;
    state = freshState();
    resultEl.classList.add('hidden');
    updateHud();
  });

  function tick(){
    if(!document.body.contains(canvas)){
      // saiu da aba: encerra o loop e devolve o teclado
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      return;
    }

    const now = performance.now();
    const t = state.target;

    // decide se usa habilidade de fuga: reage a um Q chegando perto (ou do nada, às vezes)
    if(!state.over && now >= t.abilityReadyAt){
      const threatened = state.projectiles.some(p =>
        Math.hypot(p.mesh.position.x - t.x, p.mesh.position.z - t.z) < 3.2
      );
      if(threatened || Math.random() < 0.003){
        useEvadeAbility(t);
        t.abilityReadyAt = now + 2600 + Math.random()*2000;
      }
    }

    // movimento com profundidade + impulso de dash decaindo
    const hasted = now < t.hasteUntil;
    const speedMul = hasted ? 1.9 : 1;
    t.x += t.vx * speedMul + t.dashVx;
    t.z += t.vz * speedMul + t.dashVz;
    t.dashVx *= 0.86;
    t.dashVz *= 0.86;
    if(t.x <= LANE.minX || t.x >= LANE.maxX){
      t.x = clamp(t.x, LANE.minX, LANE.maxX);
      t.vx *= -1;
      t.dashVx *= -0.5;
    }
    if(t.z <= LANE.minZ || t.z >= LANE.maxZ){
      t.z = clamp(t.z, LANE.minZ, LANE.maxZ);
      t.vz *= -1;
      t.dashVz *= -0.5;
    }
    if(Math.random() < 0.008) t.vz = (Math.random() < 0.5 ? -1 : 1) * (0.015 + Math.random()*0.03);

    // pulo do Gnar: arco vertical por cima do tiro
    let targetY = TARGET_Y + Math.sin(now * 0.005 + t.bobPhase) * 0.1;
    if(t.hopT >= 0){
      t.hopT += 0.045;
      if(t.hopT >= 1) t.hopT = -1;
      else targetY += Math.sin(t.hopT * Math.PI) * 1.3;
    }

    // camuflagem do Akshan: sprite e sombra quase somem
    const stealthed = now < t.stealthUntil;
    targetSprite.material.opacity = stealthed ? 0.12 : 1;
    targetShadow.material.opacity = stealthed ? 0.15 : 1;

    // anel de velocidade sob quem está acelerado
    if(hasted && !stealthed){
      speedRing.material.opacity = 0.7;
      speedRing.material.color.set(currentTarget.color);
      speedRing.position.set(t.x, 0.04, t.z);
      const pulse = 1 + 0.15 * Math.sin(now * 0.02);
      speedRing.scale.set(pulse, pulse, 1);
    } else {
      speedRing.material.opacity = 0;
    }

    const hasteScale = hasted ? 1.12 : 1; // Rell montada (e afins) fica maior
    targetSprite.position.set(t.x, targetY, t.z);
    targetSprite.scale.set(
      TARGET_SCALE * hasteScale * ((t.vx * speedMul + t.dashVx) >= 0 ? 1 : -1),
      TARGET_SCALE * hasteScale,
      1
    );
    targetShadow.position.set(t.x, 0.02, t.z);

    // desvio com A/D
    if(!state.over){
      if(keys.left)  SHOOTER_POS.x = Math.max(-EZ_LIMIT, SHOOTER_POS.x - EZ_SPEED);
      if(keys.right) SHOOTER_POS.x = Math.min( EZ_LIMIT, SHOOTER_POS.x + EZ_SPEED);
    }
    ezrealToken.position.set(SHOOTER_POS.x, SHOOTER_POS.y, SHOOTER_POS.z);
    ezrealShadow.position.set(SHOOTER_POS.x, 0.02, SHOOTER_POS.z);
    ezrealToken.scale.x = EZREAL_SCALE * ((t.x >= SHOOTER_POS.x) ? 1 : -1);
    ezrealToken.material.color.setHex(now < state.ezHitFlashUntil ? 0xff5a5a : 0xffffff);

    // o alvo revida: atira um poder no Ezreal de tempos em tempos (camuflado não atira)
    if(!state.over && now >= state.nextEnemyShotAt){
      if(stealthed){
        state.nextEnemyShotAt = t.stealthUntil + 200;
      } else {
        spawnEnemyBolt();
        state.nextEnemyShotAt = now + 1100 + Math.random()*1300 - Math.min(state.hits*70, 500);
      }
    }

    for(let i = state.enemyShots.length - 1; i >= 0; i--){
      const p = state.enemyShots[i];
      p.base.addScaledVector(p.dir, p.speed);
      p.mesh.position.copy(p.base);
      if(p.wobble) p.mesh.position.addScaledVector(p.perp, Math.sin(now*0.008 + p.phase) * p.wobble);
      if(p.spin) p.mesh.rotation.y += p.spin;
      const dx = p.mesh.position.x - SHOOTER_POS.x;
      const dz = p.mesh.position.z - SHOOTER_POS.z;
      if(!state.over && Math.hypot(dx, dz) <= EZ_HIT_DIST){
        state.hp--;
        state.ezHitFlashUntil = now + 280;
        spawnHitBurst(SHOOTER_POS.x, SHOOTER_POS.y, SHOOTER_POS.z, '#ff4b5c');
        scene.remove(p.mesh);
        state.enemyShots.splice(i, 1);
        updateHud();
        if(state.hp <= 0) endByDeath();
        continue;
      }
      if(Math.abs(p.mesh.position.x) > 10 || p.mesh.position.z > 9 || p.mesh.position.z < -14){
        scene.remove(p.mesh);
        state.enemyShots.splice(i, 1);
      }
    }

    river.material.map.offset.x += 0.0011;
    fireflies.update(now);

    // cristais das torres flutuam e giram devagar
    for(const c of turretCrystals){
      c.rotation.y += 0.02;
      const y = c.userData.baseY + Math.sin(now*0.002 + c.userData.phase) * 0.1;
      c.position.y = y;
      c.userData.shell.position.y = y;
      c.userData.shell.rotation.y = c.rotation.y;
    }

    for(let i = effects.length - 1; i >= 0; i--){
      const fx = effects[i];
      fx.life += 0.055;
      const s = 1 + fx.life * 4.5;
      fx.ring.scale.set(s, s, s);
      fx.ring.material.opacity = Math.max(0, 0.95 - fx.life);
      fx.flash.intensity = Math.max(0, 2.2 * (1 - fx.life * 1.6));
      if(fx.life >= 1){
        scene.remove(fx.ring);
        scene.remove(fx.flash);
        effects.splice(i, 1);
      }
    }

    for(let i = state.projectiles.length - 1; i >= 0; i--){
      const p = state.projectiles[i];
      p.mesh.position.addScaledVector(p.dir, p.speed);

      const dist = Math.hypot(p.mesh.position.x - t.x, p.mesh.position.z - t.z);
      if(dist <= HIT_DIST){
        state.hits++;
        spawnHitBurst(t.x, TARGET_Y, t.z, currentTarget.color);
        scene.remove(p.mesh);
        state.projectiles.splice(i, 1);
        state.target = freshTarget(state.hits);
        updateHud();
        endGameIfNeeded();
        continue;
      }
      if(Math.abs(p.mesh.position.x) > 9 || p.mesh.position.z < -14 || p.mesh.position.z > 9){
        scene.remove(p.mesh);
        state.projectiles.splice(i, 1);
        endGameIfNeeded();
        continue;
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  updateHud();
  requestAnimationFrame(tick);
}

// ---------- quiz do heimerdinger ----------
function shuffleArray(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QUIZ_QUESTIONS = [
  {
    cat: 'Competitivo',
    q: 'Qual foi o primeiro time a vencer dois Campeonatos Mundiais consecutivos (2015 e 2016)?',
    options: ['SK Telecom T1', 'Fnatic', 'Royal Never Give Up', 'Cloud9'],
    correct: 0,
    fact: 'A SKT T1 (hoje T1) foi a primeira organização bicampeã consecutiva, com o Faker liderando o time.'
  },
  {
    cat: 'Competitivo',
    q: 'Em que ano aconteceu o primeiro Campeonato Mundial de League of Legends?',
    options: ['2010', '2011', '2012', '2013'],
    correct: 1,
    fact: 'O Season 1 World Championship foi em 2011, na Suécia, com premiação total de US$ 100 mil — hoje é milhões.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual região é historicamente a mais vitoriosa em Mundiais de League of Legends?',
    options: ['LCS (América do Norte)', 'LEC (Europa)', 'LCK (Coreia do Sul)', 'CBLOL (Brasil)'],
    correct: 2,
    fact: 'A LCK coreana já ergueu o troféu de Worlds mais vezes que qualquer outra região do mundo.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual é o apelido de Lee Sang-hyeok, considerado por muitos o maior jogador de todos os tempos?',
    options: ['Faker', 'Uzi', 'Caps', 'Bang'],
    correct: 0,
    fact: 'Faker joga de mid laner desde sempre e é ídolo até de gente que nunca viu uma partida de LoL.'
  },
  {
    cat: 'Competitivo',
    q: 'O que significa a sigla MSI, o outro grande torneio internacional de LoL?',
    options: ['Major Series International', 'Mid-Season Invitational', 'Master Series Invitational', 'Multi Server Invitational'],
    correct: 1,
    fact: 'O MSI reúne os campeões de cada região no meio da temporada — uma prévia do que vem no Mundial.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual monstro neutro dá um buff que aumenta muito o dano contra estruturas?',
    options: ['Dragão de Fogo', 'Arauto do Vale', 'Barão Nashor', 'Lagarto de Pedra'],
    correct: 2,
    fact: 'O Barão Nashor concede um buff poderoso que ajuda o time inteiro a estourar as rotas.'
  },
  {
    cat: 'Competitivo',
    q: 'Como se chama a primeira kill de uma partida, que dá ouro extra a quem consegue?',
    options: ['First Blood', 'Pentakill', 'Ace', 'Shutdown'],
    correct: 0,
    fact: 'First Blood dá ouro bônus — e também é o motivo número um de flame nos primeiros 5 minutos.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão tem o menor Champion ID do jogo, sendo tecnicamente o "primeiro"?',
    options: ['Ashe', 'Annie', 'Teemo', 'Warwick'],
    correct: 1,
    fact: 'Annie carrega o Champion ID número 1, o mais antigo oficialmente registrado.'
  },
  {
    cat: 'Campeões',
    q: 'Qual desses campeões NÃO usa mana como recurso principal?',
    options: ['Lux', 'Ryze', 'Tryndamere', 'Annie'],
    correct: 2,
    fact: 'Tryndamere usa Fúria, um recurso que cresce com ataques básicos e é gasto no ultimate dele.'
  },
  {
    cat: 'Campeões',
    q: 'Gnar alterna entre quais duas formas durante o combate?',
    options: ['Mini Gnar e Mega Gnar', 'Gnar Fera e Gnar Sábio', 'Gnar Jovem e Gnar Ancião', 'Gnar Selvagem e Gnar Domado'],
    correct: 0,
    fact: 'Ao encher a barra de fúria, Gnar vira Mega Gnar: maior, mais lento e bem mais violento.'
  },
  {
    cat: 'Campeões',
    q: 'Qual é o título oficial de Jhin dentro do jogo?',
    options: ['O Carrasco', 'O Virtuoso', 'O Artista da Morte', 'O Atirador Fantasma'],
    correct: 1,
    fact: 'Jhin se vê como um artista — cada execução dele é encenada como uma performance macabra.'
  },
  {
    cat: 'Campeões',
    q: 'Yasuo e Yone são o quê um do outro?',
    options: ['Rivais de clã', 'Mestre e aprendiz', 'Irmãos', 'Pai e filho'],
    correct: 2,
    fact: 'Yone é o irmão mais velho de Yasuo — e morreu pelas mãos dele antes de virar um espírito vingativo.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeã é conhecida como a "Fada da Vela" que anda dormindo e pode causar pesadelos?',
    options: ['Zoe', 'Lillia', 'Neeko', 'Bard'],
    correct: 1,
    fact: 'Lillia é tão tímida que se esconde da própria sombra — mas seu toque pode virar sonho ou pesadelo.'
  },
  {
    cat: 'Campeões',
    q: 'Na história de Arcane, Vi e Jinx são o quê uma da outra?',
    options: ['Só melhores amigas de infância', 'Irmãs', 'Primas distantes', 'Rivais de gangue sem parentesco'],
    correct: 1,
    fact: 'Vi e Jinx (antiga Powder) são irmãs — uma das revelações mais marcantes da Runeterra recente.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão cientista de Piltover é o anfitrião deste quiz?',
    options: ['Viktor', 'Jayce', 'Heimerdinger', 'Ziggs'],
    correct: 2,
    fact: 'Heimerdinger é o Grande Inventor de Piltover — nem sempre com sucesso, mas sempre com muita explosão.'
  },
  {
    cat: 'Lore',
    q: 'Zaun, a cidade dos submundos tóxicos, fica localizada abaixo de qual cidade?',
    options: ['Demacia', 'Noxus', 'Piltover', 'Bilgewater'],
    correct: 2,
    fact: 'Zaun nasceu nas cavernas e minas abandonadas logo abaixo da rica e reluzente Piltover.'
  },
  {
    cat: 'Lore',
    q: 'Qual nação de Runeterra valoriza força e conquista acima de tudo, sem julgar os métodos usados?',
    options: ['Demacia', 'Noxus', 'Ionia', 'Freljord'],
    correct: 1,
    fact: 'Em Noxus, poder é tudo o que importa — não interessa se você nasceu nobre ou foi escravizado.'
  },
  {
    cat: 'Lore',
    q: 'A região de Freljord é inspirada em qual tipo de cultura e clima?',
    options: ['Deserto escaldante', 'Selva tropical', 'Terras nórdicas geladas', 'Arquipélago vulcânico'],
    correct: 2,
    fact: 'Freljord é um território congelado, dividido entre tribos guerreiras e espíritos ancestrais.'
  },
  {
    cat: 'Lore',
    q: 'De onde vêm criaturas como Kai\'Sa, Kog\'Maw e Cho\'Gath?',
    options: ['Do Vazio', 'Das Ilhas das Sombras', 'Do Monte Targon', 'Da Fonte Antiga de Runeterra'],
    correct: 0,
    fact: 'O Vazio é uma força cósmica que devora e corrompe tudo o que toca em Runeterra.'
  },
  {
    cat: 'Lore',
    q: 'Quem é o Imperador Ascendido que retornou como um Rei-Deus após milênios enterrado na areia de Shurima?',
    options: ['Azir', 'Renekton', 'Nasus', 'Xerath'],
    correct: 0,
    fact: 'Azir foi traído e enterrado vivo — só ressuscitou séculos depois, trazido de volta como um Ascendido.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual é o nome do prêmio dado ao jogador de melhor desempenho de um Campeonato Mundial?',
    options: ['MVP', 'POG', 'ACE', 'S-Rank'],
    correct: 0,
    fact: 'O MVP (Most Valuable Player) é a honraria máxima individual de cada torneio.'
  },
  {
    cat: 'Competitivo',
    q: 'Como se chama a jogada em que um único jogador elimina os 5 inimigos numa mesma luta?',
    options: ['Pentakill', 'Grand Slam', 'Rampage', 'Ace'],
    correct: 0,
    fact: 'Pentakill é a maior glória (e vergonha, se for contra vocês) que existe numa teamfight.'
  },
  {
    cat: 'Competitivo',
    q: 'O que significa dar um "Ace" numa partida de League of Legends?',
    options: ['Eliminar os 5 jogadores do time inimigo', 'Destruir o Nexus adversário', 'Conseguir o primeiro abate da partida', 'Matar o Barão Nashor sozinho'],
    correct: 0,
    fact: 'Um Ace deixa o time inimigo inteiro morto ao mesmo tempo — ótima hora pra pressionar objetivos.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual estrutura, quando destruída, encerra a partida imediatamente?',
    options: ['Torre externa', 'Inibidor', 'Nexus', 'Barão Nashor'],
    correct: 2,
    fact: 'Destruir o Nexus adversário é a única forma de vencer oficialmente uma partida.'
  },
  {
    cat: 'Competitivo',
    q: 'O que acontece quando um inibidor é destruído?',
    options: ['A partida acaba na hora', 'Minions super poderosos nascem naquela rota por um tempo', 'O time perde ouro automaticamente', 'Nada além de efeito visual'],
    correct: 1,
    fact: 'Enquanto o inibidor está destruído, minions "super" muito mais fortes reforçam aquela rota.'
  },
  {
    cat: 'Competitivo',
    q: 'T1, Gen.G, KT Rolster e Dplus KIA disputam qual liga regional?',
    options: ['LPL', 'LCK', 'LEC', 'LCS'],
    correct: 1,
    fact: 'Essas são organizações tradicionais da LCK, a liga sul-coreana de League of Legends.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual é a liga chinesa de League of Legends, famosa por seu estilo agressivo de jogo?',
    options: ['LCK', 'LPL', 'PCS', 'VCS'],
    correct: 1,
    fact: 'A LPL chinesa é uma das ligas mais fortes e disputadas do mundo competitivo.'
  },
  {
    cat: 'Competitivo',
    q: 'O que é a estratégia conhecida como "Baron Power Play"?',
    options: ['Empurrar as rotas usando o buff do Barão Nashor', 'Comprar todos os itens de uma vez', 'Recuar pra base a partida inteira', 'Ignorar objetivos e só focar em kills'],
    correct: 0,
    fact: 'Depois de matar o Barão, o time usa o buff pra empurrar rotas com muito mais força de empurrão.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeã "renasce" de um ovo gelado ao ser derrotada, podendo voltar à luta?',
    options: ['Anivia', 'Lissandra', 'Ashe', 'Braum'],
    correct: 0,
    fact: 'A passiva de Anivia a transforma num ovo ao "morrer" — se não for destruído a tempo, ela renasce.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão pode continuar lançando sua habilidade suprema por alguns segundos mesmo depois de morrer?',
    options: ['Karthus', 'Mordekaiser', 'Yorick', 'Viego'],
    correct: 0,
    fact: 'O Requiem de Karthus segue ativo por um tempo após a morte — puro rancor póstumo.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão troca entre um martelo corpo a corpo e um canhão à distância durante o combate?',
    options: ['Jayce', 'Gnar', 'Nidalee', 'Elise'],
    correct: 0,
    fact: 'Jayce alterna entre Martelo de Mercúrio (perto) e Canhão de Mercúrio (longe) a qualquer momento.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão usa uma âncora gigante como arma e é um capitão fantasma preso no mar?',
    options: ["Gangplank", "Pyke", "Nautilus", "Fizz"],
    correct: 2,
    fact: 'Nautilus ficou preso nas profundezas por séculos e agora emerge arrastando sua âncora amaldiçoada.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeã pode se transformar entre forma humana e forma de aranha gigante?',
    options: ['Elise', "Vel'Koz", 'Zyra', 'Cassiopeia'],
    correct: 0,
    fact: 'Elise, a Rainha Aranha, alterna entre sua forma humana e uma aranha monstruosa em combate.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeã jungler meio-dragão pode se transformar num dragão de verdade ao usar sua ultimate?',
    options: ['Shyvana', 'Aurelion Sol', 'Smolder', 'Rengar'],
    correct: 0,
    fact: 'Shyvana carrega sangue de dragão nas veias e vira uma fera alada ao ativar sua fúria.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão manipula o tempo e pode fazer aliados (ou ele mesmo) "renascerem" segundos depois de morrer?',
    options: ['Zilean', 'Bard', 'Ivern', 'Renata Glasc'],
    correct: 0,
    fact: 'Zilean, o Guardião Cronal, é obcecado em manipular o tempo pra evitar uma catástrofe futura.'
  },
  {
    cat: 'Campeões',
    q: 'Bard coleta itens espalhados pelo mapa chamados de quê, que dão bônus permanentes de status?',
    options: ['Carrilhões (chimes)', 'Moedas de ouro', 'Flores mágicas', 'Cristais de mana'],
    correct: 0,
    fact: 'Os carrilhões dados por Meeps ficam espalhados pelo mapa e fortalecem Bard aos poucos.'
  },
  {
    cat: 'Lore',
    q: 'Qual região de Runeterra é fortemente inspirada no Egito Antigo, cheia de deserto e imperadores milenares?',
    options: ['Shurima', 'Noxus', 'Targon', 'Ixtal'],
    correct: 0,
    fact: 'Shurima já foi um império vastíssimo antes de ruir e virar um deserto esquecido por séculos.'
  },
  {
    cat: 'Lore',
    q: 'Escalar o Monte Targon pode transformar um mortal em quê, caso sobreviva à jornada?',
    options: ['Um Ascendido', 'Um Aspecto (avatar de um poder celestial)', 'Um Darkin', 'Um Vastaya'],
    correct: 1,
    fact: 'Quem sobrevive ao topo de Targon pode se tornar hospedeiro de um Aspecto, como fizeram Leona e Pantheon.'
  },
  {
    cat: 'Lore',
    q: 'Ixtal, região isolacionista de Runeterra, é conhecida por qual tipo de paisagem?',
    options: ['Selva/floresta densa', 'Deserto gelado', 'Ilhas vulcânicas', 'Pântanos sombrios'],
    correct: 0,
    fact: 'Ixtal se esconde atrás de barreiras mágicas na selva, evitando contato com o resto de Runeterra.'
  },
  {
    cat: 'Lore',
    q: 'Bilgewater é conhecida como um porto dominado por qual tipo de gente?',
    options: ['Piratas e caçadores de recompensa', 'Monges guerreiros', 'Cientistas e inventores', 'Cavaleiros nobres'],
    correct: 0,
    fact: 'Em Bilgewater, lei é o que a espada (ou a bala) decidir — um paraíso pra piratas e fora da lei.'
  },
  {
    cat: 'Lore',
    q: 'Antes de serem amaldiçoadas, as Ilhas Sombrias eram conhecidas por qual outro nome?',
    options: ['Ilhas Brilhantes (Blessed Isles)', 'Ilhas Cristalinas', 'Arquipélago Dourado', 'Terras Prometidas'],
    correct: 0,
    fact: 'As Ilhas Brilhantes eram um paraíso próspero antes de serem destruídas pela Ruína.'
  },
  {
    cat: 'Lore',
    q: 'Qual evento cataclísmico transformou as Ilhas Brilhantes nas amaldiçoadas Ilhas Sombrias?',
    options: ['A Ruína, causada por Viego', 'Uma invasão do Vazio', 'Uma guerra entre deuses', 'Um feitiço de Karthus'],
    correct: 0,
    fact: 'Em busca de trazer sua esposa morta de volta, Viego desencadeou a Ruína e destruiu seu próprio reino.'
  },
  {
    cat: 'Lore',
    q: 'Viego é conhecido em toda Runeterra pelo título de:',
    options: ['O Rei Arruinado', 'O Imperador Sombrio', 'O Lich Eterno', 'O Senhor das Correntes'],
    correct: 0,
    fact: 'Viego, o Rei Arruinado, vaga pelas Ilhas Sombrias buscando algo que possa trazer sua rainha de volta.'
  },
  {
    cat: 'Lore',
    q: 'Qual é a relação entre as celestiais Kayle e Morgana?',
    options: ['Irmãs', 'Mãe e filha', 'Rivais sem parentesco', 'Melhores amigas apenas'],
    correct: 0,
    fact: 'Kayle e Morgana são irmãs que discordaram profundamente sobre como aplicar justiça — e isso as separou.'
  },
  {
    cat: 'Lore',
    q: 'Qual dessas nações é conhecida por proibir e reprimir rigorosamente o uso de magia?',
    options: ['Demacia', 'Ionia', 'Zaun', 'Bilgewater'],
    correct: 0,
    fact: 'Demacia enxerga a magia como uma ameaça e persegue quem a usa dentro de suas fronteiras.'
  },
  {
    cat: 'Lore',
    q: 'Como é conhecido o grande conflito histórico e recorrente entre Demacia e Noxus?',
    options: ['As Guerras Demaciana-Noxiana', 'A Grande Ruína', 'A Guerra das Sombras', 'O Cerco Eterno'],
    correct: 0,
    fact: 'Demacia e Noxus já se enfrentaram em diversas guerras ao longo da história de Runeterra.'
  },
  {
    cat: 'Lore',
    q: 'Katarina, Darius, Draven e Swain pertencem a qual nação militarista e expansionista?',
    options: ['Noxus', 'Demacia', 'Ionia', 'Freljord'],
    correct: 0,
    fact: 'Todos eles servem (ou lideram) Noxus, onde poder e resultado importam mais que berço nobre.'
  },
  {
    cat: 'Lore',
    q: 'Quem é o atual Grande General, líder supremo de Noxus?',
    options: ['Swain', 'Darius', 'LeBlanc', 'Katarina'],
    correct: 0,
    fact: 'Swain tomou o comando de Noxus à força e governa a nação com métodos nada ortodoxos — e um demônio como aliado.'
  },
  {
    cat: 'Competitivo',
    q: 'Como é chamada a grande final anual que reúne os melhores times do mundo?',
    options: ['World Championship (Mundial)', 'All-Star', 'Rift Rivals', 'Demacia Cup'],
    correct: 0,
    fact: 'O Mundial (Worlds) é o torneio mais cobiçado da temporada competitiva de League of Legends.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual desses NÃO é um objetivo neutro presente no Rift?',
    options: ['Dragão', 'Arauto do Vale', 'Barão Nashor', 'Fênix Ancestral'],
    correct: 3,
    fact: '"Fênix Ancestral" não existe — os objetivos reais são Dragões, Arauto do Vale e Barão Nashor.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual papel é tradicionalmente responsável por proteger o atirador (ADC) durante a partida?',
    options: ['Suporte', 'Topo', 'Selva (Jungle)', 'Meio (Mid)'],
    correct: 0,
    fact: 'O suporte costuma abrir mão de ouro e farm pra manter o atirador vivo e forte até o fim do jogo.'
  },
  {
    cat: 'Competitivo',
    q: 'O que é dar "Recall" durante uma partida?',
    options: ['Canalizar uma teleportação de volta pra base', 'Trocar de campeão no meio do jogo', 'Comprar itens instantaneamente', 'Curar todos os aliados à distância'],
    correct: 0,
    fact: 'Recall é a canalização que leva o campeão de volta à base pra comprar itens e recuperar vida/mana.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual dessas é uma organização brasileira tradicional do CBLOL?',
    options: ['LOUD', 'paiN Gaming', 'RED Canids', 'Todas as opções'],
    correct: 3,
    fact: 'LOUD, paiN Gaming e RED Canids são organizações consolidadas na cena competitiva brasileira.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeã planta sementes que se transformam em plantas espinhosas armadilhadas contra os inimigos?',
    options: ['Ivern', 'Zyra', 'Maokai', 'Elise'],
    correct: 1,
    fact: 'Zyra semeia o campo de batalha e pode fazer suas plantas espinhosas brotarem repentinamente pra atacar.'
  },
  {
    cat: 'Campeões',
    q: 'Qual Yordle pilota um mecha gigante feito de sucata e é conhecido por seu temperamento explosivo?',
    options: ['Rumble', 'Ziggs', 'Tristana', 'Corki'],
    correct: 0,
    fact: 'Rumble construiu seu próprio mecha "Tremor" com peças recicladas — e ele superaquece fácil.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão usa cartas mágicas como arma, incluindo uma carta vermelha que pode ser letal?',
    options: ['Twisted Fate', 'Graves', 'Jhin', 'Neeko'],
    correct: 0,
    fact: 'Twisted Fate lança cartas de três cores diferentes — e ninguém nunca sabe qual carta vem em seguida.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeã pode se disfarçar com a aparência de aliados pra confundir o time inimigo?',
    options: ['Neeko', 'LeBlanc', 'Shaco', 'Kayn'],
    correct: 0,
    fact: 'Neeko, o Camaleão Curioso, adora imitar outras criaturas — inclusive seus próprios aliados.'
  },
  {
    cat: 'Campeões',
    q: 'Quais desses campeões usam clones ilusórios pra confundir o time adversário?',
    options: ['Apenas LeBlanc', 'Apenas Shaco', 'Apenas Wukong', 'LeBlanc, Shaco e Wukong'],
    correct: 3,
    fact: 'Os três têm alguma forma de clone ou ilusão no kit — um pesadelo pra saber quem é o "de verdade".'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão fica invisível ao permanecer parado por alguns segundos, mecânica clássica de emboscada?',
    options: ['Twitch', 'Vayne', 'Akali', 'Rengar'],
    correct: 0,
    fact: 'A passiva Emboscada de Twitch o deixa camuflado até ele atacar ou se mover — perfeito pro rato traiçoeiro.'
  },
  {
    cat: 'Lore',
    q: 'Qual campeão é um espírito ancestral da natureza que protege as criaturas da selva e evita conflito com elas?',
    options: ['Ivern', 'Maokai', 'Zyra', 'Nunu'],
    correct: 0,
    fact: 'Ivern, o Pai Verde, prefere fazer amizade com monstros da selva a lutar contra eles.'
  },
  {
    cat: 'Lore',
    q: 'Qual campeã é conhecida como a Feiticeira do Gelo, uma das Três Irmãs de Freljord?',
    options: ['Lissandra', 'Sejuani', 'Ashe', 'Nunu'],
    correct: 0,
    fact: 'Lissandra manipula gelo ancestral e é uma das três grandes lideranças que disputam o destino de Freljord.'
  },
  {
    cat: 'Lore',
    q: 'Ashe, Sejuani e Lissandra são conhecidas em conjunto na lore como:',
    options: ['As Três Irmãs de Freljord', 'As Feiticeiras do Gelo', 'As Rainhas Congeladas', 'As Guardiãs do Trono Gélido'],
    correct: 0,
    fact: 'Cada uma lidera uma facção diferente de Freljord, disputando quem vai unificar (ou não) a região gelada.'
  },
  {
    cat: 'Lore',
    q: 'Qual cidade é conhecida como "a Cidade do Progresso", berço da tecnologia hextech?',
    options: ['Piltover', 'Zaun', 'Noxus', 'Demacia'],
    correct: 0,
    fact: 'Piltover é vista como o centro da inovação de Runeterra — pelo menos na versão oficial da história.'
  },
  {
    cat: 'Lore',
    q: 'Vastaya, povo de Ahri, Rakan e Xayah, são caracterizados por qual traço marcante?',
    options: ['Traços de animais (metade humanos, metade bestas)', 'Serem feitos inteiramente de pedra', 'Viverem só debaixo d\'água', 'Serem imortais e sem memória'],
    correct: 0,
    fact: 'Os Vastaya carregam características de criaturas selvagens — caudas, penas, garras — misturadas ao corpo humanoide.'
  },
  {
    cat: 'Lore',
    q: 'Xayah e Rakan, dupla icônica de Vastaya, são o quê um do outro?',
    options: ['Casal/parceiros românticos', 'Irmãos gêmeos', 'Rivais mortais', 'Mestre e aprendiz'],
    correct: 0,
    fact: 'Xayah e Rakan lutam lado a lado pela sobrevivência do seu povo — e um nunca larga a mão do outro.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual é o modo de jogo padrão e mais jogado de League of Legends, disputado 5x5?',
    options: ["Summoner's Rift (Convocação do Rift)", 'ARAM (Abismo do Rei Congelado)', 'TFT', 'Nexus Blitz'],
    correct: 0,
    fact: "Summoner's Rift é o mapa clássico, com três rotas, selva e todos os objetivos principais do jogo."
  },
  {
    cat: 'Competitivo',
    q: 'O que significa a sigla "KDA", usada pra medir o desempenho de um jogador numa partida?',
    options: ['Kills, Deaths, Assists (Abates, Mortes, Assistências)', 'Kill Death Average', 'Knockdown Attack', "King's Domain Achievement"],
    correct: 0,
    fact: 'KDA é a métrica clássica pra saber quem carregou — ou quem só ficou "de churrasco" a partida inteira.'
  },
  {
    cat: 'Competitivo',
    q: 'O que é um "smurf" no vocabulário de League of Legends?',
    options: ['Uma conta secundária de um jogador experiente', 'Um tipo de item raro', 'Um bug conhecido do jogo', 'Um campeão removido do jogo'],
    correct: 0,
    fact: 'Smurfs são contas novas de jogadores bons demais pra elo — o pesadelo de quem só quer jogar em paz.'
  },
  {
    cat: 'Competitivo',
    q: 'Como se chama o sistema que tenta equilibrar os dois times por habilidade antes da partida começar?',
    options: ['Matchmaking', 'Placement', 'Promotion', 'Seeding'],
    correct: 0,
    fact: 'O matchmaking tenta deixar as partidas justas — o que nem sempre convence quem acabou de perder.'
  },
  {
    cat: 'Competitivo',
    q: 'Quantos jogadores compõem cada time numa partida padrão de Summoner\'s Rift?',
    options: ['4', '5', '6', '3'],
    correct: 1,
    fact: 'Cinco jogadores de cada lado, cada um assumindo uma rota ou papel diferente na equipe.'
  },
  {
    cat: 'Competitivo',
    q: 'O que é a estratégia conhecida como "Split Push"?',
    options: ['Pressionar uma rota sozinho enquanto o resto do time controla outra área', 'Atacar todos juntos o tempo inteiro', 'Ficar parado na base a partida inteira', 'Comprar itens em dobro no início do jogo'],
    correct: 0,
    fact: 'Split push divide a atenção do inimigo — um jogador pressiona uma rota sozinho enquanto o resto do time domina em outro lugar.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual é o nome do modo de jogo rápido, caótico e sem selva, jogado no mapa gelado com uma única rota?',
    options: ['ARAM', 'TFT', 'Nexus Blitz', 'Ultra Rapid Fire'],
    correct: 0,
    fact: 'ARAM (All Random All Mid) é jogado no Abismo do Rei Congelado, com campeões sorteados aleatoriamente.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão alquimista de Zaun espalha rastros de gás venenoso pelo mapa?',
    options: ['Singed', 'Twitch', 'Dr. Mundo', 'Warwick'],
    correct: 0,
    fact: 'Singed, o Químico Louco, deixa um rastro tóxico atrás de si — clássico "flee engineering".'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeã pode transformar um inimigo numa criatura inofensiva por alguns segundos?',
    options: ['Lulu', 'Soraka', 'Karma', 'Janna'],
    correct: 0,
    fact: 'A Metamorfose de Lulu transforma o alvo em um bichinho fofo e completamente inofensivo.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão gigante de pedra carrega literalmente um fragmento de uma montanha em seu corpo?',
    options: ['Malphite', 'Sion', 'Ornn', 'Skarner'],
    correct: 0,
    fact: 'Malphite é um fragmento vivo do Monólito, uma montanha de cristal que guardava segredos antigos.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão ferreiro pode forjar itens ancestrais poderosos para seus aliados durante a partida?',
    options: ['Ornn', 'Taric', 'Braum', 'Volibear'],
    correct: 0,
    fact: 'Ornn forja nas profundezas de Freljord e pode criar versões aprimoradas de itens pros aliados.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeã invoca um urso flamejante gigante chamado Tibbers?',
    options: ['Annie', 'Sejuani', 'Nunu', 'Volibear'],
    correct: 0,
    fact: 'Tibbers começou como um ursinho de pelúcia — até Annie aprender a incendiá-lo com magia.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão foi decapitado e depois trazido de volta como um morto-vivo imparável?',
    options: ['Sion', 'Yorick', 'Karthus', 'Viego'],
    correct: 0,
    fact: 'Sion foi ressuscitado por Noxus como uma arma viva, sem cabeça e sem medo de nada.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão-imperador pode invocar soldados de areia pra lutar ao seu lado?',
    options: ['Azir', 'Xerath', 'Renekton', 'Nasus'],
    correct: 0,
    fact: 'Azir comanda soldados-areia ancestrais, vestígios do exército que ele liderava em vida.'
  },
  {
    cat: 'Lore',
    q: 'A invasão Noxiana a Ionia é um marco importante na história de quais campeãs?',
    options: ['Apenas Irelia', 'Apenas Karma', 'Apenas Akali', 'Irelia, Karma e Akali'],
    correct: 3,
    fact: 'As três tiveram um papel central na resistência de Ionia contra a invasão de Noxus.'
  },
  {
    cat: 'Lore',
    q: 'Qual região é conhecida por sua profunda conexão espiritual com a natureza e o equilíbrio entre corpo e mente?',
    options: ['Ionia', 'Noxus', 'Zaun', 'Bilgewater'],
    correct: 0,
    fact: 'Ionia valoriza harmonia, espíritos e tradição — o oposto quase perfeito da filosofia de Noxus.'
  },
  {
    cat: 'Lore',
    q: 'Antes de virar um carcereiro fantasmagórico das Ilhas Sombrias, o que Thresh fazia em vida?',
    options: ['Era um carcereiro cruel que torturava prisioneiros', 'Era um rei justo e generoso', 'Era um pescador comum', 'Era um mago de Piltover'],
    correct: 0,
    fact: 'Thresh já era sádico em vida — a maldição das Ilhas Sombrias só lhe deu tempo (e correntes) de sobra.'
  },
  {
    cat: 'Lore',
    q: 'Antes de ruir e virar um deserto esquecido, o que Shurima já foi?',
    options: ['Um dos maiores impérios que Runeterra já viu', 'Uma pequena vila isolada', 'Uma federação de piratas', 'Um reino totalmente subaquático'],
    correct: 0,
    fact: 'Shurima já dominou boa parte do sul de Runeterra antes de sua queda catastrófica.'
  },
  {
    cat: 'Lore',
    q: 'Como costumam ser chamadas as criaturas que foram corrompidas pelo Vazio?',
    options: ['Aberrações do Vazio', 'Ascendidos', 'Darkin', 'Vastaya Sombrios'],
    correct: 0,
    fact: 'Quem é tocado pelo Vazio raramente volta ao normal — vira uma aberração a serviço da destruição cósmica.'
  },
  {
    cat: 'Lore',
    q: 'Quais desses campeões carregam (ou são) uma lâmina Darkin, arma habitada por um espírito ancestral vingativo?',
    options: ['Apenas Aatrox', 'Apenas Varus', 'Apenas Kayn', 'Aatrox, Varus e Kayn'],
    correct: 3,
    fact: 'Aatrox é um Darkin, Varus carrega três espíritos Darkin no corpo, e Kayn luta pelo controle da lâmina Rhaast.'
  },
  {
    cat: 'Mecânicas',
    q: 'Qual feitiço de invocador permite "piscar" instantaneamente uma curta distância?',
    options: ['Fantasma', 'Flash', 'Teleporte', 'Purificar'],
    correct: 1,
    fact: 'O Flash é o feitiço mais usado do jogo — e errar um Flash pra dentro da parede é tradição milenar.'
  },
  {
    cat: 'Mecânicas',
    q: 'Qual feitiço de invocador é praticamente obrigatório para quem joga na selva?',
    options: ['Barreira', 'Curar', 'Golpear (Smite)', 'Incendiar'],
    correct: 2,
    fact: 'O Golpear causa dano enorme em monstros e é essencial pra garantir Dragão e Barão no segundo certo.'
  },
  {
    cat: 'Mecânicas',
    q: 'O que significa "CS", o número exibido no placar ao lado dos abates?',
    options: ['Combat Speed', 'Champion Skill', 'Control Score', 'Creep Score (tropas abatidas)'],
    correct: 3,
    fact: 'CS é a contagem de tropas e monstros abatidos — a fonte de ouro mais confiável (e mais ignorada) do jogo.'
  },
  {
    cat: 'Mecânicas',
    q: 'O que é um "gank" no vocabulário do jogo?',
    options: ['Uma emboscada surpresa numa rota', 'Um tipo de item', 'Um erro de conexão', 'Uma provocação no chat'],
    correct: 0,
    fact: 'Gank é quando alguém (geralmente o jungler) aparece de surpresa pra pegar o inimigo desprevenido.'
  },
  {
    cat: 'Mecânicas',
    q: 'Quantos dragões elementais um time precisa matar pra ganhar a Alma do Dragão?',
    options: ['2', '3', '4', '5'],
    correct: 2,
    fact: 'Com 4 dragões, o time ganha a Alma do elemento dominante — um bônus que costuma decidir a partida.'
  },
  {
    cat: 'Mecânicas',
    q: 'O que uma sentinela (ward) faz quando posicionada no mapa?',
    options: ['Ataca inimigos próximos', 'Revela visão da área por um tempo', 'Cura aliados', 'Gera ouro passivo'],
    correct: 1,
    fact: 'Visão ganha jogo — e mesmo assim tem gente que termina a partida com zero sentinelas colocadas.'
  },
  {
    cat: 'Mecânicas',
    q: 'Qual é o elo mais alto do sistema ranqueado de League of Legends?',
    options: ['Mestre', 'Grão-Mestre', 'Diamante', 'Desafiante'],
    correct: 3,
    fact: 'O Desafiante é o topo da pirâmide, reservado aos melhores jogadores de cada servidor.'
  },
  {
    cat: 'Mecânicas',
    q: 'E qual é o elo mais baixo, lar espiritual de muita gente?',
    options: ['Bronze', 'Ferro', 'Prata', 'Madeira'],
    correct: 1,
    fact: 'O Ferro é o elo mais baixo desde 2019 — "Madeira" segue sendo só uma lenda (e uma ofensa).'
  },
  {
    cat: 'Mecânicas',
    q: 'O que significa URF, o modo de jogo caótico e amado pela comunidade?',
    options: ['Ultra Rapid Fire', 'Unlimited Rift Fight', 'Ultimate Rift Festival', 'Under Rift Fire'],
    correct: 0,
    fact: 'No URF, as habilidades quase não têm recarga nem custo — é o caos institucionalizado.'
  },
  {
    cat: 'Mecânicas',
    q: 'Em que ano League of Legends foi lançado oficialmente?',
    options: ['2007', '2009', '2011', '2013'],
    correct: 1,
    fact: 'O LoL saiu em outubro de 2009 — e tem gente flamando em solo queue desde o primeiro dia.'
  },
  {
    cat: 'Mecânicas',
    q: 'Aproximadamente quantos campeões o LoL tem atualmente?',
    options: ['Cerca de 90', 'Cerca de 120', 'Mais de 160', 'Exatamente 100'],
    correct: 2,
    fact: 'São mais de 160 campeões — e mesmo assim todo mundo cai contra o mesmo Yasuo de sempre.'
  },
  {
    cat: 'Mecânicas',
    q: 'O que o Arauto do Vale faz quando é capturado e invocado?',
    options: ['Investe contra torres inimigas causando dano enorme', 'Cura o time inteiro', 'Rouba o Dragão', 'Vira um aliado permanente'],
    correct: 0,
    fact: 'O Arauto se lança de cabeça nas torres — o aríete mais eficiente (e suicida) do Rift.'
  },
  {
    cat: 'Mecânicas',
    q: 'O que é "farmar" numa partida?',
    options: ['Plantar sentinelas', 'Abater tropas pra acumular ouro', 'Ficar AFK na base', 'Trocar de rota'],
    correct: 1,
    fact: 'Farmar bem é a diferença entre carregar o jogo e passar 30 minutos implorando por kills.'
  },
  {
    cat: 'Mecânicas',
    q: 'Qual empresa desenvolve League of Legends?',
    options: ['Blizzard', 'Valve', 'Riot Games', 'Epic Games'],
    correct: 2,
    fact: 'A Riot Games nasceu em 2006 e o LoL foi seu primeiro jogo — hoje é um universo inteiro.'
  },
  {
    cat: 'Mecânicas',
    q: 'O que significa TFT, o jogo de estratégia derivado de LoL?',
    options: ['Total Fight Tournament', 'Teamfight Tactics', 'Twisted Fate Trials', 'Turbo Fast Tactics'],
    correct: 1,
    fact: 'Teamfight Tactics é o auto battler da Riot, jogado dentro do próprio cliente de LoL.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual organização venceu o Mundial em 2023 e em 2024, consolidando a maior dinastia da história?',
    options: ['T1', 'Gen.G', 'JD Gaming', 'Bilibili Gaming'],
    correct: 0,
    fact: 'A T1 de Faker venceu Worlds 2023 e 2024, chegando a cinco títulos mundiais pela organização.'
  },
  {
    cat: 'Competitivo',
    q: 'Quantos títulos mundiais o Faker conquistou até 2024?',
    options: ['3', '4', '5', '2'],
    correct: 2,
    fact: 'Faker levantou o troféu em 2013, 2015, 2016, 2023 e 2024 — cinco vezes campeão do mundo.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual sigla historicamente representa a liga brasileira de League of Legends?',
    options: ['LLA', 'CBLOL', 'LCS', 'VCS'],
    correct: 1,
    fact: 'O CBLOL é famoso por ter uma das torcidas mais barulhentas e apaixonadas do cenário mundial.'
  },
  {
    cat: 'Competitivo',
    q: 'Como se chama a fase antes da partida em que os times escolhem e banem campeões?',
    options: ['Warm-up', 'Scrim', 'Draft (seleção e banimentos)', 'Loading'],
    correct: 2,
    fact: 'O draft é um jogo dentro do jogo — tem partida que já termina ganha (ou perdida) ali.'
  },
  {
    cat: 'Competitivo',
    q: 'O que é uma "scrim" no cenário competitivo?',
    options: ['Treino amistoso entre times', 'Final de campeonato', 'Punição por toxicidade', 'Tipo de patrocínio'],
    correct: 0,
    fact: 'Scrims são treinos fechados entre equipes — onde as estratégias nascem longe das câmeras.'
  },
  {
    cat: 'Competitivo',
    q: 'Qual lendário atirador brasileiro é um dos maiores ídolos da história do CBLOL, famoso pela sua Draven?',
    options: ['Robo', 'Kami', 'Tinowns', 'brTT'],
    correct: 3,
    fact: 'brTT marcou época no CBLOL — sua Draven virou sinônimo de espetáculo (ou desastre, dependendo do dia).'
  },
  {
    cat: 'Competitivo',
    q: 'No competitivo, o que significa "levar o jogo pro late game"?',
    options: ['Terminar o jogo o mais rápido possível', 'Prolongar a partida apostando em campeões que ficam mais fortes no fim', 'Desistir aos 15 minutos', 'Trocar o mid laner no intervalo'],
    correct: 1,
    fact: 'Times com composição de late game seguram a partida até seus carries virarem monstros.'
  },
  {
    cat: 'Competitivo',
    q: 'O que é o famoso "Silver Scrapes"?',
    options: ['Um item lendário', 'Uma skin rara', 'A música tradicionalmente tocada antes do 5º jogo de uma série decisiva', 'Um golpe do Yasuo'],
    correct: 2,
    fact: 'Silver Scrapes virou o hino não oficial de toda série que vai pro jogo 5 — arrepio garantido.'
  },
  {
    cat: 'Competitivo',
    q: 'O que significa um jogador ou campeão "flex" no cenário competitivo?',
    options: ['Que atua em mais de uma posição', 'Que joga sem itens', 'Que provoca o inimigo no chat', 'Que nunca usa o Flash'],
    correct: 0,
    fact: 'Um pick flex pode ir pra mais de uma rota, escondendo a estratégia do time até o último segundo do draft.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão planta cogumelos venenosos invisíveis pelo mapa?',
    options: ['Ivern', 'Teemo', 'Zac', 'Shaco'],
    correct: 1,
    fact: 'Pisar num cogumelo do Teemo é a experiência mais humilhante que o jogo oferece.'
  },
  {
    cat: 'Campeões',
    q: 'Ahri, a Raposa de Nove Caudas, pertence a qual povo?',
    options: ['Yordle', 'Darkin', 'Vastaya', 'Ascendidos'],
    correct: 2,
    fact: 'Ahri é uma vastaya com traços de raposa que absorvia memórias de suas vítimas — hoje busca redenção.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão é um lobisomem quimicamente alterado que caça pelo cheiro de sangue em Zaun?',
    options: ['Warwick', 'Rengar', "Kha'Zix", 'Naafiri'],
    correct: 0,
    fact: 'Warwick era humano antes dos experimentos de Singed — agora caça criminosos pelos becos de Zaun.'
  },
  {
    cat: 'Campeões',
    q: 'Braum, o Coração de Freljord, usa o quê como escudo?',
    options: ['Um escudo de gelo comum', 'Uma porta de cofre encantada', 'Um caixão', 'Uma frigideira gigante'],
    correct: 1,
    fact: 'O escudo de Braum é uma porta encantada de um cofre — indestrutível como o bigode dele.'
  },
  {
    cat: 'Campeões',
    q: 'Kled, o yordle mais raivoso de Noxus, monta em qual criatura?',
    options: ['Um javali', 'Um poro gigante', 'Um dragão bebê', 'Skaarl, um lagarto covarde'],
    correct: 3,
    fact: 'Skaarl foge no meio da luta e volta quando dá — a dupla mais disfuncional (e funcional) de Noxus.'
  },
  {
    cat: 'Campeões',
    q: 'Kindred, a personificação da morte, é formada por quais duas figuras?',
    options: ['Cordeiro e Lobo', 'Corvo e Serpente', 'Gato e Rato', 'Águia e Urso'],
    correct: 0,
    fact: 'O Cordeiro entrega uma morte serena; o Lobo caça quem tenta fugir. Escolha seu destino.'
  },
  {
    cat: 'Campeões',
    q: 'Quem acompanha o menino Nunu em todas as suas aventuras pelo Freljord?',
    options: ['Tibbers, um urso', 'Willump, um yeti', 'Bristle, um javali', 'Um poro'],
    correct: 1,
    fact: 'Willump é um yeti mágico — e a amizade dos dois é a coisa mais pura de Runeterra inteira.'
  },
  {
    cat: 'Campeões',
    q: 'Quais são as duas armas da Jinx?',
    options: ['Duas pistolas hextech', 'Um arco e uma besta', 'Pow-Pow (metralhadora) e Fishbones (lança-foguetes)', 'Granadas e um rifle de precisão'],
    correct: 2,
    fact: 'Pow-Pow e Fishbones têm até personalidade própria na cabeça da Jinx — e ela conversa com os dois.'
  },
  {
    cat: 'Campeões',
    q: 'Tahm Kench é famoso por poder fazer o quê com aliados (e inimigos)?',
    options: ['Engoli-los', 'Teleportá-los pra base', 'Transformá-los em peixes', 'Cloná-los'],
    correct: 0,
    fact: 'O Bagre Gigante engole aliados pra salvá-los — ou inimigos, pra cuspi-los onde for pior pra eles.'
  },
  {
    cat: 'Campeões',
    q: 'Miss Fortune dedica sua vida a caçar qual pirata?',
    options: ['Pyke', 'Twisted Fate', 'Graves', 'Gangplank'],
    correct: 3,
    fact: 'Gangplank assassinou a mãe de Miss Fortune — e ela retribuiu explodindo o navio dele inteiro.'
  },
  {
    cat: 'Campeões',
    q: 'Qual campeão do Vazio evolui partes do próprio corpo ao caçar presas isoladas?',
    options: ["Kha'Zix", "Cho'Gath", "Kog'Maw", "Rek'Sai"],
    correct: 0,
    fact: "Kha'Zix se adapta a cada caçada — e mantém uma rivalidade eterna com Rengar pra ver quem caça quem."
  },
  {
    cat: 'Campeões',
    q: 'Urgot, antes de virar a máquina de guerra que é hoje, tinha qual função em Noxus?',
    options: ['Cozinheiro', 'Carrasco/executor', 'General supremo', 'Espião'],
    correct: 1,
    fact: 'Urgot era o carrasco de Noxus até ser traído, jogado nas minas de Zaun e reconstruído em aço e ódio.'
  },
  {
    cat: 'Campeões',
    q: 'Ezreal, o dono da mira deste treino, é um explorador nascido em qual cidade?',
    options: ['Zaun', 'Demacia', 'Piltover', 'Bilgewater'],
    correct: 2,
    fact: 'Ezreal saqueia ruínas de Shurima com o amuleto que dá seus poderes — e uma autoconfiança inabalável.'
  },
  {
    cat: 'Campeões',
    q: 'Vayne dedica sua vida a caçar o quê?',
    options: ['Piratas', 'Usuários de magia maligna e demônios', 'Yordles', 'Dragões'],
    correct: 1,
    fact: 'Depois que um demônio destruiu sua família, Shauna Vayne virou a caçadora implacável das trevas.'
  },
  {
    cat: 'Campeões',
    q: 'Renata Glasc construiu seu império químico em qual cidade?',
    options: ['Piltover', 'Noxus', 'Bandle City', 'Zaun'],
    correct: 3,
    fact: 'Renata é a chem-baronesa mais poderosa de Zaun — tudo que ela oferece tem um preço escondido.'
  },
  {
    cat: 'Campeões',
    q: 'Yuumi é uma gata mágica que viaja sobre o quê?',
    options: ['Um livro encantado', 'Um tapete voador', 'Uma vassoura', 'Um escudo'],
    correct: 0,
    fact: 'O Livro dos Limiares pertencia à sua dona desaparecida, Norra — Yuumi ainda viaja procurando por ela.'
  },
  {
    cat: 'Campeões',
    q: 'Rell desertou de qual instituição depois de ser usada como cobaia?',
    options: ['O Colégio de Piltover', 'Uma academia noxiana', 'A Ordem Kinkou', 'A guarda de Demacia'],
    correct: 1,
    fact: 'Rell foi torturada numa academia de Noxus que "criava" cavaleiros de metal — hoje ela caça seus algozes.'
  },
  {
    cat: 'Campeões',
    q: 'Qual "arma" improvisada Jax usa pra provar que não precisa de uma arma de verdade?',
    options: ['Uma colher gigante', 'Um remo', 'Um lampião/poste de luz', 'Um galho de árvore'],
    correct: 2,
    fact: 'Jax luta com um lampião porque nenhuma arma seria páreo justo — a arrogância tem nome.'
  },
  {
    cat: 'Campeões',
    q: 'Alistar é um campeão de qual espécie?',
    options: ['Minotauro', 'Centauro', 'Troll', 'Golem'],
    correct: 0,
    fact: 'Alistar é um minotauro que sobreviveu à destruição de seu clã por Noxus — e nunca esqueceu.'
  },
  {
    cat: 'Campeões',
    q: "Rengar, o rival eterno de Kha'Zix, coleciona o quê?",
    options: ['Moedas antigas', 'Troféus de suas caçadas', 'Cabeças de yordle', 'Mapas de Runeterra'],
    correct: 1,
    fact: 'Rengar exibe cada troféu de caça com orgulho — só falta um: a cabeça do Kha\'Zix.'
  },
  {
    cat: 'Campeões',
    q: 'Aurora, uma das campeãs mais recentes do jogo, é uma vastaya de qual região?',
    options: ['Ionia', 'Freljord', 'Ixtal', 'Shurima'],
    correct: 1,
    fact: 'Aurora é uma vastaya do Freljord que enxerga e transita pelo mundo espiritual.'
  },
  {
    cat: 'Campeões',
    q: 'Akshan usa qual equipamento pra se balançar pelo mapa?',
    options: ['Asas mecânicas', 'Botas de foguete', 'Um gancho/arpéu', 'Um portal arcano'],
    correct: 2,
    fact: 'O arpéu de Akshan deixa ele se balançar por terrenos — estiloso até demais pra um "vingador bondoso".'
  },
  {
    cat: 'Arcane',
    q: 'Qual estúdio de animação produziu a série Arcane junto com a Riot?',
    options: ['Pixar', 'Fortiche', 'Studio Ghibli', 'DreamWorks'],
    correct: 1,
    fact: 'O estúdio francês Fortiche criou o visual único de Arcane — e colecionou prêmios com isso.'
  },
  {
    cat: 'Arcane',
    q: 'Em Arcane, quem são os criadores da tecnologia Hextech?',
    options: ['Jayce e Viktor', 'Heimerdinger e Ekko', 'Silco e Singed', 'Caitlyn e Vi'],
    correct: 0,
    fact: 'Jayce e Viktor domaram a magia com cristais hextech — uma parceria que terminou em tragédia.'
  },
  {
    cat: 'Arcane',
    q: 'Qual substância química dá poderes (e mutações) aos habitantes de Zaun em Arcane?',
    options: ['Éter', 'Hexcore', 'Shimmer', 'Néctar'],
    correct: 2,
    fact: 'O Shimmer, produzido por Singed e distribuído por Silco, transformou Zaun de dentro pra fora.'
  },
  {
    cat: 'Arcane',
    q: 'Qual era o nome de infância da Jinx antes de adotar essa identidade?',
    options: ['Sky', 'Powder', 'Maddie', 'Ren'],
    correct: 1,
    fact: 'Powder virou Jinx depois da noite que separou sua vida — e a da irmã Vi — em antes e depois.'
  },
  {
    cat: 'Arcane',
    q: 'Em Arcane, qual grupo Ekko lidera nas ruas de Zaun?',
    options: ['Os Chem-Barões', 'A Rosa Negra', 'Os Vigias', 'Os Firelights'],
    correct: 3,
    fact: 'Os Firelights protegem Zaun do Shimmer e de Silco — andando de hoverboard, com muito estilo.'
  },
  {
    cat: 'Arcane',
    q: 'Na 2ª temporada de Arcane, é revelado que o monstro Warwick era quem no passado?',
    options: ['Silco', 'Vander', 'Benzo', 'O pai de Caitlyn'],
    correct: 1,
    fact: 'Vander, o pai adotivo de Vi e Powder, foi transformado por Singed na fera Warwick.'
  },
  {
    cat: 'Arcane',
    q: 'Qual cargo Caitlyn ocupa em Piltover?',
    options: ['Conselheira do comércio', 'Cientista-chefe', 'Xerife/comandante dos Vigias', 'Embaixadora de Zaun'],
    correct: 2,
    fact: 'Caitlyn trocou a vida de herdeira rica pela farda — a melhor atiradora dos Vigias de Piltover.'
  },
  {
    cat: 'Arcane',
    q: 'Silco, o grande vilão da 1ª temporada de Arcane, sonhava com o quê?',
    options: ['A independência de Zaun ("a Nação de Zaun")', 'Destruir Noxus', 'Ser aceito no Conselho de Piltover', 'Encontrar as Runas Mundiais'],
    correct: 0,
    fact: '"Você teria entregado a Jinx?" — Silco morreu sem abrir mão da filha adotiva nem do sonho da Nação de Zaun.'
  },
  {
    cat: 'Lore',
    q: 'Ryze viaja por Runeterra coletando quais artefatos perigosíssimos?',
    options: ['As lâminas Darkin', 'As Runas Mundiais', 'Os cristais hextech', 'Os olhos do Vazio'],
    correct: 1,
    fact: 'As Runas Mundiais já quase destruíram o mundo nas Guerras Rúnicas — Ryze as esconde de todos.'
  },
  {
    cat: 'Lore',
    q: 'Nasus e Renekton, os Ascendidos de Shurima, são o quê um do outro?',
    options: ['Irmãos', 'Pai e filho', 'Mestre e aprendiz', 'Inimigos desde sempre'],
    correct: 0,
    fact: 'Renekton se sacrificou selando Xerath junto de si — e séculos preso o transformaram em fúria pura contra Nasus.'
  },
  {
    cat: 'Lore',
    q: 'Senna ficou aprisionada durante anos dentro de qual objeto?',
    options: ['O ovo de Anivia', 'O martelo de Jayce', 'O elmo de Mordekaiser', 'A lanterna de Thresh'],
    correct: 3,
    fact: 'Senna sofreu dentro da lanterna de Thresh até Lucian conseguir libertá-la — e agora ela usa a própria Névoa como arma.'
  },
  {
    cat: 'Lore',
    q: 'Lucian e Senna, os caçadores da Névoa Negra, são o quê um do outro?',
    options: ['Irmãos', 'Marido e esposa', 'Rivais', 'Primos'],
    correct: 1,
    fact: 'O casal mais letal de Runeterra caça espectros lado a lado — a morte literalmente não os separou.'
  },
  {
    cat: 'Lore',
    q: 'Garen lidera qual força de elite demaciana?',
    options: ['A Rosa Negra', 'A Vanguarda Destemida', 'A Guarda Real de Noxus', 'Os Sentinelas da Luz'],
    correct: 1,
    fact: 'A Vanguarda Destemida é a tropa de elite de Demacia — e Garen é seu líder mais dedicado. DEMACIAAA!'
  },
  {
    cat: 'Lore',
    q: 'Qual segredo perigoso Lux esconde da própria família em Demacia?',
    options: ['Que é noxiana', 'Que é uma vastaya', 'Que possui magia', 'Que serve ao Vazio'],
    correct: 2,
    fact: 'Numa nação que persegue magos, Lux nasceu com magia de luz — um segredo que pode custar sua vida.'
  },
  {
    cat: 'Lore',
    q: 'Sylas de Dregbourne lidera uma revolta de quem em Demacia?',
    options: ['Dos magos oprimidos', 'Dos camponeses sem terra', 'Dos soldados desertores', 'Dos yordles exilados'],
    correct: 0,
    fact: 'Preso por anos só por ter magia, Sylas quebrou as correntes — literalmente — e virou símbolo da revolta dos magos.'
  },
  {
    cat: 'Lore',
    q: 'Zed traiu e abandonou qual ordem de Ionia?',
    options: ['A Ordem das Sombras', 'O Templo de Hirana', 'A Ordem Kinkou', 'A Irmandade de Navori'],
    correct: 2,
    fact: 'Zed abandonou a Kinkou e fundou a Ordem das Sombras — Shen, seu antigo amigo, lidera o que restou.'
  },
  {
    cat: 'Lore',
    q: 'Ornn e Volibear, semideuses do Freljord, são o quê um do outro?',
    options: ['Criador e criatura', 'Irmãos', 'Aliados eternos', 'Mestre e aprendiz'],
    correct: 1,
    fact: 'Ornn e Volibear são irmãos semideuses que mal se toleram — briga de família em escala divina.'
  },
  {
    cat: 'Lore',
    q: 'Ashe lidera qual tribo do Freljord?',
    options: ['A Garra Invernal', 'Os Avarosanos', 'Os Filhos de Ornn', 'A Guarda Gélida'],
    correct: 1,
    fact: 'Ashe lidera os Avarosanos e sonha unificar o Freljord pela paz — Sejuani discorda, com um javali.'
  },
  {
    cat: 'Lore',
    q: 'Sejuani, a grande rival de Ashe, comanda qual tribo?',
    options: ['A Garra Invernal', 'Os Avarosanos', 'Os Perdidos', 'Os Iceborn'],
    correct: 0,
    fact: 'A Garra Invernal acredita que só os fortes sobrevivem ao Freljord — diplomacia não está no vocabulário.'
  },
  {
    cat: 'Lore',
    q: 'Como é chamada a névoa mortal que emana das Ilhas Sombrias?',
    options: ['Bruma do Vazio', 'Véu de Cinzas', 'Sopro da Ruína', 'Névoa Negra'],
    correct: 3,
    fact: 'A Névoa Negra rouba almas por onde passa — e os Sentinelas da Luz existem pra contê-la.'
  },
];

function heimerVerdict(pct){
  if(pct <= 30) return 'Nem meus experimentos que explodem erram tanto quanto isso. Volte pro tutorial, invocador.';
  if(pct <= 60) return 'Sabe o básico. Aceitável — mas eu já destruí três laboratórios sabendo mais que isso.';
  if(pct <= 85) return 'Impressionante! Quase tão sábio quanto um Yordle de 200 anos.';
  return 'GENIAL! Você merece uma cadeira honorária no Colégio de Piltover.';
}

// ---------- ranking do quiz (melhor pontuação por pessoa, salvo no navegador) ----------
function loadHeimerRanking(){
  const raw = localStorage.getItem('rg_heimer_ranking');
  return raw ? JSON.parse(raw) : [];
}
function saveHeimerRanking(list){
  localStorage.setItem('rg_heimer_ranking', JSON.stringify(list));
}
function submitHeimerScore(name, score, total){
  const list = loadHeimerRanking();
  const pct = Math.round((score / total) * 100);
  const idx = list.findIndex(e => e.name.toLowerCase() === name.toLowerCase());
  const entry = { name, score, total, pct, date: new Date().toLocaleDateString('pt-BR') };
  if(idx === -1){
    list.push(entry);
  } else if(pct > list[idx].pct || (pct === list[idx].pct && score > list[idx].score)){
    list[idx] = entry;
  }
  list.sort((a, b) => b.pct - a.pct || b.score - a.score);
  saveHeimerRanking(list);
  return list;
}
function renderHeimerRankingHtml(){
  const list = loadHeimerRanking().slice(0, 15);
  const currentUser = (sessionStorage.getItem('rg_current_user') || '').toLowerCase();
  if(!list.length){
    return '<p class="empty-roster">Ninguém completou o quiz ainda. Seja o primeiro nome no quadro do Heimerdinger.</p>';
  }
  const rows = list.map((e, i) => `
    <li class="${e.name.toLowerCase() === currentUser ? 'you' : ''}">
      <span class="pos">${i + 1}º</span>
      <span class="n">${e.name}</span>
      <span class="score">${e.score}/${e.total} acertos</span>
      <span class="pct">${e.pct}%</span>
    </li>`).join('');
  return `<ul class="heimer-rank-list">${rows}</ul>`;
}

function renderHeimerQuiz(){
  contentEl.innerHTML = `
    <section class="player-panel heimer-panel" style="--accent-color:#f2b84b">
      <div class="player-head">
        <img class="player-photo" style="--accent-color:#f2b84b; --accent-glow:#f2b84b55"
             src="${SPLASH('Heimerdinger')}" alt="Heimerdinger"
             onerror="this.onerror=null;this.src='${avatarFallback('Heimerdinger', '#f2b84b')}';">
        <div class="player-id">
          <h2 class="player-name">Quiz do Heimerdinger</h2>
          <div class="player-title">"Teste seu conhecimento sobre Runeterra (ele já testou o dele e se explodiu)"</div>
        </div>
      </div>

      <div class="lore-box">
        <p>O maior gênio (autoproclamado) de Piltover quer saber se vocês entendem mais de League of Legends do que jogam. São <b>mais de 150 perguntas</b> no banco de dados — competitivo, campeões, lore, Arcane e mecânicas — com 25 sorteadas a cada rodada. Ele não dá colinha.</p>
      </div>

      <div class="mira-hud">
        <span>Pergunta: <b id="heimer-qnum">1</b>/<b id="heimer-total">25</b></span>
        <span>Acertos: <b id="heimer-score">0</b></span>
        <button id="heimer-restart-btn" class="mira-reset-btn" type="button">Reiniciar</button>
      </div>

      <div id="heimer-body"></div>
      <div id="heimer-result" class="mira-result hidden"></div>

      <h3 class="heimer-rank-title">Ranking do Heimerdinger</h3>
      <div id="heimer-ranking"></div>
    </section>
  `;
  initHeimerQuiz();
}

function initHeimerQuiz(){
  const ROUND_SIZE = Math.min(25, QUIZ_QUESTIONS.length);
  const qnumEl = document.getElementById('heimer-qnum');
  const totalEl = document.getElementById('heimer-total');
  const scoreEl = document.getElementById('heimer-score');
  const bodyEl = document.getElementById('heimer-body');
  const resultEl = document.getElementById('heimer-result');
  const restartBtn = document.getElementById('heimer-restart-btn');
  const rankingEl = document.getElementById('heimer-ranking');

  totalEl.textContent = ROUND_SIZE;

  function refreshRanking(){
    rankingEl.innerHTML = renderHeimerRankingHtml();
  }
  refreshRanking();

  let round, index, score, answered;

  function startRound(){
    round = shuffleArray(QUIZ_QUESTIONS).slice(0, ROUND_SIZE);
    index = 0;
    score = 0;
    resultEl.classList.add('hidden');
    scoreEl.textContent = 0;
    renderQuestion();
  }

  function renderQuestion(){
    answered = false;
    const q = round[index];
    qnumEl.textContent = index + 1;
    const optionsHtml = q.options.map((opt, i) => `<button class="heimer-option" data-i="${i}" type="button">${opt}</button>`).join('');
    bodyEl.innerHTML = `
      <div class="heimer-question">
        <span class="heimer-cat">${q.cat}</span>
        <p>${q.q}</p>
      </div>
      <div class="heimer-options">${optionsHtml}</div>
      <div class="heimer-feedback hidden" id="heimer-feedback"></div>
    `;
    bodyEl.querySelectorAll('.heimer-option').forEach(btn=>{
      btn.addEventListener('click', () => selectAnswer(Number(btn.dataset.i)));
    });
  }

  function selectAnswer(i){
    if(answered) return;
    answered = true;
    const q = round[index];
    bodyEl.querySelectorAll('.heimer-option').forEach(btn=>{
      const bi = Number(btn.dataset.i);
      if(bi === q.correct) btn.classList.add('correct');
      else if(bi === i) btn.classList.add('wrong');
      btn.disabled = true;
    });
    if(i === q.correct){ score++; scoreEl.textContent = score; }

    const feedback = document.getElementById('heimer-feedback');
    feedback.classList.remove('hidden');
    feedback.innerHTML = `<b>${i === q.correct ? 'Acertou!' : 'Errou.'}</b> ${q.fact}`;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'heimer-next-btn';
    nextBtn.textContent = index < round.length - 1 ? 'Próxima pergunta' : 'Ver resultado';
    nextBtn.onclick = () => {
      index++;
      if(index < round.length) renderQuestion();
      else showResult();
    };
    bodyEl.appendChild(nextBtn);
  }

  function showResult(){
    const pct = Math.round((score / round.length) * 100);
    bodyEl.innerHTML = '';
    resultEl.innerHTML = `<b>${score}/${round.length} acertos (${pct}%)</b><br>${heimerVerdict(pct)}`;
    resultEl.classList.remove('hidden');

    const currentUser = sessionStorage.getItem('rg_current_user') || 'Anônimo';
    submitHeimerScore(currentUser, score, round.length);
    refreshRanking();
  }

  restartBtn.addEventListener('click', startRound);

  startRound();
}

// ---------- caça à rek'sai (whack-a-mole do vazio) ----------
function loadReksaiRanking(){
  const raw = localStorage.getItem('rg_reksai_ranking');
  return raw ? JSON.parse(raw) : [];
}
function saveReksaiRanking(list){
  localStorage.setItem('rg_reksai_ranking', JSON.stringify(list));
}
function submitReksaiScore(name, score){
  const list = loadReksaiRanking();
  const idx = list.findIndex(e => e.name.toLowerCase() === name.toLowerCase());
  const entry = { name, score, date: new Date().toLocaleDateString('pt-BR') };
  if(idx === -1){
    list.push(entry);
  } else if(score > list[idx].score){
    list[idx] = entry;
  }
  list.sort((a, b) => b.score - a.score);
  saveReksaiRanking(list);
  return list;
}
function renderReksaiRankingHtml(){
  const list = loadReksaiRanking().slice(0, 15);
  const currentUser = (sessionStorage.getItem('rg_current_user') || '').toLowerCase();
  if(!list.length){
    return '<p class="empty-roster">Ninguém caçou a Rek\'Sai ainda. O Vazio segue impune.</p>';
  }
  const rows = list.map((e, i) => `
    <li class="${e.name.toLowerCase() === currentUser ? 'you' : ''}">
      <span class="pos">${i + 1}º</span>
      <span class="n">${e.name}</span>
      <span class="score">em ${e.date}</span>
      <span class="pct">${e.score} pts</span>
    </li>`).join('');
  return `<ul class="heimer-rank-list rk-rank">${rows}</ul>`;
}
function reksaiVerdict(score){
  if(score === 0) return 'Zero. A Rek\'Sai nem percebeu que você estava lá. Você é literalmente um ward.';
  if(score <= 8) return 'Ela riu de você debaixo da terra. Dava pra ouvir.';
  if(score <= 16) return 'Razoável. Você acertaria mais se ela fosse do tamanho do Cho\'Gath com 6 stacks.';
  if(score <= 25) return 'Boa mira! O Vazio está oficialmente incomodado.';
  if(score <= 34) return 'Caçador de elite. A Rek\'Sai vai dar dodge na próxima queue.';
  return 'ISSO NÃO É HUMANO. Reportado por script de martelo.';
}

// se o CDN da Riot estiver fora do ar, a Rek'Sai vira este monstrinho desenhado na mão
function reksaiMoleFallback(){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
    <rect width='200' height='200' fill='#120b1e'/>
    <path d='M100 8 L126 66 L74 66 Z' fill='#9a5cff'/>
    <path d='M100 26 L116 66 L84 66 Z' fill='#5a2bb0'/>
    <ellipse cx='100' cy='132' rx='66' ry='62' fill='#2a1b45'/>
    <ellipse cx='100' cy='132' rx='66' ry='62' fill='none' stroke='#7d3cff' stroke-width='5'/>
    <ellipse cx='100' cy='158' rx='42' ry='30' fill='#3b2760'/>
    <circle cx='76' cy='116' r='9' fill='#e93cff'/>
    <circle cx='124' cy='116' r='9' fill='#e93cff'/>
    <circle cx='76' cy='113' r='3' fill='#fff'/>
    <circle cx='124' cy='113' r='3' fill='#fff'/>
    <path d='M62 150 Q72 168 84 152' fill='none' stroke='#e93cff' stroke-width='4' stroke-linecap='round'/>
    <path d='M116 152 Q128 168 138 150' fill='none' stroke='#e93cff' stroke-width='4' stroke-linecap='round'/>
    <path d='M88 156 L96 172 L104 156 L112 172' fill='none' stroke='#d9c8ff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg.replace(/\s+/g, ' '))}`;
}

function renderRekSai(){
  const HOLES = 9;
  const moleFallback = reksaiMoleFallback();
  const holesHtml = Array.from({length: HOLES}, (_, i) => `
    <div class="rk-hole" data-i="${i}">
      <div class="rk-dirt"></div>
      <div class="rk-mole">
        <img src="${LOADING_ART('RekSai')}" alt="Rek'Sai" draggable="false"
             onerror="this.onerror=null;this.src='${moleFallback}';">
      </div>
      <div class="rk-cover"></div>
    </div>`).join('');

  contentEl.innerHTML = `
    <section class="player-panel reksai-panel" style="--accent-color:#7d3cff">
      <div class="player-head">
        <img class="player-photo" style="--accent-color:#7d3cff; --accent-glow:#7d3cff55"
             src="${SPLASH('RekSai')}" alt="Rek'Sai"
             onerror="this.onerror=null;this.src='${avatarFallback("Rek'Sai", '#7d3cff')}';">
        <div class="player-id">
          <h2 class="player-name">Caça à Rek'Sai</h2>
          <div class="player-title">"Ela ganka pelos túneis. Hoje, os túneis são dela — e o martelo é seu."</div>
        </div>
      </div>

      <div class="lore-box">
        <h3>A Escavadora do Vazio</h3>
        <p>A Rek'Sai cavou <b>9 túneis</b> no meio da base da R.G. e fica dando spawn kill em todo mundo. Chega de morrer pro gank dela: pegue o martelo e <b>acerte a cabeça dela toda vez que ela sair do buraco</b>. Você tem <b>30 segundos</b>. Cada acerto vale <b>1 ponto</b> — e se aparecer a <b>Rek'Sai enfurecida</b> (a vermelha, mais rápida), vale <b>2</b>. Quanto mais o tempo passa, mais rápido ela mergulha de volta. Quem acertar mais entra pro ranking dos caçadores.</p>
      </div>

      <div class="mira-hud">
        <span>Tempo: <b id="rk-time">30</b>s</span>
        <span>Pontos: <b id="rk-score">0</b></span>
        <span>Marteladas no vento: <b id="rk-miss">0</b></span>
        <button id="rk-start-btn" class="mira-reset-btn" type="button">Começar caçada</button>
      </div>

      <div class="rk-arena" id="rk-arena">
        <div class="rk-grid">${holesHtml}</div>
        <div class="rk-hammer" id="rk-hammer">🔨</div>
        <div class="rk-overlay" id="rk-overlay"><span>Clique em "Começar caçada"<br>e prepare o martelo</span></div>
      </div>
      <p class="mira-hint">Dica: mire na cabeça, não no buraco. A Rek'Sai não respeita quem bate na terra.</p>

      <div id="rk-result" class="mira-result hidden"></div>

      <h3 class="heimer-rank-title">Ranking dos caçadores do Vazio</h3>
      <div id="rk-ranking">${renderReksaiRankingHtml()}</div>
    </section>
  `;

  const arena = document.getElementById('rk-arena');
  const overlay = document.getElementById('rk-overlay');
  const hammer = document.getElementById('rk-hammer');
  const timeEl = document.getElementById('rk-time');
  const scoreEl = document.getElementById('rk-score');
  const missEl = document.getElementById('rk-miss');
  const startBtn = document.getElementById('rk-start-btn');
  const resultEl = document.getElementById('rk-result');
  const rankingEl = document.getElementById('rk-ranking');
  const holes = Array.from(arena.querySelectorAll('.rk-hole'));

  let playing = false;
  let score = 0, misses = 0, timeLeft = 30;
  let timerId = null;
  const spawnTimeouts = new Set();

  const alive = () => document.body.contains(arena);

  function clearAllTimers(){
    clearInterval(timerId);
    spawnTimeouts.forEach(t => clearTimeout(t));
    spawnTimeouts.clear();
  }
  function later(fn, ms){
    const t = setTimeout(() => { spawnTimeouts.delete(t); if(alive()) fn(); }, ms);
    spawnTimeouts.add(t);
    return t;
  }

  // martelo segue o cursor dentro da arena (pointer events cobrem mouse, caneta e toque)
  function moveHammer(e){
    const r = arena.getBoundingClientRect();
    hammer.style.left = (e.clientX - r.left) + 'px';
    hammer.style.top = (e.clientY - r.top) + 'px';
  }
  arena.addEventListener('pointermove', moveHammer);
  arena.addEventListener('pointerenter', () => hammer.classList.add('show'));
  arena.addEventListener('pointerleave', () => hammer.classList.remove('show'));
  arena.addEventListener('pointerdown', (e) => {
    moveHammer(e); // no toque não há "move" antes do tap — posiciona o martelo no ponto da batida
    hammer.classList.add('show');
    hammer.classList.remove('smash');
    void hammer.offsetWidth; // reinicia a animação
    hammer.classList.add('smash');
  });

  // martelada fora da cabeça = no vento
  arena.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // evita zoom de duplo toque, seleção e eventos de mouse duplicados no celular
    if(!playing || e._rkHit) return;
    misses++;
    missEl.textContent = misses;
  });

  function popMole(){
    if(!playing) return;
    const free = holes.filter(h => !h.classList.contains('active'));
    if(!free.length){ later(popMole, 120); return; }

    const hole = free[Math.floor(Math.random() * free.length)];
    const mole = hole.querySelector('.rk-mole');
    const enraged = Math.random() < 0.18;

    hole.classList.add('active');
    mole.classList.toggle('enraged', enraged);
    mole.classList.remove('hit');
    mole.classList.add('up');

    // fica menos tempo na superfície conforme o tempo passa (e a enfurecida é mais rápida)
    const progress = 1 - timeLeft / 30;
    let upTime = 1050 - progress * 520 + Math.random() * 220;
    if(enraged) upTime *= 0.7;

    later(() => {
      if(mole.classList.contains('up') && !mole.classList.contains('hit')){
        mole.classList.remove('up');
        later(() => hole.classList.remove('active'), 260);
      }
    }, upTime);

    // agenda a próxima aparição — o ritmo acelera com o tempo
    const gap = 620 - progress * 330 + Math.random() * 240;
    later(popMole, gap);
  }

  function whack(e){
    const mole = e.currentTarget;
    if(!playing || !mole.classList.contains('up') || mole.classList.contains('hit')) return;
    e._rkHit = true; // avisa o contador de erros da arena que essa martelada acertou

    const pts = mole.classList.contains('enraged') ? 2 : 1;
    score += pts;
    scoreEl.textContent = score;
    if(navigator.vibrate) navigator.vibrate(pts === 2 ? 40 : 20); // marretada com feedback no celular

    mole.classList.add('hit');
    mole.classList.remove('up');

    // "+1" flutuante no ponto do acerto
    const r = arena.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'rk-pop' + (pts === 2 ? ' big' : '');
    pop.textContent = `+${pts}`;
    pop.style.left = (e.clientX - r.left) + 'px';
    pop.style.top = (e.clientY - r.top) + 'px';
    arena.appendChild(pop);
    later(() => pop.remove(), 700);

    const hole = mole.closest('.rk-hole');
    later(() => { mole.classList.remove('hit', 'enraged'); hole.classList.remove('active'); }, 300);
  }
  holes.forEach(h => h.querySelector('.rk-mole').addEventListener('pointerdown', whack));

  function endGame(){
    playing = false;
    clearAllTimers();
    holes.forEach(h => {
      h.classList.remove('active');
      h.querySelector('.rk-mole').classList.remove('up', 'hit', 'enraged');
    });
    startBtn.textContent = 'Caçar de novo';
    overlay.classList.remove('hidden');
    overlay.innerHTML = '<span>Fim da caçada!</span>';

    const total = score + misses;
    const acc = total ? Math.round((score / total) * 100) : 0;
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `<b>${score} pontos</b> — ${misses} martelada(s) no vento (${acc}% de precisão)<br>${reksaiVerdict(score)}`;

    const currentUser = sessionStorage.getItem('rg_current_user') || 'Anônimo';
    submitReksaiScore(currentUser, score);
    rankingEl.innerHTML = renderReksaiRankingHtml();
  }

  function startGame(){
    clearAllTimers();
    playing = true;
    score = 0; misses = 0; timeLeft = 30;
    scoreEl.textContent = '0';
    missEl.textContent = '0';
    timeEl.textContent = '30';
    resultEl.classList.add('hidden');
    overlay.classList.add('hidden');
    startBtn.textContent = 'Reiniciar';
    holes.forEach(h => {
      h.classList.remove('active');
      h.querySelector('.rk-mole').classList.remove('up', 'hit', 'enraged');
    });

    timerId = setInterval(() => {
      if(!alive()){ clearAllTimers(); return; }
      timeLeft--;
      timeEl.textContent = timeLeft;
      if(timeLeft <= 0) endGame();
    }, 1000);

    later(popMole, 500);
    later(popMole, 1100);
  }

  startBtn.addEventListener('click', startGame);
}

function selectTab(id){
  document.querySelectorAll('.tab-btn').forEach(b=> b.classList.toggle('active', b.dataset.tab === id));
  document.querySelectorAll('.credit-link').forEach(b=> b.classList.toggle('active', b.dataset.tab === id));
  if(id === 'hoje'){ renderHoje(); return; }
  if(id === 'mira'){ renderMira(); return; }
  if(id === 'heimer'){ renderHeimerQuiz(); return; }
  if(id === 'reksai'){ renderRekSai(); return; }
  const p = PLAYERS.find(pl => pl.id === id);
  if(p) renderPlayer(p);
  window.scrollTo({top:0, behavior:'smooth'});
}

// ---------- gate ----------
const gateEl = document.getElementById('gate');
const siteEl = document.getElementById('site');
const gateForm = document.getElementById('gate-form');
const welcomeMsg = document.getElementById('welcome-msg');

function enterSite(name){
  addToRoster(name);
  sessionStorage.setItem('rg_current_user', name);
  gateEl.classList.add('hidden');
  siteEl.classList.remove('hidden');
  welcomeMsg.innerHTML = `na área: <b>${name}</b>`;
  buildTabs();
  buildCredits();
  selectTab(PLAYERS[0].id);
}

gateForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const val = document.getElementById('gate-name').value.trim();
  if(val) enterSite(val);
});

// se já tem usuário nessa sessão, pula o portão
const existing = sessionStorage.getItem('rg_current_user');
if(existing){ enterSite(existing); }
