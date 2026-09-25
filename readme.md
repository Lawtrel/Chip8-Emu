# CHIP-8 Emulator

Emulador educacional em TypeScript com um núcleo de CPU compartilhado entre duas interfaces: navegador e terminal. O projeto explora decodificação de instruções, operações bit a bit, memória e renderização de um framebuffer.

**TypeScript · Node.js · Vite · Canvas · Emulação**

## Arquitetura

- `src/core/cpu.ts`: estado da CPU, memória, registradores e execução de instruções.
- `src/web/`: interface web e renderização.
- `src/cli/index.ts`: execução no terminal e entrada de teclado.
- `public/roms/`: arquivos de ROM usados nas demonstrações.

O núcleo trabalha com memória de 4 KB, 16 registradores de uso geral, instruções de 16 bits e display de 64 × 32 pixels. Separar a CPU das interfaces permite estudar a lógica de emulação independentemente da apresentação.

## Executar

Instale Git, Node.js compatível com a versão de Vite do `package.json` e npm.

```bash
git clone https://github.com/Lawtrel/Chip8-Emu.git
cd Chip8-Emu
npm install
npm run dev
```

Abra o endereço exibido pelo Vite para a interface web.

Para executar no terminal:

```bash
npm run start:cli -- IBM_LOGO.ch8
```

O argumento é o nome de um arquivo dentro de `public/roms/`. Sem argumento, a CLI utiliza `IBM_LOGO.ch8`. Use `Ctrl+C` para encerrar. As teclas físicas da CLI são `1 2 3 4`, `q w e r`, `a s d f` e `z x c v`.

Para verificar a compilação TypeScript e gerar a aplicação web:

```bash
npm run build
```

## Estado da implementação

Projeto de estudo em evolução. A compatibilidade completa com ROMs e variantes de CHIP-8 ainda precisa de validação sistemática. A instrução `FX0A` (espera de tecla) não está implementada no núcleo atual, e não há script de testes automatizados no `package.json`.

## Próximas entregas

- Implementar espera de tecla e documentar a variante de CHIP-8 suportada.
- Criar testes unitários de instruções, flags, saltos e limites de memória.
- Verificar temporizadores, desenho de sprites, colisão e comportamento de reinício.
- Registrar resultados de ROMs de diagnóstico com versão, resultado esperado e resultado observado.

Uma imagem renderizada demonstra parte do funcionamento; testes de instruções e ROMs de diagnóstico são necessários para sustentar uma afirmação de compatibilidade.
