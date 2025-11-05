(function (Scratch) {
  'use strict';

  class HideAllBlocksVM {
    getInfo() {
      return {
        id: 'hide_all_blocks_vm',
        name: 'Hide All Blocks (VM)',
        blocks: [] // We'll populate dynamically
      };
    }

    constructor() {
      try {
        // Access the VM (should already exist globally)
        const vm = window.vm || Scratch.vm;
        if (!vm || !vm.runtime || !vm.runtime._primitives) {
          console.warn('VM or primitives not found. Cannot hide blocks.');
          return;
        }

        const opcodes = Object.keys(vm.runtime._primitives);

        // Build hidden block definitions
        const hiddenBlocks = opcodes.map(op => ({
          opcode: op,
          blockType: Scratch.BlockType.COMMAND,
          text: `[hidden] ${op}`,
          hideFromPalette: true
        }));

        const info = this.getInfo();
        info.blocks = hiddenBlocks;

        // Override getInfo() so TurboWarp sees our updated version
        this.getInfo = () => info;

        console.log(`✅ HideAllBlocks: hiding ${hiddenBlocks.length} blocks`);
      } catch (e) {
        console.error('Error while hiding blocks:', e);
      }
    }
  }

  Scratch.extensions.register(new HideAllBlocksVM());
})(Scratch);