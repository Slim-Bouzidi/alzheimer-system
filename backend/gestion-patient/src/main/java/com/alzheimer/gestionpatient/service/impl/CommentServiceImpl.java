package com.alzheimer.gestionpatient.service.impl;

import com.alzheimer.gestionpatient.entity.Article;
import com.alzheimer.gestionpatient.entity.Comment;
import com.alzheimer.gestionpatient.repository.ArticleRepository;
import com.alzheimer.gestionpatient.repository.CommentRepository;
import com.alzheimer.gestionpatient.service.interfaces.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final ArticleRepository articleRepository;

    @Override
    public List<Comment> getCommentsByArticle(Integer articleId) {
        return commentRepository.findByArticleId(articleId);
    }

    @Override
    public Comment createComment(Comment comment, Integer articleId) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("Article not found with id: " + articleId));
        comment.setArticle(article);
        return commentRepository.save(comment);
    }

    @Override
    public void deleteComment(Integer id) {
        commentRepository.deleteById(id);
    }
}
