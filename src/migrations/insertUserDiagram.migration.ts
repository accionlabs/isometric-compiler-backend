import { MigrationInterface, QueryRunner } from 'typeorm';
import { UserRole } from '../entities/user.entity';

export class SeedAdminUserAndDefaultProject1713267600000 implements MigrationInterface {
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Optional: implement if rollback is needed.
    }
}
