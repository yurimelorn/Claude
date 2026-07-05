# 🌱 Agroflores Garden — Estoque & Vendas

Modelo de aplicativo web para a **Agroflores Garden**: controle de estoque,
ponto de venda (PDV) e fluxo de **autorização do administrador** para
alteração de preços. Front-end estático, sem dependências — os dados ficam
salvos no próprio navegador (`localStorage`).

## Perfis

| Perfil | O que pode fazer |
| --- | --- |
| 🛒 **Vendedor** | Registrar vendas (carrinho com cálculo do total), adicionar itens ao estoque e **solicitar** alteração de preço |
| 🔑 **Administrador** | Aprovar/recusar solicitações de preço, alterar preços diretamente, remover produtos e ver o histórico de vendas |

> PIN do administrador no modelo: **`1234`** (constante `ADMIN_PIN` em `app.js`).

## Fluxo de alteração de preço

1. O vendedor **seleciona o produto** (no carrinho ou na tela de estoque) e
   toca em *Alterar preço / Solicitar novo preço*.
2. Informa o novo valor e o motivo. Duas saídas:
   - **Administrador presente no balcão** → digita o PIN e a alteração é
     autorizada na hora;
   - **Sem administrador** → a solicitação fica **pendente** na aba
     🔔 Solicitações, até o administrador aprovar ou recusar na aba
     🔑 Autorizações.
3. O preço do produto só muda depois da autorização.

## Funcionalidades

- **Estoque**: cadastro de produtos (nome, categoria, preço, quantidade);
  produtos repetidos somam quantidade; alerta ⚠️ de estoque baixo (≤ 5 un.).
- **PDV**: busca de produtos, carrinho com +/− de quantidade, total em tempo
  real (R$) e baixa automática do estoque ao finalizar a venda.
- **Vendas**: histórico com itens, vendedor, data e total (visão do admin).
- Vem com produtos de exemplo (flores, mudas, vasos, insumos e ferramentas).

## Como rodar

É um app estático — basta servir a pasta:

```bash
cd agroflores
python3 -m http.server 8000
# abra http://localhost:8000
```

Ou simplesmente abra o `index.html` no navegador.
