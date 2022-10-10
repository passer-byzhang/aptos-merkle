import { AptosAccount,  HexString, AptosClient,TxnBuilderTypes,BCS } from "aptos";

import {NODE_URL,privateKey,get_proof} from "./common"
import keccak256 from "keccak256";
const client = new AptosClient(NODE_URL);
const admin = new AptosAccount(new HexString(privateKey).toUint8Array());
const {
    AccountAddress,
    EntryFunction,
    TransactionPayloadEntryFunction,
    RawTransaction,
    ChainId,
  } = TxnBuilderTypes;
async function verify(proof:Uint8Array,hash:Buffer) {
    console.log(`set merkle root: ${hash}`);
    const entryFunctionPayload = new TransactionPayloadEntryFunction(
        EntryFunction.natural(
          
          "0xe463a68bb1dd0d9b9864ed030a8cd357f2a38b6b3fea92c0af07694db203a6e0::merkle",
          
          "verify",
          
          [],
          
          [BCS.bcsSerializeBytes(proof),BCS.bcsSerializeBytes(hash)],
        ),
      );
      console.log(BCS.bcsSerializeBytes(proof));
      console.log(BCS.bcsSerializeBytes(hash));
    
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

let account = '0x09d4ee382de0fa20f889ac6158273f29c81a1fec7385e8e26801db2e9e0c2f32'
//console.log('0x254a8d20f95c8a0ac2cb39041ba3375f6742dea2accf4361028e43ea669b8a91');
verify(get_proof(account),keccak256(account));

//console.log(Buffer.from('0x254a8d20f95c8a0ac2cb39041ba3375f6742dea2accf4361028e43ea669b8a91'.slice(2),'hex'))
