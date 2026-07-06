# ⏱️ Cronômetro às Cegas

Um jogo para navegador **e** celular: o app sorteia um tempo-alvo entre 0,5 e 20 segundos
(com casas decimais, ex.: `1,57s` ou `2,61s`) e você precisa iniciar e parar o cronômetro
no momento exato — **sem ver os segundos passando**. Quem chegar mais perto do alvo, vence!

## 🎮 Como jogar

1. Escolha o número de jogadores (1 a 8) e, se quiser, digite os nomes.
2. O jogo sorteia o **tempo-alvo** (ex.: `7,43s`).
3. Cada jogador, na sua vez, toca em **INICIAR** e depois em **PARAR** quando achar
   que o tempo passou. O cronômetro fica escondido o tempo todo! 🙈
4. No fim da rodada, aparece o resultado: quem parou mais perto do alvo ganha 1 ponto.
5. Jogue quantas rodadas quiser e encerre para ver o campeão. 🏆

**Modo solo:** jogando sozinho, o app avalia sua precisão e guarda seu recorde pessoal.

No computador, a tecla **Espaço** também inicia/para o cronômetro.

## 🚀 Como rodar

É um app 100% estático — não precisa de build nem dependências:

```bash
# qualquer servidor estático serve, por exemplo:
python3 -m http.server 8080
# depois abra http://localhost:8080
```

Ou publique os arquivos em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel…).

## 📱 Instalando no celular (PWA)

O jogo é um **Progressive Web App**: abra a URL no navegador do celular e use
**"Adicionar à tela inicial"** (Android/Chrome) ou **Compartilhar → "Adicionar à Tela
de Início"** (iPhone/Safari). Ele vira um app com ícone próprio e funciona **offline**.

> Para o service worker (modo offline) funcionar, a página precisa ser servida via
> `https://` ou `localhost`.

## 🗂️ Estrutura

| Arquivo | Descrição |
|---|---|
| `index.html` | Telas do jogo (início, jogo, resultado, placar) |
| `style.css` | Visual (tema escuro, responsivo, animações) |
| `app.js` | Lógica do jogo: sorteio do alvo, cronômetro, pontuação, recorde |
| `manifest.webmanifest` | Metadados do PWA (nome, ícones, cores) |
| `sw.js` | Service worker — cache para funcionar offline |
| `icons/` | Ícones do app |
