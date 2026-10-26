import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import App from '../App';
import { renderWithProviders } from '../test/renderWithProviders';
import { featureList } from '../featureList';

describe('Landing page', () => {
  it('turns every feature into a card that opens its tool', () => {
    renderWithProviders(<App />, { route: '/home' });
    const features = within(document.getElementById('features'));
    const links = features.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(featureList.map((f) => f.link));
    // Only the feature cards tilt.
    links.forEach((a) => expect(a).toHaveAttribute('data-tilt'));
  });

  it('shows the numbers and the four benefits', () => {
    renderWithProviders(<App />, { route: '/home' });
    expect(screen.getByText('tools in one free app')).toBeInTheDocument();
    expect(within(document.getElementById('benefits')).getAllByRole('listitem')).toHaveLength(4);
  });

  it('offers a free account at the end to visitors, but not to members', () => {
    const { unmount } = renderWithProviders(<App />, { route: '/home' });
    expect(screen.getByRole('link', { name: 'Create your free account' })).toHaveAttribute('href', '/register');
    unmount();
    renderWithProviders(<App />, { route: '/home', user: { id: '1', name: 'Shella' } });
    expect(screen.queryByRole('link', { name: 'Create your free account' })).not.toBeInTheDocument();
  });
});
