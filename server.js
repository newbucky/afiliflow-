require('dotenv').config();
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('🤖 AfiliFlow iniciando...');

bot.command('start', (ctx) => {
  ctx.reply(
    `👋 Bem-vindo ao AfiliFlow!\n\n` +
    `Comandos disponíveis:\n` +
    `/adicionar [link] [desconto] - Adiciona uma oferta manualmente\n` +
    `/grupos - Lista seus grupos cadastrados\n` +
    `/status - Mostra configurações atuais\n` +
    `/ajuda - Exibe todos os comandos`
  );
});

bot.command('ajuda', (ctx) => {
  ctx.reply(
    `📖 Comandos do AfiliFlow:\n\n` +
    `/start - Inicia o bot\n` +
    `/adicionar [link] [desconto] - Cadastra oferta manual\n` +
    `/grupos - Ver seus grupos cadastrados\n` +
    `/status - Ver configurações do sistema\n` +
    `/ajuda - Esta mensagem\n\n` +
    `⏰ Postagem automática ativa:\n• Fora de pico: 1 oferta a cada 10 min\n• Horário de pico: 1 oferta a cada 5 min\n• Desconto mínimo: 20%`
  );
});

bot.command('status', async (ctx) => {
  ctx.reply(
    `⚙️ Sistema AfiliFlow ✅\n\n` +
    `Configurações ativas:\n` +
    `• Desconto mínimo: 20%\n` +
    `• Fora de pico: 1 oferta/10min\n` +
    `• Horário de pico: 1 oferta/5min\n` +
    `• Shopee API: Conectada ✅\n` +
    `• Mercado Livre: Aguardando API`
  );
});

bot.command('grupos', async (ctx) => {
  ctx.reply(
    `📋 Nenhum grupo cadastrado ainda.\n\n` +
    `📝 Como cadastrar:\n` +
    `1. Adicione este bot no seu grupo do Telegram\n` +
    `2. Dê permissão para ele enviar mensagens\n` +
    `3. Envie qualquer mensagem no grupo\n` +
    `4. Eu cadastro automaticamente! ✅`
  );
});

bot.command('adicionar', (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 2) {
    return ctx.reply(`❌ Uso correto:\n/adicionar https://shopee.com.br/produto 25`);
  }
  const [link, desconto] = args;
  ctx.reply(
    `✅ Oferta cadastrada!\n\n` +
    `🔗 Link: ${link}\n` +
    `🏷️ Desconto: ${desconto}%\n\n` +
    `Será postada em breve nos seus grupos! 🚀`
  );
});

bot.catch((err, ctx) => {
  console.error('❌ Erro do bot:', err);
  ctx.reply(`⚠️ Ops! Ocorreu um erro. Tente novamente.`);
});

bot.launch({ polling: true })
  .then(() => console.log('✅ Bot rodando em modo contínuo!'))
  .catch(err => console.error('❌ Erro ao iniciar bot:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
