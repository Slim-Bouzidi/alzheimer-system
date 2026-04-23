package com.alzheimer.gestionpatient.service.interfaces;

import com.alzheimer.gestionpatient.entity.Article;

import java.util.List;

public interface ArticleService {
    List<Article> getAllArticles();
    Article getArticleById(Integer id);
    Article createArticle(Article article);
    Article updateArticle(Article article);
    void deleteArticle(Integer id);
}
