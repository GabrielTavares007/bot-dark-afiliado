const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const pastaDestino = path.join(__dirname, 'downloads');

// Procura o primeiro vídeo .mp4 original na pasta downloads
const arquivos = fs.readdirSync(pastaDestino).filter(file => file.endsWith('.mp4') && !file.includes('editado'));

if (arquivos.length === 0) {
    console.log("Nenhum vídeo original encontrado na pasta downloads.");
    process.exit(1);
}

const videoOriginal = path.join(pastaDestino, arquivos[0]);
const videoEditado = path.join(pastaDestino, `editado_${arquivos[0]}`);

console.log(`🎬 A processar e a ofuscar o vídeo: ${arquivos[0]}... Isto pode demorar alguns segundos.`);

ffmpeg(videoOriginal)
    // Agrupa todos os filtros visuais (espelhar, cortar e acelerar) numa única corrente (chain)
    .outputOptions([
        '-vf', 'hflip,crop=iw*0.96:ih*0.96,setpts=0.95*PTS',
        '-filter:a', 'atempo=1.05'
    ])
    .on('end', () => {
        console.log(`✅ Sucesso! O vídeo "autêntico" está pronto e guardado como: editado_${arquivos[0]}`);
    })
    .on('error', (err) => {
        console.error(`❌ Erro na edição: ${err.message}`);
    })
    .save(videoEditado);