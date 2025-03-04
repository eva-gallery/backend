import { UnityRoomId, ExhibitionId } from '@modules/app-db/entities';

export interface ExhibitionDetailDto {
  id: ExhibitionId;
  name: string;
  fromDate: string;
  toDate: string;
  curator: string;
  gallery: {
    name: string;
    slug: string;
    countryCode: string;
  }
  activeRoomId: UnityRoomId;
}
