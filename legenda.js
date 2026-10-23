require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const linkShopee = process.env.SHOPEE_LINK_TESTE;
const nomeProduto = "Luminária Inteligente Formato G com Carregador sem Fios e Coluna Bluetooth";

async function gerarLegendaViral() {
    console.log(`🧠 Conectando à Inteligência Artificial para o produto: ${nomeProduto}...`);
    
    try {
        // Modelo atualizado e exigido pelo servidor para contas de 2026
        const modelo = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
        
        const prompt = `Age como um especialista em marketing viral do TikTok e afiliado da Shopee. Escreve uma legenda curta e muito persuasiva que crie urgência para vender o seguinte produto: "${nomeProduto}". A legenda deve ter no máximo 3 frases, usar emojis que chamem a atenção, e terminar com uma forte chamada para ação (CTA) a dizer "Comenta EU QUERO que te envio o link" ou "Link na bio!". Adiciona 4 hashtags relevantes e em alta no final. Não uses aspas na tua resposta.`;

        const resultado = await modelo.generateContent(prompt);
        const respostaTexto = resultado.response.text();

        console.log("\n====================================");
        console.log("📝 LEGENDA GERADA PRONTA A POSTAR:");
        console.log("====================================\n");
        console.log(respostaTexto);
        console.log(`\n🔗 Link de Afiliado associado: ${linkShopee}`);
        console.log("\n====================================");

    } catch (erro) {
        console.error("❌ Erro ao gerar a legenda:", erro.message);
    }
}

gerarLegendaViral();