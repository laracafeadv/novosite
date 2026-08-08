/* =========================================================
   Áreas de atuação — o índice da home
   ---------------------------------------------------------
   Cada item vira uma linha clicável que abre o WhatsApp com
   a mensagem já escrita. A numeração é automática.

   Para adicionar, remover ou renomear uma área, edite aqui
   e rode `node build.mjs`.
   ========================================================= */

export const gruposDeAtuacao = [
  {
    rotulo: 'Família & União',
    itens: [
      {
        titulo: 'Divórcio',
        descricao: 'Consensual ou litigioso, conduzido com estratégia e o menor desgaste possível.',
      },
      {
        titulo: 'Planejamento matrimonial',
        descricao: 'Pactos e acordos que antecipam cenários antes que se tornem conflitos.',
      },
      {
        titulo: 'União estável',
        descricao: 'Formalização da relação com todos os efeitos jurídicos garantidos.',
      },
      {
        titulo: 'Reconhecimento de união estável',
        descricao: 'Comprovação e registro da relação para todos os efeitos legais.',
      },
      {
        titulo: 'Dissolução de união estável',
        descricao: 'Encerramento conduzido com respeito e definição clara de direitos.',
      },
    ],
  },
  {
    rotulo: 'Sucessões',
    itens: [
      {
        titulo: 'Inventário',
        descricao: 'Judicial ou extrajudicial, para encerrar o processo com segurança.',
      },
      {
        titulo: 'Partilha de bens',
        descricao: 'Divisão de patrimônio construída com clareza e critério técnico.',
      },
      {
        titulo: 'Planejamento sucessório',
        descricao: 'Estruturas pensadas para proteger quem você deixa para trás.',
      },
    ],
  },
];
