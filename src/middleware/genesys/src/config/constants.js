/**
 *
 * IBM Confidential
 *
 * (C) Copyright IBM Corp. 2020
 *
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has been
 * deposited with the U. S. Copyright Office
 *
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 *
 */
// eslint-disable-next-line header/header
export const PORT = process.env.PORT || 3000;
export const GENESYS_CLIENT_ID = process.env.GENESYS_CLIENT_ID;
export const GENESYS_CLIENT_SECRET = process.env.GENESYS_CLIENT_SECRET;

// Genesys URLs
export const GENESYS_TOKEN_URL = 'https://login.mypurecloud.com/oauth/token';
export const GENESYS_SIGNED_DATA_URL = 'https://api.mypurecloud.com/api/v2/signeddata';
export const GENESYS_QUEUE_URL = 'https://api.mypurecloud.com/api/v2/routing/queues';
export const GENESYS_ANALYTICS_URL = 'https://api.mypurecloud.com/api/v2/analytics/queues/observations/query';