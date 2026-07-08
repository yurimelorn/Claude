/* ===== Organizador de Tarefas — lógica ===== */
(() => {
  'use strict';

  const CHAVE_TAREFAS = 'organizador.tarefas';
  const CHAVE_HISTORICO = 'organizador.historico';

  /** @type {{id:string, texto:string, criadaEm:number}[]} */
  let tarefas = carregar(CHAVE_TAREFAS);
  /** @type {{id:string, texto:string, criadaEm:number, concluidaEm:number}[]} */
  let historico = carregar(CHAVE_HISTORICO);

  // ---- Elementos ----
  const $ = (id) => document.getElementById(id);
  const listaTarefas = $('lista-tarefas');
  const vazioTarefas = $('vazio-tarefas');
  const conteudoHistorico = $('conteudo-historico');
  const vazioHistorico = $('vazio-historico');
  const botaoLimpar = $('botao-limpar');
  const entrada = $('entrada-tarefa');
  const form = $('form-nova');
  const botaoVoz = $('botao-voz');
  const statusVoz = $('status-voz');
  const contador = $('contador');
  const painelTarefas = $('painel-tarefas');
  const painelHistorico = $('painel-historico');
  const abaTarefas = $('aba-tarefas');
  const abaHistorico = $('aba-historico');

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

  // ---- Formatação de data/hora ----
  const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fmtDia = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  function chaveDoDia(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function rotuloDoDia(ts) {
    const hoje = chaveDoDia(Date.now());
    const ontem = chaveDoDia(Date.now() - 86400000);
    const chave = chaveDoDia(ts);
    if (chave === hoje) return 'Hoje';
    if (chave === ontem) return 'Ontem';
    return fmtDia.format(new Date(ts));
  }

  // ---- Renderização: tarefas pendentes ----
  function renderizarTarefas() {
    listaTarefas.innerHTML = '';
    vazioTarefas.hidden = tarefas.length > 0;
    contador.textContent = tarefas.length === 0
      ? 'tudo em dia'
      : `${tarefas.length} pendente${tarefas.length > 1 ? 's' : ''}`;

    for (const t of tarefas) {
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
      const hora = document.createElement('span');
      hora.className = 'hora-criacao';
      hora.textContent = `adicionada ${rotuloDoDia(t.criadaEm).toLowerCase()} às ${fmtHora.format(new Date(t.criadaEm))}`;
      texto.appendChild(hora);

      const excluir = document.createElement('button');
      excluir.className = 'botao-excluir';
      excluir.title = 'Excluir sem concluir';
      excluir.setAttribute('aria-label', 'Excluir tarefa');
      excluir.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
      excluir.addEventListener('click', () => {
        if (confirm('Excluir esta tarefa sem marcar como feita?')) {
          tarefas = tarefas.filter((x) => x.id !== t.id);
          salvar();
          renderizarTarefas();
        }
      });

      li.append(ok, texto, excluir);
      listaTarefas.appendChild(li);
    }
  }

  // ---- Renderização: histórico agrupado por dia ----
  function renderizarHistorico() {
    conteudoHistorico.innerHTML = '';
    vazioHistorico.hidden = historico.length > 0;
    botaoLimpar.hidden = historico.length === 0;

    // mais recentes primeiro
    const ordenado = [...historico].sort((a, b) => b.concluidaEm - a.concluidaEm);

    /** @type {Map<string, typeof ordenado>} */
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

  // ---- Ações ----
  function adicionar(texto) {
    const limpo = texto.trim();
    if (!limpo) return;
    tarefas.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      texto: limpo,
      criadaEm: Date.now(),
    });
    salvar();
    renderizarTarefas();
  }

  function concluir(id, li, botao) {
    const tarefa = tarefas.find((t) => t.id === id);
    if (!tarefa) return;

    botao.classList.add('marcado');
    li.classList.add('saindo');

    setTimeout(() => {
      tarefas = tarefas.filter((t) => t.id !== id);
      historico.push({ ...tarefa, concluidaEm: Date.now() });
      salvar();
      renderizarTarefas();
      renderizarHistorico();
    }, 300);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    adicionar(entrada.value);
    entrada.value = '';
    entrada.focus();
  });

  botaoLimpar.addEventListener('click', () => {
    if (confirm('Apagar TODO o histórico? Isso não pode ser desfeito.')) {
      historico = [];
      salvar();
      renderizarHistorico();
    }
  });

  // ---- Abas ----
  function trocarAba(qual) {
    const historicoAtivo = qual === 'historico';
    painelTarefas.classList.toggle('ativo', !historicoAtivo);
    painelHistorico.classList.toggle('ativo', historicoAtivo);
    abaTarefas.classList.toggle('ativo', !historicoAtivo);
    abaHistorico.classList.toggle('ativo', historicoAtivo);
    abaTarefas.setAttribute('aria-selected', String(!historicoAtivo));
    abaHistorico.setAttribute('aria-selected', String(historicoAtivo));
    if (historicoAtivo) renderizarHistorico();
  }

  abaTarefas.addEventListener('click', () => trocarAba('tarefas'));
  abaHistorico.addEventListener('click', () => trocarAba('historico'));

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
  renderizarTarefas();
  renderizarHistorico();
})();
