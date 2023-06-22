
import { HexString,AptosClient, Provider, Types,Network,TxnBuilderTypes, BCS } from "aptos";



export class WrapperClient
{
  client: AptosClient;
  pid: string;
  provider:Provider;

  constructor(nodeUrl: string, pid:string,network:Network) {
    this.client = new AptosClient(nodeUrl);
    // Initialize the module owner account here
    this.pid = pid
    this.provider= new Provider(network)
  }
  /**
   * Inititate Collection for wrapping
   *
   * @param creatorAddress Collection Creator Address
   * @param collectionName Collection name
   * @param tokenName Token name
   * @returns Promise<TxnBuilderTypes.RawTransaction>
   */
  // :!:>initiate_collection
  async initiate_collection(
    creatorAddress: HexString,
    collectionName: string,
    tokenName: string,
    propertyVersion: BCS.AnyNumber,
  ): Promise<TxnBuilderTypes.RawTransaction> {
    return await this.provider.generateTransaction(creatorAddress, {
      function: `${this.pid}::wrapper::initiate_collection`,
      type_arguments: [],
      arguments: [creatorAddress, collectionName,tokenName,propertyVersion,],
    });
  }
  /**
   * Inititate Collection for wrapping
   *
   * @param creatorAddress Collection Creator Address
   * @param tokenName Token name
   * @param propertyVersion Property version of token
   * @param collectionName Collection name
   * @returns Promise<TxnBuilderTypes.RawTransaction>
   */
  // :!:>wrap_token
  async wrap_token(
    holderAddress:HexString,
    tokenName: string,
    propertyVersion: BCS.AnyNumber,
    collectionName:string
    ): Promise<TxnBuilderTypes.RawTransaction> {
      let wrapObj = await this.objectAddress(collectionName)
      return await this.provider.generateTransaction(holderAddress, {
        function: `${this.pid}::wrapper::wrap_token`,
        type_arguments: [],
        arguments: [tokenName, propertyVersion,wrapObj],
      });
  }
  //helper function
  async objectAddress(collectionName:string): Promise<HexString> {
    const payload: Types.ViewRequest = {
      function: `${this.pid}::wrapper::wrap_obj_address`,
      type_arguments: [],
      arguments: [collectionName],
    };
  
    const result = await this.provider.view(payload);
    return HexString.ensure(result[0] as any);
  }
  }

