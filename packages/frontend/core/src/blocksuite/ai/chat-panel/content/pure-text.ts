import { ShadowlessElement } from '@blocksuite/affine/block-std';
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

export class ChatContentPureText extends ShadowlessElement {
  static override styles = css`
    .text-content {
      display: inline-block;
      text-align: left;
      max-width: 800px;
      max-height: 500px;
      overflow-y: auto;
      background: var(--affine-v2-aI-userTextBackground);
      border-radius: 8px;
      padding: 12px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  `;

  @property({ attribute: false })
  accessor text: string = '';

  protected override render() {
    return this.text.length > 0
      ? html`<div class="text-content">${this.text}</div>`
      : nothing;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-content-pure-text': ChatContentPureText;
  }
}

customElements.define('chat-content-pure-text', ChatContentPureText);
