import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@modules/config/app-config.service';
import { AdminRepository, NftRepository } from '@modules/app-db/repositories';
import { NftData } from '@modules/app-db/entities';
import { NftConfigService } from '@modules/config';
import { Logger } from '@nestjs/common';

export enum MintStatus {
  MintedAlready = 'MintedAlready',
  Success = 'Success',
  Failed = 'Failed'
}

@Injectable()
export class MintCreator {
  private readonly logger = new Logger(MintCreator.name)

  constructor(private configService: AppConfigService, private nftRepository: NftRepository, private adminRepository: AdminRepository, private nftConfigService: NftConfigService) {
  }

  async createMint(userId: string, artworkId: string): Promise<MintStatus> {
    //First we check if user has the right to mint an NFT, if they have already minted an NFT we return null
    //If they haven't we create the NFT for them
    const user = await this.nftRepository.getUser(userId);
    const artwork = await this.nftRepository.getArtwork(userId, artworkId);
    const artworkImage = await this.adminRepository.getArtworkImage(userId, artworkId);
    this.logger.log("Got here");

    if (artwork == null || user.trialMintClaimed == true || user.trialMintId != null) {
      return MintStatus.MintedAlready;
    }

    const url = this.configService.nftModuleUrl;

    //Create metadata
    const descriptionParts = [
      artwork.description ? `Description: ${artwork.description}` : null,
      artwork.artist?.name ? `Artist: ${artwork.artist.name}` : null,
      artwork.year ? `Year: ${artwork.year}` : null,
      artwork.artworkGenre?.name ? `Genre: ${artwork.artworkGenre.name}` : null,
      artwork.artworkMaterial?.name ? `Material: ${artwork.artworkMaterial.name}` : null,
      artwork.artworkTechnique?.name ? `Technique: ${artwork.artworkTechnique.name}` : null,
      artwork.artworkWorktype?.name ? `Worktype: ${artwork.artworkWorktype.name}` : null,
      artwork.measurements ? `Measurements: ${artwork.measurements}` : null,
    ].filter(part => part !== null);

    const description = descriptionParts.join(', ');

    const formData = new FormData();
    const fileBlob = new Blob([artworkImage.image], { type: artworkImage.mimeType });

    // Append fields and files to the FormData object
    formData.append('file', fileBlob);
    formData.append('name', artwork.name);
    formData.append('metadata', description);

    const response = await fetch(`${url}/trial/mint`, {
      method: 'PUT',
      body: formData
    });

    const { nftID, metadataCid } = await response.json();
    this.logger.log("Received response", nftID, metadataCid, response);

    if (nftID != null && metadataCid != null) {
      const collectionID = this.nftConfigService.collectionId;
      const EvaGalleryWalletAddress = this.nftConfigService.walletAddress;

      //replace ipfs://ipfs/ with https://ipfs1.fiit.stuba.sk/ipfs/
      let metadata = metadataCid as string;
      if (metadata.startsWith("ipfs://ipfs/")) {
        metadata = this.nftConfigService.convertIpfsLink(metadata);
      }
      const cidResp = await this.nftConfigService.fetchMetadataFromIPFS(metadata);

      const cid = JSON.parse(cidResp);

      //also replace ipfs://ipfs/ with https://ipfs1.fiit.stuba.sk/ipfs/
      let image = cid.image as string;
      if (image.startsWith("ipfs://ipfs/")) {
        image = this.nftConfigService.convertIpfsLink(image);
      }
      const nft: NftData = {
        id: `${collectionID}-${nftID}`,
        name: artwork.name,
        description: cid.description,
        image: image,
      }
      this.logger.log("Adding to DB", response);
      await this.nftRepository.trialMint(user.id, artworkId, nft, EvaGalleryWalletAddress);
      this.logger.log("Added to DB", response);
      return MintStatus.Success;
    }

    return MintStatus.Failed;
  }
} 