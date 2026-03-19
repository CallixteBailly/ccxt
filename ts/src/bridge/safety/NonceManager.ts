// ---------------------------------------------------------------------------
// NonceManager -- tracks on-chain nonces for rapid sequential submissions
// ---------------------------------------------------------------------------

import type { PublicClient } from 'viem';

export class NonceManager {
    private currentNonce: number | null = null;
    private pendingCount = 0;
    private address: `0x${string}`;
    private publicClient: PublicClient;

    constructor(publicClient: PublicClient, address: `0x${string}`) {
        this.publicClient = publicClient;
        this.address = address;
    }

    async getNextNonce(): Promise<number> {
        if (this.currentNonce === null) {
            await this.sync();
        }
        const nonce = this.currentNonce! + this.pendingCount;
        this.pendingCount++;
        return nonce;
    }

    confirmTransaction(): void {
        if (this.pendingCount > 0) {
            this.pendingCount--;
            if (this.currentNonce !== null) {
                this.currentNonce++;
            }
        }
    }

    failTransaction(): void {
        if (this.pendingCount > 0) {
            this.pendingCount--;
        }
    }

    async sync(): Promise<void> {
        const onChainNonce = await this.publicClient.getTransactionCount({
            address: this.address,
        });
        this.currentNonce = onChainNonce;
        this.pendingCount = 0;
    }

    getPendingCount(): number {
        return this.pendingCount;
    }
}
