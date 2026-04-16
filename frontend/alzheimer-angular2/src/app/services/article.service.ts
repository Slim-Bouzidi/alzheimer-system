import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Article } from '../models/article.model';

@Injectable({
    providedIn: 'root'
})
export class ArticleService {
    private apiUrl = 'http://localhost:8081/api/articles';

    constructor(private http: HttpClient) { }

    getAllArticles(): Observable<Article[]> {
        return this.http.get<Article[]>(this.apiUrl);
    }

    getArticleById(id: number): Observable<Article> {
        return this.http.get<Article>(`${this.apiUrl}/${id}`);
    }

    createArticle(article: Article): Observable<Article> {
        const headers = new HttpHeaders().set('Role', 'Doctor');
        return this.http.post<Article>(this.apiUrl, article, { headers });
    }

    updateArticle(article: Article): Observable<Article> {
        const headers = new HttpHeaders().set('Role', 'Doctor');
        return this.http.put<Article>(this.apiUrl, article, { headers });
    }

    deleteArticle(id: number): Observable<any> {
        const headers = new HttpHeaders().set('Role', 'Doctor');
        return this.http.delete(`${this.apiUrl}/${id}`, { headers, responseType: 'text' });
    }
}
