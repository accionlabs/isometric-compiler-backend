import { getRequest, postRequest, deleteRequest } from '../utils/httpRequest';
import { keycloakConfig } from '../configs/keycloak';
import { Service } from 'typedi';

const BASE_KEYCLOAK_URL = `${keycloakConfig.KEYCLOAK_LOGIN_URL}/admin/realms/${keycloakConfig.KEYCLOAK_REALM}`;

@Service()
export class KeycloakService {
  private getAuthHeaders(accessToken: string): Record<string, string> {
    return { Authorization: `Bearer ${accessToken}` };
  }

  async getKeycloakAdminToken(): Promise<string> {
    const loginData = new URLSearchParams();
    loginData.append('client_id', keycloakConfig.KEYCLOAK_CLIENT_ID);
    loginData.append('client_secret', keycloakConfig.KEYCLOAK_CLIENT_SECRET);
    loginData.append('grant_type', 'client_credentials');

    const resp = await postRequest(
      `${keycloakConfig.KEYCLOAK_LOGIN_URL}/realms/${keycloakConfig.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      loginData,{}
    );
    return resp.access_token;
  }

/*   async createUser(userPayload: Record<string, any>, accessToken: string): Promise<any> {
    return await postRequest(
      `${BASE_KEYCLOAK_URL}/users`,
      userPayload,
      this.getAuthHeaders(accessToken),
    );
  } */

  async getUserByEmail(email: string, accessToken: string): Promise<any> {
    const resp = await getRequest(
      `${BASE_KEYCLOAK_URL}/users?username=${encodeURIComponent(email)}`,
      this.getAuthHeaders(accessToken),
    );
    return resp[0] || {};
  }


  async getRolesFromKeycloak(accessToken: string): Promise<any> {
    return await getRequest(
      `${BASE_KEYCLOAK_URL}/clients/${keycloakConfig.KEYCLOAK_CLIENT_UID}/roles`,
      this.getAuthHeaders(accessToken),
    );
  }

  async getRolesAssignedToUserFromKeycloak(userId: string, accessToken: string): Promise<any> {
    return await getRequest(
      `${BASE_KEYCLOAK_URL}/users/${userId}/role-mappings/clients/${keycloakConfig.KEYCLOAK_CLIENT_UID}`,
      this.getAuthHeaders(accessToken),
    );
  }

  async removeRolesFromUser(
    userId: string,
    roleArrayToRemove: any[],
    accessToken: string,
  ): Promise<void> {
    if (roleArrayToRemove.length > 0) {
      await deleteRequest(
        `${BASE_KEYCLOAK_URL}/users/${userId}/role-mappings/clients/${keycloakConfig.KEYCLOAK_CLIENT_UID}`,
        roleArrayToRemove,
        {
          ...this.getAuthHeaders(accessToken),
          'Content-Type': 'application/json',
        },
      );
    }
  }
}
