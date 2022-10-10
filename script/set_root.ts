/** AptosAccount provides methods around addresses, key-pairs */

import { AptosAccount,  HexString, AptosClient,TxnBuilderTypes,BCS } from "aptos";

import {NODE_URL,privateKey} from "./common"





const client = new AptosClient(NODE_URL);
const admin = new AptosAccount(new HexString(privateKey).toUint8Array());
const {
    AccountAddress,
    EntryFunction,
    TransactionPayloadEntryFunction,
    RawTransaction,
    ChainId,
  } = TxnBuilderTypes;
async function set_root(hash:string) {
    console.log(`set merkle root: ${hash}`);
    const entryFunctionPayload = new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          
          "0xe463a68bb1dd0d9b9864ed030a8cd357f2a38b6b3fea92c0af07694db203a6e0::merkle",
          
          "set_root",
          
          [],
          
          [BCS.bcsSerializeBytes(Buffer.from(hash.slice(2),'hex')),],
        ),
      );
      
    
      const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
        client.getAccount(admin.address()),
        client.getChainId(),
      ]);
    
      // See class definiton here
      // https://aptos-labs.github.io/ts-sdk-doc/classes/TxnBuilderTypes.RawTransaction.html#constructor.
      const rawTxn = new RawTransaction(
        // Transaction sender account address
        AccountAddress.fromHex(admin.address()),
        BigInt(sequenceNumber),
        entryFunctionPayload,
        // Max gas unit to spend
        BigInt(2000),
        // Gas price per unit
        BigInt(100),
        // Expiration timestamp. Transaction is discarded if it is not executed within 10 seconds from now.
        BigInt(Math.floor(Date.now() / 1000) + 10),
        new ChainId(chainId),
      );
    
      // Sign the raw transaction with account1's private key
      const bcsTxn = AptosClient.generateBCSTransaction(admin, rawTxn);
    
      const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
    
      await client.waitForTransaction(transactionRes.hash);
    console.log(transactionRes.hash);
}
//console.log('0x254a8d20f95c8a0ac2cb39041ba3375f6742dea2accf4361028e43ea669b8a91');
set_root('0x9631ed26c30837034747a06b272a8b8324170e18a74b3479bd46aef5fc598a30');

//console.log(Buffer.from('0x254a8d20f95c8a0ac2cb39041ba3375f6742dea2accf4361028e43ea669b8a91'.slice(2),'hex'))