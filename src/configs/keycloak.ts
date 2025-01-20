require("dotenv").config();

export const keycloakConfig = {
    KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || '',
    KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET || '',
    KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || '',
    KEYCLOAK_CLIENT_UID: process.env.KEYCLOAK_CLIENT_UID || '',
    KEYCLOAK_GUEST_ROLE_ID: process.env.KEYCLOAK_GUEST_ROLE_ID || '',
    KEYCLOAK_LOGIN_URL: process.env.KEYCLOAK_LOGIN_URL || ''
};