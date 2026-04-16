package org.example.alzheimerapp.controllers;

import org.example.alzheimerapp.entities.Article;
import org.example.alzheimerapp.services.interfaces.ArticleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public ResponseEntity<List<Article>> getAllArticles() {
        return ResponseEntity.ok(articleService.getAllArticles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Article> getArticleById(@PathVariable("id") Integer id) {
        return ResponseEntity.ok(articleService.getArticleById(id));
    }

    @PostMapping
    public ResponseEntity<?> createArticle(
            @RequestBody Article article,
            @RequestHeader(value = "Role", required = false) String role) {

        if (!"Doctor".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Doctors can create articles");
        }
        return ResponseEntity.ok(articleService.createArticle(article));
    }

    @PutMapping
    public ResponseEntity<?> updateArticle(
            @RequestBody Article article,
            @RequestHeader(value = "Role", required = false) String role) {

        if (!"Doctor".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Doctors can update articles");
        }
        return ResponseEntity.ok(articleService.updateArticle(article));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteArticle(
            @PathVariable("id") Integer id,
            @RequestHeader(value = "Role", required = false) String role) {

        if (!"Doctor".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Doctors can delete articles");
        }
        articleService.deleteArticle(id);
        return ResponseEntity.ok("Article deleted successfully");
    }
}
