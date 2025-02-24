import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGalleryType1740372108538 implements MigrationInterface {
    name = 'AddGalleryType1740372108538'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."gallery_type_enum" AS ENUM('Real', 'Virtual')`);
        await queryRunner.query(`ALTER TABLE "gallery" ADD "type" "public"."gallery_type_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gallery" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."gallery_type_enum"`);
    }

}
