import {
  VersionedTransaction,
  BlockhashWithExpiryBlockHeight,
  Transaction,
  Connection,
  PublicKey,
  Signer,
  Keypair,
  ComputeBudgetInstruction,
  TransactionMessage,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import BN from 'bn.js';
import {
  initSdk,
  logger,
  isValidAmm,
  sleep,
  getWallet,
  txVersion,
  RPC_ENDPOINT,
  POOL_ADDRESS,
  COMPUTE_UNIT_LIMIT,
  COMPUTE_UNIT_PRICE,
  BUFFER,
} from '../config';
import { isReturnStatement } from 'typescript';
import { TransportMultiOptions } from 'pino';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import { MINT_SIZE, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import InstructionNamespaceFactory from '@project-serum/anchor/dist/cjs/program/namespace/instruction';
import { sign } from 'crypto';
import { promises } from 'fs';
const poolId = POOL_ADDRESS;


const jitpTipAccounts = [
  'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
  'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
  '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
  '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
  'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
  'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
  'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
];

export const getRandomValidatorKey = (): PublicKey => {
  const randomValidator = jitpTipAccounts[Math.floor(Math.random() * jitpTipAccounts.length)];
  return new PublicKey(randomValidator);
};

export const getPoolInfo = async (connection: Connection, wallet: Keypair) => {

  const pumpfun = await initSdk(connection, wallet);
  let poolInfo: ApiV3PoolInfoStandardItemAmm;
  let poolKeys: AmmKeys | undefined;
  let tickCache: ReturnTypeFetchMultiplePoolTickArrays;
  let AmmPoolInfo: AmmPoolInfoInterface;
  let rpcData: AmmRpcData;

  if (pumpfun.cluster === 'mainnet') {
    const data = await pumpfun.api.fetchPoolById({ ids: poolId });
    poolInfo = data[0] as ApiV3PoolInfoStandardItemAmm;
    if (!isValidAmm(poolInfo.programId)) throw new Error('target pool is not Amm pool');
    rpcData = await pumpfun.Amm.getRpcPoolInfo(poolInfo.id, true);
  } else {
    const data = await pumpfun.Amm.getPoolInfoFromRpc(poolId);
    poolInfo = data.poolInfo;
    poolKeys = data.poolKeys;
    rpcData = data.rpcData;
  }

  return {
    pumpfun: pumpfun,
    poolInfo: poolInfo,
    poolKeys: poolKeys,
    rpcData: rpcData,
  };
};

export const getAmountOut = async (inputAmount: BN, baseIn: boolean, rpcData: AmmRpcData) => {
  return CurveCalculator.swap(
    inputAmount,
    baseIn ? rpcData.baseReserve : rpcData.quoteReserve,
    baseIn ? rpcData.quoteReserve : rpcData.baseReserve,
    rpcData.configInfo!.tradeFeeRate,
  )
};

// export const makeSwapTransaction = async (
//   poolInfo: any,
//   poolKeys: any,
//   baseIn: any,
//   slippage: any,
//   swapResult: any,
//   pumpfun: pumpfun,
//   latestBlockhash: BlockhashWithExpiryBlockHeight,
//   signers: Array<Keypair>,                                               // Array<Signer>: the correct datatype
//   connection: Connection,
//   payer: Keypair,
//   jitoFee: string,
// ) => {
//   const provider = payer.publicKey;
//   const { transaction } = await pumpfun.Amm.swap<TxVersion.V0>({
//     poolInfo,
//     poolKeys,
//     payer: provider,
//     baseIn,
//     slippage,
//     swapResult,
//     // txVersion: TxVersion.LEGACY
//   });

//   // transaction.feePayer = provider;
//   transaction.recentBlockhash = latestBlockhash.blockhash;
//   if (signers.length > 0) {
//     // transaction.add(
//     //   SystemProgram.createAccount({
//     //     fromPubkey: payer.publicKey,
//     //     newAccountPubkey: payer.publicKey,
//     //     space: MINT_SIZE,
//     //     lamports: 1,
//     //     programId: TOKEN_PROGRAM_ID
//     //   })
//     // )

//     // transaction.sign(...signers);
//     // transaction.addSignature(provider, Buffer.from(payer.secretKey));
//   } else {
//     throw new Error("No signers provided for the transaction.");
//   }
//   console.log("===========TRNASACTION SIGNATURE==============", transaction.signatures);
//   return transaction;
// };


export const makeSwapTransaction = async (
  pumpfun: pumpfun,
  poolInfo: ApiV3PoolInfoStandardItemAmm,
  poolKeys: AmmKeys,
  payer: PublicKey,
  baseIn: boolean,
  slippage: number,
  swapResult: SwapResult,
): Promise<VersionedTransaction> => {
  const { transaction, execute } = await pumpfun.Amm.swap({
    poolInfo,
    poolKeys,
    payer,
    baseIn,
    slippage,
    swapResult,
    // config.bypassAssociatedCheck,
    // config.checkCreateATAOwner,
    // config.associatedOnly,
    // computeBudgetConfig,
  });
  // transaction.serialize()
  const { signedTx } = await execute();
  let transaction1 = signedTx;
  return transaction as VersionedTransaction
}


export const confirm = async (
  connection: Connection,
  signature: string,
  latestBlockhash: BlockhashWithExpiryBlockHeight,
) => {

  const confirmation = await connection.confirmTransaction(
    {
      signature,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      blockhash: latestBlockhash.blockhash,
    },
    'confirmed',
  );

  return { confirmed: !confirmation.value.err, signature };
};


export const executeAndConfirm = async (
  connection: Connection,
  transaction: VersionedTransaction,
  latestBlockhash: BlockhashWithExpiryBlockHeight,
): Promise<{ confirmed: boolean; signature?: string; error?: string }> => {
  logger.debug('Executing transaction...');

  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    preflightCommitment: connection.commitment,
  });

  return await confirm(connection, signature, latestBlockhash);
};
function tyepof(secretKey: any): any {
  throw new Error('Function not implemented.');
}

