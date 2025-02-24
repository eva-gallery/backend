import { Entity, Column, VirtualColumn, ManyToOne, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { LabeledEntity } from './labeled.entity';
import { Country, CountryId } from './country.entity';
import { User, UserId } from './user.entity';
import { Image } from './image';
import { ID, createThumbnail } from '@common/helpers';

export type GalleryId = ID<"Gallery">;

export enum GalleryType {
  Real = "Real",
  Virtual = "Virtual"
}
@Entity()
@Index(['name', 'userId'], { unique: true })
@Index(['label', 'userId'], { unique: true })
export class Gallery extends LabeledEntity {

  @VirtualColumn({ query: () => null })
  private _lastImage: Buffer;

  id: GalleryId;

  @Column('text', { nullable: true })
  description: string;

  @Column('text')
  address: string;

  @ManyToOne(() => Country)
  country: Country;

  @Column({ nullable: true })
  countryId: CountryId;

  @Column('text', { nullable: true })
  gps: string;

  @Column(() => Image)
  image: Image;

  @Column(() => Image)
  thumbnail: Image;

  @Column({ type: 'boolean', default: false })
  public: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ nullable: true })
  userId: UserId;

  @Column({ type: 'enum', enum: GalleryType })
  type: GalleryType;

  get slug() { return `${this.user.label}/${this.label}`; }

  @BeforeInsert()
  @BeforeUpdate()
  async updateImageData() {
    if (this.image?.buffer === undefined)
      return;
    const buffer = this.image?.buffer ?? null;
    if (buffer !== this._lastImage) {
      if (buffer != null) {
        this.thumbnail = { buffer: await createThumbnail(buffer), mimeType: "image/jpeg" };
      } else {
        this.thumbnail = Image.empty;
      }
      this._lastImage = buffer;
    }
  }

}
