import { InfisicalClient } from '@infisical/sdk';
import axios from 'axios';

const INFISICAL_TOKEN = 'st.9509204e-5acc-45ce-a317-d9f268323f68.c1766c072448185b2066a3ef54df0304.fd1a04fe1222d6fe1a45663fca246e0a';

export async function getInfisicalSecret(secretName) {
  try {
    const client = new InfisicalClient({
        siteUrl: "https://app.infisical.com",
        auth: {
            serviceToken: INFISICAL_TOKEN
        }
    });

    const secret = await client.getSecret({
      secretName: secretName,
      projectSlug: 'secret-management',
      environmentSlug: 'dev',
      path: '/'
    });
    return secret.secretValue;
  } catch (err) {
    console.error(`Infisical error (${secretName}):`, err.message);
    
    // Fallback: пробуем через REST API напрямую через axios
    try {
        const res = await axios.get(`https://app.infisical.com/api/v3/secrets/raw/${secretName}?projectSlug=secret-management&environmentSlug=dev&workspaceId=c4df75cc-1d24-455e-afb7-b34f53b2e863`, {
            headers: {
                'Authorization': `Bearer ${INFISICAL_TOKEN}`
            }
        });
        
        if (res.data && res.data.secret && res.data.secret.secretValue) {
            return res.data.secret.secretValue;
        }
    } catch(e) {
        console.error("Direct API fetch also failed:", e.message, e.response?.data);
    }
    
    return null;
  }
}
