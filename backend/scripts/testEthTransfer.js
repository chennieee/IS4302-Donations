require('dotenv').config();
const { ethers } = require('ethers');

async function test() {
  const provider = new ethers.JsonRpcProvider('https://cat.chuu.cc/rpc');
  const campaignAddr = '0x8c27e4dec7a89000000000000000000000000000';

  console.log('Testing ETH transfer detection...');
  console.log('Campaign address:', campaignAddr);

  // Check blocks 1-5
  for (let blockNum = 1; blockNum <= 5; blockNum++) {
    console.log(`\nChecking block ${blockNum}...`);
    const block = await provider.getBlock(blockNum, false);

    if (!block) {
      console.log(`  Block ${blockNum} not found`);
      continue;
    }

    console.log(`  Found ${block.transactions.length} transaction(s)`);

    for (const txHash of block.transactions) {
      // Fetch full transaction
      const tx = await provider.getTransaction(txHash);
      if (!tx) continue;

      const value = tx.value || 0n;
      console.log(`  TX: from=${tx.from} to=${tx.to} value=${ethers.formatEther(value)} ETH`);

      if (tx.to && tx.to.toLowerCase() === campaignAddr.toLowerCase() && value > 0n) {
        console.log(`  ✓✓✓ MATCH! This is a donation of ${ethers.formatEther(value)} ETH from ${tx.from}`);
      }
    }
  }
}

test().catch(console.error);
