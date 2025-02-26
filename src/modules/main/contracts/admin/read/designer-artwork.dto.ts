import { ArtworkId } from '@modules/app-db/entities';

export interface DesignerArtworkDto {
  id: ArtworkId;
  src: string;
  width: number;
  height: number;
  name: string;
  description?: string;
  artist: string;
  worktype: string;
  material: string;
  technique: string;
  genre: string;
  measurements: string;
  exhibition: string;
  gallery: string;
  year: string;
  urlArtwork: string;
  urlExhibition: string;
  urlGallery: string;
}
