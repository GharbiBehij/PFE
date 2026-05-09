import { execSync } from 'child_process';

export default async function globalSetup() {
  execSync('docker compose -f docker-compose.test.yml up -d --wait', {
    stdio: 'inherit',
  });

  let retries = 20;
  while (retries > 0) {
    try {
      execSync(
        'docker compose -f docker-compose.test.yml exec -T postgres_test ' +
          'pg_isready -U test -d netyfly_test',
        { stdio: 'pipe' },
      );
      break;
    } catch {
      retries--;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (retries === 0) {
    throw new Error('PostgreSQL test container failed to start');
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://test:test@localhost:5433/netyfly_test',
    },
  });
}
