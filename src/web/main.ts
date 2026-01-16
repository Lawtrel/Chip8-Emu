import { CPU } from '../core/cpu';

const canvas = document.getElementById('screen') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Escala: Cada pixel do Chip-8 vira um quadrado de 10x10 na tela
const SCALE = 10;

const cpu = new CPU();

async function start() {
    // Carrega a ROM via HTTP (Fetch)
    const response = await fetch('/roms/test_opcode.ch8');
    const buffer = await response.arrayBuffer();
    cpu.loadRom(new Uint8Array(buffer));

    // Inicia o Loop
    loop();
}

function loop() {
    // Roda 10 ciclos de CPU por frame (Speed Hack)
    for (let i = 0; i < 10; i++) {
        cpu.cycle();
    }
    // Se o timer for maior que zero, diminua ele
    if (cpu.delayTimer > 0) {
        cpu.delayTimer--;
    }

    draw();
    
    // Chama o próximo frame (geralmente 60 vezes por segundo)
    requestAnimationFrame(loop);
}

function draw() {
    // Limpa a tela
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'lime'; // Cor dos pixels (Verde clássico)

    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 64; x++) {
            // Se o pixel no array da CPU for 1, desenha um quadrado
            if (cpu.display[y * 64 + x] === 1) {
                ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
            }
        }
    }
}

// Mapa de Teclas: Teclado PC -> Teclado Chip-8
const keyMap: { [key: string]: number } = {
    '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
    'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
    'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
    'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF
};

document.addEventListener('keydown', (event) => {
    const key = keyMap[event.key.toLowerCase()];
    if (key !== undefined) {
        cpu.keys[key] = 1; // Avisa a CPU que a tecla baixou
    }
});

document.addEventListener('keyup', (event) => {
    const key = keyMap[event.key.toLowerCase()];
    if (key !== undefined) {
        cpu.keys[key] = 0; // Avisa a CPU que a tecla subiu
    }
});

start();