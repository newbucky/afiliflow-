const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

bot.command('start', (ctx) => {
  return ctx.reply(
    '👋 Bem-vindo ao AfiliFlow!\n\n' +
    'Comandos disponíveis:\n' +
    '/adicionar [link] [desconto%] [título] [preço] [imagem-url]\n' +
    '/grupos - Lista seus grupos cadastrados\n' +
    '/status - Mostra configurações atuais\n' +
    '/publicar - Publica a próxima oferta no grupo\n' +
    '/ajuda - Exibe todos os comandos'
  );
});

bot.command('ajuda', (ctx) => {
  return ctx.reply(
    '📖 Comandos do AfiliFlow:\n\n' +
    '/start - Inicia o bot\n' +
    '/ajuda - Exibe esta mensagem\n' +
    '/adicionar - Cadastra uma nova oferta\n' +
    '  Exemplo: /adicionar https://shopee.com.br/produto 25 Camiseta R$29,90 https://exemplo.com/foto.jpg\n' +
    '/grupos - Ver grupos cadastrados\n' +
    '/status - Ver status do sistema\n' +
    '/publicar - Envia a próxima oferta para o grupo'
  );
});

bot.command('grupos', async (ctx) => {
  try {
    const { data, error } = await supabase.from('grupos').select('*');
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return ctx.reply('📭 Nenhum grupo cadastrado ainda.');
    }
    
    let lista = '👥 Seus grupos cadastrados:\n\n';
    data.forEach((g, i) => {
      lista += `${i + 1}. 📌 ${g.nome}\n   🆔 ID: ${g.chat_id}\n`;
    });
    return ctx.reply(lista);
  } catch (err) {
    console.error('Erro grupos:', err);
    return ctx.reply('❌ Erro ao buscar grupos: ' + err.message);
  }
});

bot.command('status', async (ctx) => {
  try {
    const { count: pendentes } = await supabase
      .from('ofertas')
      .select('*', { count: 'exact', head: true })
      .eq('enviada', false);

    const { count: total } = await supabase
      .from('ofertas')
      .select('*', { count: 'exact', head: true });

    const { count: totalGrupos } = await supabase
      .from('grupos')
      .select('*', { count: 'exact', head: true });

    return ctx.reply(
      `📊 *Status do AfiliFlow*\n\n` +
      `📋 Ofertas pendentes: ${pendentes || 0}\n` +
      `✅ Total de ofertas: ${total || 0}\n` +
      `👥 Grupos ativos: ${totalGrupos || 0}`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Erro status:', err);
    return ctx.reply('❌ Erro ao buscar status.');
  }
});

bot.command('adicionar', async (ctx) => {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length < 3) {
    return ctx.reply(
      '⚠️ Uso correto:\n' +
      '/adicionar [link] [desconto%] [título] [preço] [imagem-url-opcional]\n\n' +
      '💡 Exemplo:\n' +
      '/adicionar https://shopee.com.br/camiseta 25 Camiseta Branca R$29,90 https://exemplo.com/foto.jpg'
    );
  }
  
  const link = args[0];
  const desconto = parseInt(args[1]);
  
  // Identifica preço (começa com R$) e monta os campos
  const precoRegex = /^R\$\d/;
  let precoIndex = args.findIndex(arg => precoRegex.test(arg));
  
  if (precoIndex === -1) {
    return ctx.reply('⚠️ Por favor, coloque o preço começando com R$\nExemplo: R$29,90');
  }
  
  const titulo = args.slice(2, precoIndex).join(' ') || 'Produto em Destaque';
  const preco = args[precoIndex];
  const imagemUrl = args.length > precoIndex + 1 ? args[args.length - 1] : null;
  
  if (isNaN(desconto)) {
    return ctx.reply('⚠️ Desconto precisa ser um número! Exemplo: 25');
  }
  
  try {
    const { data, error } = await supabase
      .from('ofertas')
      .insert([{ 
        link, 
        desconto, 
        titulo, 
        preco,
        imagem_url: imagemUrl,
        enviada: false 
      }])
      .select();
    
    if (error) {
      console.error('Erro do Supabase:', error);
      return ctx.reply('❌ Erro: ' + error.message);
    }
    
    return ctx.reply(
      `✅ *Oferta cadastrada com sucesso!*\n\n` +
      `🆔 ID: ${data[0].id}\n` +
      `📦 Produto: ${titulo}\n` +
      `💰 Preço: ${preco}\n` +
      `🎁 Desconto: ${desconto}%`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Erro capturado:', err);
    return ctx.reply('❌ Erro: ' + err.message);
  }
});

bot.command('publicar', async (ctx) => {
  try {
    const { data: oferta, error: erroOferta } = await supabase
      .from('ofertas')
      .select('*')
      .eq('enviada', false)
      .order('criado_em', { ascending: true })
      .limit(1)
      .single();

    if (erroOferta || !oferta) {
      return ctx.reply('📭 Nenhuma oferta pendente para publicar!');
    }

    const { data: grupos, error: erroGrupo } = await supabase
      .from('grupos')
      .select('*');

    if (erroGrupo || !grupos || grupos.length === 0) {
      return ctx.reply('❌ Nenhum grupo cadastrado! Use /grupos primeiro.');
    }

    // Calcula preço original com base no desconto
    let precoOriginal = '';
    if (oferta.preco) {
      const valor = parseFloat(oferta.preco.replace('R$','').replace(',','.'));
      const original = valor / (1 - (oferta.desconto / 100));
      precoOriginal = `R$${original.toFixed(2).replace('.',',')}`;
    }

    // ✨ Mensagem chamativa e persuasiva
    const mensagem = 
      `🔥 *OFERTA IMPERDÍVEL!* 🔥\n\n` +
      `✨ *${oferta.titulo || 'Produto em Destaque'}*\n\n` +
      `💰 *De:* ~~${precoOriginal}~~\n` +
      `💸 *Por:* ${oferta.preco}\n` +
      `🎁 *Desconto:* ${oferta.desconto}% OFF! 🎉\n\n` +
      `⏳ *Corre! Esta oferta pode acabar a qualquer momento!*\n` +
      `🔥 *Estoque limitado — não perca essa chance!*\n\n` +
      `👉 *Clique abaixo e garanta o seu antes que acabe!* 🛒👇\n` +
      `${oferta.link}\n\n` +
      `💨 *Corre e aproveita!* ✨`;

    let enviados = 0;
    for (const grupo of grupos) {
      try {
        const chatId = grupo.chat_id;
        
        // Envia com imagem se tiver, senão só texto
        if (oferta.imagem_url) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              photo: oferta.imagem_url,
              caption: mensagem,
              parse_mode: 'Markdown',
              disable_web_page_preview: false
            })
          });
        } else {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: mensagem,
              parse_mode: 'Markdown',
              disable_web_page_preview: false
            })
          });
        }
        enviados++;
      } catch (e) {
        console.log(`Erro ao enviar para ${grupo.nome}:`, e);
      }
    }

    await supabase.from('ofertas').update({ enviada: true }).eq('id', oferta.id);

    return ctx.reply(
      `✅ *Oferta publicada com sucesso!*\n` +
      `📤 Enviada para ${enviados} grupo(s)\n` +
      `🆔 Oferta ID: ${oferta.id}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(error);
    return ctx.reply('❌ Erro ao publicar oferta.');
  }
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
    console.error('Erro geral:', err);
    return { statusCode: 200, body: 'OK' };
  }
};
