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
    paginaAtual = 1;
    houveMudanca = false;

    editor.hidden = false;
    carregando.hidden = false;
    carregando.textContent = 'Carregando PDF...';

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
    paginaAtual = n;
    const pagina = await pdf.getPage(n);
    const base = pagina.getViewport({ scale: 1 });
    const larguraDisponivel = Math.max(280, area.clientWidth - 24);
    const escalaCss = larguraDisponivel / base.width;
    const nitidez = Math.min(window.devicePixelRatio || 1, 2);
    const vp = pagina.getViewport({ scale: escalaCss * nitidez });

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

  function desenharItem(ctx, item, W, H) {
    ctx.strokeStyle = item.cor;
    ctx.lineWidth = Math.max(1, item.l * W);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (item.t === 'caneta') {
      item.p.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x * W, pt.y * H);
        else ctx.lineTo(pt.x * W, pt.y * H);
      });
      ctx.stroke();
      return;
    }
    const x1 = item.x1 * W;
    const y1 = item.y1 * H;
    const x2 = item.x2 * W;
    const y2 = item.y2 * H;
    if (item.t === 'linha' || item.t === 'seta') {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      if (item.t === 'seta') {
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const tam = Math.max(10, item.l * W * 4);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - tam * Math.cos(ang - 0.5), y2 - tam * Math.sin(ang - 0.5));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - tam * Math.cos(ang + 0.5), y2 - tam * Math.sin(ang + 0.5));
        ctx.stroke();
      }
    } else if (item.t === 'ret') {
      ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    } else if (item.t === 'circ') {
      ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
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
    const r = canvasDesenho.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }

  canvasDesenho.addEventListener('pointerdown', (e) => {
    if (ferramenta === 'mover') return;
    e.preventDefault();
    canvasDesenho.setPointerCapture(e.pointerId);
    const p = posicao(e);
    itemEmCurso = ferramenta === 'caneta'
      ? { t: 'caneta', cor, l: largura, p: [p] }
      : { t: ferramenta, cor, l: largura, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    redesenhar();
  });

  canvasDesenho.addEventListener('pointermove', (e) => {
    if (!itemEmCurso) return;
    const p = posicao(e);
    if (itemEmCurso.t === 'caneta') itemEmCurso.p.push(p);
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

  $('ed-pag-ant').addEventListener('click', () => { if (paginaAtual > 1) mostrarPagina(paginaAtual - 1); });
  $('ed-pag-prox').addEventListener('click', () => { if (paginaAtual < pdf.numPages) mostrarPagina(paginaAtual + 1); });

  $('ed-fechar').addEventListener('click', () => {
    if (houveMudanca && !confirm('Sair sem exportar? Os desenhos feitos serão perdidos.')) return;
    editor.hidden = true;
    pdf = null;
    bytesOriginais = null;
  });

  // ---- Gerar o PDF com os desenhos gravados ----
  async function gerarPdfEditado() {
    const doc = await window.PDFLib.PDFDocument.load(bytesOriginais.slice());
    const paginas = doc.getPages();

    for (const [num, itens] of desenhos) {
      if (!itens.length || num > paginas.length) continue;
      const pagina = paginas[num - 1];
      const W = pagina.getWidth();
      const H = pagina.getHeight();

      const c = document.createElement('canvas');
      c.width = Math.round(W * 2);
      c.height = Math.round(H * 2);
      const ctx = c.getContext('2d');
      for (const item of itens) desenharItem(ctx, item, c.width, c.height);

      const png = await new Promise((res) => c.toBlob(res, 'image/png'));
      const bytesPng = new Uint8Array(await png.arrayBuffer());
      const imagem = await doc.embedPng(bytesPng);
      pagina.drawImage(imagem, { x: 0, y: 0, width: W, height: H });
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
