import { Injectable } from '@nestjs/common';
import '@polkadot/api-augment';
import { MintDto } from './dto/MintDto';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api'


@Injectable()
export class MintCreator {

   async createMint(mintData: MintDto): Promise<any> {
    //First we check if user has the right to mint an NFT, if they have already minted an NFT we return 400
    //If they haven't we create the NFT for them

    const collectionID = 1 //TBA This will be hardcoded value but has to be set to actual collection that will be created
    const {name, description} = mintData;

    //TBA Upload image to IPFS here for the fetch below
    const ipfs = "IPFS image link";

    const response = await fetch("http://localhost:3001/generatenft", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "metadata": {
                "name": name,
                "description": description,
                "ipfs": ipfs
            },
            "collectionID": collectionID
        })
    });
    
    //Create Api instance
    const wsProvider = new WsProvider('wss://westmint-rpc-tn.dwellir.com');
    const api = await ApiPromise.create({ provider: wsProvider });


    //Create the NFT
    const resp = await response.json();
    const tx = api.tx(resp)   

    //Create wallet instance
    const wallet = new Keyring({ type: 'sr25519' });
    const secretKey =  "Private key for wallet" //config.get("SECRET_KEY");
    const alice = wallet.addFromUri(secretKey);

    //Sign and send the transaction also subscribe to the status of the transaction
    const hash = await tx.signAndSend(alice)

    //TBA Add subscription to notifications 

    //If NFT minting is successful return 200 else return 400

  }

}