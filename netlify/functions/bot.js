const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Comando /start
bot.command('start', (ctx) => {
  ctx.reply(`👋 Bem-vindo ao AfiliFlow!

Comandos disponíveis:
/adicionar [link] [desconto] — Adiciona uma oferta manualmente
/grupos — Lista seus grupos cadastrados
/status — Mostra configurações atuais
/ajuda — Exibe todos os comandos`);
});

// Comando /status
bot.command('status', async (ctx) => {
  ctx.reply(`📊 AfiliFlow - Sistema Online ✅
💸 Desconto mínimo: ${process.env.MIN_DISCOUNT || 20}%
⏱ Pico: ${process.env.INTERVAL_PEAK || 5}min | Normal: ${process.env.INTERVAL_NORMAL || 15}min`);
});

// Comando /adicionar link desconto
bot.hears(/^adicionar (.+) (\d+)/, async (ctx, match) => {
  const link = match[1];
  const desconto = parseInt(match[2]);
  const minDiscount = parseInt(process.env.MIN_DISCOUNT || 20);

  if (desconto >= minDiscount) {
    const { error } = await supabase.from('ofertas').insert({
      titulo: 'Oferta Manual',
      link_afiliado: link,
      desconto: desconto,
      cupom: null,
      ativo: true
    });

    if (error) {
      ctx.reply(`❌ Erro ao salvar oferta: ${error.message}`);
    } else {
      ctx.reply(`✅ Oferta adicionada! 🔗 ${link} | 🏷️ ${desconto}%`);
    }
  } else {
    ctx.reply(`❌ Desconto mínimo é de ${minDiscount}%`);
  }
});

// Comando /grupos
bot.command('grupos', async (ctx) => {
  const { data, error } = await supabase
    .from('grupos')
    .select('nome')
    .order('nome');

  if (error) {
    ctx.reply(`❌ Erro ao buscar grupos: ${error.message}`);
    return;
  }

  const lista = data?.map((g, i) => `${i+1}. ${g.nome}`).join('\n') || 'Nenhum grupo cadastrado.';
  ctx.reply(`📋 Grupos cadastrados:\n${lista}`);
});

// Comando /ajuda
bot.command('ajuda', (ctx) => {
  ctx.reply(`📖 Comandos do AfiliFlow:

/start — Inicia o bot
/status — Configurações do sistema
/adicionar [link] [desconto] — Cadastra oferta manual
/grupos — Lista seus grupos
/ajuda — Esta mensagem

💡 O bot buscará produtos com desconto e postará automaticamente nos grupos cadastrados!`);
});

exports.handler = async (event) => {
  try {
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: '' };
  } catch (err) {
    console.error('Erro:', err);
    return { statusCode: 500, body: 'Erro interno' };
  }
};
