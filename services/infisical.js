import pkg from '@infisical/sdk';
const { InfisicalClient } = pkg;
import { getDb, save } from './store.js';

const INFISICAL_TOKEN = 'st.3c4e45c6-a523-49a4-9761-bd4040e817cd.6841e9afbb3eba29bbd61c24fbd75a1c.0f78a0301d15035c7c38c607813c21ba';

let client;

function getClient() {
  if (!client) {
    client = new InfisicalClient({
      siteUrl: 'https://app.infisical.com',
      auth: {
        accessToken: INFISICAL_TOKEN
      }
    });
  }
  return client;
}

/**
 * Получает секрет из Infisical.
 * Поскольку у нас нет slug проекта и среды, мы пытаемся использовать
 * значения по умолчанию или общие параметры, если это возможно в SDK.
 * ПРЕДУПРЕЖДЕНИЕ: Без projectSlug и environmentSlug это может не работать.
 */
export async function getInfisicalSecret(secretName) {
  try {
    const infisical = getClient();
    // По умолчанию пробуем dev среду, если проект не указан
    // ВАЖНО: Обычно требуется .getSecret({ secretName, projectSlug, environmentSlug })
    const secret = await infisical.getSecret({
      secretName,
      projectSlug: 'schoolai', // Предполагаемое имя проекта
      environmentSlug: 'dev'    // Предполагаемая среда
    });
    return secret.secretValue;
  } catch (err) {
    console.error(`Infisical error (${secretName}):`, err.message);
    return null;
  }
}
