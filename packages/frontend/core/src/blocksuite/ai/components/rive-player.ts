import { ShadowlessElement } from '@blocksuite/affine/block-std';
import { WithDisposable } from '@blocksuite/affine/global/lit';
import { Fit, Layout, Rive } from '@rive-app/canvas';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ref } from 'lit/directives/ref.js';

export class RivePlayer extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  accessor src = '';

  @property({ attribute: false })
  accessor animationName = '';

  @property({ attribute: false })
  accessor width = 0;

  @property({ attribute: false })
  accessor height = 0;

  @state()
  accessor riveInstance: Rive | null = null;

  private canvas!: HTMLCanvasElement;

  override firstUpdated() {
    this.initRive().catch(_ => {
      // do nothing
    });
  }

  async initRive() {
    if (!this.src || !this.canvas) return;

    this.riveInstance = new Rive({
      src: this.src,
      canvas: this.canvas,
      autoplay: true,
      animations: this.animationName || 'idle',
      layout: new Layout({
        fit: Fit.Cover,
        layoutScaleFactor: 0.5,
      }),
      onLoad: () => {
        this.riveInstance?.resizeDrawingSurfaceToCanvas();
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.disposables.add(() => {
      if (this.riveInstance) {
        this.riveInstance.stop();
        this.riveInstance.cleanup();
        this.riveInstance = null;
      }
    });
  }

  protected override render() {
    return html`
      <canvas
        ${ref((element: Element | undefined) => {
          if (element instanceof HTMLCanvasElement) {
            this.canvas = element;
          }
        })}
        width=${this.width}
        height=${this.height}
      ></canvas>
    `;
  }
}

customElements.define('rive-player', RivePlayer);

declare global {
  interface HTMLElementTagNameMap {
    'rive-player': RivePlayer;
  }
}
