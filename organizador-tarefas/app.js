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
    ok.title = 'Marcar como feita';
    ok.setAttribute('aria-label', 'Marcar como feita');
    ok.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
    ok.addEventListener('click', () => concluir(t.id, li, ok));

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

    const excluir = document.createElement('button');
    excluir.className = 'botao-excluir';
    excluir.title = 'Excluir sem concluir';
    excluir.setAttribute('aria-label', 'Excluir tarefa');
    excluir.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
    excluir.addEventListener('click', () => {
      if (confirm('Excluir esta tarefa sem marcar como feita?')) {
        tarefas = tarefas.filter((x) => x.id !== t.id);
        salvar();
        renderizarTudo();
      }
    });

    li.append(ok, texto, excluir);
    return li;
  }

  // ---- Renderização: histórico agrupado por dia ----
  function renderizarHistorico() {
    conteudoHistorico.innerHTML = '';
    vazioHistorico.hidden = historico.length > 0;

    const ordenado = [...historico].sort((a, b) => b.concluidaEm - a.concluidaEm);

    const grupos = new Map();
    for (const item of ordenado) {
      const chave = chaveDoDia(item.concluidaEm);
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(item);
    }

    for (const [, itens] of grupos) {
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

        const texto = document.createElement('span');
        texto.className = 'texto';
        texto.textContent = item.texto;

        div.append(hora, texto);
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

    botao.classList.add('marcado');
    li.classList.add('saindo');

    setTimeout(() => {
      tarefas = tarefas.filter((t) => t.id !== id);
      historico.push({ id: tarefa.id, texto: tarefa.texto, criadaEm: tarefa.criadaEm, concluidaEm: Date.now() });
      salvar();
      renderizarTudo();
    }, 300);
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

  // ---- Service worker (offline / instalável) ----
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // ---- Inicialização ----
  renderizarTudo();
})();
