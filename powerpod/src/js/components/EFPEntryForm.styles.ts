import { css } from 'lit';

export const efpEntryFormStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;500;600;700&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@bcgov/bc-sans@2.0.0/css/BCSans.css');

  :host {
    font-family: 'BCSans', 'BC Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --chapter-font: 'Roboto Slab', Georgia, serif;
    --body-font: 'BCSans', 'BC Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* Global font override for all content */
  :host *,
  :host *::before,
  :host *::after {
    font-family: var(--body-font) !important;
  }

  /* Specific overrides for headings */
  :host h1,
  :host h2,
  :host h3,
  :host h4,
  :host h5,
  :host h6 {
    font-family: var(--chapter-font) !important;
  }

  .container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    min-height: 100vh;
    height: auto;
    font-family: var(--body-font);
  }

  /* Custom spacing for navigation collapsible containers */
  sl-details {
    margin-bottom: 0.75rem !important;
  }

  sl-details::part(base) {
    padding: 0.25rem !important;
  }

  sl-details::part(header) {
    padding: 0.5rem 0.75rem !important;
  }

  sl-details::part(content) {
    padding: 0.25rem 0.75rem 0.5rem 0.75rem !important;
  }

  /* Spacing for standalone navigation items after collapsible containers */
  .nav-subchapter-title {
    margin-top: 0.5rem !important;
  }

  .sidebar {
    flex: 0 0 25%;
    padding: 1rem;
    border-right: 1px solid var(--sl-color-neutral-200);
    font-family: var(--body-font);
    min-height: 100vh;
  }

  .main-content {
    flex: 1;
    padding: 1rem;
    font-family: var(--body-font);
    min-height: 100vh;
  }

  @media (max-width: 992px) {
    .sidebar {
      order: 1;
      flex: 0 0 100%;
    }

    .main-content {
      order: 2;
      flex: 0 0 100%;
    }
  }

  .card {
    border: 1px solid var(--sl-color-neutral-200);
    border-radius: var(--sl-border-radius-medium);
    padding: 1rem;
    margin-bottom: 1rem;
    background-color: var(--sl-color-neutral-0);
    font-family: var(--body-font);
  }

  .nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  sl-tab::part(base) {
    display: flex;
    align-items: center;
    font-family: var(--body-font);
    font-weight: 500;
  }

  .question-container {
    margin-bottom: 1.5rem;
    padding: 1.25rem;
    border: 1px solid var(--sl-color-neutral-200);
    border-radius: var(--sl-border-radius-medium);
    background-color: var(--sl-color-neutral-50);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    font-family: var(--body-font);
  }

  .question-label {
    font-family: var(--chapter-font);
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    line-height: 1.4;
    color: var(--sl-color-neutral-900);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .question-tooltip-icon {
    color: var(--sl-color-neutral-500);
    cursor: help;
    font-size: 1rem;
  }

  .question-tooltip-icon:hover {
    color: var(--sl-color-primary-600);
  }

  .question-text {
    margin-bottom: 1rem;
    color: var(--sl-color-neutral-700);
    font-size: 0.95rem;
    line-height: 1.6;
    font-family: var(--body-font);
  }

  .chapter-header {
    background: linear-gradient(135deg, var(--sl-color-primary-50) 0%, var(--sl-color-primary-100) 100%);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border-radius: var(--sl-border-radius-medium);
    border-left: 4px solid var(--sl-color-primary-600);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .chapter-header h3 {
    font-family: var(--chapter-font);
    font-weight: 700;
    font-size: 1.75rem;
    color: var(--sl-color-primary-900);
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.025em;
  }

  .subchapter-header {
    background: linear-gradient(135deg, var(--sl-color-neutral-100) 0%, var(--sl-color-neutral-150) 100%);
    padding: 1rem;
    margin: 1.5rem 0;
    border-radius: var(--sl-border-radius-small);
    border-left: 3px solid var(--sl-color-neutral-500);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  }

  .subchapter-header h4 {
    font-family: var(--chapter-font);
    font-weight: 600;
    font-size: 1.35rem;
    color: var(--sl-color-neutral-800);
    margin: 0 0 0.5rem 0;
    letter-spacing: -0.015em;
  }

  .sub-subchapter-header {
    background: linear-gradient(135deg, var(--sl-color-neutral-50) 0%, var(--sl-color-neutral-100) 100%);
    padding: 0.75rem;
    margin: 1rem 0 1rem 1rem;
    border-radius: var(--sl-border-radius-small);
    border-left: 2px solid var(--sl-color-neutral-400);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .sub-subchapter-header h5 {
    font-family: var(--chapter-font);
    font-weight: 500;
    font-size: 1.15rem;
    color: var(--sl-color-neutral-700);
    margin: 0 0 0.5rem 0;
  }

  .container-message {
    background: linear-gradient(135deg, var(--sl-color-neutral-50) 0%, var(--sl-color-neutral-100) 100%);
    padding: 2rem;
    margin: 2rem 0;
    border-radius: var(--sl-border-radius-medium);
    border: 1px solid var(--sl-color-neutral-200);
    text-align: center;
  }

  .container-message h3 {
    font-family: var(--chapter-font);
    font-weight: 600;
    font-size: 1.25rem;
    color: var(--sl-color-neutral-700);
    margin: 0 0 1rem 0;
  }

  .container-message p {
    font-family: var(--body-font);
    color: var(--sl-color-neutral-600);
    margin: 0;
    line-height: 1.5;
  }

  .question-response {
    margin-top: 1rem;
    font-family: var(--body-font);
  }

  /* Navigation styling */
  .nav-chapter-title {
    font-family: var(--chapter-font);
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--sl-color-neutral-800);
  }

  .nav-subchapter-title {
    font-family: var(--body-font);
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--sl-color-neutral-700);
  }

  /* Content area typography */
  .chapter-content h3,
  .subchapter-content h3 {
    font-family: var(--chapter-font) !important;
    font-weight: 600;
    color: var(--sl-color-neutral-800);
    margin-bottom: 0.75rem;
  }

  .chapter-content p,
  .subchapter-content p {
    font-family: var(--body-font) !important;
    line-height: 1.6;
    color: var(--sl-color-neutral-700);
  }

  /* Question content styling - override any inherited fonts */
  .main-content,
  .main-content *,
  .main-content p,
  .main-content div,
  .main-content span,
  .main-content label,
  .main-content input,
  .main-content textarea,
  .main-content select {
    font-family: var(--body-font) !important;
  }

  /* Ensure question text uses BC Sans */
  .main-content h1,
  .main-content h2,
  .main-content h3,
  .main-content h4,
  .main-content h5,
  .main-content h6 {
    font-family: var(--chapter-font) !important;
  }

  /* Radio buttons and form elements */
  .main-content input[type="radio"],
  .main-content input[type="checkbox"],
  .main-content input[type="text"],
  .main-content textarea,
  .main-content select {
    font-family: var(--body-font) !important;
  }

  /* Question labels and text */
  .main-content .question-label,
  .main-content .question-text {
    font-family: var(--body-font) !important;
  }

  /* Override any external stylesheets for question content */
  .main-content [data-question-content],
  .main-content [data-question-content] *,
  .main-content .question-container,
  .main-content .question-container * {
    font-family: var(--body-font) !important;
  }

  /* Specific overrides for common question elements */
  .main-content strong,
  .main-content b,
  .main-content em,
  .main-content i,
  .main-content span,
  .main-content div {
    font-family: inherit !important;
  }
`;

