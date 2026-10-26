import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { AllExceptionsFilter } from './../src/common/filters/all_exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';

const randomPhone = () =>
  `9${Math.floor(Math.random() * 1e9)
    .toString()
    .padStart(9, '0')}`;

describe('API keys and records (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let projectId: string;
  let resourceId: string;
  let apiKey: string;
  let apiKeyId: string;

  const password = 'StrongPassword123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    const phone = randomPhone();

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ phone, password, firstName: 'Key', lastName: 'Tester' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone, password })
      .expect(200);
    accessToken = login.body.data.accessToken;

    const project = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `E2E Keys ${Date.now()}` })
      .expect(201);
    projectId = project.body.data.id;

    const resource = await request(app.getHttpServer())
      .post(`/projects/${projectId}/resources`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'products' })
      .expect(201);
    resourceId = resource.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /projects/:id/api-keys creates a key in the pk_ format', async () => {
    const res = await request(app.getHttpServer())
      .post(`/projects/${projectId}/api-keys`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'e2e key' })
      .expect(201);

    expect(res.body.data.key).toMatch(/^pk_[0-9a-f]{48}$/);
    apiKey = res.body.data.key;
    apiKeyId = res.body.data.id;
  });

  it('POST records works with the x-api-key header', async () => {
    const res = await request(app.getHttpServer())
      .post(`/projects/${projectId}/resources/${resourceId}/records`)
      .set('x-api-key', apiKey)
      .send({ data: { title: 'Phone', price: 499 } })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('GET records works with the x-api-key header', async () => {
    const res = await request(app.getHttpServer())
      .get(`/projects/${projectId}/resources/${resourceId}/records`)
      .set('x-api-key', apiKey)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
  });

  it('GET records without credentials is rejected with 401', async () => {
    await request(app.getHttpServer())
      .get(`/projects/${projectId}/resources/${resourceId}/records`)
      .expect(401);
  });

  it('a revoked key is rejected with 401', async () => {
    await request(app.getHttpServer())
      .delete(`/projects/${projectId}/api-keys/${apiKeyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/projects/${projectId}/resources/${resourceId}/records`)
      .set('x-api-key', apiKey)
      .expect(401);
  });
});
