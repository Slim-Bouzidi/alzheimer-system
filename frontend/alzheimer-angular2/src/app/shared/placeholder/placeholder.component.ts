import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './placeholder.component.html',
  styleUrls: ['./placeholder.component.css']
})
export class PlaceholderComponent {
  title = 'Page';
  backLink = '/test';

  constructor(private route: ActivatedRoute, private router: Router) {
    const data = this.route.snapshot.data;
    this.title = data['title'] ?? 'Page';
    this.backLink = data['backLink'] ?? '/test';
  }

  goBack(): void {
    this.router.navigate([this.backLink]);
  }
}
