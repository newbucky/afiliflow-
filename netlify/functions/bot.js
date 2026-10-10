const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

bot.command('start', (ctx) => {
  ctx.reply(`🤖 Bem-vindo ao AfiliFlow!

Comandos disponíveis:
/adicionargrupo — Adiciona este grupo
/listagrupos — Ver grupos cadastrados
/removergrupo — Remove este grupo
/status — Ver status do sistema
adicionar [link] [desconto] — Adiciona oferta manual`);
});

bot.command('adicionargrupo', async (ctx) => {
  const chatId = ctx.chat.id;
  const chatTitle = ctx.chat.title || 'Chat Privado';
  
  const { error } = await supabase
    .from('grupos')
    .upsert({ id: chatId, nome: chatTitle, ativo: true });
  
  ctx.reply(`✅ Grupo "${chatTitle}" adicionado com sucesso!`);
});

bot.command('listagrupos', async (ctx) => {
  const { data } = await supabase.from('grupos').select('*');
  const lista = data?.map((g, i) => `${i+1}. ${g.nome}`).join('\n') || 'Nenhum grupo cadastrado.';
  ctx.reply(`📋 Grupos cadastrados:\n${lista || 'Nenhum grupo cadastrado.'}`);
});

bot.command('removergrupo', async (ctx) => {
  const chatId = ctx.chat.id;
  await supabase.from('grupos').delete().eq('id', chatId);
  ctx.reply('🗑️ Grupo removido da lista.');
});

bot.command('status', async (ctx) => {
  ctx.reply(`📊 AfiliFlow — Sistema Online ✅

🎯 Desconto mínimo: ${process.env.MIN_DISCOUNT || 20}%
⏱️ Pico: ${process.env.INTERVAL_PEAK || 5}min | Normal: ${process.env.INTERVAL_NORMAL || 10}min`);
});

bot.hears(/^adicionar (.+) (\d+)/, async (ctx, match) => {
  const link = match[1];
  const desconto = parseInt(match[2]);
  const minDiscount = parseInt(process.env.MIN_DISCOUNT || 20);
  
  if (desconto >= minDiscount) {
    const { error } = await supabase.from('ofertas').insert({
      titulo: 'Oferta Manual',
      link_afiliado: link,
      desconto: desconto,
      loja: 'Externo'
    });
    ctx.reply('✅ Oferta adicionada!');
  } else {
    ctx.reply(❌ Desconto mínimo é de ${minDiscount}%);
  }
});

exports.handler = async (event) => {
  try {
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Error' };
  }
};
