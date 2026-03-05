/**
 * funder.ts — Funder (treasury) wallet service.
 *
 * Loads a funder keypair from FUNDER_SECRET_KEY env var (base58 format).
 * This wallet is used to fund newly created agent wallets instead of calling
 * requestAirdrop(), which is heavily rate-limited on devnet.
 *
 * SECURITY: The funder secret key is NEVER logged. It is loaded once into
 * memory and reused for the lifetime of the process.
 *
 * Format: FUNDER_SECRET_KEY must be the base58-encoded secret key of the wallet.
 * How to get it:
 *   - Phantom: Settings → Security & Privacy → Export Private Key → copy the base58 string
 *   - Solana CLI: cat ~/.config/solana/id.json  (that's a JSON array; convert below)
 *   - Generate fresh: node -e "const {Keypair}=require('@solana/web3.js');
 *       const kp=Keypair.generate();
 *       const bs58=require('bs58');
 *       console.log(bs58.default.encode(kp.secretKey));"
 */

import { Keypair, PublicKey, Connection, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { logger } from '../logger.js';

let _funderKeypair: Keypair | null = null;
let _funderLoaded = false;

/**
 * Attempt to load the funder keypair from FUNDER_SECRET_KEY env var.
 * Returns null if not configured.
 * Supports two formats:
 *   1. Base58-encoded secret key (64 bytes)
 *   2. JSON array of numbers e.g. [1,2,3,...] (as exported by solana-keygen)
 */
export function getFunderKeypair(): Keypair | null {
  if (_funderLoaded) return _funderKeypair;
  _funderLoaded = true;

  const raw = process.env.FUNDER_SECRET_KEY;
  if (!raw || raw.trim() === '') {
    logger.info('FUNDER_SECRET_KEY not set — will use airdrop for agent funding');
    return null;
  }

  try {
    let secretKeyBytes: Uint8Array;

    if (raw.trim().startsWith('[')) {
      // JSON array format: [1, 2, 3, ...]
      const arr = JSON.parse(raw.trim()) as number[];
      secretKeyBytes = Uint8Array.from(arr);
    } else {
      // Base58 format
      secretKeyBytes = bs58.decode(raw.trim());
    }

    if (secretKeyBytes.length !== 64) {
      throw new Error(`Expected 64-byte secret key, got ${secretKeyBytes.length} bytes`);
    }

    _funderKeypair = Keypair.fromSecretKey(secretKeyBytes);
    // Log public key only — never the secret
    logger.info({ funderPublicKey: _funderKeypair.publicKey.toBase58() }, '✅ Funder wallet loaded');
    return _funderKeypair;
  } catch (err) {
    logger.error(
      { err: (err as Error).message },
      '❌ Failed to load FUNDER_SECRET_KEY — falling back to airdrop'
    );
    return null;
  }
}

/**
 * Returns true if a funder keypair is configured and available.
 */
export function hasFunder(): boolean {
  return getFunderKeypair() !== null;
}

/**
 * Get the funder's current SOL balance in SOL.
 */
export async function getFunderBalance(connection: Connection): Promise<number> {
  const funder = getFunderKeypair();
  if (!funder) return 0;
  const lamports = await connection.getBalance(funder.publicKey);
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Transfer SOL from funder wallet to a recipient address.
 * Throws on failure.
 */
export async function transferFromFunder(
  connection: Connection,
  toPublicKey: string,
  solAmount: number
): Promise<string> {
  const funder = getFunderKeypair();
  if (!funder) {
    throw new Error('Funder wallet not configured');
  }

  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
  const toPubkey = new PublicKey(toPublicKey);

  // Check funder has enough balance
  const funderBalance = await connection.getBalance(funder.publicKey);
  const minRequired = lamports + 10_000; // leave room for tx fee
  if (funderBalance < minRequired) {
    throw new Error(
      `Funder balance too low: has ${funderBalance / LAMPORTS_PER_SOL} SOL, ` +
      `needs ${solAmount} SOL + fees. Funder: ${funder.publicKey.toBase58()}`
    );
  }

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: funder.publicKey,
      toPubkey,
      lamports,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [funder], {
    commitment: 'confirmed',
    maxRetries: 3,
  });

  logger.info(
    {
      to: toPublicKey,
      solAmount,
      signature,
      // funder public key only, never secret
      funderPublicKey: funder.publicKey.toBase58(),
    },
    'Funder transfer successful'
  );

  return signature;
}
