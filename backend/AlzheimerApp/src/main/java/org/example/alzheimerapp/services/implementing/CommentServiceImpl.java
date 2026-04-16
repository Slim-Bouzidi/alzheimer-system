package org.example.alzheimerapp.services.implementing;

import org.example.alzheimerapp.entities.Article;
import org.example.alzheimerapp.entities.Comment;
import org.example.alzheimerapp.repositories.ArticleRepository;
import org.example.alzheimerapp.repositories.CommentRepository;
import org.example.alzheimerapp.services.interfaces.CommentService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final ArticleRepository articleRepository;

    public CommentServiceImpl(CommentRepository commentRepository, ArticleRepository articleRepository) {
        this.commentRepository = commentRepository;
        this.articleRepository = articleRepository;
    }

    @Override
    public List<Comment> getCommentsByArticle(Integer articleId) {
        return commentRepository.findByArticleId(articleId);
    }

    @Override
    public Comment createComment(Comment comment, Integer articleId) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found"));
        comment.setArticle(article);
        return commentRepository.save(comment);
    }

    @Override
    public void deleteComment(Integer id) {
        commentRepository.deleteById(id);
    }
}
