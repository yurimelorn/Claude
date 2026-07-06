# ⏱️ Cronômetro Cego

Jogo de adivinhar o tempo: o app sorteia um tempo alvo entre **0,50 e 20,00 segundos**
(com casas decimais, ex.: `1,57` ou `2,61`). Você precisa **iniciar e parar o
cronômetro sem ver a contagem** — só no instinto. Quem chegar mais perto do
tempo alvo vence a rodada!

Funciona no **navegador do computador e do celular**, e pode ser **instalado
como app no celular** (PWA) — depois de instalado, funciona até offline.

## Como jogar

1. Adicione um ou mais jogadores (dá para jogar sozinho para treinar).
2. Escolha o número de rodadas (1, 3, 5 ou 10).
3. A cada rodada, o app sorteia um tempo alvo — todos os jogadores tentam o mesmo alvo.
4. Na sua vez, memorize o alvo, toque em **Iniciar** e depois em **Parar**
   quando achar que o tempo passou. O cronômetro fica escondido!
5. Quem tiver a menor diferença vence a rodada. No fim, vence quem ganhou
   mais rodadas (empate é decidido pela menor soma de diferenças).

## Como rodar

É um site estático — não precisa de build nem dependências:

```bash
# Qualquer servidor estático funciona, por exemplo:
npx http-server .
# ou
python3 -m http.server 8000
```

Depois abra `http://localhost:8000` no navegador.

Também dá para hospedar de graça no **GitHub Pages**: em
*Settings → Pages*, aponte para o branch principal e pronto — o link
funciona em qualquer celular.

## Como instalar no celular

1. Abra o link do jogo no navegador do celular (Chrome, Safari etc.).
2. **Android/Chrome**: toque no menu ⋮ → *Adicionar à tela inicial* (ou aceite o aviso de instalação).
3. **iPhone/Safari**: toque em Compartilhar → *Adicionar à Tela de Início*.

O ícone aparece na tela inicial e o jogo abre em tela cheia, como um app nativo.

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | Telas do jogo |
| `style.css` | Visual (tema escuro, mobile-first) |
| `game.js` | Lógica do jogo e cronômetro (`performance.now()` para precisão) |
| `manifest.json` | Manifesto PWA (instalação no celular) |
| `sw.js` | Service worker (funcionamento offline) |
| `icon.svg`, `icon-*.png` | Ícones do app |
