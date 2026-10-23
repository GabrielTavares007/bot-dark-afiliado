const fs = require('fs');
const path = require('path');

async function testarLocutor() {
    console.log("🗣️ Gerando narração MP3 direto da nuvem...");

    const textoParaNarrar = "Olha só esse achadinho que vai salvar a tua rotina! Ele é compacto, super potente e está com um desconto absurdo só hoje. Clica no link para garantir o teu!";
    const caminhoMp3 = path.join(__dirname, 'downloads', 'narracao_teste.mp3');

    try {
        // Rota direta para a API de voz do Google (sem precisar de bibliotecas)
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textoParaNarrar)}&tl=pt-BR&client=tw-ob`;

        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error("A conexão com a nuvem foi recusada.");

        // Transforma a resposta da internet num arquivo de áudio
        const arrayBuffer = await resposta.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        fs.writeFileSync(caminhoMp3, buffer);

        console.log("✅ Áudio MP3 gerado com sucesso na pasta downloads!");
    } catch (erro) {
        console.error("❌ Erro ao gerar narração:", erro.message);
    }
}

testarLocutor();