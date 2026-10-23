require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const ffmpeg = require('fluent-ffmpeg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dns = require('dns');

// Força rede rápida
dns.setDefaultResultOrder('ipv4first');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve a página visual

const pastaDestino = path.join(__dirname, 'downloads');
if (!fs.existsSync(pastaDestino)) fs.mkdirSync(pastaDestino);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/gerar', async (req, res) => {
    const { tiktok, shopee } = req.body;
    
    try {
        // 1. Download
        const respostaDL = await fetch(`https://www.tikwm.com/api/?url=${tiktok}`);
        const dadosDL = await respostaDL.json();
        if (dadosDL.code !== 0) throw new Error("Erro na API do TikTok");
        
        const urlVideoLimpo = dadosDL.data.play;
        const idVideo = dadosDL.data.id || Date.now();
        const videoOriginal = path.join(pastaDestino, `${idVideo}.mp4`);
        const videoEditado = path.join(pastaDestino, `editado_${idVideo}.mp4`);

        await new Promise((resolve, reject) => {
            const arquivo = fs.createWriteStream(videoOriginal);
            https.get(urlVideoLimpo, (resposta) => {
                resposta.pipe(arquivo);
                arquivo.on('finish', () => { arquivo.close(); resolve(); });
            }).on('error', reject);
        });

        // 2. Edição (Inverte, Corta e Acelera)
        await new Promise((resolve, reject) => {
            ffmpeg(videoOriginal)
                .outputOptions(['-vf', 'hflip,crop=iw*0.96:ih*0.96,setpts=0.95*PTS', '-filter:a', 'atempo=1.05'])
                .on('end', resolve)
                .on('error', reject)
                .save(videoEditado);
        });
        fs.unlinkSync(videoOriginal); // Limpa o rastro

        // 3. IA Copywriting
        const modelo = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
        const prompt = `Age como um especialista em marketing viral do TikTok. Escreve uma legenda curta e persuasiva para vender o produto deste link: ${shopee}. Máximo 3 frases, com emojis, gatilho de escassez e CTA para clicar no link da bio. Adicione 4 hashtags em alta. Não use aspas.`;
        const resultadoIA = await modelo.generateContent(prompt);
        
        // Devolve tudo pronto para o front-end
        res.json({ 
            sucesso: true, 
            legenda: resultadoIA.response.text(), 
            link: shopee 
        });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ sucesso: false, erro: erro.message });
    }
});

app.listen(3000, () => {
    console.log('🌐 Painel de Controle ONLINE!');
    console.log('👉 Acesse no seu navegador: http://localhost:3000');
});