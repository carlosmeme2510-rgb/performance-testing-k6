import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 20 },  // ramp-up
    { duration: '60s', target: 20 },  // carga sostenida
    { duration: '15s', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% de las peticiones bajo 800ms
    http_req_failed: ['rate<0.01'],   // menos de 1% de errores
  },
};

const BASE_URL = 'https://reqres.in/api';

export default function () {
  group('Flujo 1 - Consulta de datos publicos', function () {
    const res = http.get(`${BASE_URL}/users?page=2`);
    check(res, {
      'users: status 200': (r) => r.status === 200,
      'users: respuesta rapida (<800ms)': (r) => r.timings.duration < 800,
    });
  });

  sleep(1);

  group('Flujo 2 - Autenticacion', function () {
    const payload = JSON.stringify({
      email: 'eve.holt@reqres.in',
      password: 'cityslicka',
    });
    const params = {
      headers: { 'Content-Type': 'application/json' },
    };
    const res = http.post(`${BASE_URL}/login`, payload, params);
    check(res, {
      'login: status 200': (r) => r.status === 200,
      'login: respuesta rapida (<800ms)': (r) => r.timings.duration < 800,
      'login: devuelve token': (r) => !!r.json('token'),
    });
  });

  sleep(1);
}
