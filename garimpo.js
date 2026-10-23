require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dns = require('dns');

// Força rede rápida IPv4
dns.setDefaultResultOrder('ipv4first');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const tokenBot = process.env.TELEGRAM_BOT_TOKEN;
const canalId = process.env.TELEGRAM_CANAL_ID;

async function analisarTendenciasCanal() {
    console.log("🔍 [Garimpo] Conectando ao Telegram para ler as últimas ofertas do canal...");

    try {
        // 1. Busca as mensagens recentes diretamente da API do Telegram
        const urlTelegram = `https://api.telegram.org/bot${tokenBot}/getUpdates`;
        const respostaTG = await fetch(urlTelegram);
        const dadosTG = await respostaTG.json();

        if (!dadosTG.ok || !dadosTG.result || dadosTG.result.length === 0) {
            throw new Error("O bot não encontrou mensagens recentes. Certifique-se de que o bot é administrador do canal e que novas mensagens foram postadas recentemente.");
        }

        // Extrai os textos das mensagens recebidas
        let listaProdutosTexto = "";
        dadosTG.result.forEach((update) => {
            const mensagem = update.channel_post || update.message;
            if (mensagem && mensagem.text) {
                listaProdutosTexto += `- ${mensagem.text}\n`;
            }
        });

        if (!listaProdutosTexto) {
            console.log("⚠️ Nenhuma mensagem com texto encontrada nas atualizações recentes do bot.");
            return;
        }

        console.log("🧠 [Garimpo] Enviando lista de produtos para a IA analisar o potencial viral...");

        // 2. Envia para o Gemini fazer a curadoria
        const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Atue como um analista sênior de tendências do TikTok e marketing de afiliados. 
        Abaixo está uma lista de produtos extraídos do meu canal de promoções:
        
        ${listaProdutosTexto}
        
        Analise esta lista e selecione os **3 melhores produtos** com maior potencial de viralização atual para vídeos curtos (TikTok/Reels), priorizando itens estéticos, soluções de problemas domésticos ou tecnologia curiosa. 
        Para cada um dos 3 escolhidos, forneça:
        1. O nome do produto.
        2. O link original que veio na mensagem.
        3. Uma breve justificativa baseada no comportamento de compra e viralização.
        
        Seja direto e objetivo na resposta.`;

        const resultadoIA = await modelo.generateContent(prompt);
        const relatorio = resultadoIA.response.text();

        console.log("\n====================================");
        console.log("🏆 RELATÓRIO DE GARIMPO - TOP 3 DO DIA:");
        console.log("====================================\n");
        console.log(relatorio);
        console.log("\n====================================");

    } catch (erro) {
        console.error("❌ Erro no garimpo:", erro.message);
    }
}

analisarTendenciasCanal();