module aptos_merkle::merkle{


    use std::vector;
    use std::debug;
    use std::error;
    use std::signer::address_of;
    use aptos_std::aptos_hash;
    
    const EQUAL:u8 = 0;
    const BIGGER:u8 = 1;
    const SMALLER:u8 = 2;
    const VERIFY_FAILED:u64 = 0;
    const NO_AUTHORIZATION:u64 = 1;
    const ROOT_UNEXISTED:u64 = 2;
    const LENGTH_INVALID:u64 = 3;

    const Admin:address = @aptos_merkle;

    struct Root has key {
        hash : vector<u8>
    }

    fun extract_vector(vec:vector<u8>,start:u64,end:u64):vector<u8>{
        let result = vector::empty<u8>();
        let len = vector::length(&vec);

        assert!(start <= end && end <= len,error::out_of_range(1));
        let index = start;
        while(index < end){
            vector::push_back(&mut result,*vector::borrow(&vec,index));
            index = index + 1;
        };
        result
    }

    fun hashPair(a:vector<u8>,b:vector<u8>):vector<u8>{
        if(compare_vector(&a,&b)==SMALLER){
            vector::append(&mut a,b);
            aptos_hash::keccak256(a)
        }else{
            vector::append(&mut b,a);
            aptos_hash::keccak256(b)
        }
    }

    fun processProof(proof:vector<u8>,leaf:vector<u8>):vector<u8>{
        assert!(vector::length(&proof)%32==0,error::invalid_argument(LENGTH_INVALID));
        let deep = vector::length(&proof)/32;
        assert!(vector::length(&leaf)==32,error::invalid_argument(LENGTH_INVALID));
        let node = leaf;
        let index = 0;
        while(index < deep){
            node = hashPair(node,extract_vector(proof,index*32,index*32+32));
            index = index +1;
        };
        node
    }

    fun compare_vector(a:&vector<u8>,b:&vector<u8>):u8{
        let len = vector::length(a);
        assert!(vector::length(b)==len,error::invalid_argument(LENGTH_INVALID));
        let index = 0;
        while(index < len){
            if(*vector::borrow(a,index) > *vector::borrow(b,index)){
                return BIGGER
            };
            if(*vector::borrow(a,index) < *vector::borrow(b,index)){
                return SMALLER
            };
            index = index +1;
        };
        EQUAL
    }

    public entry fun set_root(signer:&signer,new_root:vector<u8>)acquires Root{
        assert!(address_of(signer)==Admin,error::permission_denied(NO_AUTHORIZATION));
        if(!exists<Root>(Admin)){
            move_to(
                signer,
                Root{
                    hash:new_root
                }
            );
        }else{
            let root = borrow_global_mut<Root>(Admin);
            root.hash = new_root;
        }
    }

    public entry fun verify(proof:vector<u8>,leaf:vector<u8>)acquires Root {
        assert!(exists<Root>(Admin),error::not_found(ROOT_UNEXISTED));
        let root = borrow_global<Root>(Admin);
        assert!(compare_vector(&processProof(proof,leaf),&root.hash)==EQUAL,error::invalid_argument(VERIFY_FAILED));
    }

}