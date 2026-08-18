/* =========================================================
   Áreas de atuação — o índice da home
   ---------------------------------------------------------
   Cada item vira uma linha clicável que abre o WhatsApp com
   a mensagem já escrita. A numeração é automática e corre
   entre os grupos (01 a 08).

   Para acrescentar, remover ou renomear uma área, edite aqui
   e rode `node build.mjs`.
   ========================================================= */

export const gruposDeAtuacao = [
  {
    rotulo: 'Direito de Família',
    descricao: 'Para relações que estão se formando, se organizando ou passando por uma separação.',
    itens: [
      {
        titulo: 'Planejamento matrimonial e organização do patrimônio',
        descricao: 'Organização das decisões jurídicas e patrimoniais do casal, antes ou durante o casamento ou a união, para evitar que precisem ser resolvidas depois, sob conflito.',
      },
      {
        titulo: 'Pactos antenupciais, acordos e contratos',
        descricao: 'Elaboração de pactos antenupciais, contratos de convivência e demais acordos que formalizam as escolhas do casal sobre o patrimônio e a relação.',
      },
      {
        titulo: 'Divórcio e dissolução de união estável',
        descricao: 'Consensual ou litigioso, incluindo as questões patrimoniais que costumam acompanhar a separação.',
      },
      {
        titulo: 'Guarda e alimentos',
        descricao: 'Definição da guarda dos filhos, regulamentação da convivência e fixação, revisão ou execução de pensão alimentícia.',
      },
    ],
  },
  {
    rotulo: 'Sucessões e Patrimônio',
    descricao: 'Para quem precisa organizar a transmissão de bens — antes ou depois de uma perda.',
    itens: [
      {
        titulo: 'Inventário judicial e extrajudicial',
        descricao: 'Formalização da partilha de bens após um falecimento, pela via mais adequada a cada situação familiar.',
      },
      {
        titulo: 'Planejamento sucessório',
        descricao: 'Organização, ainda em vida, de como o patrimônio será transmitido, reduzindo a chance de disputa entre herdeiros e dando mais segurança a quem fica.',
      },
      {
        titulo: 'Doações e regularização de imóveis',
        descricao: 'Orientação sobre doações em vida e regularização de bens imóveis, dentro de uma estratégia patrimonial e sucessória.',
      },
      {
        titulo: 'Herança e partilha de bens',
        descricao: 'Orientação sobre direitos dos herdeiros e divisão do patrimônio deixado, com clareza e critério técnico.',
      },
    ],
  },
];
