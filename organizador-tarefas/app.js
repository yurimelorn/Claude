/* ===== Organizador de Tarefas — lógica ===== */
(() => {
  'use strict';

  const CHAVE_TAREFAS = 'organizador.tarefas';
  const CHAVE_HISTORICO = 'organizador.historico';

  /** @type {{id:string, texto:string, criadaEm:number, paraDia:string}[]} */
  let tarefas = carregar(CHAVE_TAREFAS);
  /** @type {{id:string, texto:string, criadaEm:number, concluidaEm:number}[]} */
  let historico = carregar(CHAVE_HISTORICO);

  // ---- Elementos ----
  const $ = (id) => document.getElementById(id);
  const listaTarefas = $('lista-tarefas');
  const vazioTarefas = $('vazio-tarefas');
  const conteudoHistorico = $('conteudo-historico');
  const vazioHistorico = $('vazio-historico');
  const buscaHistorico = $('busca-historico');
  const resultadoBusca = $('resultado-busca');
  const buscaSemResultado = $('busca-sem-resultado');
  const entrada = $('entrada-tarefa');
  const form = $('form-nova');
  const botaoVoz = $('botao-voz');
  const statusVoz = $('status-voz');
  const contador = $('contador');
  const calTitulo = $('cal-titulo');
  const calGrade = $('cal-grade');
  const calDiaTitulo = $('cal-dia-titulo');
  const calLista = $('cal-lista');
  const calVazio = $('cal-vazio');
  const calEntrada = $('cal-entrada');
  const formCal = $('form-cal');

  const abas = {
    tarefas: { aba: $('aba-tarefas'), painel: $('painel-tarefas') },
    calendario: { aba: $('aba-calendario'), painel: $('painel-calendario') },
    historico: { aba: $('aba-historico'), painel: $('painel-historico') },
  };

  // ---- Persistência ----
  function carregar(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave)) || [];
    } catch {
      return [];
    }
  }

  function salvar() {
    localStorage.setItem(CHAVE_TAREFAS, JSON.stringify(tarefas));
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
  }

  // ---- Banco de anexos (IndexedDB — comporta fotos e documentos) ----
  const bancoAnexos = new Promise((resolve) => {
    const req = indexedDB.open('organizador-anexos', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('anexos', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  function guardarAnexo(registro) {
    return bancoAnexos.then((db) => new Promise((res) => {
      if (!db) return res();
      const tx = db.transaction('anexos', 'readwrite');
      tx.objectStore('anexos').put(registro);
      tx.oncomplete = res;
      tx.onerror = res;
    }));
  }

  function obterAnexo(id) {
    return bancoAnexos.then((db) => new Promise((res) => {
      if (!db) return res(null);
      const rq = db.transaction('anexos').objectStore('anexos').get(id);
      rq.onsuccess = () => res(rq.result || null);
      rq.onerror = () => res(null);
    }));
  }

  function apagarAnexo(id) {
    return bancoAnexos.then((db) => {
      if (db) db.transaction('anexos', 'readwrite').objectStore('anexos').delete(id);
    });
  }

  // Reaproveita as URLs dos blobs já carregados
  const urlAnexos = new Map();
  async function urlDoAnexo(id) {
    if (urlAnexos.has(id)) return urlAnexos.get(id);
    const reg = await obterAnexo(id);
    if (!reg) return null;
    const u = URL.createObjectURL(reg.blob);
    urlAnexos.set(id, u);
    return u;
  }

  // Reduz fotos grandes para caberem bem no banco (máx. 1400px, JPEG)
  function comprimirImagem(arquivo) {
    return new Promise((resolve) => {
      if (!arquivo.type.startsWith('image/')) return resolve(arquivo);
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = () => {
        const MAX = 1400;
        const escala = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * escala);
        const h = Math.round(img.height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => resolve(blob || arquivo), 'image/jpeg', 0.82);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(arquivo);
      };
      img.src = url;
    });
  }

  // ---- Datas ----
  const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fmtDia = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const fmtDiaCurto = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
  const fmtMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

  function chaveDoDia(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function dataDaChave(chave) {
    const [a, m, d] = chave.split('-').map(Number);
    return new Date(a, m - 1, d);
  }

  const hoje = () => chaveDoDia(Date.now());

  function rotuloDoDia(ts) {
    const chave = chaveDoDia(ts);
    if (chave === hoje()) return 'Hoje';
    if (chave === chaveDoDia(Date.now() - 86400000)) return 'Ontem';
    if (chave === chaveDoDia(Date.now() + 86400000)) return 'Amanhã';
    return fmtDia.format(new Date(ts));
  }

  // Migração: tarefas antigas não tinham dia agendado
  let migrou = false;
  for (const t of tarefas) {
    if (!t.paraDia) {
      t.paraDia = chaveDoDia(t.criadaEm);
      migrou = true;
    }
  }
  if (migrou) salvar();

  // ---- Renderização: tarefas de hoje (inclui as que passaram do dia) ----
  function renderizarTarefas() {
    listaTarefas.innerHTML = '';

    // Tarefas do dia + tudo que ficou para trás (passa para o dia seguinte automaticamente)
    const visiveis = tarefas
      .filter((t) => t.paraDia <= hoje())
      .sort((a, b) => (a.paraDia < b.paraDia ? -1 : a.paraDia > b.paraDia ? 1 : b.criadaEm - a.criadaEm));

    vazioTarefas.hidden = visiveis.length > 0;
    contador.textContent = visiveis.length === 0
      ? 'tudo em dia'
      : `${visiveis.length} pendente${visiveis.length > 1 ? 's' : ''}`;

    for (const t of visiveis) {
      listaTarefas.appendChild(criarItemTarefa(t));
    }
  }

  function criarItemTarefa(t) {
    const li = document.createElement('li');
    li.className = 'tarefa';
    li.dataset.id = t.id;

    const ok = document.createElement('button');
    ok.className = 'botao-ok';
    ok.title = 'Toque: concluir · Segure: concluir com anexo';
    ok.setAttribute('aria-label', 'Marcar como feita (segure para anexar)');
    ok.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';

    // Toque rápido conclui; segurar abre o menu de concluir com anexo
    let temporizador = null;
    let segurou = false;
    ok.addEventListener('pointerdown', () => {
      segurou = false;
      temporizador = setTimeout(() => {
        segurou = true;
        abrirMenuConcluir(t);
      }, 500);
    });
    const cancelarSegurar = () => clearTimeout(temporizador);
    ok.addEventListener('pointerup', cancelarSegurar);
    ok.addEventListener('pointerleave', cancelarSegurar);
    ok.addEventListener('pointercancel', cancelarSegurar);
    ok.addEventListener('contextmenu', (e) => e.preventDefault());
    ok.addEventListener('click', () => {
      if (!segurou) concluir(t.id, li, ok);
    });

    const texto = document.createElement('div');
    texto.className = 'texto';
    texto.textContent = t.texto;

    const detalhe = document.createElement('span');
    detalhe.className = 'hora-criacao';
    if (t.paraDia < hoje()) {
      detalhe.textContent = `veio de ${fmtDiaCurto.format(dataDaChave(t.paraDia))}`;
      detalhe.classList.add('atrasada');
    } else if (t.paraDia > hoje()) {
      detalhe.textContent = `agendada para ${rotuloDoDia(dataDaChave(t.paraDia)).toLowerCase()}`;
    } else {
      detalhe.textContent = `adicionada às ${fmtHora.format(new Date(t.criadaEm))}`;
    }
    texto.appendChild(detalhe);
    preencherAnexos(texto, t, true);

    const clipe = document.createElement('button');
    clipe.className = 'botao-excluir';
    clipe.title = 'Anexar imagem';
    clipe.setAttribute('aria-label', 'Anexar imagem');
    clipe.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6H10v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6h-1.5z"/></svg>';
    clipe.addEventListener('click', () => pedirArquivos(arquivoImagem, t.id, false));

    const excluir = document.createElement('button');
    excluir.className = 'botao-excluir';
    excluir.title = 'Excluir sem concluir';
    excluir.setAttribute('aria-label', 'Excluir tarefa');
    excluir.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    excluir.addEventListener('click', () => {
      if (confirm('Excluir esta tarefa sem marcar como feita?')) {
        for (const a of t.anexos || []) {
          apagarAnexo(a.id);
          urlAnexos.delete(a.id);
        }
        tarefas = tarefas.filter((x) => x.id !== t.id);
        salvar();
        renderizarTudo();
      }
    });

    li.append(ok, texto, clipe, excluir);
    return li;
  }

  // ---- Anexos: miniaturas e chips ----
  function preencherAnexos(destino, dono, removivel) {
    const anexos = dono.anexos || [];
    if (!anexos.length) return;
    const linha = document.createElement('div');
    linha.className = 'anexos';
    for (const a of anexos) {
      if ((a.tipo || '').startsWith('image/')) {
        const img = document.createElement('img');
        img.className = 'anexo-mini';
        img.alt = a.nome || 'imagem';
        urlDoAnexo(a.id).then((u) => { if (u) img.src = u; });
        img.addEventListener('click', () => abrirVisor(a, dono, removivel));
        linha.appendChild(img);
      } else {
        const chip = document.createElement('button');
        chip.className = 'anexo-chip';
        chip.type = 'button';
        chip.textContent = `📄 ${a.nome || 'documento'}`;
        chip.addEventListener('click', () => baixarAnexo(a));
        linha.appendChild(chip);
      }
    }
    destino.appendChild(linha);
  }

  async function baixarAnexo(a) {
    const u = await urlDoAnexo(a.id);
    if (!u) {
      alert('Anexo não encontrado neste aparelho.');
      return;
    }
    const link = document.createElement('a');
    link.href = u;
    link.download = a.nome || 'documento';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // ---- Visualizador de imagem (com setas, deslizar e contador) ----
  const visor = $('visor');
  const visorImg = $('visor-img');
  const visorRemover = $('visor-remover');
  const visorAnt = $('visor-ant');
  const visorProx = $('visor-prox');
  const visorContagem = $('visor-contagem');
  let visorAtual = null; // { imagens, indice, dono }

  function abrirVisor(anexo, dono, removivel) {
    const imagens = (dono.anexos || []).filter((a) => (a.tipo || '').startsWith('image/'));
    const indice = Math.max(0, imagens.findIndex((a) => a.id === anexo.id));
    visorAtual = { imagens, indice, dono };
    visorRemover.hidden = !removivel;
    visor.hidden = false;
    mostrarImagemVisor();
  }

  function mostrarImagemVisor() {
    const { imagens, indice } = visorAtual;
    const anexo = imagens[indice];
    if (!anexo) {
      visor.hidden = true;
      return;
    }
    visorImg.removeAttribute('src');
    urlDoAnexo(anexo.id).then((u) => { if (u) visorImg.src = u; });

    const varias = imagens.length > 1;
    visorAnt.hidden = !varias;
    visorProx.hidden = !varias;
    visorAnt.disabled = indice === 0;
    visorProx.disabled = indice === imagens.length - 1;
    visorContagem.textContent = varias ? `${indice + 1} / ${imagens.length}` : '';
  }

  function navegarVisor(passo) {
    if (!visorAtual) return;
    const novo = visorAtual.indice + passo;
    if (novo < 0 || novo >= visorAtual.imagens.length) return;
    visorAtual.indice = novo;
    mostrarImagemVisor();
  }

  visorAnt.addEventListener('click', () => navegarVisor(-1));
  visorProx.addEventListener('click', () => navegarVisor(1));

  // Deslizar com o dedo para trocar de imagem
  let toqueX = null;
  visor.addEventListener('touchstart', (e) => {
    toqueX = e.touches[0].clientX;
  }, { passive: true });
  visor.addEventListener('touchend', (e) => {
    if (toqueX === null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    toqueX = null;
    if (Math.abs(dx) > 50) navegarVisor(dx < 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (visor.hidden) return;
    if (e.key === 'ArrowLeft') navegarVisor(-1);
    if (e.key === 'ArrowRight') navegarVisor(1);
    if (e.key === 'Escape') visor.hidden = true;
  });

  $('visor-fechar').addEventListener('click', () => { visor.hidden = true; });
  visor.addEventListener('click', (e) => { if (e.target === visor) visor.hidden = true; });

  visorRemover.addEventListener('click', () => {
    if (!visorAtual || !confirm('Remover este anexo da tarefa?')) return;
    const { imagens, indice, dono } = visorAtual;
    const anexo = imagens[indice];
    dono.anexos = (dono.anexos || []).filter((x) => x.id !== anexo.id);
    apagarAnexo(anexo.id);
    urlAnexos.delete(anexo.id);
    salvar();
    imagens.splice(indice, 1);
    if (imagens.length === 0) {
      visor.hidden = true;
    } else {
      visorAtual.indice = Math.min(indice, imagens.length - 1);
      mostrarImagemVisor();
    }
    renderizarTudo();
  });

  // ---- Escolha de arquivos (imagem/documento) ----
  const arquivoImagem = $('arquivo-imagem');
  const arquivoDoc = $('arquivo-doc');
  let contextoAnexo = null; // { tarefaId, concluirDepois }

  function pedirArquivos(input, tarefaId, concluirDepois) {
    contextoAnexo = { tarefaId, concluirDepois };
    input.value = '';
    input.click();
  }

  async function tratarEscolha(input) {
    const ctx = contextoAnexo;
    contextoAnexo = null;
    if (!ctx || !input.files.length) return;
    const tarefa = tarefas.find((t) => t.id === ctx.tarefaId);
    if (!tarefa) return;

    for (const arquivo of input.files) {
      if (arquivo.size > 20 * 1024 * 1024) {
        alert(`"${arquivo.name}" é muito grande (limite de 20 MB).`);
        continue;
      }
      const blob = await comprimirImagem(arquivo);
      const tipo = blob.type || arquivo.type || 'application/octet-stream';
      const id = `anexo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await guardarAnexo({ id, nome: arquivo.name, tipo, blob });
      if (!tarefa.anexos) tarefa.anexos = [];
      tarefa.anexos.push({ id, nome: arquivo.name, tipo });
    }
    salvar();
    if (ctx.concluirDepois) concluir(tarefa.id);
    else renderizarTudo();
  }

  arquivoImagem.addEventListener('change', () => tratarEscolha(arquivoImagem));
  arquivoDoc.addEventListener('change', () => tratarEscolha(arquivoDoc));

  // ---- Menu "segurar para concluir com anexo" ----
  const menuConcluir = $('menu-concluir');
  const menuTitulo = $('menu-concluir-titulo');
  let tarefaDoMenu = null;

  function abrirMenuConcluir(t) {
    tarefaDoMenu = t;
    menuTitulo.textContent = t.texto;
    menuConcluir.hidden = false;
  }

  function fecharMenuConcluir() {
    menuConcluir.hidden = true;
  }

  $('mc-imagem').addEventListener('click', () => {
    fecharMenuConcluir();
    pedirArquivos(arquivoImagem, tarefaDoMenu.id, true);
  });
  $('mc-doc').addEventListener('click', () => {
    fecharMenuConcluir();
    pedirArquivos(arquivoDoc, tarefaDoMenu.id, true);
  });
  $('mc-so-concluir').addEventListener('click', () => {
    fecharMenuConcluir();
    concluir(tarefaDoMenu.id);
  });
  $('mc-cancelar').addEventListener('click', fecharMenuConcluir);
  menuConcluir.querySelector('.folha-fundo').addEventListener('click', fecharMenuConcluir);

  // ---- Busca: ignora acentos e maiúsculas/minúsculas ----
  function normalizar(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // Devolve o texto com as partes que batem com o termo destacadas em <mark>
  function textoComDestaque(texto, termo) {
    const span = document.createElement('span');
    if (!termo) {
      span.textContent = texto;
      return span;
    }
    const letras = [...texto];
    const norm = letras.map((c) => {
      const n = normalizar(c);
      return n.length === 1 ? n : c.toLowerCase();
    }).join('');

    let i = 0;
    let idx;
    while ((idx = norm.indexOf(termo, i)) !== -1) {
      span.appendChild(document.createTextNode(letras.slice(i, idx).join('')));
      const mark = document.createElement('mark');
      mark.textContent = letras.slice(idx, idx + termo.length).join('');
      span.appendChild(mark);
      i = idx + termo.length;
    }
    span.appendChild(document.createTextNode(letras.slice(i).join('')));
    return span;
  }

  // ---- Renderização: histórico agrupado por dia (com busca, filtro de dia e páginas) ----
  const buscaDia = $('busca-dia');
  const limparDia = $('limpar-dia');
  const paginacao = $('paginacao');
  const pagAnterior = $('pag-anterior');
  const pagProxima = $('pag-proxima');
  const pagInfo = $('pag-info');
  const DIAS_POR_PAGINA = 5;
  let paginaHistorico = 0;

  function renderizarHistorico() {
    conteudoHistorico.innerHTML = '';
    vazioHistorico.hidden = historico.length > 0;

    const termo = normalizar(buscaHistorico.value.trim());
    const diaFiltro = buscaDia.value; // já vem como AAAA-MM-DD
    limparDia.hidden = !diaFiltro;

    const ordenado = [...historico]
      .sort((a, b) => b.concluidaEm - a.concluidaEm)
      .filter((item) => !termo || normalizar(item.texto).includes(termo))
      .filter((item) => !diaFiltro || chaveDoDia(item.concluidaEm) === diaFiltro);

    const filtrando = termo || diaFiltro;
    if (filtrando && ordenado.length > 0) {
      resultadoBusca.hidden = false;
      const partes = [];
      if (termo) partes.push(`"${buscaHistorico.value.trim()}"`);
      if (diaFiltro) partes.push(`em ${fmtDia.format(dataDaChave(diaFiltro))}`);
      resultadoBusca.textContent =
        `${ordenado.length} resultado${ordenado.length > 1 ? 's' : ''} ${partes.join(' ')}`;
    } else {
      resultadoBusca.hidden = true;
    }
    buscaSemResultado.hidden = !(filtrando && ordenado.length === 0 && historico.length > 0);

    const grupos = new Map();
    for (const item of ordenado) {
      const chave = chaveDoDia(item.concluidaEm);
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(item);
    }

    // Páginas: cada página mostra até 5 dias
    const dias = [...grupos.keys()];
    const totalPaginas = Math.max(1, Math.ceil(dias.length / DIAS_POR_PAGINA));
    if (paginaHistorico > totalPaginas - 1) paginaHistorico = totalPaginas - 1;
    if (paginaHistorico < 0) paginaHistorico = 0;
    const diasDaPagina = dias.slice(
      paginaHistorico * DIAS_POR_PAGINA,
      (paginaHistorico + 1) * DIAS_POR_PAGINA
    );

    paginacao.hidden = totalPaginas <= 1;
    pagInfo.textContent = `Página ${paginaHistorico + 1} de ${totalPaginas}`;
    pagAnterior.disabled = paginaHistorico === 0;
    pagProxima.disabled = paginaHistorico >= totalPaginas - 1;

    for (const chaveDia of diasDaPagina) {
      const itens = grupos.get(chaveDia);
      const secao = document.createElement('section');
      secao.className = 'grupo-dia';

      const titulo = document.createElement('h2');
      titulo.textContent = rotuloDoDia(itens[0].concluidaEm);
      secao.appendChild(titulo);

      for (const item of itens) {
        const div = document.createElement('div');
        div.className = 'item-historico';

        const hora = document.createElement('span');
        hora.className = 'hora';
        hora.textContent = fmtHora.format(new Date(item.concluidaEm));

        const coluna = document.createElement('div');
        coluna.className = 'coluna';
        const texto = textoComDestaque(item.texto, termo);
        texto.className = 'texto';
        coluna.appendChild(texto);
        preencherAnexos(coluna, item, false);

        div.append(hora, coluna);
        secao.appendChild(div);
      }
      conteudoHistorico.appendChild(secao);
    }
  }

  // ---- Renderização: calendário ----
  let mesExibido = new Date();
  mesExibido.setDate(1);
  let diaSelecionado = hoje();

  function renderizarCalendario() {
    calTitulo.textContent = fmtMes.format(mesExibido);
    calGrade.innerHTML = '';

    // Quantas tarefas pendentes em cada dia (para o pontinho)
    const porDia = new Map();
    for (const t of tarefas) {
      porDia.set(t.paraDia, (porDia.get(t.paraDia) || 0) + 1);
    }

    const ano = mesExibido.getFullYear();
    const mes = mesExibido.getMonth();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) {
      calGrade.appendChild(document.createElement('span'));
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      const chave = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'cal-celula';
      botao.textContent = dia;
      if (chave === hoje()) botao.classList.add('hoje');
      if (chave === diaSelecionado) botao.classList.add('selecionado');
      if (porDia.has(chave)) botao.classList.add('com-tarefas');
      botao.addEventListener('click', () => {
        diaSelecionado = chave;
        renderizarCalendario();
      });
      calGrade.appendChild(botao);
    }

    renderizarDiaSelecionado();
  }

  function renderizarDiaSelecionado() {
    const data = dataDaChave(diaSelecionado);
    calDiaTitulo.textContent = rotuloDoDia(data);
    calLista.innerHTML = '';

    const doDia = tarefas
      .filter((t) => t.paraDia === diaSelecionado)
      .sort((a, b) => b.criadaEm - a.criadaEm);

    calVazio.hidden = doDia.length > 0;
    for (const t of doDia) {
      calLista.appendChild(criarItemTarefa(t));
    }
  }

  function renderizarTudo() {
    renderizarTarefas();
    renderizarHistorico();
    renderizarCalendario();
  }

  // ---- Ações ----
  function adicionar(texto, paraDia = hoje()) {
    const limpo = texto.trim();
    if (!limpo) return;
    tarefas.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      texto: limpo,
      criadaEm: Date.now(),
      paraDia,
    });
    salvar();
    renderizarTudo();
  }

  function concluir(id, li, botao) {
    const tarefa = tarefas.find((t) => t.id === id);
    if (!tarefa) return;

    const finalizar = () => {
      tarefas = tarefas.filter((t) => t.id !== id);
      historico.push({
        id: tarefa.id,
        texto: tarefa.texto,
        criadaEm: tarefa.criadaEm,
        concluidaEm: Date.now(),
        anexos: tarefa.anexos || [],
      });
      salvar();
      renderizarTudo();
    };

    if (li && botao) {
      botao.classList.add('marcado');
      li.classList.add('saindo');
      setTimeout(finalizar, 300);
    } else {
      finalizar();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    adicionar(entrada.value);
    entrada.value = '';
    entrada.focus();
  });

  formCal.addEventListener('submit', (e) => {
    e.preventDefault();
    adicionar(calEntrada.value, diaSelecionado);
    calEntrada.value = '';
    calEntrada.focus();
  });

  buscaHistorico.addEventListener('input', () => {
    paginaHistorico = 0;
    renderizarHistorico();
  });

  buscaDia.addEventListener('change', () => {
    paginaHistorico = 0;
    renderizarHistorico();
  });

  limparDia.addEventListener('click', () => {
    buscaDia.value = '';
    paginaHistorico = 0;
    renderizarHistorico();
  });

  const principal = document.querySelector('main');

  pagAnterior.addEventListener('click', () => {
    paginaHistorico--;
    renderizarHistorico();
    principal.scrollTo({ top: 0, behavior: 'smooth' });
  });

  pagProxima.addEventListener('click', () => {
    paginaHistorico++;
    renderizarHistorico();
    principal.scrollTo({ top: 0, behavior: 'smooth' });
  });

  $('cal-anterior').addEventListener('click', () => {
    mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() - 1, 1);
    renderizarCalendario();
  });

  $('cal-proximo').addEventListener('click', () => {
    mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 1);
    renderizarCalendario();
  });

  // ---- Abas ----
  function trocarAba(qual) {
    for (const [nome, { aba, painel }] of Object.entries(abas)) {
      const ativo = nome === qual;
      aba.classList.toggle('ativo', ativo);
      painel.classList.toggle('ativo', ativo);
      aba.setAttribute('aria-selected', String(ativo));
    }
    if (qual === 'historico') renderizarHistorico();
    if (qual === 'calendario') renderizarCalendario();
  }

  for (const nome of Object.keys(abas)) {
    abas[nome].aba.addEventListener('click', () => trocarAba(nome));
  }

  // Ao voltar para o app (ex.: virou o dia), atualiza as listas
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderizarTudo();
  });

  // ---- Botão de fechar o teclado ----
  const botaoTeclado = $('fechar-teclado');

  // Mantém o botão logo acima do teclado (o teclado encolhe a "janela visível")
  function posicionarBotaoTeclado() {
    const vv = window.visualViewport;
    const alturaTeclado = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
    botaoTeclado.style.bottom = `${alturaTeclado + 16}px`;
  }

  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input')) {
      botaoTeclado.hidden = false;
      posicionarBotaoTeclado();
    }
  });

  document.addEventListener('focusout', () => {
    // pequeno atraso: se o foco só pulou de um campo para outro, o botão fica
    setTimeout(() => {
      const ativo = document.activeElement;
      if (!ativo || ativo.tagName !== 'INPUT') botaoTeclado.hidden = true;
    }, 120);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', posicionarBotaoTeclado);
    window.visualViewport.addEventListener('scroll', posicionarBotaoTeclado);
  }

  // pointerdown + preventDefault: fecha sem "roubar" o toque para outro elemento
  botaoTeclado.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    botaoTeclado.hidden = true;
  });

  // ---- Reconhecimento de voz ----
  const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (Reconhecimento) {
    const rec = new Reconhecimento();
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    rec.continuous = false;

    let gravando = false;
    let textoFinal = '';

    botaoVoz.addEventListener('click', () => {
      if (gravando) {
        rec.stop();
        return;
      }
      textoFinal = '';
      try {
        rec.start();
      } catch {
        /* já iniciado — ignora */
      }
    });

    rec.onstart = () => {
      gravando = true;
      botaoVoz.classList.add('gravando');
      statusVoz.hidden = false;
      statusVoz.textContent = '🎙️ Ouvindo... fale sua tarefa (toque de novo para parar)';
    };

    rec.onresult = (e) => {
      let parcial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) textoFinal += r[0].transcript;
        else parcial += r[0].transcript;
      }
      entrada.value = (textoFinal + parcial).trim();
    };

    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        statusVoz.textContent = 'Permissão do microfone negada. Libere nos ajustes do navegador.';
      } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
        statusVoz.textContent = `Erro no reconhecimento de voz (${e.error}). Tente de novo.`;
      }
    };

    rec.onend = () => {
      gravando = false;
      botaoVoz.classList.remove('gravando');
      const texto = entrada.value.trim();
      if (texto) {
        adicionar(texto);
        entrada.value = '';
        statusVoz.textContent = '✅ Tarefa anotada por voz!';
        setTimeout(() => { statusVoz.hidden = true; }, 2500);
      } else if (!statusVoz.textContent.startsWith('Permissão') && !statusVoz.textContent.startsWith('Erro')) {
        statusVoz.hidden = true;
      }
    };
  } else {
    // Navegador sem suporte (ex.: alguns PWAs instalados no iOS antigo)
    botaoVoz.addEventListener('click', () => {
      statusVoz.hidden = false;
      statusVoz.textContent =
        'Reconhecimento de voz indisponível aqui. Dica: use o microfone do teclado do iPad para ditar no campo de texto.';
      setTimeout(() => { statusVoz.hidden = true; }, 6000);
    });
  }

  // ---- Service worker (offline / instalável) + aviso de atualização ----
  if ('serviceWorker' in navigator) {
    const avisoAtualizacao = $('aviso-atualizacao');
    // Se já havia um controlador, uma troca de controlador significa versão nova
    const tinhaControlador = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register('sw.js').then((reg) => {
      // Confere se existe versão nova sempre que o app volta a ficar visível
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) reg.update().catch(() => {});
      });
    }).catch(() => {});

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (tinhaControlador) avisoAtualizacao.hidden = false;
    });

    avisoAtualizacao.addEventListener('click', () => location.reload());
  }

  // ---- Inicialização ----
  renderizarTudo();
})();
