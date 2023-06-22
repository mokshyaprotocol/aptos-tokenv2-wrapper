
import { AptosClient,TokenClient, AptosAccount,Network, HexString,BCS,FaucetClient } from "aptos";
import {WrapperClient} from "../package/wrapper"



const NODE_URL = process.env.APTOS_NODE_URL || "https://fullnode.testnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);

//pid
const pid="0xc5a997aa6cf261756b1b88823ba91b8795e85a6f309ab82f315cc7b6ed2bde01";
const wrapClient = new WrapperClient(NODE_URL,pid,Network.TESTNET)
// Creator Account for test purposes only
const account1 =  new AptosAccount(HexString.ensure("0x1111111111111111111111111111111111111111111111111111111111111111").toUint8Array());
// Token Owner Account for test purposes only
const account2 =  new AptosAccount(HexString.ensure("0x1111111111111111111111111111111111111111111111111111111111111112").toUint8Array());
function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxy';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
const collection = "Mokshya Collection"+makeid(10)
const tokenname = "Mokshya Token #1";
const description="Mokshya Token for test"
const uri = "https://github.com/mokshyaprotocol"
const tokenPropertyVersion = BigInt(0);

const token_data_id =  {creator: account1.address().hex(),
  collection: collection,
  name: tokenname,

}
const tokenId = {
  token_data_id,
  property_version: `${tokenPropertyVersion}`,
};
const tokenClient = new TokenClient(client);

 describe("Token Wrap", () => {
  before("Create Collection", async () => {
    const create_collection_payloads = {
      type: "entry_function_payload",
      function: "0x3::token::create_collection_script",
      type_arguments: [],
      arguments: [collection,description,uri,BigInt(100),[true, true, true]],
    };
    let txnRequest = await client.generateTransaction(account1.address(), create_collection_payloads);
    let txnhash = await client.signAndSubmitTransaction(account1,txnRequest)
    await client.waitForTransaction(txnhash, { checkSuccess: true });
    console.log(`Create Collection Txn: https://explorer.aptoslabs.com/txn/${txnhash}?network=testnet`);
  });
  before("Create Token", async () => {
    const create_token_payloads = {
      type: "entry_function_payload",
      function: "0x3::token::create_token_script",
      type_arguments: [],
      arguments: [collection,tokenname,description,BigInt(5),BigInt(10),uri,account1.address(),
        BigInt(100),BigInt(0),[ true, true, true, true, true, true ],
        [ "TOKEN_BURNABLE_BY_OWNER",],
        [BCS.bcsSerializeBool(true)],
        ["bool"]
      ],
    };
    let txnRequest = await client.generateTransaction(account1.address(), create_token_payloads);
    let txnhash = await client.signAndSubmitTransaction(account1,txnRequest)
    await client.waitForTransaction(txnhash, { checkSuccess: true });
    console.log(`Create Token Txn: https://explorer.aptoslabs.com/txn/${txnhash}?network=testnet`);
  });
  before("Opt In Transfer ", async () => {
    const create_token_payloads = {
      type: "entry_function_payload",
      function: "0x3::token::opt_in_direct_transfer",
      type_arguments: [],
      arguments: [true],
    };
    let txnRequest = await client.generateTransaction(account2.address(), create_token_payloads);
    let txnhash = await client.signAndSubmitTransaction(account2,txnRequest)
    await client.waitForTransaction(txnhash, { checkSuccess: true });
    console.log(`Opt In Transfer Txn: https://explorer.aptoslabs.com/txn/${txnhash}?network=testnet`);
  });
  before("Transfer Token ", async () => {
    const create_token_payloads = {
      type: "entry_function_payload",
      function: "0x3::token::transfer_with_opt_in",
      type_arguments: [],
      arguments: [account1.address(),collection,tokenname,tokenPropertyVersion,account2.address(),BigInt(1)],
    };
    let txnRequest = await client.generateTransaction(account1.address(), create_token_payloads);
    let txnhash = await client.signAndSubmitTransaction(account1,txnRequest)
    await client.waitForTransaction(txnhash, { checkSuccess: true });
    console.log(`Transfer Token Txn: https://explorer.aptoslabs.com/txn/${txnhash}?network=testnet`);
  });
  it ("Initiate Collection For Wrapping", async () => {
    let key=["TOKEN_BURNABLE_BY_OWNER"]
    let raw_txn = await wrapClient.initiate_collection(account1.address(),collection,tokenname,tokenPropertyVersion,)
    let txnhash = await client.signAndSubmitTransaction(account1,raw_txn)
    await client.waitForTransaction(txnhash, { checkSuccess: true });
    console.log(`Initiate Collection Txn: https://explorer.aptoslabs.com/txn/${txnhash}?network=testnet`);
  });
  it ("WrapToken", async () => {
    let raw_txn = await wrapClient.wrap_token(account2.address(),tokenname,tokenPropertyVersion,collection)
    let txnhash = await client.signAndSubmitTransaction(account2,raw_txn)
    await client.waitForTransaction(txnhash, { checkSuccess: true });
    console.log(`WrapToken Txn: https://explorer.aptoslabs.com/txn/${txnhash}?network=testnet`);
  });
  });
