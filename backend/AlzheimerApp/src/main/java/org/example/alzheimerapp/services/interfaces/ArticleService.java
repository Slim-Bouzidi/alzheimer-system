package org.example.alzheimerapp.services.interfaces;

import org.example.alzheimerapp.entities.Article;
import java.util.List;

public interface ArticleService {
    List<Article> getAllArticles();

    Article getArticleById(Integer id);

    Article createArticle(Article article);

    Article updateArticle(Article article);

    void deleteArticle(Integer id);
}
