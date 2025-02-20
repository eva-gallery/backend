import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { isUUID } from 'class-validator';
import { deserializeEntity } from '@common/helpers';
import { getExtensionForMimeType } from '@common/helpers';
import {
  Artist, Artwork, Gallery, Exhibition, Nft, Resource, UnityRoom, UnityItemType,
  ArtworkId, ResourceId, UnityRoomId,
  ArtworkImageId
} from '../entities';

export const MAX_SEED = 2 ** 32;

@Injectable()
export class PublicRepository {

  constructor(
    @InjectRepository(Artist) private artists: Repository<Artist>,
    @InjectRepository(Artwork) private artworks: Repository<Artwork>,
    @InjectRepository(Gallery) private galleries: Repository<Gallery>,
    @InjectRepository(Exhibition) private exhibitions: Repository<Exhibition>,
    @InjectRepository(Nft) private nfts: Repository<Nft>,
    @InjectRepository(UnityRoom) private unityRooms: Repository<UnityRoom>,
    @InjectRepository(UnityItemType) private unityItemTypes: Repository<UnityItemType>,
    @InjectRepository(Resource) private resources: Repository<Resource>,
  ) { }
  
  async getRandomArtists(seed: number, from: number = 0, count: number = 1) {
    const nseed = seed / MAX_SEED;
    return this.artists.manager.transaction(async mgr => {
      await mgr.query(`SELECT setseed(${nseed})`);
      const subQuery = mgr.getRepository(Artwork).createQueryBuilder("artwork")
        .select(["artwork.id", "artwork.name", "artwork.label", "artwork.artist_id", "artwork.image_hash", "artwork.image_mime_type", "artwork.thumbnail_mime_type"])
        .where("artwork.public = true")
        .andWhere("artwork.artist_id = artist.id")
        .orderBy("random()")
        .limit(1);
      const query = mgr.getRepository(Artist).createQueryBuilder("artist")
        .select(["artist.name", "artist.label"])
        .innerJoin("artist.user", "user")
        .addSelect(["user.label"])
        .innerJoin("artist.country", "country")
        .addSelect(["country.code"])
        .innerJoinAndSelect((qb) => {
          qb.getQuery = () => `LATERAL (${subQuery.getQuery()})`;
          return qb;
        }, "artwork", "true")
        .orderBy("random()")
        .where("artist.public = true")
        .offset(from)
        .limit(count);
      const items = await query.getRawAndEntities();
      const res = items.entities.map((artist, i) => {
        const rawArtwork = deserializeEntity(mgr, Artwork, items.raw[i]);
        // Create a new object with the computed properties
        const artwork = {
          ...rawArtwork,
          artist,
          get imageFilename() { 
            return `${this.imageHash}.${getExtensionForMimeType(this.image.mimeType)}`;
          },
          get thumbnailFilename() {
            return `${this.imageHash}.${getExtensionForMimeType(this.thumbnail.mimeType)}`;
          }
        };
        artist.artworks = [artwork];
        return artist;
      });
      return res;
    });
  }

  async getRandomArtworks(seed: number, from: number = 0, count: number = 1, artistLabels?: string[], exhibitionLabels?: string[]) {
    const nseed = seed / MAX_SEED;
    return this.artworks.manager.transaction(async mgr => {
      await mgr.query(`SELECT setseed(${nseed})`);
      const query = mgr.getRepository(Artwork).createQueryBuilder("artwork")
        .innerJoinAndSelect("artwork.artist", "artist")
        .innerJoinAndSelect("artist.user", "user")
        .innerJoinAndSelect("artist.country", "country");
      if (exhibitionLabels != null) {
        query.innerJoin("artwork.exhibitions", "exhibition");
        query.innerJoin("exhibition.gallery", "gallery");
        query.innerJoin("gallery.user", "gallery_user");
      }
      query.where("artwork.public = true")
        .andWhere("artist.public = true");
      if (artistLabels != null) {
        const [userLabel, artistLabel] = artistLabels;
        query.andWhere("artist.label = :artistLabel", { artistLabel });
        query.andWhere("user.label = :userLabel", { userLabel });
      }
      if (exhibitionLabels != null) {
        const [galleryUserLabel, galleryLabel, exhibitionLabel] = exhibitionLabels;
        query.andWhere("exhibition.label = :exhibitionLabel", { exhibitionLabel });
        query.andWhere("gallery.label = :galleryLabel", { galleryLabel });
        query.andWhere("gallery_user.label = :galleryUserLabel", { galleryUserLabel });
      }
      query.orderBy("random()").offset(from).limit(count);
      return query.getMany();
    });
  }

  async getRandomGalleries(seed: number, from: number = 0, count: number = 1) {
    const nseed = seed / MAX_SEED;
    return this.artworks.manager.transaction(async mgr => {
      await mgr.query(`SELECT setseed(${nseed})`);
      return await mgr.getRepository(Gallery).createQueryBuilder("gallery")
        .innerJoinAndSelect("gallery.user", "user")
        .innerJoinAndSelect("gallery.country", "country")
        .orderBy("random()")
        .where("gallery.public = true")
        .offset(from)
        .limit(count)
        .getMany();
    });
  }

  async getRandomExhibitions(seed: number, from: number = 0, count: number = 1) {
    const nseed = seed / MAX_SEED;
    return this.artists.manager.transaction(async mgr => {
      await mgr.query(`SELECT setseed(${nseed})`);
      const subQuery = mgr.getRepository(Artwork).createQueryBuilder("artwork")
        .select(["artwork.name", "artwork.label", "artwork.artist_id"])
        .innerJoin("artwork.exhibitions", "ex", "ex.id = exhibition.id")
        .innerJoin("artwork.artist", "artist", "artist.id = artwork.artist_id")
        .addSelect(["artist.name", "artist.label"])
        .where("artwork.public = true")
        .orderBy("random()")
        .limit(1);
      const query = await mgr.getRepository(Exhibition).createQueryBuilder("exhibition")
        .innerJoinAndSelect("exhibition.gallery", "gallery")
        .innerJoinAndSelect("gallery.user", "user")
        .innerJoinAndSelect((qb) => {
          qb.getQuery = () => `LATERAL (${subQuery.getQuery()})`;
          return qb;
        }, "artwork", "true")
        .orderBy("random()")
        .where("exhibition.public = true")
        .andWhere("gallery.public = true")
        .offset(from)
        .limit(count);
      const items = await query.getRawAndEntities();
      const res = items.entities.map((exhibition, i) => {
        const raw = items.raw[i];
        const artist = deserializeEntity(mgr, Artist, raw);
        artist.user = exhibition.gallery.user;
        const artwork = deserializeEntity(mgr, Artwork, raw);
        artwork.artist = artist;
        exhibition.artworks = [artwork];
        return exhibition;
      });
      return res;
    });
  }

  async getRandomNfts(seed: number, from: number = 0, count: number = 1) {
    const nseed = seed / MAX_SEED;
    return this.nfts.manager.transaction(async mgr => {
      await mgr.query(`SELECT setseed(${nseed})`);
      return await mgr.getRepository(Nft).createQueryBuilder("nft")
        .leftJoinAndSelect("nft.artwork", "artwork")
        .leftJoinAndSelect("artwork.artist", "artist")
        .leftJoinAndSelect("artist.user", "user")
        .leftJoinAndSelect("nft.wallet", "wallet")
        .leftJoinAndSelect("wallet.user", "wallet_user")
        .orderBy("random()")
        .where("artwork.public = true")
        .offset(from)
        .limit(count)
        .getMany();
    });
  }

  async getArtistDetailBySlug(userLabel: string, artistLabel: string) {
    return this.artists.findOne({
      relations: {
        country: true,
        artistCategory: true,
      },
      where: {
        label: artistLabel,
        public: true,
        user: { label: userLabel }
      }
    });
  }

  async getArtworkDetailBySlug(userLabel: string, artistLabel: string, artworkLabel: string) {
    return this.artworks.findOne({
      relations: {
        artist: {
          country: true,
          user: true
        },
        artworkGenre: true,
        artworkWorktype: true,
        artworkMaterial: true,
        artworkTechnique: true,
        nft: { collection: true },
      },
      where: {
        label: artworkLabel,
        public: true,
        artist: {
          label: artistLabel,
          public: true,
          user: { label: userLabel }
        }
      }
    });
  }

  async getGalleryDetailBySlug(userLabel: string, galleryLabel: string) {
    return this.galleries.findOne({
      relations: {
        country: true,
      },
      where: {
        label: galleryLabel,
        public: true,
        user: { label: userLabel }
      }
    });
  }

  async getExhibitionDetailBySlug(userLabel: string, galleryLabel: string, exhibitionLabel: string) {
    return this.exhibitions.findOne({
      relations: {
        gallery: {
          country: true,
          user: true
        }
      },
      where: {
        label: exhibitionLabel,
        public: true,
        gallery: {
          label: galleryLabel,
          public: true,
          user: { label: userLabel }
        }
      }
    });
  }

  async getNftDetailBySlug(userLabel: string, nftLabel: string) {
    return this.nfts.findOne({
      relations: {
        collection: true,
        wallet: { user: true },
        artwork: { artist: { user: true } },
      },
      where: {
        label: nftLabel,
        wallet: {
          user: { label: userLabel }
        }
      }
    });
  }

  async getArtworkImageBySlug(userLabel: string, artistLabel: string, artworkLabel: string) {
    return this.artworks.findOne({
      select: { id: true, image: { buffer: true, mimeType: true } },
      where: {
        label: artworkLabel,
        public: true,
        artist: {
          label: artistLabel,
          public: true,
          user: { label: userLabel }
        }
      }
    }).then(a => (a != null && a.image?.buffer != null) ? { image: a.image?.buffer, mimeType: a.image?.mimeType } : null);
  }

  async getArtworkProtectedImageBySlug(userLabel: string, artistLabel: string, artworkLabel: string) {
    return this.artworks.findOne({
      select: { id: true, protectedImage: { buffer: true, mimeType: true } },
      where: {
        label: artworkLabel,
        public: true,
        artist: {
          label: artistLabel,
          public: true,
          user: { label: userLabel }
        }
      }
    }).then(a => (a != null && a.protectedImage?.buffer != null) ? { image: a.protectedImage?.buffer, mimeType: a.protectedImage?.mimeType } : null);
  }

  async getArtworkThumbnailBySlug(userLabel: string, artistLabel: string, artworkLabel: string) {
    return this.artworks.findOne({
      select: { id: true, thumbnail: { buffer: true, mimeType: true } },
      where: {
        label: artworkLabel,
        public: true,
        artist: {
          label: artistLabel,
          public: true,
          user: { label: userLabel }
        }
      }
    }).then(a => (a != null && a.thumbnail?.buffer != null) ? { image: a.thumbnail?.buffer, mimeType: a.thumbnail?.mimeType } : null);
  }

  async getArtworkUnityImage(id: ArtworkId) {
    return this.artworks.findOne({
      select: { id: true, unityImage: { buffer: true, mimeType: true } },
      where: {
        id: id,
        public: true,
        artist: { public: true },
      }
    }).then(a => (a != null && a.unityImage?.buffer != null) ? { image: a.unityImage?.buffer, mimeType: a.unityImage?.mimeType } : null);
  }

  async getGalleryImageBySlug(userLabel: string, galleryLabel: string) {
    return this.galleries.findOne({
      select: { id: true, image: { buffer: true, mimeType: true } },
      where: {
        label: galleryLabel,
        public: true,
        user: { label: userLabel }
      }
    }).then(a => (a != null && a.image?.buffer != null) ? { image: a.image?.buffer, mimeType: a.image?.mimeType } : null);
  }

  async getGalleryThumbnailBySlug(userLabel: string, galleryLabel: string) {
    return this.galleries.findOne({
      select: { id: true, thumbnail: { buffer: true, mimeType: true } },
      where: {
        label: galleryLabel,
        public: true,
        user: { label: userLabel }
      }
    }).then(a => (a != null && a.thumbnail?.buffer != null) ? { image: a.thumbnail?.buffer, mimeType: a.thumbnail?.mimeType } : null);
  }

  async getResourceContent(id: ResourceId) {
    return this.resources.findOne({
      select: { data: true, mimeType: true },
      where: {
        id: id,
        public: true,
      }
    });
  }

  async getDesignerRoom(id: UnityRoomId) {
    return this.unityRooms.findOne({
      relations: {
        walls: { images: true },
        lamps: true,
        items: true,
      },
      where: {
        id: id,
        exhibition: {
          public: true,
        }
      }
    });
  }

  async getArtworksByImageIds(ids: ArtworkImageId[]) {
    if (ids.some(id => !isUUID(id)))
      throw new Error(`invalid input ids`);
    const stringIds = ids.map(id => `'${id}'`);
    const query = this.artworks.createQueryBuilder("artwork")
      .innerJoinAndSelect("artwork.artist", "artist")
      .innerJoinAndSelect("artist.user", "user")
      .innerJoinAndSelect("artist.country", "country")
      .innerJoin((qb) => {
        qb.getQuery = () => `unnest(ARRAY[${stringIds.join(",")}]::uuid[]) WITH ORDINALITY`;
        return qb;
      }, "artwork_image_id", "artwork.image_id = artwork_image_id")
      .where("artwork.public = true")
      .andWhere("artist.public = true")
      .orderBy("ordinality");
    return query.getMany();
  }

  async getItemTypes() {
    return this.unityItemTypes.find();
  }

  async saveArtwork(artwork: DeepPartial<Artwork>) {
    const entity = this.artworks.create(artwork);
    return this.artworks.save(entity);
  }

}
