import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { ArticleService } from '../services/article.service';
import { Article } from '../models/article.model';

@Component({
    selector: 'app-doctor-articles',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule, SidebarComponent],
    templateUrl: './doctor-articles.component.html',
    styleUrls: ['./doctor-articles.component.css']
})
export class DoctorArticlesComponent implements OnInit {
    articleForm: FormGroup;
    articles: Article[] = [];
    successMessage = '';
    errorMessage = '';
    isModalOpen = false;

    constructor(private fb: FormBuilder, private articleService: ArticleService) {
        this.articleForm = this.fb.group({
            title: ['', Validators.required],
            category: ['', Validators.required],
            targetAudience: ['ALL', Validators.required],
            content: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadArticles();
    }

    openModal() {
        this.isModalOpen = true;
        this.successMessage = '';
        this.errorMessage = '';
    }

    closeModal() {
        this.isModalOpen = false;
        this.articleForm.reset({ targetAudience: 'ALL' });
    }

    loadArticles() {
        this.articleService.getAllArticles().subscribe({
            next: (data) => this.articles = data,
            error: (err) => console.error('Error fetching articles', err)
        });
    }

    onSubmit() {
        if (this.articleForm.invalid) return;

        const newArticle: Article = this.articleForm.value;

        this.articleService.createArticle(newArticle).subscribe({
            next: (created) => {
                this.successMessage = "Article published successfully!";
                this.errorMessage = '';
                this.articleForm.reset({ targetAudience: 'ALL' });
                this.articles.push(created);
                setTimeout(() => {
                    this.successMessage = '';
                    this.closeModal();
                }, 1500);
            },
            error: (err) => {
                console.error(err);
                this.errorMessage = "Failed to publish article. Check your connection.";
            }
        });
    }

    deleteArticle(id: number) {
        if (confirm("Are you sure you want to delete this article?")) {
            this.articleService.deleteArticle(id).subscribe({
                next: () => {
                    this.articles = this.articles.filter(a => a.id !== id);
                },
                error: (err) => {
                    console.error(err);
                    this.errorMessage = "Failed to delete article.";
                }
            });
        }
    }
}
