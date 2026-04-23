import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Article } from '../models/article.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ArticleService {
    private apiUrl = `${environment.apiUrl}/articles`;

    constructor(private http: HttpClient) { }

    getAllArticles(): Observable<Article[]> {
        return this.http.get<Article[]>(this.apiUrl);
    }

    getArticleById(id: number): Observable<Article> {
        return this.http.get<Article>(`${this.apiUrl}/${id}`);
    }

    createArticle(article: Article): Observable<Article> {
        return this.http.post<Article>(this.apiUrl, article);
    }

    updateArticle(article: Article): Observable<Article> {
        return this.http.put<Article>(this.apiUrl, article);
    }

    deleteArticle(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
    }
}
