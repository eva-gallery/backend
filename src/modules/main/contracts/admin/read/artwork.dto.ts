import { OptionDto } from '@common/helpers';
import { AiMode, AiGeneratedStatus, ImageDuplicateStatus, ArtistId, ArtworkId, NftId, CollectionId, WalletId, ArtworkGenreId, ArtworkWorktypeId, ArtworkMaterialId, ArtworkTechniqueId } from '@modules/app-db/entities';

export interface ArtworkDto {
  id: ArtworkId;
  name: string;
  description: string;
  artist: {
    id: ArtistId;
    name: string;
    born: string;
    biography: string;
  };
  year: string;
  nft: {
    id: NftId;
    walletId: WalletId;
    nftData: {
      id: string;
      name: string;
      description: string;
      image: string;
    }
    onlineCheck: string;
    collection: {
      id: CollectionId;
      walletId: WalletId;
      colData: {
        id: string;
        name: string;
        description: string;
        image: string;
      }
      onlineCheck: string;
    }
  }
  ai: boolean;
  aiMode: AiMode;
  aiProcessing: boolean;
  aiGeneratedStatus: AiGeneratedStatus;
  aiDuplicateStatus: ImageDuplicateStatus;
  tags: string;
  artworkGenre: OptionDto<ArtworkGenreId>;
  artworkWorktype: OptionDto<ArtworkWorktypeId>;
  artworkMaterial: OptionDto<ArtworkMaterialId>;
  artworkTechnique: OptionDto<ArtworkTechniqueId>;
  measurements: string;
  width: number;
  height: number;
  public: boolean;
}
