import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@modules/config/app-config.service';
import { NftRepository } from '@modules/app-db/repositories';
import { NftInterface } from './interface/NftInterface';
import { CollectionInterface } from './interface/ColInterface';
import { NftConfigService } from '@modules/config';

@Injectable()
export class MetaFetcher {

  constructor(private nftRepo: NftRepository, private configService: AppConfigService, private nftConfigService: NftConfigService) {

  }

  async fetchNFTMetadata(userID: string, address: string): Promise<NftInterface[]> {
    //We will fetch metadata for user and save them to the database, 
    //this call is made each time user loads their profile to see NFTS
    //Returns 200 ok if successful so project can fetch from DB
    const url = this.configService.nftModuleUrl;

    const response = await fetch(
      `${url}/metadata/nft/address/${address}`
    );

    const data: NftInterface[] = await response.json();

    for (let i = 0; i < data.length; i++) {
      if (data[i].metadata != null) {

        data[i].metadata = this.nftConfigService.convertIpfsLink(data[i].metadata);
        const fetchedData = await this.nftConfigService.fetchMetadataFromIPFS(data[i].metadata);
        const newData = typeof fetchedData === 'string' ? JSON.parse(fetchedData) : fetchedData;
        if (data[i].image != null) {
          data[i].image = this.nftConfigService.convertIpfsLink(data[i].image);
        }
        if (data[i].name == null) {
          data[i].name = newData.name
        }

        data[i].metadata = newData.description;
      }
    }
    await this.nftRepo.assignNFTsMetadata(userID, address, data);
    return data;
  }

  async fetchColMetadata(userID: string, address: string): Promise<CollectionInterface[]> {
    const url = this.configService.nftModuleUrl;

    const response = await fetch(
      `${url}/metadata/collection/address/${address}`
    );

    const data: CollectionInterface[] = await response.json();
    for (let i = 0; i < data.length; i++) {
      if (data[i].metadata != null) {

        data[i].metadata = this.nftConfigService.convertIpfsLink(data[i].metadata);
        const fetchedData = await this.nftConfigService.fetchMetadataFromIPFS(data[i].metadata);
        const newData = typeof fetchedData === 'string' ? JSON.parse(fetchedData) : fetchedData;
        if (data[i].image != null) {
          data[i].image = this.nftConfigService.convertIpfsLink(data[i].image);
        }
        if (data[i].name == null) {
          data[i].name = newData.name
        }

        data[i].metadata = newData.description;
      }
    }

    await this.nftRepo.assignColsMetadata(userID, address, data);
    return data;
  }
}