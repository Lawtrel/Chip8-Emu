import { CPU } from '../core/cpu.js';

const canvas = document.getElementById('screen') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const SCALE = 10; //Cada pixel do Chip-8 vira um quadrado de 10x10 na tela
const cpu = new CPU();

let animationID: number;
let lastTime = 0;
const fps = 60;
const fpsInterval = 1000 / fps;

//audio
let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

// Controls to select ROM
const romSelect = document.getElementById('romSelect') as HTMLSelectElement;
const btnLoad = document.getElementById('btnLoad') as HTMLButtonElement;
btnLoad.addEventListener('click', () => {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const romName = romSelect.value;
    loadGame(romName);
});

function initAudio() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContext();

    // Cria o gerador de som (Oscilador)
    oscillator = audioCtx.createOscillator();
    oscillator.type = 'square'; // Som clássico de 8-bits "buzina"
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // 440Hz (Nota Lá)

    // Cria o controle de volume (Gain)
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0; // Começa mudo

    // Conecta: Oscilador -> Volume -> Saída de Som
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Liga o oscilador (ele fica tocando "no mudo" o tempo todo)
    oscillator.start();
}
async function loadGame(romName: string) {
    console.log(`Tentando carregar: ${romName}`);
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
        console.log(`Fetch response: ${response.status} ${response.statusText}`);
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
        
        if (gainNode) {
            if (cpu.soundTimer > 0) {
                // Toca o som (10% de volume para não estourar o ouvido)
                gainNode.gain.value = 0.1; 
            } else {
                // Mudo
                gainNode.gain.value = 0;
            }
        }

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
let keyMap: Record<string, number> = {
    '1': 0x1, '2': 0x2, '3': 0x3, '4': 0xC,
    'q': 0x4, 'w': 0x5, 'e': 0x6, 'r': 0xD,
    'a': 0x7, 's': 0x8, 'd': 0x9, 'f': 0xE,
    'z': 0xA, 'x': 0x0, 'c': 0xB, 'v': 0xF
};

function getPcKeyFromChip8(chip8Key: number): string {
    return Object.keys(keyMap).find(key => keyMap[key] === chip8Key)?.toUpperCase() || '---';
}

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keyMap[key] !== undefined) {
        cpu.keys[keyMap[key]] = 1;  //Avisa a CPU que a tecla pressionou
    }
});

document.addEventListener('keyup', (e) => {
const key = e.key.toLowerCase();
    if (keyMap[key] !== undefined) {
        cpu.keys[keyMap[key]] = 0; //Avisa a CPU que a tecla soltou
    }
});

const modal = document.getElementById('config-modal') as HTMLDivElement;
const btnConfig = document.getElementById('btn-config') as HTMLButtonElement;
const btnClose = document.getElementById('btn-close-config') as HTMLButtonElement;
const mappingList = document.getElementById('mapping-list') as HTMLDivElement;

btnConfig.addEventListener('click', () => {
    renderMappingList();
    modal.style.display = 'flex';
});

btnClose.addEventListener('click', () => {
    modal.style.display = 'none';
    // Opcional: Salvar no localStorage aqui
    localStorage.setItem('chip8-keymap', JSON.stringify(keyMap));
});

// Renderiza a lista de botões
function renderMappingList() {
    mappingList.innerHTML = '';
    // Ordem das teclas Chip-8 (0-F)
    const chip8Keys = [0x1, 0x2, 0x3, 0xC, 0x4, 0x5, 0x6, 0xD, 0x7, 0x8, 0x9, 0xE, 0xA, 0x0, 0xB, 0xF];

    chip8Keys.forEach(k => {
        const row = document.createElement('div');
        row.className = 'map-row';
        
        const label = document.createElement('span');
        label.innerText = `Chip-8 Key [${k.toString(16).toUpperCase()}]`;
        
        const btnChange = document.createElement('button');
        btnChange.innerText = getPcKeyFromChip8(k);
        
        btnChange.addEventListener('click', () => {
            btnChange.innerText = 'Aperte uma tecla...';
            
            // Ouve a próxima tecla pressionada
            const listenOnce = (e: KeyboardEvent) => {
                e.preventDefault();
                const newKey = e.key.toLowerCase();
                
                // Remove o mapeamento antigo dessa tecla de PC (se existir)
                if (keyMap[newKey] !== undefined) {
                    delete keyMap[newKey]; 
                }
                
                // Remove a atribuição antiga desse botão Chip-8
                const oldKey = Object.keys(keyMap).find(key => keyMap[key] === k);
                if (oldKey) delete keyMap[oldKey];

                // Define o novo
                keyMap[newKey] = k;
                
                // Atualiza a UI
                renderMappingList();
                document.removeEventListener('keydown', listenOnce);
            };
            
            document.addEventListener('keydown', listenOnce);
        });

        row.appendChild(label);
        row.appendChild(btnChange);
        mappingList.appendChild(row);
    });
}

// Carregar Config Salva (se existir)
const savedMap = localStorage.getItem('chip8-keymap');
if (savedMap) {
    keyMap = JSON.parse(savedMap);
}


// Touch
const keypadButtons = document.querySelectorAll('#mobile-keypad button');

keypadButtons.forEach((btn) => {
    const button = btn as HTMLButtonElement;
    const keyHex = parseInt(button.getAttribute('data-k')!, 16);

    // Função para pressionar
    const press = (e: Event) => {
        e.preventDefault(); // Evita scroll ou zoom
        cpu.keys[keyHex] = 1;
        button.classList.add('active'); // Efeito visual
        
        // Se o áudio não iniciou, inicia no primeiro toque
        initAudio();
    };

    // Função para soltar
    const release = (e: Event) => {
        e.preventDefault();
        cpu.keys[keyHex] = 0;
        button.classList.remove('active');
    };

    // Eventos de Mouse (para testar no PC)
    button.addEventListener('mousedown', press);
    button.addEventListener('mouseup', release);
    button.addEventListener('mouseleave', release);

    // Eventos de Touch (para Celular)
    button.addEventListener('touchstart', press, { passive: false });
    button.addEventListener('touchend', release, { passive: false });
});

loadGame('IBM_LOGO'); // Carrega o jogo PONG por padrão ao iniciar a página