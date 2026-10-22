import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { AllExceptionsFilter } from './../src/common/filters/all_exception.filter.js';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  // Random valid Indian mobile number so reruns never hit "phone already exists"
  const phone = `9${Math.floor(Math.random() * 1e9)
    .toString()
    .padStart(9, '0')}`;
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
  });
});
