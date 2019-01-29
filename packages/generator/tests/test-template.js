module.exports = ({method, url, payload, requestParameters}) => `
import http from 'k6/http';
import {check} from 'k6';
import equals from '../node_modules/fast-deep-equal/index.js';

const user_key = __ENV.USER_KEY;
const method = __ENV.METHOD || '${method}';
const url = __ENV.URL || \`${url}\`;
const payload = ${payload && JSON.stringify(payload)};
const parameters = ${JSON.parse(requestParameters)};

export default function() {
  const response = http.request(
    method,
    url,
    payload,
    parameters
  );

  check(response, {
    'status 200': r => r.status === 200,
    // 'response body is correct value': r => equals(response.body, {}),
    // ...other checks
  });
}
`;
