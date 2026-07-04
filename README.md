# ⏱️ Cronômetro Cego

Jogo de precisão temporal: o app sorteia um **tempo alvo entre 0 e 20 segundos**
(com casas decimais, ex.: `1,57 s` ou `2,61 s`). O jogador precisa **iniciar e
parar o cronômetro sem ver o relógio** — vale só o instinto! Quem parar mais
perto do tempo alvo, vence.

Funciona no **navegador (desktop)** e no **celular** como aplicativo instalável
(PWA), inclusive **offline**.

## Como jogar

1. Adicione os jogadores (de 1 a 8) e toque em **Começar jogo**.
2. O app mostra o tempo alvo sorteado (ex.: `7,43 s`).
3. Na sua vez, toque no botão verde para **iniciar** — o relógio fica escondido!
4. Quando achar que o tempo alvo passou, toque de novo para **parar**.
5. Os resultados ficam em segredo até todos jogarem. No fim, o app mostra o
   ranking pela menor diferença — quem chegou mais perto ganha 🏅.

Jogando **sozinho**, o app guarda seu recorde pessoal (menor diferença já
alcançada) no próprio aparelho.

## Como rodar no navegador

É um app estático, sem dependências. Basta servir a pasta:

```bash
# com Python
python3 -m http.server 8000

# ou com Node
npx serve .
```

E abrir <http://localhost:8000>.

> Abrir o `index.html` direto (duplo clique) também funciona para jogar —
> apenas os recursos de instalação/offline exigem um servidor HTTP(S).

## Como instalar no celular

1. Hospede a pasta em qualquer serviço com HTTPS (GitHub Pages, Netlify,
   Vercel, Cloudflare Pages...).
2. Abra o endereço no celular:
   - **Android (Chrome):** menu ⋮ → **Adicionar à tela inicial** / **Instalar app**.
   - **iPhone (Safari):** botão de compartilhar → **Adicionar à Tela de Início**.
3. Pronto — o jogo abre em tela cheia como um app nativo e funciona offline.

### Publicar no GitHub Pages (mais fácil)

No repositório: **Settings → Pages → Source: Deploy from a branch**, escolha a
branch e a pasta raiz (`/`). O jogo ficará disponível em
`https://<seu-usuario>.github.io/<repositorio>/`.

## Estrutura do projeto

| Arquivo | Função |
| --- | --- |
| `index.html` | Estrutura das telas (configuração, jogo, resultados) |
| `style.css` | Visual (tema escuro, botão gigante do cronômetro) |
| `app.js` | Lógica do jogo (sorteio, cronômetro, ranking, recorde) |
| `manifest.webmanifest` | Metadados para instalar como app no celular |
| `sw.js` | Service worker — cache para funcionar offline |
| `icon.svg`, `icon-maskable.svg` | Ícones do app |
