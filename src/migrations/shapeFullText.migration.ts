import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFullTextSearchShapes1700000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE shapes 
      ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(metadata->>'description', '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C') ||
        setweight(to_tsvector('english', coalesce((SELECT name FROM category WHERE category._id = shapes.categoryId), '')), 'D')
      ) STORED;
    `);

        await queryRunner.query(`
      CREATE INDEX shapes_search_idx 
      ON shapes USING GIN (search_vector);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX shapes_search_idx;`);
        await queryRunner.query(`ALTER TABLE shapes DROP COLUMN search_vector;`);
    }
}
