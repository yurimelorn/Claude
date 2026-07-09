# 📝 Minhas Tarefas — Organizador pessoal

App de organização de tarefas para uso pessoal, feito como **PWA (Progressive Web App)**.
Ele **não precisa de App Store**: você instala direto pelo Safari do iPad.

## O que ele faz

- ✅ **Adicionar serviços/tarefas** a fazer, digitando ou **ditando por voz** (🎙️ em português)
- ✅ Ao tocar no círculo de "ok", a tarefa **some da lista** com uma animação
- ✅ O que **não for concluído no dia passa automaticamente para o dia seguinte**, com a etiqueta "veio de DD/MM"
- ✅ Aba de **Calendário** para agendar tarefas em qualquer dia — elas aparecem na lista principal quando o dia chega (dias com tarefas ganham um pontinho verde)
- ✅ Aba de **Histórico** com tudo que você já fez, **agrupado por dia** (Hoje, Ontem, datas) e com o **horário** exato de conclusão
- ✅ **Busca no histórico**: pesquise qualquer palavra (ex.: "DUDA") e veja tudo relacionado, ainda agrupado por dia — a busca ignora acentos e maiúsculas
- ✅ Campos de texto **sem correção automática** do teclado (o que você escreve fica como escreveu)
- ✅ Visual **preto e laranja**
- ✅ Funciona **offline** depois da primeira visita (service worker)
- ✅ Os dados ficam salvos **no próprio aparelho** (localStorage) — nada vai para servidor nenhum

## 📲 Como instalar no iPad (sem App Store)

O app precisa estar acessível por **HTTPS**. O jeito mais fácil e gratuito é o **GitHub Pages**:

1. No GitHub, abra este repositório → **Settings** → **Pages**
2. Em "Source", escolha **Deploy from a branch**, selecione a branch principal e a pasta `/ (root)`, e salve
3. Aguarde 1–2 minutos. Seu app ficará em:
   `https://SEU-USUARIO.github.io/NOME-DO-REPO/organizador-tarefas/`
4. **No iPad**, abra esse endereço no **Safari**
5. Toque no botão **Compartilhar** (quadrado com seta para cima)
6. Toque em **"Adicionar à Tela de Início"** → **Adicionar**

Pronto! O ícone aparece na tela de início e o app abre em tela cheia, como um app nativo.
Como o repositório é seu, ninguém mais precisa saber o endereço — é praticamente privado.

> Alternativa sem internet: rode um servidor local na sua rede
> (`python3 -m http.server 8000` na pasta do projeto) e acesse pelo iPad em
> `http://IP-DO-COMPUTADOR:8000/organizador-tarefas/`. Nesse caso o recurso de voz
> e a instalação podem ficar limitados, porque o Safari exige HTTPS para
> microfone — por isso o GitHub Pages é o recomendado.

## 🎙️ Sobre o reconhecimento de voz

- Toque no botão do **microfone**, fale a tarefa e toque de novo (ou faça uma pausa) — ela é anotada automaticamente
- Usa a Web Speech API do navegador em **pt-BR**; na primeira vez o Safari pede permissão do microfone
- Em algumas versões do iPadOS, o reconhecimento de voz não funciona quando o app está instalado na tela de início (limitação da Apple). Se acontecer, o app avisa e você pode usar o **microfone do teclado do iPad** para ditar no campo de texto — funciona igualmente bem

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura das três abas (Tarefas, Calendário e Histórico) |
| `style.css` | Visual mobile-first, tema escuro |
| `app.js` | Lógica: tarefas, calendário, histórico por dia/hora, voz, persistência |
| `sw.js` | Service worker (offline) |
| `manifest.webmanifest` | Metadados de instalação do PWA |
| `icon-*.png` | Ícones do app |
