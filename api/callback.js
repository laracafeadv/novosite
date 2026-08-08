/* =========================================================
   Login do painel — passo 2 de 2
   ---------------------------------------------------------
   O GitHub devolve a pessoa para cá com um código. Trocamos
   esse código por um token e entregamos ao painel.

   O token nunca passa pela URL nem fica gravado em disco:
   ele é enviado à janela do painel por postMessage e vive
   apenas na sessão do navegador.
   ========================================================= */

function paginaDeResposta(conteudo) {
  // Protocolo esperado pelo Decap CMS: avisamos que estamos
  // autorizando, esperamos a janela do painel responder e só
  // então mandamos o token — para a origem que respondeu.
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>Entrando…</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#3b1f0e;color:#f5efe6;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<p>Entrando no painel…</p>
<script>
  (function () {
    var recado = ${JSON.stringify(conteudo)};

    function aoReceber(evento) {
      window.opener.postMessage(recado, evento.origin);
      window.removeEventListener('message', aoReceber, false);
      window.close();
    }

    if (!window.opener) {
      document.body.innerHTML = '<p>Abra o painel novamente em /admin.</p>';
      return;
    }

    window.addEventListener('message', aoReceber, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
</body>
</html>`;
}

function lerCookie(cabecalho, nome) {
  if (!cabecalho) return null;
  for (const parte of cabecalho.split(';')) {
    const [chave, ...resto] = parte.trim().split('=');
    if (chave === nome) return resto.join('=');
  }
  return null;
}

export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // O cookie de estado já cumpriu o papel — apaga.
  res.setHeader('Set-Cookie', 'painel_estado=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');

  function falhar(motivo) {
    res.status(200).send(paginaDeResposta(`authorization:github:error:${JSON.stringify({ message: motivo })}`));
  }

  if (!clientId || !clientSecret) {
    return falhar('Faltam GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET nas configurações da Vercel.');
  }

  const { code, state } = req.query;
  if (!code) return falhar('O GitHub não devolveu o código de autorização.');

  const estadoEsperado = lerCookie(req.headers.cookie, 'painel_estado');
  if (!estadoEsperado || state !== estadoEsperado) {
    return falhar('Pedido de login inválido ou expirado. Tente entrar de novo.');
  }

  try {
    const resposta = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const dados = await resposta.json();

    if (!dados.access_token) {
      return falhar(dados.error_description || 'O GitHub não liberou o acesso.');
    }

    res.status(200).send(
      paginaDeResposta(
        `authorization:github:success:${JSON.stringify({
          token: dados.access_token,
          provider: 'github',
        })}`
      )
    );
  } catch (erro) {
    falhar('Não foi possível falar com o GitHub. Tente de novo em instantes.');
  }
}
