import { GalleryType } from "@modules/app-db/entities";

export interface GalleryDto {
  name: string;
  description: string;
  address: string;
  countryCode: string;
  gps: string;
  slug: string;
  type: GalleryType;
}
