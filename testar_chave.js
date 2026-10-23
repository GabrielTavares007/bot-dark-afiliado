require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

async function listarModelos() {
    console.log("🔍 A verificar quais modelos a tua chave tem permissão para usar...\n");
    try {
        const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const dados = await resposta.json();

        if (dados.error) {
            return console.error("❌ Erro do Google:", dados.error.message);
        }

        console.log("✅ Modelos disponíveis para a tua chave:");
        dados.models.forEach(modelo => {
            // Mostra apenas os modelos que suportam geração de texto
            if (modelo.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${modelo.name.replace('models/', '')}`);
            }
        });
    } catch (erro) {
        console.error("❌ Erro de conexão:", erro.message);
    }
}

listarModelos();