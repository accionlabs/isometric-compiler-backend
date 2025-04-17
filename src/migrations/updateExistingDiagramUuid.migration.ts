import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDefaultProjectDiagrams1713269900000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const adminEmail = 'isometric@accionlabs.com';
        const projectName = 'default project';

        // Step 1: Find admin user
        const userResult = await queryRunner.query(
            `SELECT _id FROM users WHERE email = $1 LIMIT 1`,
            [adminEmail]
        );

        if (userResult.length === 0) {
            throw new Error(`Admin user with email "${adminEmail}" not found.`);
        }

        const adminUserId = userResult[0]._id;

        // Step 2: Find the project's UUID
        const projectResult = await queryRunner.query(
            `SELECT uuid FROM projects WHERE name = $1 AND "userId" = $2 LIMIT 1`,
            [projectName, adminUserId]
        );

        if (projectResult.length === 0) {
            throw new Error(`Project "${projectName}" not found for admin user.`);
        }

        const projectUuid = projectResult[0].uuid;

        // Step 3: Update diagrams with the matching name
        await queryRunner.query(
            `
      UPDATE diagrams
      SET "userId" = $1,
          uuid = $2
      WHERE name = $3
      `,
            [adminUserId, projectUuid, projectName]
        );

        console.log(`Updated diagrams named "${projectName}" with userId = ${adminUserId} and project UUID = ${projectUuid}`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Optional rollback logic
    }
}
