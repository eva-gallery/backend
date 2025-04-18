import { ArtistDto } from './artist.dto';
import { ArtistDetailDto } from './artist-detail.dto';
import { ArtworkDto } from './artwork.dto';
import { ArtworkDetailDto } from './artwork-detail.dto';
import { GalleryDto } from './gallery.dto';
import { GalleryDetailDto } from './gallery-detail.dto';
import { ExhibitionDto } from './exhibition.dto';
import { ExhibitionDetailDto } from './exhibition-detail.dto';
import { NftDto } from './nft.dto';
import { NftDetailDto } from './nft-detail.dto';
import { mapEmpty } from '@common/helpers';
import { getExtensionForMimeType } from '@common/helpers';
import {
  Artist, Artwork, Gallery, Exhibition, Nft
} from '@modules/app-db/entities';
import { DesignerArtworkDto } from '../admin/read/designer-artwork.dto';

export { createDesignerRoomDto, createDesignerLibraryItemDto, createDesignerArtworkDto } from '../admin/read';

export function createArtistDto(artist: Artist): ArtistDto {
  const artwork = artist.artworks.length > 0 ? artist.artworks[0] : null;
  return {
    name: artist.name,
    born: artist.born,
    biography: artist.biography,
    countryCode: artist.country.code,
    artistCategory: artist.artistCategory?.name,
    slug: artist.slug,
    artwork: artwork != null ? {
      name: artwork.name,
      description: artwork.description,
      artistName: artwork.artist.name,
      year: artwork.year,
      slug: artwork.slug,
      imageFilename: artwork.imageHash ? 
        `${artwork.imageHash}.${artwork.image?.mimeType ? getExtensionForMimeType(artwork.image.mimeType) || 'jpg' : 'jpg'}` : undefined,
      thumbnailFilename: artwork.imageHash ? 
        `${artwork.imageHash}.${artwork.thumbnail?.mimeType ? getExtensionForMimeType(artwork.thumbnail.mimeType) || 'jpg' : 'jpg'}` : undefined,
    } : null
  };
}

export function createArtistDetailDto(artist: Artist): ArtistDetailDto {
  return {
    name: artist.name,
    born: artist.born,
    biography: artist.biography,
    countryCode: artist.country.code,
    artistCategory: artist.artistCategory?.name,
    facebookProfileLink: artist.facebookProfileLink,
    instagramProfileLink: artist.instagramProfileLink,
    xProfileLink: artist.xProfileLink,
  };
}

export function createArtworkDto(artwork: Artwork): ArtworkDto {
  return {
    name: artwork.name,
    description: artwork.description,
    artistName: artwork.artist.name,
    countryCode: artwork.artist.country.code,
    year: artwork.year,
    slug: artwork.slug,
    likes: artwork.likes,
    imageFilename: artwork.imageFilename,
    thumbnailFilename: artwork.thumbnailFilename,
  };
}

export function createArtworkDetailDto(artwork: Artwork): ArtworkDetailDto {
  return {
    name: artwork.name,
    description: artwork.description,
    artist: {
      name: artwork.artist.name,
      born: artwork.artist.born,
      biography: artwork.artist.biography,
      countryCode: artwork.artist.country.code,
      slug: artwork.artist.slug,
    },
    year: artwork.year,
    nft: artwork.nft != null ? mapEmpty(artwork.nft, nft => ({
      nftData: nft.nftData != null ? mapEmpty(nft.nftData, nftData => ({
        name: nftData.name,
        image: nftData.image,
      })) : null,
      collection: nft.collection != null ? mapEmpty(nft.collection, col => ({
        colData: col.colData != null ? mapEmpty(col.colData, colData => ({
          name: colData.name,
          image: colData.image,
        })) : null
      })) : null
    })) : null,
    ai: artwork.ai,
    tags: artwork.tags,
    artworkGenre: artwork.artworkGenre?.name,
    artworkWorktype: artwork.artworkWorktype?.name,
    artworkMaterial: artwork.artworkMaterial?.name,
    artworkTechnique: artwork.artworkTechnique?.name,
    measurements: artwork.measurements,
    width: artwork.width,
    height: artwork.height,
    likes: artwork.likes,
    imageFilename: artwork.imageFilename,
    thumbnailFilename: artwork.thumbnailFilename,
  };
}

export function createGalleryDto(gallery: Gallery): GalleryDto {
  return {
    name: gallery.name,
    description: gallery.description,
    address: gallery.address,
    countryCode: gallery.country.code,
    gps: gallery.gps,
    slug: gallery.slug,
  };
}

export function createGalleryDetailDto(gallery: Gallery): GalleryDetailDto {
  return {
    name: gallery.name,
    description: gallery.description,
    address: gallery.address,
    countryCode: gallery.country?.code,
    gps: gallery.gps,
  };
}

export function createExhibitionDto(exhibition: Exhibition): ExhibitionDto {
  const artwork = exhibition.artworks?.[0] ?? null;
  return {
    id: exhibition.id, 
    name: exhibition.name,
    fromDate: exhibition.fromDate?.toISOString() ?? null,
    toDate: exhibition.toDate?.toISOString() ?? null,
    curator: exhibition.curator,
    gallery: exhibition.gallery != null ? {
      name: exhibition.gallery.name,
      slug: exhibition.gallery.slug,
    } : null,
    artwork: artwork != null ? {
      name: artwork.name,
      slug: artwork.slug,
    } : null,
    activeRoomId: exhibition.activeRoomId,
    slug: exhibition.slug,
  };
}

export function createExhibitionDetailDto(exhibition: Exhibition): ExhibitionDetailDto {
  return {
    id: exhibition.id, 
    name: exhibition.name,
    fromDate: exhibition.fromDate?.toISOString() ?? null,
    toDate: exhibition.toDate?.toISOString() ?? null,
    curator: exhibition.curator,
    gallery: {
      name: exhibition.gallery.name,
      slug: exhibition.gallery.slug,
      countryCode: exhibition.gallery.country.code,
    },
    activeRoomId: exhibition.activeRoomId,
  };
}

export function createNftDto(nft: Nft): NftDto {
  return {
    nftData: {
      id: nft.nftData.id,
      name: nft.nftData.name,
      description: nft.nftData.description,
      image: nft.nftData.image,
    },
    slug: nft.slug,
    canBeMinted: nft.canBeMinted,
    artwork: {
      name: nft.artwork.name,
      slug: nft.artwork.slug,
    }
  };
}

export function createNftDetailDto(nft: Nft): NftDetailDto {
  return {
    nftData: {
      id: nft.nftData.id,
      name: nft.nftData.name,
      description: nft.nftData.description,
      image: nft.nftData.image,
    },
    canBeMinted: nft.canBeMinted,
    artwork: {
      name: nft.artwork.name,
      slug: nft.artwork.slug,
    }
  };
}

export function createPublicDesignerArtworkDto(artwork: Artwork, exhibition: Exhibition): DesignerArtworkDto {
  
  // For artwork: userLabel/artistLabel/artworkLabel
  const userLabel = artwork.artist.user?.label || "unknown-user";
  const artistLabel = artwork.artist?.label || "unknown-artist";
  const artworkLabel = artwork?.label || "unknown-artwork";
  const artworkSlug = `${userLabel}/${artistLabel}/${artworkLabel}`;
  
  // For exhibition: galleryUserLabel/galleryLabel/exhibitionLabel
  const galleryUserLabel = exhibition.gallery.user?.label || "unknown-user";
  const galleryLabel = exhibition.gallery?.label || "unknown-gallery";
  const exhibitionLabel = exhibition?.label || "unknown-exhibition";
  const exhibitionSlug = `${galleryUserLabel}/${galleryLabel}/${exhibitionLabel}`;
  const gallerySlug = `${galleryUserLabel}/${galleryLabel}`;
  
  // Create base DTO with required properties
  const dto: any = {
    id: artwork.id,
    src: `/public/artwork/${artwork.id}/unity-image`, // This remains as admin path for image loading
    width: artwork.width,
    height: artwork.height,
    name: artwork.name,
    artist: artwork.artist.name,
    exhibition: exhibition.name,
    gallery: exhibition.gallery.name,
    urlArtwork: `/artworks/${artworkSlug}`,
    urlExhibition: `/exhibitions/${exhibitionSlug}`,
    urlGallery: `/galleries/${gallerySlug}`,
  };
  
  // Add optional properties only if they exist
  if (artwork.artworkWorktype?.name) dto.worktype = artwork.artworkWorktype.name;
  if (artwork.artworkMaterial?.name) dto.material = artwork.artworkMaterial.name;
  if (artwork.artworkTechnique?.name) dto.technique = artwork.artworkTechnique.name;
  if (artwork.artworkGenre?.name) dto.genre = artwork.artworkGenre.name;
  if (artwork.measurements) dto.measurements = artwork.measurements;
  if (artwork.year) dto.year = artwork.year;
  
  return dto as DesignerArtworkDto;
}


