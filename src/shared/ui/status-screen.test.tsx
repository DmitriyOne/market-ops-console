import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusScreen } from './status-screen';

describe('StatusScreen', () => {
  it('names the app, heads the page and keeps the buttons in the main landmark', () => {
    render(
      <StatusScreen
        code={404}
        appName="App"
        skipLabel="Skip"
        title="Gone"
        body="Not here."
        detail={<p>/x</p>}
      >
        <button type="button">Home</button>
      </StatusScreen>,
    );
    expect(screen.getByRole('link', { name: 'Skip' })).toHaveAttribute('href', '#main');
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main');
    expect(screen.getByRole('heading', { level: 1, name: 'Gone' })).toBeInTheDocument();
    expect(screen.getByText('App')).toBeInTheDocument();
    expect(main).toContainElement(screen.getByRole('button', { name: 'Home' }));
    expect(main).toContainElement(screen.getByText('/x'));
    // The big code is decoration; the heading says what happened.
    expect(screen.getByText('404')).toHaveAttribute('aria-hidden');
  });
});
