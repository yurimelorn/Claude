# ⏱️ Cronômetro Cego

Jogo de precisão para navegador e celular: o app sorteia um tempo alvo entre **0 e 20 segundos** (com decimais, ex.: `1,57s` ou `2,61s`) e cada jogador precisa **iniciar e parar o cronômetro sem vê-lo**, tentando cravar o tempo exato. **Quem parar mais perto do alvo vence a rodada!**

## 🎮 Como jogar

1. Adicione os jogadores (de 1 a 8) e toque em **Começar jogo**
2. O app mostra o tempo alvo da rodada — memorize!
3. Na sua vez, toque no botão grande para **iniciar** o cronômetro (ele fica invisível)
4. Conte mentalmente e toque de novo para **parar**
5. Veja sua diferença para o alvo e passe para o próximo jogador
6. No fim da rodada: ranking, vencedor e placar geral de vitórias
7. Jogue quantas rodadas quiser!

Jogando sozinho? Também funciona — tente bater seu próprio recorde de precisão.

## 🚀 Como rodar

### No navegador (computador)
Basta abrir o arquivo `index.html` no navegador — não precisa de servidor nem instalação.

Ou sirva localmente para ter todos os recursos de PWA:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

### No celular (como app) 📲
O jogo é um **PWA (Progressive Web App)**. Hospede os arquivos em qualquer serviço (GitHub Pages, Netlify, Vercel…) e acesse pelo navegador do celular:

- **Android (Chrome):** menu ⋮ → *Adicionar à tela inicial* / *Instalar app*
- **iPhone (Safari):** botão de compartilhar → *Adicionar à Tela de Início*

Depois de instalado, o app abre em tela cheia, tem ícone próprio e **funciona offline**.

#### Publicar no GitHub Pages
No repositório: **Settings → Pages → Deploy from a branch**, escolha o branch e a pasta raiz (`/`). O jogo ficará disponível em `https://<seu-usuario>.github.io/<repo>/`.

## 🛠️ Tecnologia

- HTML, CSS e JavaScript puros — **zero dependências**
- `performance.now()` para medição precisa do tempo
- Service Worker + Web App Manifest (funciona offline e é instalável)
- Vibração tátil no celular ao iniciar/parar o cronômetro
- Layout mobile-first, responsivo também para desktop

## 📁 Estrutura

```
index.html      → o jogo inteiro (telas, estilos e lógica)
manifest.json   → manifesto do PWA (nome, ícones, cores)
sw.js           → service worker (cache offline)
icons/          → ícones do app (SVG + PNG 192/512)
```
