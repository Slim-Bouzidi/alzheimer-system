package com.alzheimer.gestionpatient.service.interfaces;

import com.alzheimer.gestionpatient.entity.Comment;

import java.util.List;

public interface CommentService {
    List<Comment> getCommentsByArticle(Integer articleId);
    Comment createComment(Comment comment, Integer articleId);
    void deleteComment(Integer id);
}
