import { defineConfig } from 'wxt';

const managedApiHostPermission = getManagedApiHostPermission(
    process.env.WXT_SWAN_MANAGED_API_BASE_URL,
);
const externallyConnectableMatches = getManagedApiExternallyConnectableMatches(
    process.env.WXT_SWAN_MANAGED_API_BASE_URL,
);

export default defineConfig({
    outDir: 'output',
    modules: ['@wxt-dev/module-react'],
    manifest: ({ browser }) => ({
        name: 'Swan - NSFW Blocker with Calls',
        description:
            'Swan helps you break out of unwanted porn urges with custom domain blocking and a phone call, using your own key or managed calls.',
        homepage_url: 'https://swan-oss.com/docs',
        ...(browser === 'firefox' ? {} : { incognito: 'split' as const }),
        permissions: ['storage', 'webNavigation'],
        host_permissions: [
            'https://api.elevenlabs.io/*',
            ...(managedApiHostPermission ? [managedApiHostPermission] : []),
        ],
        web_accessible_resources:
            browser === 'firefox'
                ? ['intervention.html', 'assets/*', 'chunks/*']
                : [
                      {
                          resources: [
                              'intervention.html',
                              'assets/*',
                              'chunks/*',
                          ],
                          matches: ['<all_urls>'],
                      },
                  ],
        ...(browser === 'firefox' || externallyConnectableMatches.length === 0
            ? {}
            : {
                  externally_connectable: {
                      matches: externallyConnectableMatches,
                  },
              }),
        icons: {
            16: 'icons/icon-16.png',
            32: 'icons/icon-32.png',
            48: 'icons/icon-48.png',
            128: 'icons/icon-128.png',
        },
        action: {
            default_title: 'Swan NSFW Blocker with Calls',
            default_icon: {
                16: 'icons/icon-16.png',
                32: 'icons/icon-32.png',
                48: 'icons/icon-48.png',
                128: 'icons/icon-128.png',
            },
        },
        ...(browser === 'firefox'
            ? {
                  browser_specific_settings: {
                      gecko: {
                          data_collection_permissions: {
                              required: [
                                  'personallyIdentifyingInfo',
                                  'authenticationInfo',
                                  'personalCommunications',
                                  'browsingActivity',
                              ],
                          },
                      },
                  },
              }
            : {}),
    }),
});

export function getManagedApiHostPermission(value: string | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;

    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('WXT_SWAN_MANAGED_API_BASE_URL must be an HTTP(S) URL');
    }

    return `${url.origin}/*`;
}

export function getManagedApiExternallyConnectableMatches(
    value: string | undefined,
): string[] {
    const trimmed = value?.trim();
    if (!trimmed) return [];

    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('WXT_SWAN_MANAGED_API_BASE_URL must be an HTTP(S) URL');
    }

    if (
        url.hostname === '127.0.0.1' ||
        url.hostname === 'localhost' ||
        url.hostname === '0.0.0.0'
    ) {
        return [
            `${url.protocol}//127.0.0.1/*`,
            `${url.protocol}//localhost/*`,
            `${url.protocol}//0.0.0.0/*`,
        ];
    }

    return [`${url.origin}/*`];
}
