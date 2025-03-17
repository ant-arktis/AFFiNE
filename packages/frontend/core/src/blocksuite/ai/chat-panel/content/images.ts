import { ShadowlessElement } from '@blocksuite/affine/block-std';
import { WithDisposable } from '@blocksuite/affine/global/lit';
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

export class ChatContentImages extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .images-row {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 8px;
      margin-bottom: 8px;
      max-width: 100%;
      overflow-x: auto;
      padding: 4px;
      scrollbar-width: auto;
    }

    .images-row::-webkit-scrollbar {
      height: 4px;
    }

    .images-row::-webkit-scrollbar-thumb {
      background-color: var(--affine-border-color);
      border-radius: 4px;
    }

    .images-row::-webkit-scrollbar-track {
      background: transparent;
    }

    .images-row img {
      max-width: 180px;
      max-height: 264px;
      object-fit: cover;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .images-column {
      display: flex;
      gap: 12px;
      flex-direction: column;
      margin-bottom: 8px;
    }

    .image-container {
      border-radius: 4px;
      overflow: hidden;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 70%;
      max-width: 320px;
    }

    .image-container img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
    }
  `;

  @property({ attribute: false })
  accessor images: string[] = [];

  @property({ attribute: false })
  accessor layout: 'row' | 'column' = 'row';

  protected override render() {
    if (this.images.length === 0) {
      return nothing;
    }

    if (this.layout === 'row') {
      return html`<div class="images-row">
        ${repeat(
          this.images,
          image => image,
          image => html`<img src="${image}" />`
        )}
      </div>`;
    } else {
      return html`<div class="images-column">
        ${repeat(
          this.images,
          image => image,
          image =>
            html`<div class="image-container">
              <img src="${image}" />
            </div>`
        )}
      </div>`;
    }
  }
}

customElements.define('chat-content-images', ChatContentImages);

declare global {
  interface HTMLElementTagNameMap {
    'chat-content-images': ChatContentImages;
  }
}
