export interface ArtistArtworkDto {
  name: string;
  description: string;
  artistName: string;
  year: string;
  slug: string;
  imageFilename: string;
  thumbnailFilename: string;
}

export interface ArtistDto {
  name: string;
  born: string;
  biography: string;
  countryCode: string;
  artistCategory: string;
  slug: string;
  artwork: ArtistArtworkDto;
}
