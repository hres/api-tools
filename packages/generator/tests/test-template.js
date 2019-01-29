module.exports = ({method, url, payload, requestParameters}) => {
  return `
import http from 'k6/http';
import {check} from 'k6';
import equals from '../node_modules/fast-deep-equal/index.js';

const user_key = __ENV.USER_KEY;
const method = __ENV.METHOD || '${method}';
const url = \`${url}\`;
const payload = ${payload};
const parameters = ${requestParameters};

export default function() {
  const response = http.request(
    method,
    url,
    payload,
    parameters
  );

  check(response, {
    'status 200': r => r.status === 200,
    // ...other checks
  });
}
`;
};
