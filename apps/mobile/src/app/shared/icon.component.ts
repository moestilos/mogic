import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Icons, type IconKey } from './icons';

@Component({
  selector: 'crown-icon',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-angular [img]="data" [size]="size" [strokeWidth]="strokeWidth" [class]="cls" [attr.aria-label]="name"></lucide-angular>`,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; line-height: 0; }
    :host ::ng-deep svg { display: block; }
  `],
})
export class IconComponent {
  @Input() name: IconKey = 'Crown';
  @Input() size: number | string = 18;
  @Input() strokeWidth: number = 1.75;
  @Input() cls: string = '';

  get data() {
    return Icons[this.name] ?? Icons.Crown;
  }
}
