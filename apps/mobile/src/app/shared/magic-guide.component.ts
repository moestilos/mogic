import { Component, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-magic-guide',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="guide-backdrop" (click)="close.emit()"></div>
    <div class="guide-sheet">
      <div class="guide-header">
        <div class="guide-title">
          <crown-icon name="BookOpen" [size]="18"></crown-icon>
          Guía Magic: The Gathering
        </div>
        <button class="guide-close" (click)="close.emit()" aria-label="Cerrar">
          <crown-icon name="X" [size]="16"></crown-icon>
        </button>
      </div>

      <div class="guide-body">

        <!-- TIPOS DE CARTAS -->
        <section class="guide-section">
          <div class="guide-section-title">Tipos de cartas</div>

          <div class="guide-card">
            <div class="guide-card-icon guide-land">
              <crown-icon name="Mountain" [size]="14"></crown-icon>
            </div>
            <div>
              <div class="guide-card-name">Tierras</div>
              <div class="guide-card-desc">Producen maná. Se juega 1 por turno. No se pueden contrarrestar. Tapéalas para activar su habilidad de maná.</div>
            </div>
          </div>

          <div class="guide-card">
            <div class="guide-card-icon guide-creature">
              <crown-icon name="Swords" [size]="14"></crown-icon>
            </div>
            <div>
              <div class="guide-card-name">Criaturas</div>
              <div class="guide-card-desc">Tienen Fuerza/Resistencia (ej: 3/2). Luchan y bloquean. Entran con "mareo de invocación" — no pueden atacar ni tapear el turno que entran.</div>
            </div>
          </div>

          <div class="guide-card">
            <div class="guide-card-icon guide-instant">
              <crown-icon name="Zap" [size]="14"></crown-icon>
            </div>
            <div>
              <div class="guide-card-name">Instantáneos</div>
              <div class="guide-card-desc">Se juegan en cualquier momento, incluso en el turno del rival o en respuesta a otros hechizos. Van a la pila. Van al cementerio al resolverse.</div>
            </div>
          </div>

          <div class="guide-card">
            <div class="guide-card-icon guide-sorcery">
              <crown-icon name="Wand" [size]="14"></crown-icon>
            </div>
            <div>
              <div class="guide-card-name">Conjuros</div>
              <div class="guide-card-desc">Solo se juegan en tu turno, cuando la pila está vacía. Van al cementerio al resolverse. Más poderosos que los instantáneos pero con restricciones.</div>
            </div>
          </div>

          <div class="guide-card">
            <div class="guide-card-icon guide-enchant">
              <crown-icon name="Sparkles" [size]="14"></crown-icon>
            </div>
            <div>
              <div class="guide-card-name">Encantamientos</div>
              <div class="guide-card-desc">Permanentes que dan efectos continuos. Quedan en el campo. Los "Aura" se adjuntan a otro permanente.</div>
            </div>
          </div>

          <div class="guide-card">
            <div class="guide-card-icon guide-artifact">
              <crown-icon name="Cog" [size]="14"></crown-icon>
            </div>
            <div>
              <div class="guide-card-name">Artefactos</div>
              <div class="guide-card-desc">Permanentes de cualquier color. Dan efectos pasivos o habilidades activadas. Los "Equipamiento" se equipan a criaturas.</div>
            </div>
          </div>

          <div class="guide-card">
            <div class="guide-card-icon guide-planeswalker">
              <crown-icon name="Crown" [size]="14"></crown-icon>
            </div>
            <div>
              <div class="guide-card-name">Planeswalkers</div>
              <div class="guide-card-desc">Tienen contador de lealtad. Se activan con habilidades + o −. Los rivales pueden atacarlos directamente. Solo 1 de cada tipo en campo.</div>
            </div>
          </div>
        </section>

        <!-- FASES DEL TURNO -->
        <section class="guide-section">
          <div class="guide-section-title">Turno (en orden)</div>

          <div class="guide-phases">
            <div class="guide-phase">
              <div class="guide-phase-num">1</div>
              <div>
                <div class="guide-phase-name">Desdobla</div>
                <div class="guide-phase-desc">Gira boca arriba todas tus permanentes tapadas.</div>
              </div>
            </div>
            <div class="guide-phase">
              <div class="guide-phase-num">2</div>
              <div>
                <div class="guide-phase-name">Roba</div>
                <div class="guide-phase-desc">Roba 1 carta de tu biblioteca (el jugador inicial no roba en el primer turno).</div>
              </div>
            </div>
            <div class="guide-phase">
              <div class="guide-phase-num">3</div>
              <div>
                <div class="guide-phase-name">Principal 1</div>
                <div class="guide-phase-desc">Juega tierras, hechizos, criaturas. La pila debe estar vacía para conjuros/criaturas.</div>
              </div>
            </div>
            <div class="guide-phase">
              <div class="guide-phase-num">4</div>
              <div>
                <div class="guide-phase-name">Combate</div>
                <div class="guide-phase-desc">Declara atacantes → rival declara bloqueadores → daño se asigna → resuelve. Las criaturas que atacan se tapean.</div>
              </div>
            </div>
            <div class="guide-phase">
              <div class="guide-phase-num">5</div>
              <div>
                <div class="guide-phase-name">Principal 2</div>
                <div class="guide-phase-desc">Igual que Principal 1. Buen momento para jugar criaturas post-combate.</div>
              </div>
            </div>
            <div class="guide-phase">
              <div class="guide-phase-num">6</div>
              <div>
                <div class="guide-phase-name">Final</div>
                <div class="guide-phase-desc">Descarta hasta el máximo de mano (7). El daño sobre criaturas se quita.</div>
              </div>
            </div>
          </div>
        </section>

        <!-- HABILIDADES CLAVE -->
        <section class="guide-section">
          <div class="guide-section-title">Habilidades clave</div>

          <div class="guide-abilities">
            <div class="guide-ability">
              <div class="guide-ability-name">Volar</div>
              <div class="guide-ability-desc">Solo puede ser bloqueada por criaturas con volar o alcance.</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Pisar</div>
              <div class="guide-ability-desc">Su exceso de daño pasa al jugador aunque haya bloqueadores.</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Toque letal</div>
              <div class="guide-ability-desc">Destruye cualquier criatura a la que dañe, sin importar su resistencia.</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Vínculo vital</div>
              <div class="guide-ability-desc">El daño que hace cura al mismo número de puntos de vida.</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Vigilancia</div>
              <div class="guide-ability-desc">No se tapa al atacar.</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Prisa</div>
              <div class="guide-ability-desc">Puede atacar y tapear el mismo turno que entra al campo.</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Destello</div>
              <div class="guide-ability-desc">Puede jugarse como si fuera un instantáneo (en cualquier momento).</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Golpe doble</div>
              <div class="guide-ability-desc">Hace daño en el paso de golpe inicial Y en el normal.</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Hexproof</div>
              <div class="guide-ability-desc">No puede ser objetivo de hechizos ni habilidades del rival.</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Indestructible</div>
              <div class="guide-ability-desc">No puede ser destruida por daño ni por efectos de "destruye".</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Alcance</div>
              <div class="guide-ability-desc">Puede bloquear criaturas con volar.</div>
            </div>
            <div class="guide-ability">
              <div class="guide-ability-name">Protección</div>
              <div class="guide-ability-desc">Inmune a daño, encantamientos, equipamientos y bloqueos de la calidad indicada.</div>
            </div>
          </div>
        </section>

        <!-- REGLAS CLAVE COMMANDER -->
        <section class="guide-section">
          <div class="guide-section-title">Reglas Commander (EDH)</div>

          <div class="guide-rules">
            <div class="guide-rule">
              <crown-icon name="Users" [size]="12"></crown-icon>
              <span>2–4 jugadores (ideal 4). Vida inicial: <strong>40</strong>.</span>
            </div>
            <div class="guide-rule">
              <crown-icon name="BookOpen" [size]="12"></crown-icon>
              <span>Mazo de exactamente <strong>100 cartas</strong>. Máximo 1 copia de cada carta (excepto tierras básicas).</span>
            </div>
            <div class="guide-rule">
              <crown-icon name="Crown" [size]="12"></crown-icon>
              <span>El <strong>Comandante</strong> es una criatura legendaria que vive en la "zona de comandante". Puede jugarse desde ahí pagando su coste.</span>
            </div>
            <div class="guide-rule">
              <crown-icon name="RotateCw" [size]="12"></crown-icon>
              <span>Si el comandante moriría o sería exiliado, su dueño puede devolverlo a la zona de comandante. Coste adicional: <strong>+2 genérico</strong> por cada vez que se haya jugado desde ahí.</span>
            </div>
            <div class="guide-rule">
              <crown-icon name="Swords" [size]="12"></crown-icon>
              <span><strong>Daño de comandante:</strong> 21 o más de daño de combate del mismo comandante elimina a ese jugador directamente.</span>
            </div>
            <div class="guide-rule">
              <crown-icon name="Skull" [size]="12"></crown-icon>
              <span><strong>Veneno:</strong> 10 fichas de veneno = eliminación instantánea.</span>
            </div>
          </div>
        </section>

        <!-- LA PILA -->
        <section class="guide-section">
          <div class="guide-section-title">La pila (stack)</div>
          <div class="guide-stack-info">
            <p>Cuando se juega un hechizo o se activa una habilidad, va a la <strong>pila</strong>. Los jugadores pueden responder. Los hechizos se resuelven de <strong>último en entrar, primero en salir</strong> (LIFO).</p>
            <p style="margin-top: 8px;">Ambos jugadores deben "pasar prioridad" sin añadir nada para que la pila resuelva. Los instantáneos y habilidades pueden jugarse con hechizos en la pila.</p>
          </div>
        </section>

        <!-- COLORES -->
        <section class="guide-section">
          <div class="guide-section-title">Los 5 colores</div>
          <div class="guide-colors">
            <div class="guide-color guide-color-w">
              <div class="guide-color-pip">W</div>
              <div>
                <div class="guide-color-name">Blanco</div>
                <div class="guide-color-desc">Orden, protección, criaturas pequeñas en masa, exilio</div>
              </div>
            </div>
            <div class="guide-color guide-color-u">
              <div class="guide-color-pip">U</div>
              <div>
                <div class="guide-color-name">Azul</div>
                <div class="guide-color-desc">Contrarrestar, robar cartas, control, volar</div>
              </div>
            </div>
            <div class="guide-color guide-color-b">
              <div class="guide-color-pip">B</div>
              <div>
                <div class="guide-color-name">Negro</div>
                <div class="guide-color-desc">Destrucción, sacrificio, descarte, regresa del cementerio</div>
              </div>
            </div>
            <div class="guide-color guide-color-r">
              <div class="guide-color-pip">R</div>
              <div>
                <div class="guide-color-name">Rojo</div>
                <div class="guide-color-desc">Daño directo, prisa, agresión, quemar</div>
              </div>
            </div>
            <div class="guide-color guide-color-g">
              <div class="guide-color-pip">G</div>
              <div>
                <div class="guide-color-name">Verde</div>
                <div class="guide-color-desc">Criaturas grandes, maná extra, pisar, crecimiento</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed; inset: 0; z-index: 200;
      display: flex; flex-direction: column; justify-content: flex-end;
    }
    .guide-backdrop {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }
    .guide-sheet {
      position: relative; z-index: 1;
      background: var(--bg-base);
      border-top: 1px solid var(--divider);
      border-radius: 20px 20px 0 0;
      max-height: 88vh;
      display: flex; flex-direction: column;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
    [data-theme='brutal'] .guide-sheet { border-radius: 0; border-top-width: 2px; }

    .guide-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px 12px;
      border-bottom: 1px solid var(--divider);
      flex-shrink: 0;
    }
    .guide-title {
      display: flex; align-items: center; gap: 8px;
      font-family: var(--font-name);
      font-weight: 700; font-size: 16px;
      color: var(--text-hi);
    }
    .guide-close {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--divider);
      border-radius: 8px;
      color: var(--text-mid);
      cursor: pointer;
    }
    [data-theme='brutal'] .guide-close { border-radius: 0; }

    .guide-body {
      overflow-y: auto; -webkit-overflow-scrolling: touch;
      padding: 16px 20px 24px;
      flex: 1;
      display: flex; flex-direction: column; gap: 24px;
    }

    .guide-section { display: flex; flex-direction: column; gap: 10px; }
    .guide-section-title {
      font-family: var(--font-hud);
      font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
      color: var(--text-lo);
      padding-bottom: 4px;
      border-bottom: 1px solid var(--divider);
    }

    /* Card type rows */
    .guide-card {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--divider);
      border-radius: 10px;
    }
    [data-theme='brutal'] .guide-card { border-radius: 0; }
    [data-theme='stark']  .guide-card { background: rgba(20,20,14,0.04); }
    .guide-card-icon {
      width: 32px; height: 32px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 8px;
    }
    [data-theme='brutal'] .guide-card-icon { border-radius: 0; }
    .guide-land        { background: rgba(78,160,78,0.15); color: #5a9a4c; }
    .guide-creature    { background: rgba(210,79,69,0.15); color: #d24f45; }
    .guide-instant     { background: rgba(79,143,203,0.15); color: #4f8fcb; }
    .guide-sorcery     { background: rgba(150,120,180,0.15); color: #9678b4; }
    .guide-enchant     { background: rgba(201,162,86,0.15); color: #c9a256; }
    .guide-artifact    { background: rgba(160,160,180,0.15); color: #a0a0b4; }
    .guide-planeswalker { background: rgba(179,157,255,0.15); color: #b39dff; }

    .guide-card-name {
      font-family: var(--font-name);
      font-weight: 600; font-size: 13px;
      color: var(--text-hi); margin-bottom: 2px;
    }
    .guide-card-desc {
      font-size: 12px; line-height: 1.5;
      color: var(--text-mid);
    }

    /* Phases */
    .guide-phases { display: flex; flex-direction: column; gap: 6px; }
    .guide-phase {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 8px 10px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--divider);
      border-radius: 8px;
    }
    [data-theme='brutal'] .guide-phase { border-radius: 0; }
    .guide-phase-num {
      width: 22px; height: 22px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: var(--accent-flat);
      color: var(--bg-base);
      border-radius: 50%;
      font-family: var(--font-hud);
      font-size: 10px; font-weight: 700;
    }
    [data-theme='brutal'] .guide-phase-num { border-radius: 0; }
    .guide-phase-name {
      font-family: var(--font-name);
      font-weight: 600; font-size: 12px;
      color: var(--text-hi);
    }
    .guide-phase-desc {
      font-size: 11px; line-height: 1.4;
      color: var(--text-mid); margin-top: 1px;
    }

    /* Abilities */
    .guide-abilities {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .guide-ability {
      padding: 8px 10px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--divider);
      border-radius: 8px;
    }
    [data-theme='brutal'] .guide-ability { border-radius: 0; }
    .guide-ability-name {
      font-family: var(--font-name);
      font-weight: 700; font-size: 11px;
      color: var(--text-hi); margin-bottom: 2px;
    }
    .guide-ability-desc {
      font-size: 10px; line-height: 1.4;
      color: var(--text-mid);
    }

    /* Commander rules */
    .guide-rules { display: flex; flex-direction: column; gap: 8px; }
    .guide-rule {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: 12px; line-height: 1.5;
      color: var(--text-mid);
    }
    .guide-rule strong { color: var(--text-hi); }

    /* Stack */
    .guide-stack-info {
      padding: 12px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--divider);
      border-radius: 10px;
      font-size: 12px; line-height: 1.6;
      color: var(--text-mid);
    }
    [data-theme='brutal'] .guide-stack-info { border-radius: 0; }
    .guide-stack-info strong { color: var(--text-hi); }

    /* Colors */
    .guide-colors { display: flex; flex-direction: column; gap: 6px; }
    .guide-color {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--divider);
      border-radius: 8px;
    }
    [data-theme='brutal'] .guide-color { border-radius: 0; }
    .guide-color-pip {
      width: 28px; height: 28px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      font-family: var(--font-hud);
      font-weight: 800; font-size: 12px;
    }
    [data-theme='brutal'] .guide-color-pip { border-radius: 0; }
    .guide-color-w .guide-color-pip { background: #FFFDE0; color: #7a6a2a; }
    .guide-color-u .guide-color-pip { background: #4f8fcb; color: #fff; }
    .guide-color-b .guide-color-pip { background: #1a1620; color: #c8b0e0; border: 1px solid rgba(200,176,224,0.3); }
    .guide-color-r .guide-color-pip { background: #d24f45; color: #fff; }
    .guide-color-g .guide-color-pip { background: #5a9a4c; color: #fff; }
    .guide-color-name {
      font-family: var(--font-name);
      font-weight: 600; font-size: 12px;
      color: var(--text-hi);
    }
    .guide-color-desc {
      font-size: 10px; line-height: 1.4;
      color: var(--text-mid);
    }
  `],
})
export class MagicGuideComponent {
  readonly close = output<void>();
}
