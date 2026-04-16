package org.example.alzheimerapp.services.interfaces;

import org.example.alzheimerapp.entities.Comment;
import java.util.List;

public interface CommentService {
    List<Comment> getCommentsByArticle(Integer articleId);

    Comment createComment(Comment comment, Integer articleId);

    void deleteComment(Integer id);
}
