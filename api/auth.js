/* =========================================================
   Login do painel — e-mail e senha
   ---------------------------------------------------------
   O painel (/admin) abre esta página numa janelinha. Aqui a
   pessoa digita e-mail e senha. Se conferirem, devolvemos ao
   painel a chave de acesso ao repositório.

   A chave nunca fica no navegador de quem não entrou: ela
   mora nas variáveis de ambiente da Vercel e só é entregue
   após a senha bater.

   Variáveis necessárias (Vercel → Settings → Environment):

     PAINEL_EMAIL        e-mail que pode entrar
     PAINEL_SENHA_HASH   senha embaralhada — gere com:
                           node gerar-senha.mjs
     GITHUB_TOKEN        chave de acesso ao repositório
                         (fine-grained, só este repositório,
                          permissão Contents: Read and write)
   ========================================================= */

import { scryptSync, timingSafeEqual } from 'node:crypto';

/* ---------- Comparações que não vazam tempo ---------- */

function iguais(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  if (A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

function senhaConfere(senha, guardada) {
  // formato: sal:hash (ambos em hexadecimal)
  const [sal, esperado] = String(guardada).split(':');
  if (!sal || !esperado) return false;
  try {
    const calculado = scryptSync(senha, Buffer.from(sal, 'hex'), 64).toString('hex');
    return iguais(calculado, esperado);
  } catch {
    return false;
  }
}

/* ---------- Páginas ---------- */

const ESTILO = `
  *{box-sizing:border-box;margin:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#3b1f0e;color:#f5efe6;padding:24px;
       font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
  .caixa{width:100%;max-width:340px;text-align:center}
  .marca{font-family:Georgia,'Times New Roman',serif;font-size:26px;
         letter-spacing:.16em;margin-bottom:6px}
  .sub{font-size:10px;letter-spacing:.3em;color:rgba(245,239,230,.55);
       text-transform:uppercase;margin-bottom:34px}
  label{display:block;text-align:left;font-size:11px;font-weight:600;
        letter-spacing:.12em;text-transform:uppercase;
        color:rgba(245,239,230,.6);margin:0 0 7px}
  input{width:100%;padding:13px 15px;margin-bottom:18px;border-radius:8px;
        border:1px solid rgba(245,239,230,.22);background:rgba(245,239,230,.06);
        color:#f5efe6;font-size:15px;font-family:inherit}
  input:focus{outline:none;border-color:rgba(245,239,230,.6);
              background:rgba(245,239,230,.1)}
  button{width:100%;padding:13px;border:0;border-radius:999px;cursor:pointer;
         background:#f5efe6;color:#3b1f0e;font-size:14px;font-weight:600;
         letter-spacing:.04em;font-family:inherit}
  button:hover{background:#fff}
  .erro{margin-bottom:18px;padding:11px 14px;border-radius:8px;font-size:13px;
        line-height:1.45;background:rgba(190,70,50,.18);
        border:1px solid rgba(230,120,100,.35);color:#ffd9d0;text-align:left}
  .aviso{margin-top:26px;font-size:12px;line-height:1.5;
         color:rgba(245,239,230,.45)}
`;

function paginaLogin({ erro = '', email = '' } = {}) {
  const seguro = (t) => String(t).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Entrar no painel — Lara Café Advocacia</title>
<style>${ESTILO}</style>
</head>
<body>
  <form class="caixa" method="POST" action="/api/auth">
    <p class="marca">LARA CAFÉ</p>
    <p class="sub">Painel de publicação</p>

    ${erro ? `<p class="erro">${seguro(erro)}</p>` : ''}

    <label for="email">E-mail</label>
    <input id="email" name="email" type="email" required autocomplete="username"
           value="${seguro(email)}" autofocus />

    <label for="senha">Senha</label>
    <input id="senha" name="senha" type="password" required
           autocomplete="current-password" />

    <button type="submit">Entrar</button>

    <p class="aviso">Acesso restrito. Se esqueceu a senha, peça para quem
    cuida do site gerar uma nova.</p>
  </form>
</body>
</html>`;
}

/**
 * Página que devolve a chave ao painel.
 * O Decap CMS espera exatamente esta conversa:
 *   1. avisamos que estamos autorizando
 *   2. o painel responde
 *   3. mandamos a chave — só para a origem que respondeu
 */
function paginaEntrega(recado) {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Entrando…</title><style>${ESTILO}</style></head>
<body>
  <div class="caixa"><p class="marca">LARA CAFÉ</p><p class="sub">Entrando…</p></div>
<script>
  (function () {
    var recado = ${JSON.stringify(recado)};

    if (!window.opener) {
      document.querySelector('.sub').textContent = 'Abra o painel em /admin';
      return;
    }

    function aoReceber(evento) {
      window.opener.postMessage(recado, evento.origin);
      window.removeEventListener('message', aoReceber, false);
      setTimeout(function () { window.close(); }, 150);
    }

    window.addEventListener('message', aoReceber, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
</body>
</html>`;
}

/* ---------- Leitura do corpo do formulário ---------- */

async function lerFormulario(req) {
  if (req.body && typeof req.body === 'object') return req.body;

  const partes = [];
  for await (const p of req) partes.push(p);
  const texto = Buffer.concat(partes).toString('utf8');

  const dados = {};
  for (const [chave, valor] of new URLSearchParams(texto)) dados[chave] = valor;
  return dados;
}

/* ---------- Função ---------- */

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const emailPermitido = process.env.PAINEL_EMAIL;
  const senhaGuardada = process.env.PAINEL_SENHA_HASH;
  const token = process.env.GITHUB_TOKEN;

  // Diz exatamente o que falta — poupa adivinhação na hora de configurar.
  const faltando = [
    !emailPermitido && 'PAINEL_EMAIL',
    !senhaGuardada && 'PAINEL_SENHA_HASH',
    !token && 'GITHUB_TOKEN',
  ].filter(Boolean);

  if (faltando.length) {
    return res.status(500).send(paginaLogin({
      erro: `Falta configurar na Vercel: ${faltando.join(', ')}. ` +
            'Depois de salvar, republique o site.',
    }));
  }

  if (req.method !== 'POST') {
    return res.status(200).send(paginaLogin());
  }

  const dados = await lerFormulario(req);
  const email = String(dados.email || '').trim().toLowerCase();
  const senha = String(dados.senha || '');

  const emailBate = iguais(email, emailPermitido.trim().toLowerCase());
  const senhaBate = senhaConfere(senha, senhaGuardada);

  if (!emailBate || !senhaBate) {
    // Espera de propósito: atrasa quem fica tentando adivinhar.
    await new Promise((r) => setTimeout(r, 900));
    return res.status(401).send(paginaLogin({
      erro: 'E-mail ou senha incorretos.',
      email,
    }));
  }

  return res.status(200).send(
    paginaEntrega(`authorization:github:success:${JSON.stringify({
      token,
      provider: 'github',
    })}`)
  );
}
