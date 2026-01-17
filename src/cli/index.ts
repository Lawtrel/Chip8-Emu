import * as fs from 'fs';
import { CPU } from '../core/cpu.js';
import path from 'path';
const cpu = new CPU();
const romName = process.argv[2] || 'PONG.ch8'; // Nome da ROM passado como argumento ou PONG por padrão

// --- 1. Mapeamento de Teclas (PC -> Chip-8) ---
const keyMap: { [key: string]: number } = {
    '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
    'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
    'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
    'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF
};

// --- 2. Configuração do Terminal (Input) ---
if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true);
}
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key: Buffer) => {
    const char = key.toString();

    // Ctrl+C para sair
    if (char === '\u0003') {
        console.clear();
        process.exit();
    }

    const chip8Key = keyMap[char.toLowerCase()];
    if (chip8Key !== undefined) {
        // Simula o pressionar da tecla
        cpu.keys[chip8Key] = 1;

        // O Chip-8 não tem evento de "soltar tecla" nativo rápido, 
        // então soltamos ela automaticamente após um breve momento
        setTimeout(() => {
            cpu.keys[chip8Key] = 0;
        }, 100);
    }
});

// --- 3. Carregar ROM ---
try {
    //const romData = fs.readFileSync('roms` ,`Tank.ch8');
    const romPath = path.join(process.cwd(), 'public', 'roms', romName);
    const romData = fs.readFileSync(romPath);
    cpu.loadRom(new Uint8Array(romData));
    console.clear(); // Limpa o terminal uma vez antes de começar
} catch (e) {
    console.error("Erro ao carregar ROM.");
    process.exit(1);
}

// --- 4. Função de Desenho Otimizada ---
function drawTerminal() {
    // \x1b[H move o cursor para o topo (0,0) sem limpar o buffer (evita flicker)
    let output = '\x1b[H'; 
    
    // Borda Superior
    output += '┌' + '─'.repeat(64) + '┐\n';

    for (let y = 0; y < 32; y++) {
        output += '│'; // Borda Lateral
        for (let x = 0; x < 64; x++) {
            const pixel = cpu.display[y * 64 + x];
            // █ para pixel ligado, espaço para desligado
            output += pixel ? '█' : ' ';
        }
        output += '│\n'; // Borda Lateral
    }
    
    // Borda Inferior
    output += '└' + '─'.repeat(64) + '┘\n';
    
    process.stdout.write(output);
}

// --- 5. Loop do Jogo (Game Loop) ---
setInterval(() => {
    // Aceleração: Roda 10 instruções da CPU por quadro de vídeo
    for (let i = 0; i < 10; i++) {
        cpu.cycle();
    }

    // Decrementa os Timers (Essencial para a física da bola!)
    if (cpu.delayTimer > 0) cpu.delayTimer--;
    if (cpu.soundTimer > 0) cpu.soundTimer--;

    // Desenha a tela
    drawTerminal();

}, 1000 / 60); // 60 FPS