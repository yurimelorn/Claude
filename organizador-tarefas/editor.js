/* ===== Editor de PDF: desenhar formas e exportar ===== */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const editor = $('editor-pdf');
  const area = $('ed-area');
  const folha = $('ed-folha');
  const canvasPdf = $('ed-canvas-pdf');
  const canvasDesenho = $('ed-canvas-desenho');
  const pagInfo = $('ed-pag-info');
  const carregando = $('ed-carregando');
  const botaoSalvar = $('ed-salvar');

  // ---- Estado ----
  let pdf = null;               // documento aberto no pdf.js
  let bytesOriginais = null;    // cópia dos bytes para exportar
  let nomeArquivo = 'documento.pdf';
  let aoSalvar = null;          // callback para gravar de volta no app
  let paginaAtual = 1;
  let desenhos = new Map();     // página -> [itens]
  let ferramenta = 'caneta';
  let cor = '#ff3b30';
  let largura = 0.008;          // relativa à largura da página
  let itemEmCurso = null;
  let houveMudanca = false;
  let zoom = 1;                 // ampliação atual da página (pinça)
  let rotacoesExtra = new Map(); // página -> giro adicional (0/90/180/270)

  // Modo "só caneta": dedos movem/dão zoom, apenas a Apple Pencil desenha
  const CHAVE_SO_CANETA = 'organizador.soCaneta';
  let soCaneta = localStorage.getItem(CHAVE_SO_CANETA) !== '0';
  const botaoModoCaneta = $('ed-modo-caneta');

  function atualizarModoCaneta() {
    botaoModoCaneta.classList.toggle('ativo', soCaneta);
  }

  botaoModoCaneta.addEventListener('click', () => {
    soCaneta = !soCaneta;
    localStorage.setItem(CHAVE_SO_CANETA, soCaneta ? '1' : '0');
    atualizarModoCaneta();
  });
  atualizarModoCaneta();

  // ---- Carregamento das bibliotecas só quando o editor abre ----
  let bibliotecas = null;
  function carregarScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error('Falha ao carregar ' + src));
      document.head.appendChild(s);
    });
  }

  function carregarBibliotecas() {
    if (!bibliotecas) {
      bibliotecas = (async () => {
        await carregarScript('pdf.min.js');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
        await carregarScript('pdf-lib.min.js');
      })();
    }
    return bibliotecas;
  }

  // ---- Abrir ----
  async function abrir(blob, opcoes = {}) {
    nomeArquivo = opcoes.nome || 'documento.pdf';
    aoSalvar = opcoes.aoSalvar || null;
    botaoSalvar.hidden = !aoSalvar;
    desenhos = new Map();
    rotacoesExtra = new Map();
    zoom = 1;
    paginaAtual = 1;
    houveMudanca = false;

    editor.hidden = false;
    carregando.hidden = false;
    carregando.textContent = 'Carregando PDF...';
    pagInfo.textContent = '';
    definirBarra(false);

    try {
      await carregarBibliotecas();
      const buf = await blob.arrayBuffer();
      bytesOriginais = new Uint8Array(buf).slice();
      pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
      await mostrarPagina(1);
      carregando.hidden = true;
    } catch (erro) {
      carregando.hidden = true;
      editor.hidden = true;
      alert('Não consegui abrir este PDF. ' + (erro && erro.message ? erro.message : ''));
    }
  }

  // ---- Exibição da página ----
  async function mostrarPagina(n) {
    if (!pdf) return;
    paginaAtual = n;
    const pagina = await pdf.getPage(n);
    // Respeita a orientação original da página + o giro aplicado pelo usuário
    const rotacao = (((pagina.rotate || 0) + (rotacoesExtra.get(n) || 0)) % 360 + 360) % 360;
    const base = pagina.getViewport({ scale: 1, rotation: rotacao });
    const larguraDisponivel = Math.max(280, area.clientWidth - 24);
    const escalaCss = (larguraDisponivel / base.width) * zoom;
    let nitidez = Math.min(window.devicePixelRatio || 1, 2);
    // Limita o tamanho do canvas para não pesar a memória em zoom alto
    const maxLargura = 3000;
    if (base.width * escalaCss * nitidez > maxLargura) {
      nitidez = maxLargura / (base.width * escalaCss);
    }
    const vp = pagina.getViewport({ scale: escalaCss * nitidez, rotation: rotacao });

    canvasPdf.width = Math.floor(vp.width);
    canvasPdf.height = Math.floor(vp.height);
    canvasDesenho.width = canvasPdf.width;
    canvasDesenho.height = canvasPdf.height;
    const cssL = `${Math.floor(vp.width / nitidez)}px`;
    const cssA = `${Math.floor(vp.height / nitidez)}px`;
    for (const c of [canvasPdf, canvasDesenho]) {
      c.style.width = cssL;
      c.style.height = cssA;
    }
    folha.style.width = cssL;
    folha.style.height = cssA;

    await pagina.render({ canvasContext: canvasPdf.getContext('2d'), viewport: vp }).promise;
    pagInfo.textContent = `${n} / ${pdf.numPages}`;
    $('ed-pag-ant').disabled = n <= 1;
    $('ed-pag-prox').disabled = n >= pdf.numPages;
    redesenhar();
  }

  // ---- Desenho ----
  function itensDaPagina() {
    if (!desenhos.has(paginaAtual)) desenhos.set(paginaAtual, []);
    return desenhos.get(paginaAtual);
  }

  const FERRAMENTAS_LIVRES = ['caneta', 'marca'];

  function cabecaDeSeta(ctx, xPonta, yPonta, angulo, tamanho) {
    ctx.beginPath();
    ctx.moveTo(xPonta, yPonta);
    ctx.lineTo(xPonta - tamanho * Math.cos(angulo - 0.5), yPonta - tamanho * Math.sin(angulo - 0.5));
    ctx.moveTo(xPonta, yPonta);
    ctx.lineTo(xPonta - tamanho * Math.cos(angulo + 0.5), yPonta - tamanho * Math.sin(angulo + 0.5));
    ctx.stroke();
  }

  function desenharItem(ctx, item, W, H) {
    ctx.save();
    ctx.strokeStyle = item.cor;
    ctx.fillStyle = item.cor;
    ctx.lineWidth = Math.max(1, item.l * W);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (item.t === 'marca') {
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = Math.max(2, item.l * W * 3);
    }
    if (item.t === 'tracejada') {
      ctx.setLineDash([ctx.lineWidth * 3, ctx.lineWidth * 2]);
    }

    if (item.t === 'texto') {
      const tamanho = Math.max(12, item.l * W * 6);
      ctx.font = `bold ${tamanho}px -apple-system, 'Segoe UI', sans-serif`;
      ctx.textBaseline = 'top';
      item.txt.split('\n').forEach((linha, i) => {
        ctx.fillText(linha, item.x * W, item.y * H + i * tamanho * 1.25);
      });
      ctx.restore();
      return;
    }

    ctx.beginPath();
    if (FERRAMENTAS_LIVRES.includes(item.t)) {
      item.p.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x * W, pt.y * H);
        else ctx.lineTo(pt.x * W, pt.y * H);
      });
      ctx.stroke();
      ctx.restore();
      return;
    }

    const x1 = item.x1 * W;
    const y1 = item.y1 * H;
    const x2 = item.x2 * W;
    const y2 = item.y2 * H;
    const tamCabeca = Math.max(10, item.l * W * 4);

    if (item.t === 'linha' || item.t === 'tracejada' || item.t === 'seta' || item.t === 'seta2') {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const ang = Math.atan2(y2 - y1, x2 - x1);
      if (item.t === 'seta' || item.t === 'seta2') cabecaDeSeta(ctx, x2, y2, ang, tamCabeca);
      if (item.t === 'seta2') cabecaDeSeta(ctx, x1, y1, ang + Math.PI, tamCabeca);
    } else if (item.t === 'ret' || item.t === 'retfill') {
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const l = Math.abs(x2 - x1);
      const a = Math.abs(y2 - y1);
      if (item.t === 'retfill') {
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, y, l, a);
        ctx.globalAlpha = 1;
      }
      ctx.strokeRect(x, y, l, a);
    } else if (item.t === 'circ') {
      ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function redesenhar() {
    const ctx = canvasDesenho.getContext('2d');
    ctx.clearRect(0, 0, canvasDesenho.width, canvasDesenho.height);
    for (const item of desenhos.get(paginaAtual) || []) {
      desenharItem(ctx, item, canvasDesenho.width, canvasDesenho.height);
    }
    if (itemEmCurso) desenharItem(ctx, itemEmCurso, canvasDesenho.width, canvasDesenho.height);
  }

  function posicao(e) {
    // offsetX/Y são relativos ao próprio canvas, calculados pelo navegador —
    // imunes aos deslocamentos de viewport do iOS (teclado, zoom nativo)
    let x;
    let y;
    if (e.target === canvasDesenho && typeof e.offsetX === 'number') {
      x = e.offsetX / canvasDesenho.clientWidth;
      y = e.offsetY / canvasDesenho.clientHeight;
    } else {
      const r = canvasDesenho.getBoundingClientRect();
      x = (e.clientX - r.left) / r.width;
      y = (e.clientY - r.top) / r.height;
    }
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
  }

  canvasDesenho.addEventListener('pointerdown', (e) => {
    if (ferramenta === 'mover') return;

    // Texto: um toque (dedo ou caneta) pergunta o texto e coloca no ponto
    if (ferramenta === 'texto') {
      e.preventDefault();
      const p = posicao(e);
      definirBarra(false);
      const txt = prompt('Texto para inserir:');
      // Reancora a tela: o teclado do iOS pode deixar o viewport deslocado
      window.scrollTo(0, 0);
      if (txt && txt.trim()) {
        itensDaPagina().push({ t: 'texto', cor, l: largura / zoom, x: p.x, y: p.y, txt: txt.trim() });
        houveMudanca = true;
        redesenhar();
      }
      return;
    }

    // No modo "só caneta", o dedo não desenha — serve para mover e dar zoom
    if (soCaneta && e.pointerType === 'touch') return;
    e.preventDefault();
    try {
      canvasDesenho.setPointerCapture(e.pointerId);
    } catch { /* ponteiro sintético em testes */ }
    const p = posicao(e);
    // A grossura acompanha o zoom: ampliado, o traço fica proporcionalmente mais fino
    const traco = largura / zoom;
    itemEmCurso = FERRAMENTAS_LIVRES.includes(ferramenta)
      ? { t: ferramenta, cor, l: traco, p: [p] }
      : { t: ferramenta, cor, l: traco, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    definirBarra(false);
    redesenhar();
  });

  canvasDesenho.addEventListener('pointermove', (e) => {
    if (!itemEmCurso) return;
    const p = posicao(e);
    if (FERRAMENTAS_LIVRES.includes(itemEmCurso.t)) itemEmCurso.p.push(p);
    else {
      itemEmCurso.x2 = p.x;
      itemEmCurso.y2 = p.y;
    }
    redesenhar();
  });

  const soltar = () => {
    if (!itemEmCurso) return;
    itensDaPagina().push(itemEmCurso);
    itemEmCurso = null;
    houveMudanca = true;
    redesenhar();
  };
  canvasDesenho.addEventListener('pointerup', soltar);
  canvasDesenho.addEventListener('pointercancel', () => { itemEmCurso = null; redesenhar(); });

  // ---- Gestos com os dedos: um dedo move, dois dedos dão zoom (pinça) ----
  const toques = new Map(); // pointerId -> {x, y}
  let gesto = null;

  function distancia() {
    const [a, b] = [...toques.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function centroPinça() {
    const [a, b] = [...toques.values()];
    const r = area.getBoundingClientRect();
    return { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
  }

  area.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    // Primeiro dedo de um novo gesto: descarta toques órfãos de gestos anteriores
    if (e.isPrimary) {
      toques.clear();
      gesto = null;
    }
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const podeArrastar = soCaneta || ferramenta === 'mover';
    if (toques.size === 1 && podeArrastar) {
      gesto = {
        tipo: 'pan',
        x: e.clientX,
        y: e.clientY,
        sl: area.scrollLeft,
        st: area.scrollTop,
      };
    } else if (toques.size === 2) {
      // Segundo dedo: se havia um traço em andamento (modo dedo), cancela e vira pinça
      if (itemEmCurso) {
        itemEmCurso = null;
        redesenhar();
      }
      const foco = centroPinça();
      const rf = folha.getBoundingClientRect();
      const ra = area.getBoundingClientRect();
      gesto = {
        tipo: 'pinch',
        dist: distancia(),
        zoom0: zoom,
        fator: 1,
        foco,
        // ponto da PÁGINA (proporcional) que está entre os dedos — é a âncora do zoom
        ponto: {
          x: Math.min(1, Math.max(0, (foco.x + ra.left - rf.left) / rf.width)),
          y: Math.min(1, Math.max(0, (foco.y + ra.top - rf.top) / rf.height)),
        },
      };
      // O zoom visual acontece em volta do ponto entre os dedos
      folha.style.transformOrigin = `${gesto.ponto.x * 100}% ${gesto.ponto.y * 100}%`;
    }
  });

  area.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'touch' || !toques.has(e.pointerId)) return;
    toques.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!gesto) return;

    if (gesto.tipo === 'pan' && toques.size === 1) {
      area.scrollLeft = gesto.sl - (e.clientX - gesto.x);
      area.scrollTop = gesto.st - (e.clientY - gesto.y);
    } else if (gesto.tipo === 'pinch' && toques.size === 2) {
      const fator = Math.max(0.4, Math.min(4, distancia() / gesto.dist));
      gesto.fator = fator;
      folha.style.transform = `scale(${fator})`;
    }
  });

  async function fimDeToque(e) {
    if (e.pointerType !== 'touch') return;
    toques.delete(e.pointerId);

    if (gesto && gesto.tipo === 'pinch' && toques.size < 2) {
      const antigo = gesto;
      gesto = null;
      folha.style.transform = '';
      folha.style.transformOrigin = '0 0';
      const novoZoom = Math.max(1, Math.min(4, antigo.zoom0 * antigo.fator));
      if (Math.abs(novoZoom - antigo.zoom0) > 0.01) {
        zoom = novoZoom;
        await mostrarPagina(paginaAtual);
        // Recoloca o ponto da página que estava entre os dedos na mesma posição da tela
        area.scrollLeft = folha.offsetLeft + antigo.ponto.x * folha.offsetWidth - antigo.foco.x;
        area.scrollTop = folha.offsetTop + antigo.ponto.y * folha.offsetHeight - antigo.foco.y;
      }
    } else if (gesto && gesto.tipo === 'pan' && toques.size === 0) {
      gesto = null;
    }
  }
  area.addEventListener('pointerup', fimDeToque);
  area.addEventListener('pointercancel', fimDeToque);

  // ---- Barra de ferramentas retrátil ----
  const barraFerramentas = document.querySelector('.editor-barra');
  const alternarBarra = $('ed-alternar');

  function definirBarra(aberta) {
    barraFerramentas.classList.toggle('fechada', !aberta);
    alternarBarra.textContent = aberta ? '⌄' : '⌃';
    // Quando a barra está aberta, a setinha sobe para ficar logo acima dela
    alternarBarra.style.bottom = aberta ? `${barraFerramentas.offsetHeight + 10}px` : '';
  }

  alternarBarra.addEventListener('click', () => {
    definirBarra(barraFerramentas.classList.contains('fechada'));
  });

  // ---- Barra de ferramentas ----
  function ligarGrupo(idGrupo, atributo, acao) {
    const grupo = $(idGrupo);
    grupo.addEventListener('click', (e) => {
      const botao = e.target.closest(`button[data-${atributo}]`);
      if (!botao) return;
      grupo.querySelectorAll('button').forEach((b) => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      acao(botao.dataset[atributo]);
    });
  }

  ligarGrupo('ed-ferramentas', 'fer', (v) => {
    ferramenta = v;
    canvasDesenho.style.pointerEvents = v === 'mover' ? 'none' : 'auto';
  });
  ligarGrupo('ed-cores', 'cor', (v) => { cor = v; });
  ligarGrupo('ed-larguras', 'larg', (v) => { largura = parseFloat(v); });

  $('ed-desfazer').addEventListener('click', () => {
    itensDaPagina().pop();
    redesenhar();
  });

  // ---- Girar a página (90° para cada lado; duas vezes = 180°) ----
  function rotacionarItem90(item) {
    // giro horário de 90°: (x, y) vira (1 - y, x)
    const rot = (pt) => {
      const nx = 1 - pt.y;
      pt.y = pt.x;
      pt.x = nx;
    };
    if (item.p) {
      item.p.forEach(rot);
    } else if (item.t === 'texto') {
      const p = { x: item.x, y: item.y };
      rot(p);
      item.x = p.x;
      item.y = p.y;
    } else {
      const a = { x: item.x1, y: item.y1 };
      const b = { x: item.x2, y: item.y2 };
      rot(a);
      rot(b);
      item.x1 = a.x;
      item.y1 = a.y;
      item.x2 = b.x;
      item.y2 = b.y;
    }
  }

  function girar(graus) {
    const atual = rotacoesExtra.get(paginaAtual) || 0;
    rotacoesExtra.set(paginaAtual, (atual + graus + 360) % 360);
    const passos = ((graus + 360) % 360) / 90;
    const itens = desenhos.get(paginaAtual) || [];
    for (let i = 0; i < passos; i++) itens.forEach(rotacionarItem90);
    houveMudanca = true;
    mostrarPagina(paginaAtual);
  }

  $('ed-girar-esq').addEventListener('click', () => girar(-90));
  $('ed-girar-dir').addEventListener('click', () => girar(90));

  $('ed-pag-ant').addEventListener('click', () => { if (paginaAtual > 1) mostrarPagina(paginaAtual - 1); });
  $('ed-pag-prox').addEventListener('click', () => { if (paginaAtual < pdf.numPages) mostrarPagina(paginaAtual + 1); });

  $('ed-fechar').addEventListener('click', () => {
    if (houveMudanca && !confirm('Sair sem exportar? Os desenhos feitos serão perdidos.')) return;
    editor.hidden = true;
    pdf = null;
    bytesOriginais = null;
  });

  // ---- Gerar o PDF com os desenhos gravados ----
  // Posiciona a imagem do desenho conforme a rotação final da página
  function opcoesDesenho(rot, W, H) {
    const { degrees } = window.PDFLib;
    switch (rot) {
      case 90: return { x: W, y: 0, width: H, height: W, rotate: degrees(90) };
      case 180: return { x: W, y: H, width: W, height: H, rotate: degrees(180) };
      case 270: return { x: 0, y: H, width: H, height: W, rotate: degrees(270) };
      default: return { x: 0, y: 0, width: W, height: H };
    }
  }

  async function gerarPdfEditado() {
    const doc = await window.PDFLib.PDFDocument.load(bytesOriginais.slice());
    const paginas = doc.getPages();

    for (let num = 1; num <= paginas.length; num++) {
      const itens = desenhos.get(num) || [];
      const extra = rotacoesExtra.get(num) || 0;
      if (!itens.length && extra === 0) continue;

      const pagina = paginas[num - 1];
      const rotOriginal = ((pagina.getRotation().angle || 0) % 360 + 360) % 360;
      const rotTotal = (rotOriginal + extra) % 360;
      if (extra) pagina.setRotation(window.PDFLib.degrees(rotTotal));
      if (!itens.length) continue;

      const W = pagina.getWidth();
      const H = pagina.getHeight();
      // O desenho foi feito na orientação exibida; o canvas segue essa orientação
      const deitado = rotTotal % 180 === 90;
      const c = document.createElement('canvas');
      c.width = Math.round((deitado ? H : W) * 2);
      c.height = Math.round((deitado ? W : H) * 2);
      const ctx = c.getContext('2d');
      for (const item of itens) desenharItem(ctx, item, c.width, c.height);

      const png = await new Promise((res) => c.toBlob(res, 'image/png'));
      const bytesPng = new Uint8Array(await png.arrayBuffer());
      const imagem = await doc.embedPng(bytesPng);
      pagina.drawImage(imagem, opcoesDesenho(rotTotal, W, H));
    }

    const salvo = await doc.save();
    return new Blob([salvo], { type: 'application/pdf' });
  }

  function nomeEditado() {
    return nomeArquivo.replace(/\.pdf$/i, '') + '-editado.pdf';
  }

  $('ed-exportar').addEventListener('click', async () => {
    carregando.hidden = false;
    carregando.textContent = 'Gerando PDF...';
    try {
      const blob = await gerarPdfEditado();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeEditado();
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      houveMudanca = false;
    } catch (erro) {
      alert('Erro ao exportar: ' + (erro && erro.message ? erro.message : erro));
    }
    carregando.hidden = true;
  });

  botaoSalvar.addEventListener('click', async () => {
    if (!aoSalvar) return;
    carregando.hidden = false;
    carregando.textContent = 'Salvando...';
    try {
      const blob = await gerarPdfEditado();
      await aoSalvar(blob);
      houveMudanca = false;
      alert('PDF salvo no app! O anexo da tarefa foi atualizado.');
    } catch (erro) {
      alert('Erro ao salvar: ' + (erro && erro.message ? erro.message : erro));
    }
    carregando.hidden = true;
  });

  window.EditorPDF = { abrir };
})();
