import { MigrationInterface, QueryRunner } from 'typeorm';
import { UserRole } from '../entities/user.entity';

export class CreateUserProjectDefaultProjectDiagrams1713269900001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const adminEmail = 'isometric@accionlabs.com';
        const projectName = 'default project';
        const projectVersion = '1.0.0';

        // Check if user exists
        const user = await queryRunner.query(
            `SELECT _id FROM users WHERE email = $1 LIMIT 1`,
            [adminEmail]
        );

        let userId: number;

        if (user.length > 0) {
            userId = user[0]._id;
            console.log(`User with email ${adminEmail} already exists with id ${userId}`);
        } else {
            // Create new user
            const insertResult = await queryRunner.query(
                `
                INSERT INTO users ("firstName", "lastName", email, role, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING _id
                `,
                ['admin', 'isometric', adminEmail, UserRole.ADMIN]
            );
            userId = insertResult[0]._id;
            console.log(`Created new admin user with id ${userId}`);
        }

        // Check if project exists for this user
        const existingProject = await queryRunner.query(
            `
              SELECT _id FROM projects
              WHERE name = $1 AND version = $2 AND "userId" = $3
              LIMIT 1
              `,
            [projectName, projectVersion, userId]
        );

        if (existingProject.length > 0) {
            console.log(`Project "${projectName}" already exists for user id ${userId}`);
        } else {
            // Insert new project
            await queryRunner.query(
                `
                INSERT INTO projects ("userId", name, version, uuid, metadata, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, gen_random_uuid(), $4, NOW(), NOW())
                `,
                [userId, projectName, projectVersion, JSON.stringify({})]
            );
            console.log(`Created project "${projectName}" for user id ${userId}`);
        }

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
