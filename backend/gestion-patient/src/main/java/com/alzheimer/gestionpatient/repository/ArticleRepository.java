package com.alzheimer.gestionpatient.repository;

import com.alzheimer.gestionpatient.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Integer> {
}
