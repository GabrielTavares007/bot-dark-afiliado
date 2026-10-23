require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const ffmpeg = require('fluent-ffmpeg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dns = require('dns');

// Força rede rápida IPv4
dns.setDefaultResultOrder('ipv4first');

const pastaDestino = path.join(__dirname, 'downloads');
if (!fs.existsSync(pastaDestino)) fs.mkdirSync(pastaDestino);

const urlAlvo = process.env.TEST_TIKTOK_URL;
const linkShopee = process.env.SHOPEE_LINK_TESTE;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const nomeProduto = "Achadinho Viral da Shopee"; 

async function iniciarBot() {
    console.log("=========================================");
    console.log("🤖 INICIANDO MÁQUINA DARK DE AFILIADOS");
    console.log("=========================================\n");

    try {
        const urlLimpa = urlAlvo.split('?')[0];

        // --- PASSO 1: DOWNLOAD LIMPO ---
        console.log(`[1/4] 📥 A transferir vídeo sem marca de água...`);
        const respostaDL = await fetch(`https://www.tikwm.com/api/?url=${urlLimpa}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        const dadosDL = await respostaDL.json();

        if (dadosDL.code !== 0 || !dadosDL.data || !dadosDL.data.play) {
            throw new Error("API recusou o vídeo. Verifica se é público.");
        }

        const idVideo = dadosDL.data.id || Date.now();
        const videoOriginal = path.join(pastaDestino, `${idVideo}.mp4`);
        const videoEditado = path.join(pastaDestino, `editado_${idVideo}.mp4`);
        const caminhoMp3 = path.join(pastaDestino, `narracao_${idVideo}.mp3`);

        await new Promise((resolve, reject) => {
            const arquivo = fs.createWriteStream(videoOriginal);
            https.get(dadosDL.data.play, (res) => {
                res.pipe(arquivo);
                arquivo.on('finish', () => { arquivo.close(); resolve(); });
            }).on('error', reject);
        });
        console.log(`✅ Vídeo guardado!\n`);

        // --- PASSO 2: CÉREBRO IA (COPY + GUIÃO) ---
        console.log(`[2/4] 🧠 A gerar Copy e Guião da Narração...`);
        const modelo = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
        const prompt = `És um especialista em vídeos virais do TikTok. Para o produto "${nomeProduto}", cria o seguinte:
        1. Uma LEGENDA para o post (máximo 3 frases, emojis, com CTA para o link na bio).
        2. Uma NARRACAO para o áudio do vídeo (Obrigatório ser muito curto, MÁXIMO 20 palavras, estilo gancho viral).
        
        Responde EXATAMENTE neste formato, sem asteriscos ou formatações extra:
        LEGENDA: [texto da legenda aqui]
        NARRACAO: [texto da narração aqui]`;

        const resultadoIA = await modelo.generateContent(prompt);
        const respostaTexto = resultadoIA.response.text();
        
        // Extrair a Legenda e a Narração do texto da IA
        const legenda = respostaTexto.split('NARRACAO:')[0].replace('LEGENDA:', '').trim();
        const narracao = respostaTexto.split('NARRACAO:')[1].trim();
        console.log(`✅ Textos gerados com sucesso!\n`);

        // --- PASSO 3: LOCUTOR IA (TEXT-TO-SPEECH) ---
        console.log(`[3/4] 🗣️ A gravar a narração na nuvem...`);
        // O limite da API do Google Tradutor é cerca de 200 caracteres, por isso a narração tem de ser curta
        const urlVoz = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(narracao)}&tl=pt-BR&client=tw-ob`;
        
        const respostaVoz = await fetch(urlVoz);
        if (!respostaVoz.ok) throw new Error("Falha ao gerar voz.");
        
        const bufferVoz = Buffer.from(await respostaVoz.arrayBuffer());
        fs.writeFileSync(caminhoMp3, bufferVoz);
        console.log(`✅ Áudio MP3 gerado!\n`);

        // --- PASSO 4: MISTURA MÁGICA (FFMPEG) ---
        console.log(`[4/4] 🎬 A editar vídeo, aplicar camuflagem e misturar áudios...`);
        
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(videoOriginal)
                .input(caminhoMp3)
                .complexFilter([
                    // 1. Imagem: espelhar, cortar e ajustar velocidade
                    '[0:v]hflip,crop=iw*0.96:ih*0.96,setpts=0.95*PTS[v]',
                    // 2. Áudio Original: baixar o volume para 10% (0.1) e ajustar velocidade
                    '[0:a]atempo=1.05,volume=0.1[a1]',
                    // 3. Áudio TTS: aumentar o volume ligeiramente para destacar a voz
                    '[1:a]volume=1.5[a2]',
                    // 4. Misturar tudo (original de fundo + narração por cima)
                    '[a1][a2]amix=inputs=2:duration=first[aout]'
                ])
                .outputOptions([
                    '-map [v]',
                    '-map [aout]',
                    '-shortest' // Corta se sobrar áudio ou vídeo no final
                ])
                .on('end', resolve)
                .on('error', reject)
                .save(videoEditado);
        });

        // Limpeza dos ficheiros originais temporários
        fs.unlinkSync(videoOriginal);
        fs.unlinkSync(caminhoMp3);
        console.log(`✅ Vídeo Dark gerado com sucesso!\n`);

        console.log("====================================");
        console.log("🎯 PROCESSO 100% CONCLUÍDO!");
        console.log("====================================\n");
        console.log("📝 A TUA LEGENDA:");
        console.log(legenda);
        console.log(`\n🔗 O TEU LINK: ${linkShopee}`);
        console.log("\n📁 O TEU VÍDEO FINAL: Está na pasta 'downloads' com o nome 'editado_...'");

    } catch (erro) {
        console.error("\n❌ ERRO NO PROCESSO:", erro.message);
    }
}

iniciarBot();