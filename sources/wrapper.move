// Module to wrap token v1 to token v2

address wrapper
{
    module wrapper
    {
        use std::signer;
        use std::bcs;
        use std::string::{String};
        use aptos_framework::object::{Self,Object};
        use aptos_token_objects::aptos_token::{Self as tokenv2,AptosToken as TokenV2};
        use aptos_framework::account;
        use aptos_std::option;
        // use std::vector;
        use aptos_std::simple_map::{Self, SimpleMap};

        use aptos_token::token as tokenv1;
        // use aptos_token::property_map;

        /// The collection doesn't exist
        const ENO_COLLECTION_DOESNT_EXIST:u64=1;
        /// Royalty receiver doesn't match
        const ENO_NOT_ROYALTY_RECEIVER:u64=2;
        /// No token in token store
        const ENO_NO_TOKEN_IN_TOKEN_STORE:u64=3;
        /// Collection Name already initiated
        const ENO_ALREADY_INITIATED:u64=4;
        /// Collection not initiated
        const ENO_NO_WRAP_OBJ:u64=5;

        struct Wrapper has key
        {
            collection:String,
            creator_address:address,
            treasury_cap:account::SignerCapability,            
        }
        struct ObjectMap  has key {
        wraopObjMap: SimpleMap<vector<u8>,address>,
        }
        fun init_module(account:&signer)
        {
            move_to(account, ObjectMap { wraopObjMap: simple_map::create() })

        }
        // a token name with collection info is sent
        // royalty payee address is extracted to verify the creator
        // this is because most of the collection are published through resource
        // account
        public entry fun initiate_collection(
            owner: &signer, 
            creator_address: address,
            collection_name: String,
            token_name:String,
            property_version:u64,
        )acquires ObjectMap{
            let owner_addr = signer::address_of(owner);
            assert!(tokenv1::check_collection_exists(creator_address,collection_name),ENO_COLLECTION_DOESNT_EXIST);
            let token_id = tokenv1::create_token_id_raw(creator_address,collection_name,token_name,property_version);
            // this verifies the sender is the owner of the collection
            assert!(tokenv1::get_royalty_payee(&tokenv1::get_royalty(token_id))==owner_addr,ENO_NOT_ROYALTY_RECEIVER);
            let construction_ref = object::create_named_object(owner,bcs::to_bytes(&collection_name));
            let signing = object::generate_signer(&construction_ref);
            let (_resource, resource_cap) = account::create_resource_account(owner, bcs::to_bytes(&collection_name));
            let resource_signer_from_cap = account::create_signer_with_capability(&resource_cap);
            let collection_mutability_config= tokenv1::get_collection_mutability_config(creator_address,collection_name);
            let token_mutability_config = tokenv1::get_tokendata_mutability_config(tokenv1::get_tokendata_id(token_id));
            tokenv2::create_collection(
                &resource_signer_from_cap,
                tokenv1::get_collection_description(creator_address,collection_name),
                *option::borrow(&tokenv1::get_collection_supply(creator_address,collection_name)),
                collection_name,
                tokenv1::get_collection_uri(creator_address,collection_name),
                tokenv1::get_collection_mutability_description(&collection_mutability_config),
                tokenv1::get_token_mutability_royalty(&token_mutability_config),
                tokenv1::get_collection_mutability_uri(&collection_mutability_config),
                tokenv1::get_token_mutability_description(&token_mutability_config),
                false, // token name is not allowed to be mutated
                tokenv1::get_token_mutability_default_properties(&token_mutability_config),
                tokenv1::get_token_mutability_uri(&token_mutability_config),
                true,
                true,
                tokenv1::get_royalty_numerator(&tokenv1::get_royalty(token_id)), //numerator
                tokenv1::get_royalty_denominator(&tokenv1::get_royalty(token_id)), //denominator
            );
            move_to<Wrapper>(&signing,Wrapper{
                collection:collection_name,
                creator_address:creator_address,
                treasury_cap:resource_cap,
            });
            let maps = borrow_global_mut<ObjectMap>(@wrapper);
            assert!(!simple_map::contains_key(&maps.wraopObjMap, &bcs::to_bytes(&collection_name)),ENO_ALREADY_INITIATED);
            simple_map::add(&mut maps.wraopObjMap, bcs::to_bytes(&collection_name),signer::address_of(&signing));
        }

        public entry fun wrap_token(
            token_holder: &signer, 
            token_name:String,
            property_version:u64,
            wrap_obj:Object<Wrapper>
        )acquires Wrapper {
            let holder_addr = signer::address_of(token_holder);
            let wrap_info = borrow_global<Wrapper>(object::object_address(&wrap_obj));
            let token_id = tokenv1::create_token_id_raw(wrap_info.creator_address,wrap_info.collection,token_name,property_version);
            assert!(tokenv1::balance_of(holder_addr,token_id)>=1,ENO_NO_TOKEN_IN_TOKEN_STORE);
            let resource_signer_from_cap = account::create_signer_with_capability(&wrap_info.treasury_cap);
            let token_creation_num = account::get_guid_next_creation_num(account::get_signer_capability_address(&wrap_info.treasury_cap));
            let token_data = tokenv1::get_tokendata_id(token_id);
            tokenv1::burn(
                token_holder,
                wrap_info.creator_address,
                wrap_info.collection,
                token_name,
                property_version,
                1
            );
            // functions not in testnet or mainnet
            // let propertymap = tokenv1::get_property_map(holder_addr,token_id); // gives PropertyMap
            // let keys = property_map::keys(&propertymap);
            // let types=property_map::types(&propertymap);
            // let values= property_map::values(&propertymap);

            tokenv2::mint(
            &resource_signer_from_cap,
            wrap_info.collection,
            tokenv1::get_tokendata_description(token_data),
            token_name,
            tokenv1::get_tokendata_uri(wrap_info.creator_address,token_data),
            // keys,
            // types,
            // values,
            vector<String>[],
            vector<String>[],
            vector<vector<u8>>[],
            ); 
            let minted_token = object::address_to_object<TokenV2>(object::create_guid_object_address(account::get_signer_capability_address(&wrap_info.treasury_cap), token_creation_num));
            object::transfer( &resource_signer_from_cap, minted_token, holder_addr);
        }
        #[view]
        public fun wrap_obj_address(collection:String) : address acquires ObjectMap
        {
            let maps = borrow_global<ObjectMap>(@wrapper);
            assert!(simple_map::contains_key(&maps.wraopObjMap, &bcs::to_bytes(&collection)),ENO_NO_WRAP_OBJ);
            let obj_address = *simple_map::borrow(&maps.wraopObjMap, &bcs::to_bytes(&collection));
            obj_address
        }
}
}