/**
 * fundingService.ts — High-level agent funding logic.
 *
 * Strategy:
 *   1. If FUNDER_SECRET_KEY is configured → transfer from funder wallet
 *   2. Otherwise → try requestAirdrop() with retries
 *   3. If both fail → mark agent as NEEDS_FUNDING, do NOT crash
 */

import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getSolBalance } from '@aws/core';
import { getConnection, airdropSolWithRetry } from './solana.js';
import { hasFunder, transferFromFunder, getFunderBalance } from './funder.js';
import { getAllAgents, getAgentById, updateAgentFundingStatus } from './db.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

export type FundingResult =
  | { ok: true; signature: string; method: 'funder' | 'airdrop'; solAmount: number }
  | { ok: false; reason: string; method: 'funder' | 'airdrop' | 'none' };

/**
 * Ensure an agent has at least MIN_AGENT_SOL.
 * Uses funder if available, falls back to airdrop, marks NEEDS_FUNDING on failure.
 */
export async function ensureAgentFunded(
  agentId: string,
  agentPublicKey: string,
  targetSol: number = config.MIN_AGENT_SOL
): Promise<FundingResult> {
  const connection = getConnection();
  const currentBalance = await getSolBalance(connection, agentPublicKey).catch(() => 0);

  if (currentBalance >= targetSol) {
    logger.debug({ agentId, currentBalance, targetSol }, 'Agent already has enough SOL');
    return { ok: true, signature: '', method: 'none' as any, solAmount: 0 };
  }

  const topUpAmount = Math.max(targetSol - currentBalance, targetSol);
  logger.info({ agentId, currentBalance, topUpAmount, targetSol }, 'Agent needs funding');

  // Strategy 1: funder wallet
  if (hasFunder()) {
    try {
      const sig = await transferFromFunder(connection, agentPublicKey, topUpAmount);
      await updateAgentFundingStatus(agentId, 'FUNDED');
      return { ok: true, signature: sig, method: 'funder', solAmount: topUpAmount };
    } catch (err) {
      logger.warn(
        { agentId, err: (err as Error).message },
        'Funder transfer failed, trying airdrop fallback'
      );
    }
  }

  // Strategy 2: airdrop fallback
  try {
    const sig = await airdropSolWithRetry(agentPublicKey, topUpAmount, 3);
    await updateAgentFundingStatus(agentId, 'FUNDED');
    return { ok: true, signature: sig, method: 'airdrop', solAmount: topUpAmount };
  } catch (err) {
    const reason = (err as Error).message;
    logger.warn({ agentId, reason }, 'All funding methods failed — marking NEEDS_FUNDING');
    await updateAgentFundingStatus(agentId, 'NEEDS_FUNDING');
    return { ok: false, reason, method: hasFunder() ? 'funder' : 'airdrop' };
  }
}

/**
 * Explicitly fund a single agent with a specific SOL amount.
 * Used by POST /agents/:id/fund
 */
export async function fundAgent(
  agentId: string,
  solAmount: number = config.MIN_AGENT_SOL
): Promise<FundingResult> {
  const agent = getAgentById(agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);

  const connection = getConnection();

  if (hasFunder()) {
    try {
      const sig = await transferFromFunder(connection, agent.publicKey, solAmount);
      await updateAgentFundingStatus(agentId, 'FUNDED');
      return { ok: true, signature: sig, method: 'funder', solAmount };
    } catch (err) {
      const reason = (err as Error).message;
      await updateAgentFundingStatus(agentId, 'NEEDS_FUNDING');
      return { ok: false, reason, method: 'funder' };
    }
  }

  // No funder — use airdrop
  try {
    const sig = await airdropSolWithRetry(agent.publicKey, solAmount, 3);
    await updateAgentFundingStatus(agentId, 'FUNDED');
    return { ok: true, signature: sig, method: 'airdrop', solAmount };
  } catch (err) {
    const reason = (err as Error).message;
    await updateAgentFundingStatus(agentId, 'NEEDS_FUNDING');
    return { ok: false, reason, method: 'airdrop' };
  }
}

/**
 * Fund all agents that are below MIN_AGENT_SOL.
 * Used by POST /agents/fund-all
 */
export async function fundAllAgents(solAmount: number = config.MIN_AGENT_SOL): Promise<{
  funded: number;
  skipped: number;
  failed: number;
  results: Array<{ agentId: string; publicKey: string; result: FundingResult }>;
}> {
  const connection = getConnection();
  const agents = getAllAgents();

  let funded = 0;
  let skipped = 0;
  let failed = 0;
  const results: Array<{ agentId: string; publicKey: string; result: FundingResult }> = [];

  for (const agent of agents) {
    const balance = await getSolBalance(connection, agent.publicKey).catch(() => 0);

    if (balance >= config.MIN_AGENT_SOL) {
      logger.debug({ agentId: agent.id, balance }, 'Agent has enough SOL, skipping');
      skipped++;
      continue;
    }

    logger.info({ agentId: agent.id, balance, solAmount }, 'Funding agent');
    const result = await fundAgent(agent.id, solAmount);
    results.push({ agentId: agent.id, publicKey: agent.publicKey, result });

    if (result.ok) {
      funded++;
    } else {
      failed++;
    }

    // Small delay to avoid hammering RPC
    await new Promise((r) => setTimeout(r, 300));
  }

  return { funded, skipped, failed, results };
}

/**
 * Check if an agent has enough SOL to perform actions.
 */
export async function hasEnoughForAction(agentPublicKey: string): Promise<boolean> {
  const connection = getConnection();
  const balance = await getSolBalance(connection, agentPublicKey).catch(() => 0);
  return balance >= config.MIN_ACTION_SOL;
}

/**
 * Get funder info for the health/status endpoint.
 */
export async function getFunderInfo(): Promise<{
  configured: boolean;
  publicKey: string | null;
  balanceSol: number | null;
}> {
  if (!hasFunder()) {
    return { configured: false, publicKey: null, balanceSol: null };
  }
  const { getFunderKeypair } = await import('./funder.js');
  const keypair = getFunderKeypair();
  if (!keypair) return { configured: false, publicKey: null, balanceSol: null };

  const connection = getConnection();
  const balance = await getFunderBalance(connection).catch(() => null);
  return {
    configured: true,
    publicKey: keypair.publicKey.toBase58(),
    balanceSol: balance,
  };
}
