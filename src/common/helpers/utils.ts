import { DataSource, EntityManager, getMetadataArgsStorage } from 'typeorm';
import { DriverUtils } from 'typeorm/driver/DriverUtils';
import { OptionDto } from './option.dto';
import { Request as ExpressRequest } from 'express';
import { Observable } from 'rxjs';
import * as sharp from 'sharp';

export type EMPTY = "";

export type Environment = "local" | "development" | "production" | "test";

export const usedMimeTypes = ['image/jpeg', 'image/png', 'image/tiff', 'audio/mpeg'] as const;

export type MimeType = typeof usedMimeTypes[number];

export const imageMimeTypes: MimeType[] = ['image/jpeg', 'image/png', 'image/tiff'];

export const audioMimeTypes: MimeType[] = ['audio/mpeg'];

const mimeExtMap = new Map<MimeType, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/tiff', 'tif'],
  ['audio/mpeg', 'mp3'],
]);

const extMimeMap = new Map<string, MimeType>([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['tif', 'image/tiff'],
  ['mp3', 'audio/mpeg'],
]);

export interface ImageData {
  buffer: Buffer;
  mimeType: MimeType;
}

export function getEnv(): Environment {
  return (process.env.NODE_ENV as Environment) || "local";
}

export function isEntity(type: object) {
  const tables = getMetadataArgsStorage().tables;
  return tables.some(t => t.target === type);
}

export function filterEntities(types: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return types.filter(t => isEntity(t)) as Function[];
}

export function createOptionDto<T>(entity: { id: T, name: string }): OptionDto<T> {
  if (entity == null)
    return null;
  return {
    id: entity.id,
    name: entity.name,
  };
}

export function mapAsync<T, S>(list: Promise<T[]>, mapper: (item: T) => S): Promise<S[]> {
  return list.then(items => items.map(mapper));
}

export function mapOptionsAsync<T>(list: Promise<{ id: T, name: string }[]>): Promise<OptionDto<T>[]> {
  return mapAsync(list, createOptionDto);
}

export function mapEmpty<T, S>(value: T | EMPTY, mapper: (value: T) => S, defaultEmpty: S = null): S {
  if (value === undefined)
    return undefined;
  if (value === null || value === "")
    return defaultEmpty;
  return mapper(value);
}

export function deserializeEntity<T>(_dataSource: DataSource | EntityManager, entityType: { new(): T }, rawData: any, customTableAlias?: string) {
  const dataSource = (_dataSource instanceof DataSource) ? _dataSource : _dataSource.connection;
  const driver = dataSource.driver;
  const metadata = dataSource.getMetadata(entityType);
  const entity = new entityType();
  const columns = metadata.columns;
  for (const column of columns) {
    if (column.isVirtual)
      continue;
    const tableAlias = customTableAlias ?? metadata.tableName;
    const propName = DriverUtils.buildAlias(driver, undefined, tableAlias, column.databaseName);
    const value = rawData[propName];
    if (value === undefined)
      continue;
    const convertedValue = driver.prepareHydratedValue(value, column);
    column.setEntityValue(entity, convertedValue);
  }
  return entity as T;
}

export function urlCombine(...urls: string[]) {
  const parts = [];
  for (let i = 0; i < urls.length; i++) {
    let part = urls[i];
    if (i !== 0) {
      part = part.replace(/^\//, '');
    }
    if (i !== urls.length - 1) {
      part = part.replace(/\/$/, '');
    }
    parts.push(part);
  }
  return parts.join("/");
}

export function parseBool(value: string) {
  if (value === "1" || value === "true")
    return true;
  if (value === "0" || value === "false")
    return false;
  return undefined;
}

export function isLocalhostOrigin(req: ExpressRequest) {
  const origin = req.header('Origin') ?? "";
  return origin.toLowerCase().startsWith("http://localhost:");
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createThumbnail(image: Buffer) {
  return sharp(image).resize({ width: 480 }).toFormat('jpg').toBuffer();
}

export async function resizeToLimit(image: ImageData, pixelLimit: number): Promise<ImageData> {
  const sharpImage = sharp(image.buffer);
  const imageInfo = await sharpImage.metadata();
  const pixels = imageInfo.width * imageInfo.height;
  if (pixels <= pixelLimit)
    return image;
  const ratio = imageInfo.width / imageInfo.height;
  const desiredWidth = Math.floor(Math.sqrt(pixelLimit * ratio));
  const desiredHeight = Math.floor(Math.sqrt(pixelLimit / ratio));
  const newBuffer = await sharpImage.resize({ width: desiredWidth, height: desiredHeight }).toFormat('jpg').toBuffer();
  return { buffer: newBuffer, mimeType: "image/jpeg" };
}

export function getExtensionForMimeType(mimeType: MimeType) {
  return mimeExtMap.get(mimeType);
}

export function getMimeTypeForExtension(ext: string) {
  return extMimeMap.get(ext);
}

export function createText(...parts: string[]) {
  return parts.join("\n");
}

export function delayExecution<T>(func: (value: T) => Promise<any>) {
  return (source: Observable<T>) => new Observable(dest => {
    let running = false;
    let reemit: T = null;
    const exec = (value: T) => {
      if (running) {
        reemit = value;
        return;
      }
      running = true;
      func(value).then(() => {
        dest.next(value);
        running = false;
        if (reemit != null) {
          const v = reemit;
          reemit = null;
          exec(v);
        }
      });
    }
    source.subscribe(exec);
  });
}
