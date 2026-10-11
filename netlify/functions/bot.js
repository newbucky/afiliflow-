const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Comando /start
bot.command('start', (ctx) => {
  ctx.reply(
    👋 Bem-vindo ao AfiliFlow!\n\n +
    Comandos disponíveis:\n +
    /adicionar [link] [desconto] - Adiciona uma oferta manualmente\n +
    /grupos - Lista seus grupos cadastrados\n +
    /status - Mostra configurações atuais\n +
    /ajuda - Exibe todos os comandos
  );
});

// Comando /ajuda
bot.command('ajuda', (ctx) => {
  ctx.reply(
    📖 Comandos do AfiliFlow:\n\n +
    /start - Inicia o bot\n +
    /adicionar [link] [desconto] - Cadastra oferta manual\n +
    /grupos - Ver seus grupos\n +
    /status - Ver configurações\n +
    /ajuda - Esta mensagem\n\n +
    💡 O bot buscará produtos com desconto e postará automaticamente nos seus grupos!
  );
});

// Comando /status
bot.command('status', async (ctx) => {
  ctx.reply(⚙️ Sistema operacional ✅\n\nConfigurações ativas:\n• Desconto mínimo: 20%\n• Horário de pico: 1 oferta/5min\n• Fora de pico: 1 oferta/10min);
});

// Comando /grupos
bot.command('grupos', async (ctx) => {
  ctx.reply(📋 Nenhum grupo cadastrado ainda.\n\nAdicione o bot em um grupo e envie qualquer mensagem lá para eu cadastrar automaticamente! ✅);
});

// Comando /adicionar
bot.command('adicionar', (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 2) {
    return ctx.reply(❌ Uso correto:\n/adicionar https://link-do-produto 25);
  }
  const [link, desconto] = args;
  ctx.reply(✅ Oferta cadastrada!\n\n🔗 ${link}\n🏷️ Desconto: ${desconto}%\n\nSerá postada em breve nos seus grupos!);
});

// Tratamento de erros
bot.catch((err, ctx) => {
  console.error('Erro do bot:', err);
  ctx.reply(⚠️ Ocorreu um erro. Tente novamente mais tarde.);
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 200, body: 'Bot está ativo!' };
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
    console.error('Handler Error:', err.message);
    return { statusCode: 200, body: 'OK' };
  }
};
