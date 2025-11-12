import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { isPASignedOff, isProducerSignedOff, setProducerSignedOff, setPASignedOff } from '../common/workbookUtils.js';
import { getCurrentUser } from '../common/dynamics.js';
import { isContactPA, isContactProducer } from '../common/contacts.js';

@customElement('sign-off-buttons')
export class SignOffButtons extends LitElement {

  static styles = css`
    .sign-off-card {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      align-items: center;
      padding: 1rem;
      background: var(--sl-color-neutral-0);
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-border-radius-medium);
      box-shadow: var(--sl-shadow-x-small);
    }

    @media (max-width: 768px) {
      .sign-off-card {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      sl-button {
        width: 100%;
      }
    }
  `;

/*   private handleSignOffClick() {
    this.dispatchEvent(new CustomEvent('workbook-sign-off', {
      bubbles: true,
      composed: true
    }));
  } */

  // Sign off event handler
  private async handleSignOffClick() {
    const { contactId } = getCurrentUser();

    if(contactId != null){
      const isProducer = await isContactProducer(contactId);
      const isPA = await isContactPA(contactId);
    
      if(isProducer){
        if(isProducerSignedOff()){
          setProducerSignedOff(false);
        }else{
          setProducerSignedOff(true);
        }
      } 
      else if(isPA){
        if(isPASignedOff()){
          setPASignedOff(false);
        }else{
          setPASignedOff(true);
        }
      }
      this.requestUpdate();
    }
  }

  render() {
    return html`
      <div class="sign-off-card">
        <sl-button
          variant="primary"
          size="large"
          ?disabled=${isProducerSignedOff()}
          @click=${this.handleSignOffClick}
        >
          Sign Off
        </sl-button>

        <sl-button
          variant="default"
          size="large"
          ?disabled=${!isProducerSignedOff()}
          @click=${this.handleSignOffClick}
        >
          Cancel Sign-Off
        </sl-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sign-off-buttons': SignOffButtons;
  }
}
