export class CPU {
    memory: Uint8Array = new Uint8Array(4096); // 4KB of memory
    registers: Uint8Array = new Uint8Array(16);
    I: number = 0;
    pc: number = 0x200;
    stack: number[] = new Array(16).fill(0);
    stackPointer: number = 0; // pointer
    keys: Uint8Array = new Uint8Array(16);
    delayTimer: number = 0;
    soundTimer: number = 0;
    display: number[] = new Array(64 * 32).fill(0); // 64x32 pixels
    
    loadRom(rom: Uint8Array) {
        const startAddress = 0x200;
        for (let i = 0; i < rom.length; i++) {
            this.memory[startAddress + i] = rom[i];
        }

        const fontset = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];

        for (let i = 0; i < fontset.length; i++) {
            this.memory[i] = fontset[i];
        }
    }

    cycle() {
        const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
        this.pc += 2;

        switch (opcode & 0xF000) {
            case 0x0000:
                               if ((opcode & 0x00FF) === 0xE0) {
                    this.display.fill(0);
                } else if ((opcode & 0x00FF) === 0xEE) {
                    this.stackPointer--;
                    this.pc = this.stack[this.stackPointer];
                }
                break;

            case 0x1000: this.pc = opcode & 0x0FFF; break;

            case 0x2000:
                this.stack[this.stackPointer] = this.pc;
                this.stackPointer++;
                this.pc = opcode & 0x0FFF;
                break;

            case 0x3000:
                if (this.registers[(opcode & 0x0F00) >> 8] === (opcode & 0x00FF)) this.pc += 2;
                break;
            
            case 0x4000: // SNE (Skip Not Equal)
                if (this.registers[(opcode & 0x0F00) >> 8] !== (opcode & 0x00FF)) this.pc += 2;
                break;
            
            case 0x5000: // SE (Skip Equal Registers)
                 if (this.registers[(opcode & 0x0F00) >> 8] === this.registers[(opcode & 0x00F0) >> 4]) this.pc += 2;
                 break;

            case 0x6000:
                this.registers[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
                break;
            
            case 0x7000:
                this.registers[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
                break;

            // A MATEMATICA
            case 0x8000:
                const rX = (opcode & 0x0F00) >> 8;
                const rY = (opcode & 0x00F0) >> 4;
                switch (opcode & 0x000F) {
                    case 0x0: this.registers[rX] = this.registers[rY]; break;
                    case 0x1: this.registers[rX] |= this.registers[rY]; break;
                    case 0x2: this.registers[rX] &= this.registers[rY]; break;
                    case 0x3: this.registers[rX] ^= this.registers[rY]; break;
                    case 0x4: // ADD
                        const sum = this.registers[rX] + this.registers[rY];
                        this.registers[0xF] = sum > 0xFF ? 1 : 0;
                        this.registers[rX] = sum & 0xFF;
                        break;
                    case 0x5: // SUB (Vx - Vy)
                        this.registers[0xF] = this.registers[rX] > this.registers[rY] ? 1 : 0;
                        this.registers[rX] -= this.registers[rY];
                        break;
                    case 0x6: // SHR
                        this.registers[0xF] = this.registers[rX] & 0x1;
                        this.registers[rX] >>= 1;
                        break;
                    case 0x7: // SUBN (Vy - Vx)
                        this.registers[0xF] = this.registers[rY] > this.registers[rX] ? 1 : 0;
                        this.registers[rX] = this.registers[rY] - this.registers[rX];
                        break;
                    case 0xE: // SHL
                        this.registers[0xF] = (this.registers[rX] & 0x80) >> 7;
                        this.registers[rX] <<= 1;
                        break;
                }
                break;

            case 0x9000: // SNE Registers
                if (this.registers[(opcode & 0x0F00) >> 8] !== this.registers[(opcode & 0x00F0) >> 4]) this.pc += 2;
                break;

            case 0xA000: this.I = opcode & 0x0FFF; break;
            case 0xB000: this.pc = (opcode & 0x0FFF) + this.registers[0]; break;

            case 0xC000:
                 const rC = (opcode & 0x0F00) >> 8;
                 this.registers[rC] = Math.floor(Math.random() * 256) & (opcode & 0x00FF);
                 break;

            case 0xD000:
                const x = (opcode & 0x0F00) >> 8;
                const y = (opcode & 0x00F0) >> 4;
                const height = opcode & 0x000F;
                const pixelX = this.registers[x];
                const pixelY = this.registers[y];

                this.registers[0xF] = 0;

                for (let row = 0; row < height; row++) {
                    const spriteByte = this.memory[this.I + row];
                    for (let col = 0; col < 8; col++) {
                        if ((spriteByte & (0x80 >> col)) !== 0) {
                            const screenIdx = ((pixelX + col) % 64) + ((pixelY + row) % 32) * 64;
                            if (this.display[screenIdx] === 1) this.registers[0xF] = 1;
                            this.display[screenIdx] ^= 1;
                        }
                    }
                }
                break;
                
            case 0xE000:
                const rE = (opcode & 0x0F00) >> 8;
                if ((opcode & 0x00FF) === 0x9E) {
                    if (this.keys[this.registers[rE]] === 1) this.pc += 2;
                } else if ((opcode & 0x00FF) === 0xA1) {
                    if (this.keys[this.registers[rE]] === 0) this.pc += 2;
                }
                break;

            // IMERS
            case 0xF000:
                const rF = (opcode & 0x0F00) >> 8;
                switch (opcode & 0x00FF) {
                    case 0x07: this.registers[rF] = this.delayTimer; break;
                    case 0x15: this.delayTimer = this.registers[rF]; break;
                    case 0x18: this.soundTimer = this.registers[rF]; break;
                    case 0x1E: this.I += this.registers[rF]; break;
                    case 0x29: this.I = this.registers[rF] * 5; break; // Fonte
                    case 0x33:
                        this.memory[this.I] = Math.floor(this.registers[rF] / 100);
                        this.memory[this.I + 1] = Math.floor((this.registers[rF] % 100) / 10);
                        this.memory[this.I + 2] = this.registers[rF] % 10;
                        break;
                    case 0x55:
                        for (let i = 0; i <= rF; i++) this.memory[this.I + i] = this.registers[i];
                        break;
                    case 0x65:
                        for (let i = 0; i <= rF; i++) this.registers[i] = this.memory[this.I + i];
                        break;
                }
                break;
        }
    }
}