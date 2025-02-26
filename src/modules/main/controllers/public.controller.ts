import { Controller, Get, Post, Body, Query, ParseIntPipe, ParseUUIDPipe, Param, Response, NotFoundException, BadRequestException } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { PublicRepository, MAX_SEED } from '@modules/app-db/repositories';
import { ArtworkId, ResourceId, UnityRoomId } from '@modules/app-db/entities';
import { HttpApiService } from '@modules/http-api';
import { mapAsync } from '@common/helpers';
import { AddArtworkLikeDto } from '../contracts/public';
import { randomInt } from 'crypto';
import * as mapper from '../contracts/public/mapper';

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
  const info = await this.publicRepository.getRoomExhibitionInfo(id);
  if (info == null)
    throw new NotFoundException();
  const artworks = await this.publicRepository.getExhibitionArtworks(info.exhibition.id);
  // Map directly without using mapAsync
  return artworks.map(artwork => mapper.createPublicDesignerArtworkDto(artwork, info.exhibition));
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
