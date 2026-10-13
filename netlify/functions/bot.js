const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

bot.command('start', (ctx) => {
  return ctx.reply(
    'Bem-vindo ao AfiliFlow!\n\n' +
    'Comandos disponiveis:\n' +
    '/adicionar [link] [desconto] - Adiciona uma oferta manualmente\n' +
    '/grupos - Lista seus grupos cadastrados\n' +
    '/status - Mostra configuracoes atuais\n' +
    '/ajuda - Exibe todos os comandos'
  );
});

bot.command('ajuda', (ctx) => {
  return ctx.reply(
    'Comandos do AfiliFlow:\n\n' +
    '/start - Inicia o bot\n' +
    '/ajuda - Exibe esta mensagem\n' +
    '/adicionar [link] [desconto%] - Cadastra uma oferta\n' +
    '/grupos - Ver grupos cadastrados\n' +
    '/status - Ver status do sistema'
  );
});

bot.command('grupos', async (ctx) => {
  try {
    const { data, error } = await supabase.from('grupos').select('*');
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return ctx.reply('Nenhum grupo cadastrado ainda.');
    }
    
    let lista = 'Seus grupos:\n\n';
    data.forEach((g, i) => {
      lista += `${i + 1}. ${g.nome} (ID: ${g.chat_id})\n`;
    });
    return ctx.reply(lista);
  } catch (err) {
    console.error('Erro grupos:', err);
    return ctx.reply('Erro ao buscar grupos: ' + err.message);
  }
});

bot.command('status', (ctx) => {
  return ctx.reply(
    'Status do AfiliFlow:\n' +
    '✅ Bot: Online\n' +
    '✅ Supabase: Conectado\n' +
    '⏳ Shopee: A configurar\n' +
    '⏳ Postagem automatica: A configurar'
  );
});

bot.command('adicionar', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length < 2) {
    return ctx.reply('Uso: /adicionar [link] [desconto%]\nExemplo: /adicionar https://shopee.com.br/produto 25');
  }
  
  const link = args[0];
  const desconto = parseInt(args[1]);
  
  if (isNaN(desconto)) {
    return ctx.reply('Desconto precisa ser um numero! Exemplo: 20');
  }
  
  try {
    const { data, error } = await supabase
      .from('ofertas')
      .insert([{ link, desconto }])
      .select();
    
    if (error) {
      console.error('Erro do Supabase:', error);
      return ctx.reply('❌ Erro: ' + error.message);
    }
    
    return ctx.reply('✅ Oferta cadastrada com sucesso! ID: ' + data[0].id);
  } catch (err) {
    console.error('Erro capturado:', err);
    return ctx.reply('❌ Erro: ' + err.message);
  }
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
    console.error('Erro geral:', err);
    return { statusCode: 200, body: 'OK' };
  }
};
