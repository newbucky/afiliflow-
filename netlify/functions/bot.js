const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Inicializa Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// /start
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

// /ajuda
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

// /grupos
bot.command('grupos', async (ctx) => {
  try {
    const { data, error } = await supabase
      .from('grupos')
      .select('*');
    
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
    console.error(err);
    return ctx.reply('Erro ao buscar grupos.');
  }
});

// /status
bot.command('status', (ctx) => {
  return ctx.reply(
    'Status do AfiliFlow:\n' +
    '✅ Bot: Online\n' +
    '✅ Supabase: Conectado\n' +
    '⏳ Shopee: A configurar\n' +
    '⏳ Postagem automatica: A configurar'
  );
});

// /adicionar
bot.command('adicionar', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length < 2) {
    return ctx.reply('Uso: /adicionar [link] [desconto%]\nExemplo: /adicionar https://shopee.com.br/produto 25');
  }
  
  const link = args[0];
  const desconto = args[1];
  
  try {
    const { error } = await supabase
      .from('ofertas')
      .insert([{ link, desconto }]);
    
    if (error) throw error;
    
    return ctx.reply('✅ Oferta cadastrada com sucesso!');
  } catch (err) {
    console.error(err);
    return ctx.reply('❌ Erro ao cadastrar oferta.');
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
    console.error('Erro:', err);
    return { statusCode: 200, body: 'OK' };
  }
};
