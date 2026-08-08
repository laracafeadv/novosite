/* =========================================================
   Login do painel — passo 1 de 2
   ---------------------------------------------------------
   Manda a pessoa para o GitHub autorizar o acesso.

   Roda como função na Vercel, no mesmo domínio do site, em
   /api/auth. Precisa de duas variáveis de ambiente:

     GITHUB_CLIENT_ID
     GITHUB_CLIENT_SECRET

   (configuradas no painel da Vercel — nunca neste arquivo)
   ========================================================= */

import { randomBytes } from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    res.status(500).send(
      'Falta a variável GITHUB_CLIENT_ID nas configurações da Vercel.'
    );
    return;
  }

  // "state" protege contra pedidos forjados: geramos um valor
  // aleatório, guardamos num cookie e conferimos na volta.
  const estado = randomBytes(16).toString('hex');

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocolo = req.headers['x-forwarded-proto'] || 'https';
  const retorno = `${protocolo}://${host}/api/callback`;

  res.setHeader(
    'Set-Cookie',
    `painel_estado=${estado}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );

  const parametros = new URLSearchParams({
    client_id: clientId,
    redirect_uri: retorno,
    scope: 'repo,user',
    state: estado,
  });

  res.writeHead(302, {
    Location: `https://github.com/login/oauth/authorize?${parametros}`,
  });
  res.end();
}
