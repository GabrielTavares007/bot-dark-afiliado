require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

const pastaDestino = path.join(__dirname, 'downloads');
if (!fs.existsSync(pastaDestino)) fs.mkdirSync(pastaDestino);

const urlAlvo = process.env.TEST_TIKTOK_URL;

async function baixarSemMarcaDagua(tiktokUrl) {
    if (!tiktokUrl) return console.error("Nenhuma URL fornecida no .env");

    console.log(`Buscando vídeo sem marca d'água: ${tiktokUrl}`);
    
    try {
        // Usamos uma API pública gratuita focada em extrair o vídeo limpo dos servidores do TikTok
        const apiUrl = `https://www.tikwm.com/api/?url=${tiktokUrl}`;
        const resposta = await fetch(apiUrl);
        const dados = await resposta.json();

        if (dados.code === 0 && dados.data && dados.data.play) {
            const urlVideoLimpo = dados.data.play;
            const idVideo = dados.data.id || Date.now();
            const caminhoSalvar = path.join(pastaDestino, `${idVideo}.mp4`);

            console.log(`Vídeo limpo encontrado! Fazendo o download...`);
            
            const arquivo = fs.createWriteStream(caminhoSalvar);
            https.get(urlVideoLimpo, (respostaVideo) => {
                respostaVideo.pipe(arquivo);
                arquivo.on('finish', () => {
                    arquivo.close();
                    console.log(`✅ Sucesso! O vídeo SEM marca d'água foi salvo na pasta downloads.`);
                });
            }).on('error', (err) => {
                fs.unlink(caminhoSalvar, () => {}); // Apaga arquivo corrompido em caso de erro
                console.error(`Erro ao baixar o arquivo: ${err.message}`);
            });

        } else {
            console.error("Erro: A API não conseguiu encontrar a versão sem marca d'água deste vídeo.");
        }
    } catch (erro) {
        console.error(`Erro na requisição: ${erro.message}`);
    }
}

// Inicia o motor de download
baixarSemMarcaDagua(urlAlvo);