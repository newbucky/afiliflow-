const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command('start', (ctx) => {
  return ctx.reply(
    'Bem-vindo ao AfiliFlow!\n\n' +
    'Comandos disponiveis:\n' +
    '/ajuda - Exibe todos os comandos'
  );
});

bot.command('ajuda', (ctx) => {
  return ctx.reply(
    'Comandos do AfiliFlow:\n\n' +
    '/start - Inicia o bot\n' +
    '/ajuda - Exibe esta mensagem'
  );
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 200, body: 'Bot esta ativo!' };
    }
    
    if (!event.body) {
      return { statusCode: 200, body: 'OK' };
    }
    
    const update = JSON.parse(event.body);
    await bot.handleUpdate(update);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    console.error('Erro:', err);
    return { statusCode: 200, body: 'OK' };
  }
};
