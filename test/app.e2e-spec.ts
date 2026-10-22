import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { AllExceptionsFilter } from './../src/common/filters/all_exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';

// Random valid Indian mobile number so reruns never hit "phone already exists"
const randomPhone = () =>
  `9${Math.floor(Math.random() * 1e9)
    .toString()
    .padStart(9, '0')}`;

describe('API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let projectId: string;

  const phone = randomPhone();
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register creates a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        phone,
        password,
        firstName: 'E2E',
        lastName: 'Tester',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('User registered successfully');
  });

  it('POST /auth/login logs in the registered user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone, password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.data).toBeDefined();

    // Saved for the tests below that need a logged-in user
    accessToken = res.body.data.accessToken;
  });

  it('POST /projects creates a project for the logged-in user', async () => {
    const name = `E2E Project ${Date.now()}`;

    const res = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Project created successfully');
    expect(res.body.data.name).toBe(name);

    // Saved for the cross-project access test below
    projectId = res.body.data.id;
  });

  it("GET /projects/:id blocks another user from reading someone else's project", async () => {
    const otherPhone = randomPhone();

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        phone: otherPhone,
        password,
        firstName: 'Other',
        lastName: 'User',
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: otherPhone, password })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .expect(403);

    expect(res.body.success).toBe(false);
  });
});
