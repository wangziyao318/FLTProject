import { network } from "hardhat";

async function main() {
    const numBlocks = 20;

    // Call hardhat_mine with block count in hex string format
    await network.provider.send("hardhat_mine", [
        "0x" + numBlocks.toString(16) // convert 10 -> "0xa"
    ]);

    console.log(`⛏️ Mined ${numBlocks} blocks`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
