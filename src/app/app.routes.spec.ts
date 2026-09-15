import { routes } from './app.routes';

describe('routes', () => {
  it('redirects unknown paths to the quiz list', () => {
    const wildcard = routes.find((route) => route.path === '**');
    expect(wildcard?.redirectTo).toBe('quizzes');
  });

  it('redirects the empty path to the quiz list', () => {
    const root = routes.find((route) => route.path === '');
    expect(root?.redirectTo).toBe('quizzes');
    expect(root?.pathMatch).toBe('full');
  });
});
