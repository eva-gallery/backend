import { Controller, Get, Post, Body, Query, ParseIntPipe, ParseUUIDPipe, Param, Response, NotFoundException, BadRequestException } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { PublicRepository, MAX_SEED } from '@modules/app-db/repositories';
import { ArtworkId, ResourceId, UnityRoomId, ExhibitionId, Artwork } from '@modules/app-db/entities';
import { HttpApiService } from '@modules/http-api';
import { mapAsync } from '@common/helpers';
import { AddArtworkLikeDto, ExhibitionDto } from '../contracts/public';
import { randomInt } from 'crypto';
import * as mapper from '../contracts/public/mapper';

interface ExtendedArtwork {
  name: string;
  slug: string;
  imageFilename?: string;
  thumbnailFilename?: string;
}

interface ExtendedExhibitionDto extends Omit<ExhibitionDto, 'artwork'> {
  artwork: ExtendedArtwork;
}

@Controller('public')
export class PublicController {

  constructor(private publicRepository: PublicRepository, private httpApi: HttpApiService) {
  }

  @Get('random/artist')
  async getRandomArtists(@Query('seed', new ParseIntPipe({ optional: true })) seed = this.createSeed(), @Query('from', new ParseIntPipe({ optional: true })) from = 0, @Query('count', ParseIntPipe) count: number) {
    return mapAsync(this.publicRepository.getRandomArtists(seed, from, count), mapper.createArtistDto);
  }

  @Get('random/artwork')
  async getRandomArtworks(@Query('seed', new ParseIntPipe({ optional: true })) seed = this.createSeed(), @Query('from', new ParseIntPipe({ optional: true })) from = 0, @Query('count', ParseIntPipe) count: number, @Query('artist') artistSlug: string, @Query('exhibition') exhibitionSlug: string) {
    const artistLabels = (artistSlug != null) ? this.parseSlug(artistSlug, 2) : null;
    const exhibitionLabels = (exhibitionSlug != null) ? this.parseSlug(exhibitionSlug, 3) : null;
    return mapAsync(this.publicRepository.getRandomArtworks(seed, from, count, artistLabels, exhibitionLabels), mapper.createArtworkDto);
  }

  @Get('random/gallery')
  async getRandomGalleries(@Query('seed', new ParseIntPipe({ optional: true })) seed = this.createSeed(), @Query('from', new ParseIntPipe({ optional: true })) from = 0, @Query('count', ParseIntPipe) count: number) {
    return mapAsync(this.publicRepository.getRandomGalleries(seed, from, count), mapper.createGalleryDto);
  }

  @Get('random/exhibition')
  async getRandomExhibitions(@Query('seed', new ParseIntPipe({ optional: true })) seed = this.createSeed(), @Query('from', new ParseIntPipe({ optional: true })) from = 0, @Query('count', ParseIntPipe) count: number) {
    return mapAsync(this.publicRepository.getRandomExhibitions(seed, from, count), mapper.createExhibitionDto);
  }

  @Get('random/nft')
  async getRandomNfts(@Query('seed', new ParseIntPipe({ optional: true })) seed = this.createSeed(), @Query('from', new ParseIntPipe({ optional: true })) from = 0, @Query('count', ParseIntPipe) count: number) {
    return mapAsync(this.publicRepository.getRandomNfts(seed, from, count), mapper.createNftDto);
  }

  @Get('artist')
  async getArtistDetail(@Query('slug') slug: string) {
    const labels = this.parseSlug(slug, 2);
    const artist = await this.publicRepository.getArtistDetailBySlug(labels[0], labels[1]);
    if (artist == null)
      throw new NotFoundException();
    return mapper.createArtistDetailDto(artist);
  }

  @Get('artwork')
  async getArtworkDetail(@Query('slug') slug: string) {
    const labels = this.parseSlug(slug, 3);
    const artwork = await this.publicRepository.getArtworkDetailBySlug(labels[0], labels[1], labels[2]);
    if (artwork == null)
      throw new NotFoundException();
    return mapper.createArtworkDetailDto(artwork);
  }

  @Get('gallery')
  async getGalleryDetail(@Query('slug') slug: string) {
    const labels = this.parseSlug(slug, 2);
    const gallery = await this.publicRepository.getGalleryDetailBySlug(labels[0], labels[1]);
    if (gallery == null)
      throw new NotFoundException();
    return mapper.createGalleryDetailDto(gallery);
  }

  @Get('exhibition')
  async getExhibitionDetail(@Query('slug') slug: string) {
    const labels = this.parseSlug(slug, 3);
    const exhibition = await this.publicRepository.getExhibitionDetailBySlug(labels[0], labels[1], labels[2]);
    if (exhibition == null)
      throw new NotFoundException();
    return mapper.createExhibitionDetailDto(exhibition);
  }

  @Get('exhibition/:id/artwork')
async getExhibitionArtworks(@Param('id', ParseUUIDPipe) id: ExhibitionId) {
  // First check if the exhibition exists and is public
  const exhibition = await this.publicRepository.findExhibitionById(id);
  if (exhibition == null)
    throw new NotFoundException();
    
  // Get artworks that are in this exhibition and are public
  const artworks = await this.publicRepository.findExhibitionArtworks(id);
  
  // Map to DTOs for public display
  return artworks.map(artwork => mapper.createArtworkDto(artwork));
}

  @Get('nft')
  async getNftDetail(@Query('slug') slug: string) {
    const labels = this.parseSlug(slug, 2);
    const nft = await this.publicRepository.getNftDetailBySlug(labels[0], labels[1]);
    if (nft == null)
      throw new NotFoundException();
    return mapper.createNftDetailDto(nft);
  }

  @Get('artwork/image')
  async getArtworkImage(@Query('slug') slug: string, @Response() res: ExpressResponse) {
    const labels = this.parseSlug(slug, 3);
    let item = await this.publicRepository.getArtworkProtectedImageBySlug(labels[0], labels[1], labels[2]);
    if (item == null) {
      item = await this.publicRepository.getArtworkImageBySlug(labels[0], labels[1], labels[2]);
      if (item == null)
        throw new NotFoundException();
    }
    res.set({ "Content-Type": item.mimeType }).send(item.image);
  }

  @Get('artwork/thumbnail')
  async getArtworkThumbnail(@Query('slug') slug: string, @Response() res: ExpressResponse) {
    const labels = this.parseSlug(slug, 3);
    const item = await this.publicRepository.getArtworkThumbnailBySlug(labels[0], labels[1], labels[2]);
    if (item == null)
      throw new NotFoundException();
    res.set({ "Content-Type": item.mimeType }).send(item.image);
  }

  @Get('artwork/:id/unity-image')
  async getArtworkUnityImage(@Param('id', ParseUUIDPipe) id: ArtworkId, @Response() res: ExpressResponse) {
    const item = await this.publicRepository.getArtworkUnityImage(id);
    if (item == null)
      throw new NotFoundException();
    res.set({ "Content-Type": item.mimeType }).send(item.image);
  }

  @Get('gallery/image')
  async getGalleryImage(@Query('slug') slug: string, @Response() res: ExpressResponse) {
    const labels = this.parseSlug(slug, 2);
    const item = await this.publicRepository.getGalleryImageBySlug(labels[0], labels[1]);
    if (item == null)
      throw new NotFoundException();
    res.set({ "Content-Type": item.mimeType }).send(item.image);
  }

  @Get('gallery/thumbnail')
  async getGalleryThumbnail(@Query('slug') slug: string, @Response() res: ExpressResponse) {
    const labels = this.parseSlug(slug, 2);
    const item = await this.publicRepository.getGalleryThumbnailBySlug(labels[0], labels[1]);
    if (item == null)
      throw new NotFoundException();
    res.set({ "Content-Type": item.mimeType }).send(item.image);
  }

@Get('gallery/exhibition')
async getGalleryExhibitions(@Query('slug') slug: string) {
  if (slug === undefined || slug === null || slug === '') {
    throw new BadRequestException('Missing slug parameter');
  }
  
  const labels = this.parseSlug(slug, 2);
  const gallery = await this.publicRepository.getGalleryDetailBySlug(labels[0], labels[1]);
  if (gallery === null) {
    throw new NotFoundException();
  }
  
  const exhibitions = await this.publicRepository.getGalleryPublicExhibitions(labels[0], labels[1]);
  
  // Make sure exhibitions array exists before mapping
  if (exhibitions === undefined || exhibitions === null || exhibitions.length === 0) {
    return [];
  }
  
  // Check that all required properties exist before mapping
  return exhibitions
    .filter(exhibition => 
      exhibition !== null && 
      exhibition !== undefined &&
      exhibition.gallery !== null && 
      exhibition.gallery !== undefined &&
      exhibition.gallery.user !== null && 
      exhibition.gallery.user !== undefined &&
      Array.isArray(exhibition.artworks) && 
      exhibition.artworks.length > 0
    )
    .map(exhibition => mapper.createExhibitionDto(exhibition));
}

@Get('artist/exhibition')
async getArtistExhibitions(@Query('slug') slug: string) {
  if (slug === undefined || slug === null || slug === '') {
    throw new BadRequestException('Missing slug parameter');
  }
  
  const labels = this.parseSlug(slug, 2);
  const artist = await this.publicRepository.getArtistDetailBySlug(labels[0], labels[1]);
  if (artist === null) {
    throw new NotFoundException();
  }
  
  const exhibitions = await this.publicRepository.getArtistPublicExhibitions(labels[0], labels[1]);
  
  if (exhibitions === undefined || exhibitions === null || exhibitions.length === 0) {
    return [];
  }
  
  // Simply use the mapper without any modification
  return exhibitions
    .filter(exhibition => 
      exhibition !== null && 
      exhibition !== undefined &&
      exhibition.gallery !== null && 
      exhibition.gallery !== undefined &&
      exhibition.gallery.user !== null && 
      exhibition.gallery.user !== undefined &&
      Array.isArray(exhibition.artworks) && 
      exhibition.artworks.length > 0
    )
    .map(exhibition => mapper.createExhibitionDto(exhibition));
}
  
  @Get('resource/:id/content')
  async getResourceContent(@Param('id', ParseUUIDPipe) id: ResourceId, @Response() res: ExpressResponse) {
    const item = await this.publicRepository.getResourceContent(id);
    if (item == null)
      throw new NotFoundException();
    res.set({ "Content-Type": item.mimeType }).send(item.data);
  }

  @Get('designer/room/:id')
  async getDesignerRoom(@Param('id', ParseUUIDPipe) id: UnityRoomId) {
    const room = await this.publicRepository.getDesignerRoom(id);
    if (room == null)
      throw new NotFoundException();
    return mapper.createDesignerRoomDto(room);
  }

@Get('designer/room/:id/artwork')
async getDesignerRoomArtworks(@Param('id', ParseUUIDPipe) id: UnityRoomId) {
  // Get the room data (this stays the same)
  const room = await this.publicRepository.getDesignerRoom(id);
  if (room == null)
    throw new NotFoundException();
    
  // Use the new method to get exhibition details
  const exhibition = await this.publicRepository.getExhibitionDetailById(room.exhibitionId);
  if (exhibition == null)
    throw new NotFoundException();
    
  // Use the new method to get artwork data
  const artworks = await this.publicRepository.getExhibitionArtworksById(exhibition.id);
  
  // Map with explicit typing
  return artworks.map((artwork: Artwork) => 
    mapper.createPublicDesignerArtworkDto(artwork, exhibition)
  );
}

  @Get('designer/library')
  async getDesignerItemLibrary() {
    return mapAsync(this.publicRepository.getItemTypes(), mapper.createDesignerLibraryItemDto);
  }

  @Get('artwork/search-query')
  async artworkSearchQuery(@Query('query') query: string, @Query('count', ParseIntPipe) count: number, @Query('page', ParseIntPipe) page: number) {
    const imageIds = await this.httpApi.searchQuery(query, count, page);
    return mapAsync(this.publicRepository.getArtworksByImageIds(imageIds), mapper.createArtworkDto);
  }

  @Get('artwork/search-image')
  async artworkSearchImage(@Query('slug') slug: string, @Query('count', ParseIntPipe) count: number, @Query('page', ParseIntPipe) page: number) {
    const labels = this.parseSlug(slug, 3);
    const artwork = await this.publicRepository.getArtworkDetailBySlug(labels[0], labels[1], labels[2]);
    if (artwork == null)
      throw new NotFoundException();
    const imageIds = await this.httpApi.searchImage(artwork.image.id, count, page);
    return mapAsync(this.publicRepository.getArtworksByImageIds(imageIds), mapper.createArtworkDto);
  }

  @Post('artwork/like')
  async addArtworkLike(@Body() dto: AddArtworkLikeDto) {
    const labels = this.parseSlug(dto.slug, 3);
    const artwork = await this.publicRepository.getArtworkDetailBySlug(labels[0], labels[1], labels[2]);
    if (artwork == null)
      throw new NotFoundException();
    artwork.likes++;
    await this.publicRepository.saveArtwork(artwork);
  }

  private createSeed() {
    return randomInt(MAX_SEED);
  }

  private parseSlug(slug: string, expectedCount: number) {
    if (slug == null)
      throw new BadRequestException('invalid slug');
    const labels = slug.split('/');
    if (labels.length !== expectedCount)
      throw new BadRequestException('invalid slug');
    return labels;
  }

}
