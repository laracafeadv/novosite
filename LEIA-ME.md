# Site — Lara Café Advocacia & Consultoria

Site estático. Sem banco de dados, sem servidor, sem WordPress.
Roda em qualquer hospedagem e não quebra sozinho com o tempo.

---

## Os três comandos

```bash
node build.mjs          # gera o site na pasta site/
node novo-artigo.mjs    # cria um artigo novo do blog
npm run ver             # gera e abre em http://localhost:4000
```

Precisa apenas do Node.js instalado (versão 18 ou mais nova).

---

## Publicar

A pasta que vai para o ar é **`site/`** — mas você não precisa gerá-la à mão:
a Vercel roda `node build.mjs` a cada envio e publica sozinha.

### Primeira publicação

1. **GitHub** — suba esta pasta para o repositório.
2. **Vercel** → *Add New → Project* → importe o repositório.
   As configurações já vêm no `vercel.json`; se pedir manualmente:
   - Build Command: `node build.mjs`
   - Output Directory: `site`
3. **Domínio** — em *Settings → Domains*, adicione `laracafeadvocacia.com.br`
   e aponte o DNS conforme a Vercel indicar.
4. **Login do painel** — veja a seção abaixo.

Depois disso, todo envio ao GitHub republica o site automaticamente.

### Ligar o login do painel (uma vez só)

O `/admin` entra com a conta do **GitHub**. São dois passos:

**a) Criar o aplicativo no GitHub**

GitHub → *Settings → Developer settings → OAuth Apps → New OAuth App*:

| Campo | Valor |
|---|---|
| Application name | Painel Lara Café |
| Homepage URL | `https://laracafeadvocacia.com.br` |
| Authorization callback URL | `https://laracafeadvocacia.com.br/api/callback` |

Guarde o **Client ID** e gere um **Client Secret**.

**b) Guardar as chaves na Vercel**

Vercel → *Settings → Environment Variables*:

- `GITHUB_CLIENT_ID` — o Client ID
- `GITHUB_CLIENT_SECRET` — o Client Secret

Republique o site depois de salvar.

**c) Dar acesso à Lara**

No GitHub, em *Settings → Collaborators* do repositório, convide a conta
dela. Sem isso ela entra no painel mas não consegue salvar.

Pronto: ela acessa `laracafeadvocacia.com.br/admin`, clica em entrar,
autoriza pelo GitHub e já pode publicar.

### Hospedagem comum (FTP)

Rode `node build.mjs` e envie **o conteúdo de dentro de `site/`** para a
pasta pública do servidor. Nesse caso o painel `/admin` não funciona —
ele depende das funções em `api/`.

---

## Painel de publicação (a Lara publica sozinha)

Endereço: **`laracafeadvocacia.com.br/admin`** — entra com a **conta do
GitHub** dela. Funciona no celular.

Ao salvar, o painel grava o arquivo `.md` no repositório e a Vercel
republica o site sozinha. Em 1 ou 2 minutos o artigo está no ar.

Para ligar isso pela primeira vez, veja "Ligar o login do painel" acima.

### O que ela vê

Uma lista dos artigos e um botão **Novo**. Os campos:

| Campo | O que é |
|---|---|
| Título | Vira o título da página e do cartão |
| Categoria | Família, Sucessões ou Matrimonial |
| Resumo | Uma ou duas linhas, aparece no cartão |
| Data | Os mais recentes aparecem primeiro |
| Tempo de leitura | Ex.: "4 min de leitura" |
| Imagem de capa | Opcional — sem ela, entra a capa padrão |
| **Publicado** | Desligado = cartão "Em breve", sem link |
| Texto | Editor com negrito, itálico, subtítulo, citação e listas |

O **primeiro parágrafo** vira a abertura em itálico sob o título.

### Detalhes

- O painel fica fora do Google (`Disallow: /admin/` no `robots.txt`).
- O Decap CMS está **auto-hospedado** em `src/admin/vendor/` (5 MB). Ele só
  carrega no `/admin` — as páginas públicas continuam sem nada externo.
- As chaves do login ficam nas variáveis de ambiente da Vercel, nunca no
  repositório. O arquivo `.env.example` mostra quais são.
- O painel grava exatamente os mesmos arquivos de `conteudo/artigos/`.
  Publicar pelo painel ou editar o arquivo à mão dá no mesmo.

---

## Escrever um artigo novo (pelo Terminal)

```bash
node novo-artigo.mjs
```

Ele pergunta título, categoria e resumo, e cria o arquivo já formatado em
`conteudo/artigos/`. Depois:

1. Abra o arquivo criado e escreva o texto.
2. Troque `publicado: nao` por `publicado: sim` no topo.
3. Rode `node build.mjs`.

O artigo passa a existir em três lugares de uma vez: a página própria, o
cartão no blog e o sitemap do Google.

### Como escrever

O texto usa Markdown — só cinco coisas para lembrar:

| Para fazer isso | Escreva assim |
|---|---|
| Subtítulo | `## Meu subtítulo` |
| Parágrafo | Texto solto, com uma linha em branco entre parágrafos |
| Lista | `- Primeiro item` |
| Citação em destaque | `> A frase de destaque` |
| Negrito / itálico | `**negrito**` / `*itálico*` |

O **primeiro parágrafo** do arquivo vira a abertura em itálico, logo abaixo
do título. Escreva-o pensando nisso.

### Artigos "Em breve"

Enquanto `publicado: nao`, o artigo aparece no blog como um cartão
"Em breve", sem link. Serve para mostrar o plano de conteúdo sem publicar
texto pela metade. Hoje há **1 artigo publicado e 5 em breve**.

---

## Mudar telefone, e-mail, textos de contato

Tudo está em **`dados.json`**. Edite e rode `node build.mjs`.

O build avisa no terminal o que ainda falta preencher.

### O que ainda falta

- [ ] **Instagram** — confirme se `@laracafe.adv` está certo.
      Para não exibir, deixe `instagramUsuario` e `instagramUrl` vazios.

Já preenchidos: domínio (`laracafeadvocacia.com.br`), WhatsApp
(71 99381-2266), e-mail (laracafe.adv@gmail.com) e o repositório do painel.

**OAB:** removida do site, conforme combinado. Se um dia precisar exibir,
preencha `contato.oab` em `dados.json` — ela volta ao rodapé sozinha.

---

## Áreas de atuação

O índice da home (os 8 itens agrupados em "Família & União" e "Sucessões")
fica em **`conteudo/atuacao.mjs`**. Cada item vira uma linha clicável que
abre o WhatsApp com a mensagem já escrita. A numeração é automática.

Para acrescentar, remover ou renomear uma área, edite esse arquivo e rode
`node build.mjs`.

---

## Imagens

Coloque o arquivo em `src/assets/` e escreva o nome em `dados.json`
(seção `imagens`) ou no cabeçalho do artigo (linha `imagem:`).

| Onde | Onde se troca | Formato ideal |
|---|---|---|
| Foto do topo (hero) | `imagens.hero` | vertical, 3:4 (ex.: 1200×1600) |
| Retrato da seção "Sobre" | `imagens.retrato` | vertical, 4:5 (ex.: 1000×1250) |
| Capa de cada artigo | linha `imagem:` do `.md` | vertical ou 4:5 (ex.: 1100×1400) |

Artigo sem imagem usa `capa-padrao.jpg` automaticamente — nunca fica um
buraco na página.

**Antes de subir qualquer foto**, reduza o tamanho. Uma imagem de 2 MB deixa
o site lento no celular. No Mac, pelo Terminal:

```bash
sips -s format jpeg -s formatOptions 82 -Z 1100 foto-original.png --out src/assets/foto.jpg
```

---

## O formulário de contato

Sem back-end: ao enviar, ele monta a mensagem com nome, contato e texto e
**abre o WhatsApp da Lara já preenchido**. A pessoa só toca em enviar.

Há um campo-armadilha invisível que descarta envios de robôs.

Se um dia quiser que as mensagens também cheguem por e-mail, dá para ligar
um serviço gratuito (Formspree, Web3Forms) sem mudar o layout.

> O código sabe distinguir os dois casos pelo campo `site.hospedagem` em
> `dados.json`. Em `vercel` ele vai direto ao WhatsApp; em `netlify` tenta
> primeiro o formulário nativo. Isso evita o site dizer "enviado" quando
> nada foi enviado.

---

## Páginas

- `index.html` — home
- `blog.html` — lista de artigos com filtro por categoria
- `artigos/<slug>.html` — uma por artigo publicado
- `politica-de-privacidade.html` — aviso de LGPD (linkado no rodapé)
- `admin/` — painel de publicação, com login por e-mail e senha

---

## Estrutura da pasta

```
dados.json              telefone, e-mail, textos — edite aqui
conteudo/artigos/       um arquivo .md por artigo do blog
conteudo/atuacao.mjs    as áreas de atuação do índice da home
src/                    modelos HTML, CSS, JavaScript e imagens
  ├─ index.html            modelo da home
  ├─ blog.html             modelo do blog
  ├─ politica-de-privacidade.html
  ├─ admin/                painel de publicação (/admin)
  ├─ parciais/             cabeçalho, rodapé, modelo de artigo
  ├─ css/                  estilos + fontes auto-hospedadas
  └─ assets/               imagens já otimizadas para a web
lib/markdown.mjs        conversor de Markdown (sem dependências)
api/                    funções do login do painel (Vercel)
build.mjs               gera o site
novo-artigo.mjs         cria artigo novo
site/                   ← O SITE PRONTO. É esta pasta que vai ao ar.
originais/              arquivos antigos e imagens em alta resolução
```

A pasta `originais/` pesa 22 MB e **não é usada pelo site** — guarda o
projeto no formato antigo e as imagens em alta. Se for subir para o GitHub e
quiser um repositório leve, guarde-a em outro lugar antes.

---

## Detalhes técnicos

- HTML puro: o conteúdo aparece mesmo sem JavaScript, e o Google lê tudo.
- Fontes auto-hospedadas (Fraunces + Manrope): nada é pedido ao Google a
  cada visita, e nenhum dado do visitante sai do site.
- Paleta café `#3b1f0e` sobre creme `#f5efe6`.
- Zero dependências externas: nenhuma requisição a servidor de terceiro.
- Meta tags, Open Graph, dados estruturados (`LegalService`), `sitemap.xml`,
  `robots.txt` e favicon gerados automaticamente.
- Acessibilidade: navegação por teclado, foco visível, textos alternativos,
  link "pular para o conteúdo" e respeito a "reduzir movimento".
