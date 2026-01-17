import { CPU } from '../core/cpu.js';

const canvas = document.getElementById('screen') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const SCALE = 10; //Cada pixel do Chip-8 vira um quadrado de 10x10 na tela
const cpu = new CPU();

let animationID: number;
let lastTime = 0;
const fps = 60;
const fpsInterval = 1000 / fps;

// Controls to select ROM
const romSelect = document.getElementById('romSelect') as HTMLSelectElement;
const btnLoad = document.getElementById('btnLoad') as HTMLButtonElement;
btnLoad.addEventListener('click', () => {
    const romName = romSelect.value;
    loadGame(romName);
});

async function loadGame(romName: string) {
    if (animationID) cancelAnimationFrame(animationID);
    cpu.pc = 0x200; // Reseta o PC
    cpu.I = 0;     // Reseta o registrador I
    cpu.stack = new Array(16).fill(0); // Reseta a pilha
    cpu.stackPointer = 0; // Reseta o ponteiro da pilha
    cpu.registers.fill(0); // Reseta os registradores
    cpu.memory.fill(0); // Reseta a memória
    cpu.display.fill(0); // Reseta a tela
    //cpu.loadFontset(); // Recarrega a fontset

    try {
    // Carrega a ROM via Fetch
        const response = await fetch(`./roms/${romName}.ch8`);
        if (!response.ok) throw new Error(`Failed to load ROM: ${response.statusText}`);

        const buffer = await response.arrayBuffer();
        cpu.loadRom(new Uint8Array(buffer));
        
        lastTime = performance.now();
        loop(lastTime);
        btnLoad.blur();

    } catch (error) {
        console.error('Error loading ROM:', error);
        alert('Failed to load ROM. See console for details.');
    }
}

function loop(currentTime: number) {
    animationID = requestAnimationFrame(loop);
    const delayTimer = currentTime - lastTime;
    if (delayTimer > fpsInterval) {
        //Fix 60 fps
        lastTime = currentTime - (delayTimer % fpsInterval);
        for (let i = 0; i < 10; i++) {
            cpu.cycle();
        }
        // Se o timer for maior que zero, diminua ele
        if (cpu.delayTimer > 0) cpu.delayTimer--;
        if (cpu.soundTimer > 0) cpu.soundTimer--;
        draw();
    }
}

function draw() {
    // Limpa a tela
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'lime'; // Cor dos pixels

    for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 64; x++) {
            if (cpu.display[y * 64 + x]) {
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

loadGame('PONG'); // Carrega o jogo PONG por padrão ao iniciar a página