
import http from 'k6/http';
import {check} from 'k6';
import equals from '../node_modules/fast-deep-equal/index.js';

const user_key = __ENV.USER_KEY;
const method = __ENV.METHOD || 'GET';
const url = `https://cnf-hc-sc-apicast-staging.dev.api.canada.ca/api/canadian-nutrient-file/food/?user_key=${user_key}`;
const payload = undefined;
const parameters = undefined;

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
