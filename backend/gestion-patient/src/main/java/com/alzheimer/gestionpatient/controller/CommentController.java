package com.alzheimer.gestionpatient.controller;

import com.alzheimer.gestionpatient.entity.Comment;
import com.alzheimer.gestionpatient.service.interfaces.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/article/{articleId}")
    public ResponseEntity<List<Comment>> getCommentsByArticle(@PathVariable Integer articleId) {
        return ResponseEntity.ok(commentService.getCommentsByArticle(articleId));
    }

    @PostMapping
    public ResponseEntity<Comment> createComment(@RequestBody Comment comment,
                                                  @RequestParam Integer articleId) {
        return new ResponseEntity<>(commentService.createComment(comment, articleId), HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Integer id) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}
