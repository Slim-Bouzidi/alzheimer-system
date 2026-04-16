package org.example.alzheimerapp.services.implementing;

import org.example.alzheimerapp.entities.Article;
import org.example.alzheimerapp.repositories.ArticleRepository;
import org.example.alzheimerapp.services.interfaces.ArticleService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ArticleServiceImpl implements ArticleService {

    private final ArticleRepository articleRepository;

    public ArticleServiceImpl(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    @Override
    public List<Article> getAllArticles() {
        return articleRepository.findAll();
    }

    @Override
    public Article getArticleById(Integer id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));
    }

    @Override
    public Article createArticle(Article article) {
        return articleRepository.save(article);
    }

    @Override
    public Article updateArticle(Article article) {
        if (!articleRepository.existsById(article.getId())) {
            throw new RuntimeException("Article not found");
        }
        return articleRepository.save(article);
    }

    @Override
    public void deleteArticle(Integer id) {
        articleRepository.deleteById(id);
    }
}
